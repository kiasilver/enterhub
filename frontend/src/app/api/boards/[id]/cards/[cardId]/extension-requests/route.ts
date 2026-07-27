import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import {
  computeProposedSchedule,
  notifyExtensionManagers,
} from "@/lib/card-delay";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const createSchema = z.object({
  amount: z.number().positive().max(365),
  unit: z.enum(["HOURS", "DAYS"]),
  reason: z.string().trim().min(3).max(2000),
});

/**
 * GET — list extension requests for a card
 * POST — assignee requests more hours/days (only before due date)
 */
export async function GET(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.cardExtensionRequest.findMany({
    where: { cardId, card: { list: { boardId } } },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: rows });
}

export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via === "guest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    include: { assignees: { select: { userId: true } } },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    card,
    access,
  );
  const isAssignee = card.assignees.some((a) => a.userId === session.user!.id);
  if (!isAssignee && caps.role !== "board_admin") {
    return NextResponse.json(
      { error: "Only an assignee can request more time" },
      { status: 403 },
    );
  }

  if (
    card.workflowStatus !== "ASSIGNED" &&
    card.workflowStatus !== "IN_PROGRESS" &&
    card.workflowStatus !== "REJECTED"
  ) {
    return NextResponse.json(
      { error: "Cannot request extension for this workflow status" },
      { status: 400 },
    );
  }

  if (!card.dueDate) {
    return NextResponse.json(
      { error: "Task has no due date" },
      { status: 400 },
    );
  }
  if (card.dueDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Extension requests are only allowed before the due date" },
      { status: 400 },
    );
  }

  const pending = await prisma.cardExtensionRequest.findFirst({
    where: { cardId, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json(
      { error: "A pending extension request already exists" },
      { status: 400 },
    );
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, unit, reason } = parsed.data;
  const proposed = computeProposedSchedule(card, amount, unit);

  const row = await prisma.cardExtensionRequest.create({
    data: {
      cardId,
      workspaceId: board.workspaceId,
      requestedById: session.user.id,
      amount,
      unit,
      reason,
      status: "PENDING",
      proposedDueDate: proposed.proposedDueDate,
      proposedEstimatedHours: proposed.proposedEstimatedHours,
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyExtensionManagers({
    boardId,
    cardId,
    cardTitle: card.title,
    workspaceId: board.workspaceId,
    createdById: card.createdById,
    actorId: session.user.id,
    amount,
    unit,
    reason,
  });

  return NextResponse.json({ data: row }, { status: 201 });
}
