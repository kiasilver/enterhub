import { NextResponse } from "next/server";
import { z } from "zod";
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

const waiveSchema = z.object({
  waiveReason: z.string().trim().min(3).max(2000),
});

/**
 * POST — Waive delay (no delayScore penalty; still counted in waived stats)
 */
export async function POST(req: Request, ctx: Ctx) {
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
      { error: "Only a manager/creator can waive delay" },
      { status: 403 },
    );
  }

  if (incident.status !== "OPEN") {
    return NextResponse.json(
      { error: "Incident is already resolved" },
      { status: 400 },
    );
  }

  const parsed = waiveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Waive reason is required", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const daysLate = daysBetween(incident.overdueAt, new Date());
  const updated = await prisma.cardDelayIncident.update({
    where: { id: incident.id },
    data: {
      status: "WAIVED",
      waivedAt: new Date(),
      waivedById: session.user.id,
      waiveReason: parsed.data.waiveReason,
      daysLate,
    },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      waivedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyUsers({
    userIds: [incident.employeeId],
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.delay_waived",
    title: `Delay waived: “${incident.card.title}”`,
    body: parsed.data.waiveReason,
  });

  return NextResponse.json({ data: updated });
}
