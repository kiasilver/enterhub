import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import { emitToBoardRoom, emitToWorkspaceRoom } from "@/lib/socket-emit";
import { publishChecklistToggle } from "@/lib/my-tasks-bus";
import { publishBoardLive } from "@/lib/boards-live-bus";
import { isChecklistBookend } from "@/lib/checklist-defaults";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

function publishChecklistLive(
  board: { workspaceId: string; departmentId: string | null },
  boardId: string,
  cardId: string,
) {
  publishBoardLive({
    type: "card.changed",
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    departmentId: board.departmentId,
    reason: "updated",
  });
}

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
      description: z.string().max(2000).optional().nullable(),
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
      description: body.data.description?.trim() || null,
      isDone: body.data.isDone ?? false,
      order,
    },
  });
  publishChecklistLive(gate.board!, boardId, cardId);
  emitToBoardRoom(boardId, "card-updated", {
    type: "checklist.created",
    workspaceId: gate.board!.workspaceId,
    boardId,
    cardId,
    itemId: item.id,
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
    .object({
      itemId: z.string().optional(),
      isDone: z.boolean().optional(),
      title: z.string().min(1).max(300).optional(),
      description: z.string().max(2000).optional().nullable(),
      /** Reorder middle checklist items (Start stays first, End stays last) */
      orderedIds: z.array(z.string().min(1)).min(1).max(100).optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.data.orderedIds?.length) {
    const existing = await prisma.checklistItem.findMany({
      where: { cardId },
      orderBy: { order: "asc" },
      select: { id: true, title: true, order: true },
    });
    const start = existing.find(
      (i) => i.title.trim().toLowerCase() === "start task",
    );
    const end = existing.find(
      (i) => i.title.trim().toLowerCase() === "end of task",
    );
    const middleIds = new Set(
      existing
        .filter(
          (i) =>
            i.title.trim().toLowerCase() !== "start task" &&
            i.title.trim().toLowerCase() !== "end of task",
        )
        .map((i) => i.id),
    );
    const ordered = body.data.orderedIds.filter((id) => middleIds.has(id));
    if (ordered.length !== middleIds.size) {
      return NextResponse.json({ error: "Invalid orderedIds" }, { status: 400 });
    }
    let order = 0;
    const updates: { id: string; order: number }[] = [];
    if (start) updates.push({ id: start.id, order: order++ });
    for (const id of ordered) updates.push({ id, order: order++ });
    if (end) updates.push({ id: end.id, order: order++ });
    await prisma.$transaction(
      updates.map((u) =>
        prisma.checklistItem.update({
          where: { id: u.id },
          data: { order: u.order },
        }),
      ),
    );
    publishChecklistLive(gate.board!, boardId, cardId);
    emitToBoardRoom(boardId, "card-updated", {
      type: "checklist.reordered",
      workspaceId: gate.board!.workspaceId,
      boardId,
      cardId,
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.data.itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const current = await prisma.checklistItem.findFirst({
    where: { id: body.data.itemId, cardId },
  });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    body.data.title !== undefined &&
    isChecklistBookend(current.title)
  ) {
    return NextResponse.json(
      { error: "Cannot rename Start / End checklist items" },
      { status: 400 },
    );
  }

  // End of task may only be checked after every middle item is done
  if (
    body.data.isDone === true &&
    current.title.trim().toLowerCase() === "end of task"
  ) {
    const siblings = await prisma.checklistItem.findMany({
      where: { cardId },
      select: { title: true, isDone: true },
    });
    const middleOpen = siblings.some((i) => {
      const t = i.title.trim().toLowerCase();
      return (
        t !== "start task" && t !== "end of task" && !i.isDone
      );
    });
    if (middleOpen) {
      return NextResponse.json(
        { error: "Complete every checklist item first" },
        { status: 400 },
      );
    }
    // Keep Start in sync when finishing
    await prisma.checklistItem.updateMany({
      where: {
        cardId,
        title: { equals: "Start task", mode: "insensitive" },
        isDone: false,
      },
      data: { isDone: true },
    });
  }

  const item = await prisma.checklistItem.update({
    where: { id: body.data.itemId },
    data: {
      ...(body.data.isDone !== undefined ? { isDone: body.data.isDone } : {}),
      ...(body.data.title !== undefined ? { title: body.data.title } : {}),
      ...(body.data.description !== undefined
        ? { description: body.data.description?.trim() || null }
        : {}),
    },
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
  publishChecklistLive(gate.board!, boardId, cardId);

  return NextResponse.json({ data: item });
}

/** DELETE checklist item — query `itemId` */
export async function DELETE(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const gate = await assertChecklistAccess(session.user.id, boardId, cardId);
  if ("error" in gate && gate.error) return gate.error;

  const itemId = new URL(req.url).searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const current = await prisma.checklistItem.findFirst({
    where: { id: itemId, cardId },
  });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (isChecklistBookend(current.title)) {
    return NextResponse.json(
      { error: "Cannot delete Start / End checklist items" },
      { status: 400 },
    );
  }

  await prisma.checklistItem.delete({ where: { id: itemId } });
  publishChecklistLive(gate.board!, boardId, cardId);
  emitToBoardRoom(boardId, "card-updated", {
    type: "checklist.deleted",
    workspaceId: gate.board!.workspaceId,
    boardId,
    cardId,
    itemId,
  });
  return NextResponse.json({ ok: true });
}
