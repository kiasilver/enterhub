import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessBoard, isDoneListTitle } from "@/lib/board-access";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import { emitToBoardRoom } from "@/lib/socket-emit";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/**
 * POST /api/boards/[id]/cards/[cardId]/complete
 * Moves card into Done — requires canMoveToDone (card:complete_done / board admin).
 */
export async function POST(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via !== "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, workspaceId: true },
  });
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true, listId: true, createdById: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    card,
    access,
  );
  if (!caps.canMoveToDone) {
    return NextResponse.json(
      {
        error:
          "Forbidden: only project leads or QA (card:complete_done) can mark Done",
      },
      { status: 403 },
    );
  }

  const lists = await prisma.list.findMany({
    where: { boardId, archivedAt: null },
    orderBy: { order: "asc" },
  });
  let doneList = lists.find((l) => isDoneListTitle(l.title)) || null;

  if (!doneList) {
    if (!(await hasPermission(session.user.id, board.workspaceId, "list:create"))) {
      return NextResponse.json(
        { error: "Forbidden: no Done list and cannot create one" },
        { status: 403 },
      );
    }
    const maxOrder = lists.reduce((m, l) => Math.max(m, l.order), -1);
    doneList = await prisma.list.create({
      data: {
        boardId,
        title: "Done",
        order: maxOrder + 1,
      },
    });
  }

  if (card.listId === doneList.id) {
    return NextResponse.json({
      data: { id: card.id, listId: doneList.id, alreadyDone: true },
    });
  }

  const maxCard = await prisma.card.aggregate({
    where: { listId: doneList.id },
    _max: { order: true },
  });

  const updated = await prisma.card.update({
    where: { id: card.id },
    data: {
      listId: doneList.id,
      order: (maxCard._max.order ?? -1) + 1,
    },
  });

  emitToBoardRoom(boardId, "card-updated", {
    type: "card.completed",
    boardId,
    cardId: updated.id,
    listId: doneList.id,
  });

  return NextResponse.json({ data: { id: updated.id, listId: updated.listId } });
}
