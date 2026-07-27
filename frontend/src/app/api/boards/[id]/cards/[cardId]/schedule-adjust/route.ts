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
  applyScheduleChange,
  canManageDelayOrExtension,
  ensureDelayIncident,
  isCardOverdue,
} from "@/lib/card-delay";
import { parseCardDateInput } from "@/lib/card-dates";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const adjustSchema = z
  .object({
    reason: z.string().trim().min(3).max(2000),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    estimatedHours: z.number().positive().max(1000).optional().nullable(),
  })
  .refine(
    (d) =>
      d.dueDate !== undefined ||
      d.startDate !== undefined ||
      d.estimatedHours !== undefined,
    { message: "Provide startDate, dueDate and/or estimatedHours" },
  );

/**
 * POST — manager adjusts schedule with required reason (audited).
 * If task is overdue, uses DELAY_RESCHEDULE and auto-waives open delay
 * (no late penalty; still in excused stats).
 */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via === "guest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    include: {
      assignees: { select: { userId: true } },
      delayIncident: true,
    },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    card,
    access,
  );
  if (!canManageDelayOrExtension(caps) && !caps.canEditDueDate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = adjustSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const newDueDate =
    parsed.data.dueDate === undefined
      ? card.dueDate
      : parseCardDateInput(parsed.data.dueDate) ?? null;
  const newStartDate =
    parsed.data.startDate === undefined
      ? card.startDate
      : parseCardDateInput(parsed.data.startDate) ?? null;
  const newEstimatedHours =
    parsed.data.estimatedHours === undefined
      ? card.estimatedHours
      : parsed.data.estimatedHours;

  const overdueOpen = isCardOverdue(card);

  // Create OPEN incident before moving the due date forward
  if (overdueOpen) {
    await ensureDelayIncident({
      cardId,
      workspaceId: board.workspaceId,
      dueDate: card.dueDate,
      workflowStatus: card.workflowStatus,
      assigneeUserIds: card.assignees.map((a) => a.userId),
      createdById: card.createdById,
    });
  }

  await applyScheduleChange({
    cardId,
    workspaceId: board.workspaceId,
    changedById: session.user.id,
    source: overdueOpen ? "DELAY_RESCHEDULE" : "MANAGER_ADJUST",
    reason: parsed.data.reason,
    prevDueDate: card.dueDate,
    newDueDate,
    prevStartDate: card.startDate,
    newStartDate,
    prevEstimatedHours: card.estimatedHours,
    newEstimatedHours,
    waiveOpenDelay: overdueOpen,
  });

  await notifyUsers({
    userIds: card.assignees.map((a) => a.userId),
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: overdueOpen ? "task.delay_rescheduled" : "task.schedule_adjusted",
    title: overdueOpen
      ? `Deadline extended (excused): “${card.title}”`
      : `Schedule adjusted: “${card.title}”`,
    body: parsed.data.reason,
  });

  const updated = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      startDate: true,
      dueDate: true,
      estimatedHours: true,
      scheduleChanges: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          changedBy: { select: { id: true, name: true, email: true } },
        },
      },
      delayIncident: true,
    },
  });

  return NextResponse.json({ data: updated });
}
