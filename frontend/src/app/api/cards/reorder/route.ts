import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard, isDoneListTitle } from "@/lib/board-access";
import {
  assertMoveAllowed,
  resolveCardCapabilities,
} from "@/lib/card-permissions";
import { emitToBoardRoom } from "@/lib/socket-emit";
import { assertWritableSession } from "@/lib/session-guards";

const reorderSchema = z.object({
  boardId: z.string().min(1),
  workspaceId: z.string().min(1),
  cards: z.array(
    z.object({
      id: z.string(),
      listId: z.string(),
      order: z.number(),
    }),
  ),
});

/**
 * PATCH /api/cards/reorder
 * Enforces task-level move rights + Done column lock.
 */
export async function PATCH(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { boardId, workspaceId, cards } = parsed.data;
  const userId = session.user.id;

  const access = await canAccessBoard(userId, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (access.via === "guest") {
    return NextResponse.json(
      { error: "Forbidden: guests cannot move cards" },
      { status: 403 },
    );
  }

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspaceId },
    select: { id: true, workspaceId: true },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const cardIds = cards.map((c) => c.id);
  const existing = await prisma.card.findMany({
    where: { id: { in: cardIds }, list: { boardId } },
    select: {
      id: true,
      listId: true,
      createdById: true,
      list: { select: { title: true } },
    },
  });
  if (existing.length !== cardIds.length) {
    return NextResponse.json({ error: "Invalid cards for board" }, { status: 400 });
  }

  const lists = await prisma.list.findMany({
    where: { boardId, archivedAt: null },
    select: { id: true, title: true },
  });
  const listById = new Map(lists.map((l) => [l.id, l]));

  for (const move of cards) {
    const current = existing.find((c) => c.id === move.id);
    if (!current) continue;
    if (current.listId === move.listId) continue; // order-only within same list

    const target = listById.get(move.listId);
    if (!target) {
      return NextResponse.json({ error: "Invalid target list" }, { status: 400 });
    }

    const caps = await resolveCardCapabilities(
      userId,
      board,
      { id: current.id, createdById: current.createdById },
      access,
    );
    const err = assertMoveAllowed(caps, target.title);
    if (err) {
      return NextResponse.json(
        {
          error: err,
          cardId: current.id,
          targetList: target.title,
          locked: isDoneListTitle(target.title),
        },
        { status: 403 },
      );
    }
  }

  await prisma.$transaction(
    cards.map((c) =>
      prisma.card.update({
        where: { id: c.id },
        data: { listId: c.listId, order: c.order },
      }),
    ),
  );

  emitToBoardRoom(boardId, "card-updated", {
    type: "cards.reordered",
    boardId,
    cards,
  });

  return NextResponse.json({ ok: true });
}
