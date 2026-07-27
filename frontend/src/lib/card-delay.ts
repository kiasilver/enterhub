import { prisma } from "@/lib/prisma";
import type {
  CardWorkflowStatus,
  DelayIncidentStatus,
  ExtensionUnit,
  ScheduleChangeSource,
} from "@prisma/client";
import { notifyUsers } from "@/lib/card-permissions";
import { managerUserIds } from "@/lib/card-workflow";

const OPEN_WORKFLOW: CardWorkflowStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "REJECTED",
  "PENDING_APPROVAL",
];

export function isCardOverdue(card: {
  dueDate: Date | null;
  workflowStatus: CardWorkflowStatus;
}): boolean {
  if (!card.dueDate) return false;
  if (card.workflowStatus === "APPROVED") return false;
  return card.dueDate.getTime() < Date.now();
}

export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeProposedSchedule(
  card: { dueDate: Date | null; estimatedHours: number | null },
  amount: number,
  unit: ExtensionUnit,
): { proposedDueDate: Date | null; proposedEstimatedHours: number | null } {
  if (unit === "DAYS") {
    const base = card.dueDate ? new Date(card.dueDate) : new Date();
    const proposedDueDate = new Date(base);
    proposedDueDate.setUTCDate(proposedDueDate.getUTCDate() + Math.ceil(amount));
    return {
      proposedDueDate,
      proposedEstimatedHours: card.estimatedHours,
    };
  }
  const prev = card.estimatedHours ?? 0;
  return {
    proposedDueDate: card.dueDate,
    proposedEstimatedHours: Math.round((prev + amount) * 100) / 100,
  };
}

export function canManageDelayOrExtension(caps: {
  role: string;
  canMoveToDone: boolean;
}): boolean {
  return (
    caps.role === "board_admin" ||
    caps.role === "creator" ||
    caps.canMoveToDone
  );
}

/** Lazy-create OPEN delay incident when card is overdue and still open. */
export async function ensureDelayIncident(input: {
  cardId: string;
  workspaceId: string;
  dueDate: Date | null;
  workflowStatus: CardWorkflowStatus;
  assigneeUserIds: string[];
  createdById: string | null;
}): Promise<{
  id: string;
  status: DelayIncidentStatus;
  employeeId: string;
  overdueAt: Date;
  daysLate: number | null;
} | null> {
  if (!input.dueDate) return null;
  if (input.workflowStatus === "APPROVED") return null;
  if (input.dueDate.getTime() >= Date.now()) {
    const existing = await prisma.cardDelayIncident.findUnique({
      where: { cardId: input.cardId },
    });
    return existing;
  }

  const employeeId =
    input.assigneeUserIds[0] || input.createdById;
  if (!employeeId) return null;

  const existing = await prisma.cardDelayIncident.findUnique({
    where: { cardId: input.cardId },
  });
  if (existing) {
    if (existing.status === "OPEN") {
      const daysLate = daysBetween(existing.overdueAt, new Date());
      return { ...existing, daysLate };
    }
    return existing;
  }

  const overdueAt = input.dueDate;
  const created = await prisma.cardDelayIncident.create({
    data: {
      cardId: input.cardId,
      workspaceId: input.workspaceId,
      employeeId,
      status: "OPEN",
      overdueAt,
      daysLate: daysBetween(overdueAt, new Date()),
    },
  });
  return created;
}

export async function applyScheduleChange(input: {
  cardId: string;
  workspaceId: string;
  changedById: string;
  source: ScheduleChangeSource;
  reason: string;
  prevDueDate: Date | null;
  newDueDate: Date | null;
  prevEstimatedHours: number | null;
  newEstimatedHours: number | null;
  prevStartDate?: Date | null;
  newStartDate?: Date | null;
  extensionRequestId?: string | null;
  /** If true and an OPEN delay exists, mark it WAIVED with the same reason (no score hit). */
  waiveOpenDelay?: boolean;
}): Promise<void> {
  const addedDays =
    input.prevDueDate && input.newDueDate
      ? daysBetween(input.prevDueDate, input.newDueDate)
      : 0;
  const addedHours = Math.max(
    0,
    (input.newEstimatedHours ?? 0) - (input.prevEstimatedHours ?? 0),
  );

  await prisma.$transaction(async (tx) => {
    await tx.card.update({
      where: { id: input.cardId },
      data: {
        ...(input.newDueDate !== undefined
          ? { dueDate: input.newDueDate }
          : {}),
        ...(input.newStartDate !== undefined
          ? { startDate: input.newStartDate }
          : {}),
        ...(input.newEstimatedHours !== undefined
          ? { estimatedHours: input.newEstimatedHours }
          : {}),
      },
    });
    await tx.cardScheduleChange.create({
      data: {
        cardId: input.cardId,
        workspaceId: input.workspaceId,
        changedById: input.changedById,
        source: input.source,
        prevDueDate: input.prevDueDate,
        newDueDate: input.newDueDate,
        prevEstimatedHours: input.prevEstimatedHours,
        newEstimatedHours: input.newEstimatedHours,
        addedDays,
        addedHours,
        reason: input.reason,
        extensionRequestId: input.extensionRequestId ?? null,
      },
    });

    if (input.waiveOpenDelay) {
      const open = await tx.cardDelayIncident.findFirst({
        where: { cardId: input.cardId, status: "OPEN" },
      });
      if (open) {
        await tx.cardDelayIncident.update({
          where: { id: open.id },
          data: {
            status: "WAIVED",
            waivedAt: new Date(),
            waivedById: input.changedById,
            waiveReason: input.reason,
            daysLate: daysBetween(open.overdueAt, new Date()),
          },
        });
      }
    }
  });
}

export async function notifyExtensionManagers(input: {
  boardId: string;
  cardId: string;
  cardTitle: string;
  workspaceId: string;
  createdById: string | null;
  actorId: string;
  amount: number;
  unit: ExtensionUnit;
  reason: string;
}) {
  const managers = await managerUserIds(input.workspaceId, input.createdById);
  await notifyUsers({
    userIds: managers,
    workspaceId: input.workspaceId,
    boardId: input.boardId,
    cardId: input.cardId,
    actorId: input.actorId,
    type: "task.extension_requested",
    title: `Extension requested: “${input.cardTitle}”`,
    body: `+${input.amount} ${input.unit.toLowerCase()} — ${input.reason}`,
  });
}

export { OPEN_WORKFLOW };
