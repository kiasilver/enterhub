import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import {
  ensureDoneList,
  moveCardToList,
  notifyWorkflow,
} from "@/lib/card-workflow";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const score = z.number().int().min(1).max(5);

const approveSchema = z.object({
  quality: score,
  timeliness: score,
  communication: score,
  initiative: score,
  collaboration: score,
  overall: score,
  strengths: z.string().max(2000).optional().nullable(),
  improvements: z.string().max(2000).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

/**
 * POST — manager approves + records professional evaluation (year-end feed).
 */
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
  const canApprove =
    caps.role === "board_admin" ||
    caps.role === "creator" ||
    caps.canMoveToDone;
  if (!canApprove) {
    return NextResponse.json(
      { error: "Only a manager/lead can approve this task" },
      { status: 403 },
    );
  }

  if (card.workflowStatus !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: "Task is not awaiting approval" },
      { status: 400 },
    );
  }

  const parsed = approveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Evaluation required: rate quality, timeliness, communication, initiative, collaboration, and overall (1–5)",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const employeeId =
    card.assignees[0]?.userId || card.createdById || session.user.id;

  const done = await ensureDoneList(boardId);
  await moveCardToList(cardId, done.id);

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.card.update({
      where: { id: cardId },
      data: {
        workflowStatus: "APPROVED",
        approvedAt: new Date(),
        approvedById: session.user!.id,
        rejectionNote: null,
      },
    });
    await tx.cardEvaluation.upsert({
      where: { cardId },
      create: {
        cardId,
        workspaceId: board.workspaceId,
        employeeId,
        evaluatorId: session.user!.id,
        ...parsed.data,
        strengths: parsed.data.strengths || null,
        improvements: parsed.data.improvements || null,
        notes: parsed.data.notes || null,
      },
      update: {
        evaluatorId: session.user!.id,
        employeeId,
        ...parsed.data,
        strengths: parsed.data.strengths || null,
        improvements: parsed.data.improvements || null,
        notes: parsed.data.notes || null,
      },
    });
    return c;
  });

  await notifyWorkflow({
    userIds: card.assignees.map((a) => a.userId),
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.approved",
    title: `Approved: “${card.title}”`,
    body: "Your manager approved this task and recorded a performance evaluation",
  });

  return NextResponse.json({ data: updated });
}
