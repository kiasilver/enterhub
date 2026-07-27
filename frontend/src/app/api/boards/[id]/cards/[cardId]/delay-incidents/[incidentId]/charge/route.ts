import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import {
  resolveCardCapabilities,
  notifyUsers,
} from "@/lib/card-permissions";
import {
  canManageDelayOrExtension,
  daysBetween,
} from "@/lib/card-delay";

type Ctx = {
  params: Promise<{ id: string; cardId: string; incidentId: string }>;
};

/**
 * POST — Charge overdue incident (applies delayScore −1 in trends)
 */
export async function POST(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId, incidentId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via === "guest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const incident = await prisma.cardDelayIncident.findFirst({
    where: { id: incidentId, cardId, workspaceId: board.workspaceId },
    include: { card: { select: { title: true, createdById: true } } },
  });
  if (!incident) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    { id: cardId, createdById: incident.card.createdById },
    access,
  );
  if (!canManageDelayOrExtension(caps)) {
    return NextResponse.json(
      { error: "Only a manager/creator can charge delay" },
      { status: 403 },
    );
  }

  if (incident.status !== "OPEN") {
    return NextResponse.json(
      { error: "Incident is already resolved" },
      { status: 400 },
    );
  }

  const daysLate = daysBetween(incident.overdueAt, new Date());
  const updated = await prisma.cardDelayIncident.update({
    where: { id: incident.id },
    data: {
      status: "CHARGED",
      chargedAt: new Date(),
      chargedById: session.user.id,
      daysLate,
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      chargedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyUsers({
    userIds: [incident.employeeId],
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.delay_charged",
    title: `Delay charged: “${incident.card.title}”`,
    body: `Late by ${daysLate.toFixed(1)} days — recorded in work trends`,
  });

  return NextResponse.json({ data: updated });
}
