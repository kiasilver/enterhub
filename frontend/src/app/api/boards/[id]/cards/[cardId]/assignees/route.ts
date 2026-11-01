import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { canAssignCard, notifyUsers } from "@/lib/card-permissions";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/** GET assignees */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignees = await prisma.cardAssignee.findMany({
    where: { cardId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({
    data: assignees.map((a) => ({ userId: a.userId, user: a.user })),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true, createdById: true, title: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canAssignCard(session.user.id, board, card))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z.object({ userId: z.string().min(1) }).safeParse(
    await req.json().catch(() => null),
  );
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: board.workspaceId,
      userId: body.data.userId,
      status: "ACTIVE",
    },
  });
  if (!member) {
    return NextResponse.json(
      { error: "User is not an active workspace member" },
      { status: 400 },
    );
  }

  await prisma.cardAssignee.upsert({
    where: { cardId_userId: { cardId, userId: body.data.userId } },
    create: { cardId, userId: body.data.userId },
    update: {},
  });

  await notifyUsers({
    userIds: [body.data.userId],
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "assigned",
    title: `Assigned to “${card.title}”`,
    body: "You were assigned to a task",
  });

  try {
    const { emailUsersTaskAssigned } = await import("@/lib/notify-email");
    await emailUsersTaskAssigned({
      userIds: [body.data.userId],
      actorId: session.user.id,
      boardId,
      cardId,
      cardTitle: card.title,
      workspaceId: board.workspaceId,
    });
  } catch (e) {
    console.error("[assignees] task email failed", e);
  }

  return NextResponse.json({ data: { ok: true } }, { status: 201 });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId } },
    select: { id: true, createdById: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await canAssignCard(session.user.id, board, card))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await prisma.cardAssignee.deleteMany({ where: { cardId, userId } });
  return NextResponse.json({ data: { ok: true } });
}
