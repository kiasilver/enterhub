import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { ensureDelayIncident, daysBetween } from "@/lib/card-delay";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

async function ensure(reqUserId: string, boardId: string, cardId: string) {
  const access = await canAccessBoard(reqUserId, boardId);
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

  const incident = await ensureDelayIncident({
    cardId,
    workspaceId: board.workspaceId,
    dueDate: card.dueDate,
    workflowStatus: card.workflowStatus,
    assigneeUserIds: card.assignees.map((a) => a.userId),
    createdById: card.createdById,
  });

  if (!incident) {
    return NextResponse.json({
      data: null,
      meta: { overdue: false },
    });
  }

  const daysLate =
    incident.status === "OPEN"
      ? daysBetween(incident.overdueAt, new Date())
      : incident.daysLate;

  return NextResponse.json({
    data: { ...incident, daysLate },
    meta: { overdue: true },
  });
}

/** POST/GET — lazy upsert OPEN delay incident when card is overdue */
export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  return ensure(session.user.id, boardId, cardId);
}

export async function GET(_req: Request, ctx: Ctx) {
  return POST(_req, ctx);
}
