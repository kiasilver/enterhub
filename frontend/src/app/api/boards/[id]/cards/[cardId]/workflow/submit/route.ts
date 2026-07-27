import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import {
  checklistAllDone,
  ensureReviewList,
  managerUserIds,
  markChecklistBookend,
  moveCardToList,
  notifyWorkflow,
} from "@/lib/card-workflow";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/**
 * POST — employee marks work complete → Pending Approval.
 * Requires all checklist items done (or no checklist).
 */
export async function POST(_req: Request, ctx: Ctx) {
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
      { error: "Only the assigned employee can submit this task" },
      { status: 403 },
    );
  }

  if (card.workflowStatus !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Start the task before submitting for approval" },
      { status: 400 },
    );
  }

  // Dropping onto Done / submitting marks the End bookend, then requires all items.
  await markChecklistBookend(cardId, "end");

  const chk = await checklistAllDone(cardId);
  if (!chk.complete) {
    return NextResponse.json(
      {
        error: `Complete all checklist milestones first (${chk.done}/${chk.total})`,
      },
      { status: 400 },
    );
  }

  const review = await ensureReviewList(boardId);
  await moveCardToList(cardId, review.id);

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      workflowStatus: "PENDING_APPROVAL",
      submittedAt: new Date(),
    },
  });

  const managers = await managerUserIds(board.workspaceId, card.createdById);
  await notifyWorkflow({
    userIds: managers,
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.pending_approval",
    title: `Approval needed: “${card.title}”`,
    body: "Employee submitted work for your approval and evaluation",
  });

  return NextResponse.json({ data: updated });
}
