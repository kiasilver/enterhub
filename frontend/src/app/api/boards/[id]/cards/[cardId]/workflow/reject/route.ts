import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import {
  ensureProgressList,
  moveCardToList,
  notifyWorkflow,
} from "@/lib/card-workflow";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const rejectSchema = z.object({
  note: z.string().min(1).max(2000),
});

/** POST — manager rejects submission; employee returns to In Progress. */
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
  const canReject =
    caps.role === "board_admin" ||
    caps.role === "creator" ||
    caps.canMoveToDone;
  if (!canReject) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (card.workflowStatus !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: "Task is not awaiting approval" },
      { status: 400 },
    );
  }

  const parsed = rejectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Rejection note is required" },
      { status: 400 },
    );
  }

  const progress = await ensureProgressList(boardId);
  await moveCardToList(cardId, progress.id);

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: {
      workflowStatus: "REJECTED",
      rejectionNote: parsed.data.note,
      submittedAt: null,
      approvedAt: null,
      approvedById: null,
    },
  });

  await notifyWorkflow({
    userIds: card.assignees.map((a) => a.userId),
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.rejected",
    title: `Changes requested: “${card.title}”`,
    body: parsed.data.note,
  });

  return NextResponse.json({ data: updated });
}
