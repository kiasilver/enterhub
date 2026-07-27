import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import { emitToBoardRoom, emitToWorkspaceRoom } from "@/lib/socket-emit";
import { publishChecklistToggle } from "@/lib/my-tasks-bus";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

async function assertChecklistAccess(
  userId: string,
  boardId: string,
  cardId: string,
) {
  const access = await canAccessBoard(userId, boardId);
  if (!access.ok) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true, createdById: true },
  });
  if (!card) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  const caps = await resolveCardCapabilities(userId, board, card, access);
  if (!caps.canChecklist) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { board, card, caps, access };
}
/** POST checklist item */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const gate = await assertChecklistAccess(session.user.id, boardId, cardId);
  if ("error" in gate && gate.error) return gate.error;

  const body = z
    .object({
      title: z.string().min(1).max(300),
      isDone: z.boolean().optional(),
      promoteToCard: z.boolean().optional(),
      itemId: z.string().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.data.promoteToCard && body.data.itemId) {
    const item = await prisma.checklistItem.findUnique({ where: { id: body.data.itemId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const max = await prisma.card.aggregate({
      where: { listId: card.listId },
      _max: { order: true },
    });
    const newCard = await prisma.card.create({
      data: {
        listId: card.listId,
        title: item.title,
        order: (max._max.order ?? 0) + 1,
        createdById: session.user.id,
      },
    });
    await prisma.checklistItem.update({
      where: { id: item.id },
      data: { linkedCardId: newCard.id, isDone: true },
    });
    return NextResponse.json({ data: { item, newCard } }, { status: 201 });
  }

  const max = await prisma.checklistItem.aggregate({
    where: { cardId },
    _max: { order: true },
  });

  // Keep new items between Start and End when End bookend exists
  const existing = await prisma.checklistItem.findMany({
    where: { cardId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true },
  });
  const endItem = existing.find(
    (i) => i.title.trim().toLowerCase() === "end of task",
  );

  let order = (max._max.order ?? 0) + 1;
  if (endItem) {
    order = endItem.order;
    await prisma.checklistItem.updateMany({
      where: { cardId, order: { gte: endItem.order } },
      data: { order: { increment: 1 } },
    });
  }

  const item = await prisma.checklistItem.create({
    data: {
      cardId,
      title: body.data.title,
      isDone: body.data.isDone ?? false,
      order,
    },
  });
  return NextResponse.json({ data: item }, { status: 201 });
}

/** PATCH toggle checklist */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const gate = await assertChecklistAccess(session.user.id, boardId, cardId);
  if ("error" in gate && gate.error) return gate.error;

  const body = z
    .object({ itemId: z.string(), isDone: z.boolean(), title: z.string().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const item = await prisma.checklistItem.update({
    where: { id: body.data.itemId },
    data: { isDone: body.data.isDone, title: body.data.title },
  });

  const payload = {
    workspaceId: gate.board!.workspaceId,
    boardId,
    cardId,
    itemId: item.id,
    isDone: item.isDone,
    title: item.title,
  };
  publishChecklistToggle(payload);
  emitToBoardRoom(boardId, "card-updated", {
    type: "checklist.toggled",
    ...payload,
  });
  emitToWorkspaceRoom(gate.board!.workspaceId, "my-tasks:checklist", payload);

  return NextResponse.json({ data: item });
}
