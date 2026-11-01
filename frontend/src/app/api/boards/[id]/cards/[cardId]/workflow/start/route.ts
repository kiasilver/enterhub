import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import {
  assignmentReady,
  ensureProgressList,
  markChecklistBookend,
  moveCardToList,
  notifyWorkflow,
  setChecklistBookend,
} from "@/lib/card-workflow";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/** POST — employee starts work (requires due date range). */
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
  if (!isAssignee && caps.role !== "board_admin" && caps.role !== "creator") {
    return NextResponse.json(
      { error: "Only the assigned employee can start this task" },
      { status: 403 },
    );
  }

  if (
    card.workflowStatus === "PENDING_APPROVAL" ||
    card.workflowStatus === "APPROVED"
  ) {
    const progress = await ensureProgressList(boardId);
    await moveCardToList(cardId, progress.id);
    await markChecklistBookend(cardId, "start");
    await setChecklistBookend(cardId, "end", false);
    const reopened = await prisma.card.update({
      where: { id: cardId },
      data: {
        workflowStatus: "IN_PROGRESS",
        startedAt: card.startedAt ?? new Date(),
        submittedAt: null,
        approvedAt: null,
        approvedById: null,
        rejectionNote: null,
      },
    });
    return NextResponse.json({ data: reopened });
  }

  if (
    card.workflowStatus !== "ASSIGNED" &&
    card.workflowStatus !== "REJECTED"
  ) {
    if (card.workflowStatus === "IN_PROGRESS") {
      return NextResponse.json({ data: card });
    }
    return NextResponse.json(
      { error: `Cannot start from status ${card.workflowStatus}` },
      { status: 400 },
    );
  }

  const ready = assignmentReady(card);
  if (!ready.ok) {
    return NextResponse.json({ error: ready.error }, { status: 400 });
  }

  const progress = await ensureProgressList(boardId);
  await moveCardToList(cardId, progress.id);
  await markChecklistBookend(cardId, "start");

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      workflowStatus: "IN_PROGRESS",
      startedAt: new Date(),
      submittedAt: null,
      rejectionNote: null,
    },
  });

  const watchIds = [card.createdById, card.supervisorId].filter(
    (id): id is string => !!id,
  );
  if (watchIds.length) {
    await notifyWorkflow({
      userIds: watchIds,
      workspaceId: board.workspaceId,
      boardId,
      cardId,
      actorId: session.user.id,
      type: "task.started",
      title: `Started: “${card.title}”`,
      body: "The assignee started work on this task",
    });
  }

  return NextResponse.json({ data: updated });
}
