import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/** POST — record that the current user viewed this card */
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

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const view = await prisma.cardView.upsert({
    where: { cardId_userId: { cardId, userId: session.user.id } },
    create: {
      cardId,
      userId: session.user.id,
      firstSeenAt: now,
      lastSeenAt: now,
      seeCount: 1,
    },
    update: {
      lastSeenAt: now,
      seeCount: { increment: 1 },
    },
  });

  return NextResponse.json({ data: { ok: true, seeCount: view.seeCount } });
}

/** GET — list viewers (requires card:views) */
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

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await hasPermission(session.user.id, board.workspaceId, "card:views"))) {
    return NextResponse.json({ error: "Forbidden: card:views" }, { status: 403 });
  }

  const views = await prisma.cardView.findMany({
    where: { cardId },
    orderBy: { lastSeenAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    data: views.map((v) => ({
      userId: v.userId,
      user: v.user,
      firstSeenAt: v.firstSeenAt,
      lastSeenAt: v.lastSeenAt,
      seeCount: v.seeCount,
    })),
  });
}
