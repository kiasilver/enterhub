import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import {
  resolveCardCapabilities,
  notifyUsers,
} from "@/lib/card-permissions";
import {
  applyScheduleChange,
  canManageDelayOrExtension,
} from "@/lib/card-delay";

type Ctx = {
  params: Promise<{ id: string; cardId: string; reqId: string }>;
};

const reviewSchema = z.object({
  reviewNote: z.string().trim().max(2000).optional().nullable(),
});

/**
 * POST — manager approves extension → bump schedule + audit
 */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId, reqId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via === "guest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const request = await prisma.cardExtensionRequest.findFirst({
    where: { id: reqId, cardId, workspaceId: board.workspaceId },
    include: {
      card: {
        include: { assignees: { select: { userId: true } } },
      },
    },
  });
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    request.card,
    access,
  );
  if (!canManageDelayOrExtension(caps)) {
    return NextResponse.json(
      { error: "Only a manager/creator can approve extensions" },
      { status: 403 },
    );
  }

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request is not pending" },
      { status: 400 },
    );
  }

  const parsed = reviewSchema.safeParse(await req.json().catch(() => ({})));
  const reviewNote = parsed.success ? parsed.data.reviewNote ?? null : null;

  const card = request.card;
  const newDueDate = request.proposedDueDate ?? card.dueDate;
  const newEstimatedHours =
    request.proposedEstimatedHours ?? card.estimatedHours;

  await applyScheduleChange({
    cardId,
    workspaceId: board.workspaceId,
    changedById: session.user.id,
    source: "EXTENSION_APPROVED",
    reason: request.reason,
    prevDueDate: card.dueDate,
    newDueDate,
    prevEstimatedHours: card.estimatedHours,
    newEstimatedHours,
    extensionRequestId: request.id,
  });

  const updated = await prisma.cardExtensionRequest.update({
    where: { id: request.id },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote,
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyUsers({
    userIds: [request.requestedById],
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.extension_approved",
    title: `Extension approved: “${card.title}”`,
    body:
      reviewNote ||
      `+${request.amount} ${request.unit.toLowerCase()} applied`,
  });

  return NextResponse.json({ data: updated });
}
