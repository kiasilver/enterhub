import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import {
  assertMoveAllowed,
  resolveCardCapabilities,
} from "@/lib/card-permissions";
import { emitToBoardRoom, emitToWorkspaceRoom } from "@/lib/socket-emit";
import { pickMatchingList } from "@/lib/board-lists";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const bodySchema = z.object({
  toBoardId: z.string().min(1),
});

/**
 * POST /api/boards/[id]/cards/[cardId]/move
 * Move a card to another project (board) in the same workspace.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: fromBoardId, cardId } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { toBoardId } = parsed.data;
  if (toBoardId === fromBoardId) {
    return NextResponse.json({ data: { boardId: fromBoardId, cardId } });
  }

  const userId = session.user.id;
  const [fromAccess, toAccess] = await Promise.all([
    canAccessBoard(userId, fromBoardId),
    canAccessBoard(userId, toBoardId),
  ]);
  if (!fromAccess.ok || !toAccess.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (fromAccess.via === "guest" || toAccess.via === "guest") {
    return NextResponse.json(
      { error: "Forbidden: guests cannot move cards" },
      { status: 403 },
    );
  }

  const [fromBoard, toBoard, card] = await Promise.all([
    prisma.board.findUnique({
      where: { id: fromBoardId },
      select: { id: true, workspaceId: true, departmentId: true },
    }),
    prisma.board.findUnique({
      where: { id: toBoardId, archivedAt: null },
      select: { id: true, workspaceId: true, departmentId: true },
    }),
    prisma.card.findFirst({
      where: { id: cardId, list: { boardId: fromBoardId }, archivedAt: null },
      select: {
        id: true,
        listId: true,
        createdById: true,
        supervisorId: true,
        list: { select: { title: true } },
      },
    }),
  ]);
  if (!fromBoard || !toBoard || !card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (fromBoard.workspaceId !== toBoard.workspaceId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const caps = await resolveCardCapabilities(
    userId,
    fromBoard,
    {
      id: card.id,
      createdById: card.createdById,
      supervisorId: card.supervisorId,
    },
    fromAccess,
  );
  const targetLists = await prisma.list.findMany({
    where: { boardId: toBoardId, archivedAt: null },
    select: { id: true, title: true, order: true },
    orderBy: { order: "asc" },
  });
  const target = pickMatchingList(card.list.title, targetLists);
  if (!target) {
    return NextResponse.json({ error: "Target project has no lists" }, { status: 400 });
  }
  const moveErr = assertMoveAllowed(caps, target.title);
  if (moveErr) {
    return NextResponse.json({ error: moveErr }, { status: 403 });
  }

  const max = await prisma.card.aggregate({
    where: { listId: target.id, archivedAt: null },
    _max: { order: true },
  });
  const order = (max._max.order ?? 0) + 1;

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: { listId: target.id, order },
    select: { id: true, listId: true, order: true },
  });

  const payload = {
    type: "card.moved",
    cardId,
    fromBoardId,
    toBoardId,
    listId: updated.listId,
    listTitle: target.title,
  };
  emitToBoardRoom(fromBoardId, "card-updated", payload);
  emitToBoardRoom(toBoardId, "card-updated", payload);
  emitToWorkspaceRoom(fromBoard.workspaceId, "card-updated", payload);

  const { publishBoardLive } = await import("@/lib/boards-live-bus");
  publishBoardLive({
    type: "card.changed",
    workspaceId: fromBoard.workspaceId,
    boardId: toBoardId,
    cardId,
    departmentId: toBoard.departmentId ?? fromBoard.departmentId,
    reason: "moved",
  });
  if (
    fromBoard.departmentId &&
    toBoard.departmentId &&
    fromBoard.departmentId !== toBoard.departmentId
  ) {
    publishBoardLive({
      type: "department.changed",
      workspaceId: fromBoard.workspaceId,
      departmentId: fromBoard.departmentId,
      reason: "updated",
    });
  }

  return NextResponse.json({
    data: {
      ...updated,
      boardId: toBoardId,
      listTitle: target.title,
    },
  });
}
