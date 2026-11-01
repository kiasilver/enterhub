import { prisma } from "@/lib/prisma";
import type { CardWorkflowStatus } from "@prisma/client";
import { notifyUsers } from "@/lib/card-permissions";
import { emitToBoardRoom } from "@/lib/socket-emit";
import { isDoneListTitle } from "@/lib/board-access";
import {
  CHECKLIST_END,
  CHECKLIST_START,
} from "@/lib/checklist-defaults";

export type WorkflowCard = {
  id: string;
  title: string;
  createdById: string | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  workflowStatus: CardWorkflowStatus;
  listId: string;
};

/** Manager must set a due date range before employee can start. */
export function assignmentReady(card: {
  dueDate: Date | null;
  startDate?: Date | null;
  estimatedHours?: number | null;
}): { ok: true } | { ok: false; error: string } {
  if (!card.startDate || !card.dueDate) {
    return {
      ok: false,
      error: "Manager must set a due date range before work can start",
    };
  }
  return { ok: true };
}

/** Mark the Start task / End of task bookend checklist item done. */
export async function markChecklistBookend(
  cardId: string,
  which: "start" | "end",
) {
  await setChecklistBookend(cardId, which, true);
}

/** Set Start task / End of task bookend on or off. */
export async function setChecklistBookend(
  cardId: string,
  which: "start" | "end",
  isDone: boolean,
) {
  const title = which === "start" ? CHECKLIST_START : CHECKLIST_END;
  await prisma.checklistItem.updateMany({
    where: {
      cardId,
      title: { equals: title, mode: "insensitive" },
    },
    data: { isDone },
  });
}

export async function checklistAllDone(cardId: string): Promise<{
  total: number;
  done: number;
  complete: boolean;
}> {
  const items = await prisma.checklistItem.findMany({
    where: { cardId },
    select: { isDone: true, title: true },
  });
  const work = items.filter((i) => {
    const t = i.title.trim().toLowerCase();
    return t !== CHECKLIST_START.toLowerCase() && t !== CHECKLIST_END.toLowerCase();
  });
  const total = work.length;
  const done = work.filter((i) => i.isDone).length;
  return { total, done, complete: total === 0 || done === total };
}

export type WorkflowColumn = "todo" | "progress" | "review" | "done";

/** Move a card to a My Tasks column and sync Start / End bookends. */
export async function applyWorkflowColumn(
  boardId: string,
  card: {
    id: string;
    workflowStatus: CardWorkflowStatus;
    startedAt: Date | null;
    supervisorId?: string | null;
  },
  to: WorkflowColumn,
) {
  const cardId = card.id;

  // With a supervisor, "Completed" is not allowed until they approve → On Review
  if (to === "done" && card.supervisorId) {
    to = "review";
  }

  if (to === "done") {
    await markChecklistBookend(cardId, "start");
    await markChecklistBookend(cardId, "end");
    const doneList = await ensureDoneList(boardId);
    await moveCardToList(cardId, doneList.id);
    if (card.workflowStatus === "APPROVED") {
      return prisma.card.findUniqueOrThrow({ where: { id: cardId } });
    }
    // No supervisor: finish is final (no approval gate)
    return prisma.card.update({
      where: { id: cardId },
      data: {
        workflowStatus: "APPROVED",
        startedAt: card.startedAt ?? new Date(),
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: null,
        rejectionNote: null,
      },
    });
  }

  if (to === "todo") {
    const todo = await ensureTodoList(boardId);
    await moveCardToList(cardId, todo.id);
    await setChecklistBookend(cardId, "start", false);
    await setChecklistBookend(cardId, "end", false);
    return prisma.card.update({
      where: { id: cardId },
      data: {
        workflowStatus: "ASSIGNED",
        startedAt: null,
        submittedAt: null,
        approvedAt: null,
        approvedById: null,
        rejectionNote: null,
      },
    });
  }

  if (to === "review") {
    await markChecklistBookend(cardId, "start");
    await markChecklistBookend(cardId, "end");
    const review = await ensureReviewList(boardId);
    await moveCardToList(cardId, review.id);
    return prisma.card.update({
      where: { id: cardId },
      data: {
        workflowStatus: "PENDING_APPROVAL",
        startedAt: card.startedAt ?? new Date(),
        submittedAt: new Date(),
        approvedAt: null,
        approvedById: null,
        rejectionNote: null,
      },
    });
  }

  const list = await ensureProgressList(boardId);
  await moveCardToList(cardId, list.id);
  await markChecklistBookend(cardId, "start");
  await setChecklistBookend(cardId, "end", false);
  return prisma.card.update({
    where: { id: cardId },
    data: {
      workflowStatus: "IN_PROGRESS",
      startedAt: card.startedAt ?? new Date(),
      submittedAt: null,
      approvedAt: null,
      approvedById: null,
      rejectionNote: null,
    },
  });
}

async function findListByHeuristic(
  boardId: string,
  kind: "progress" | "done" | "todo",
) {
  const lists = await prisma.list.findMany({
    where: { boardId, archivedAt: null },
    orderBy: { order: "asc" },
  });
  if (kind === "progress") {
    return (
      lists.find((l) => /progress|doing|active|wip|in progress/i.test(l.title)) ||
      lists[1] ||
      lists[0]
    );
  }
  if (kind === "done") {
    return (
      lists.find((l) => isDoneListTitle(l.title)) ||
      lists.find((l) => /done|complete|closed/i.test(l.title))
    );
  }
  return lists[0];
}

export async function moveCardToList(cardId: string, listId: string) {
  const maxOrder = await prisma.card.aggregate({
    where: { listId },
    _max: { order: true },
  });
  return prisma.card.update({
    where: { id: cardId },
    data: { listId, order: (maxOrder._max.order ?? 0) + 1 },
  });
}

export async function ensureTodoList(boardId: string) {
  let list = await findListByHeuristic(boardId, "todo");
  if (!list) {
    list = await prisma.list.create({
      data: { boardId, title: "To Do", order: 0 },
    });
  }
  return list;
}

export async function ensureProgressList(boardId: string) {
  let list = await findListByHeuristic(boardId, "progress");
  if (!list) {
    list = await prisma.list.create({
      data: { boardId, title: "In Progress", order: 1 },
    });
  }
  return list;
}

export async function ensureDoneList(boardId: string) {
  let list = await findListByHeuristic(boardId, "done");
  if (!list) {
    const max = await prisma.list.aggregate({
      where: { boardId },
      _max: { order: true },
    });
    list = await prisma.list.create({
      data: {
        boardId,
        title: "Done",
        order: (max._max.order ?? 0) + 1,
      },
    });
  }
  return list;
}

export async function ensureReviewList(boardId: string) {
  const lists = await prisma.list.findMany({
    where: { boardId, archivedAt: null },
    orderBy: { order: "asc" },
  });
  let list =
    lists.find((l) => /on review|review/i.test(l.title)) ||
    lists.find((l) => /approval|pending|qa|بررسی/i.test(l.title));
  if (!list) {
    const max = await prisma.list.aggregate({
      where: { boardId },
      _max: { order: true },
    });
    const doneList =
      lists.find((l) => isDoneListTitle(l.title)) ||
      lists.find((l) => /done|complete|closed|تکمیل/i.test(l.title));
    list = await prisma.list.create({
      data: {
        boardId,
        title: "On Review",
        order: doneList ? doneList.order - 0.5 : (max._max.order ?? 1) + 0.5,
      },
    });
  }
  return list;
}

export async function notifyWorkflow(opts: {
  userIds: string[];
  workspaceId: string;
  boardId: string;
  cardId: string;
  actorId: string;
  type: string;
  title: string;
  body: string;
}) {
  const ids = [...new Set(opts.userIds)].filter((id) => id && id !== opts.actorId);
  if (!ids.length) return;
  await notifyUsers({
    userIds: ids,
    workspaceId: opts.workspaceId,
    boardId: opts.boardId,
    cardId: opts.cardId,
    actorId: opts.actorId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
  });
  emitToBoardRoom(opts.boardId, "card-updated", {
    type: opts.type,
    cardId: opts.cardId,
  });
}

export async function managerUserIds(
  workspaceId: string,
  createdById: string | null,
  extraIds: Array<string | null | undefined> = [],
): Promise<string[]> {
  const ids = new Set<string>();
  if (createdById) ids.add(createdById);
  for (const id of extraIds) {
    if (id) ids.add(id);
  }
  const elevated = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      role: {
        permissions: {
          some: {
            permission: {
              actionName: { in: ["card:complete_done", "board:settings", "card:assign"] },
            },
          },
        },
      },
    },
    select: { userId: true },
    take: 40,
  });
  for (const m of elevated) ids.add(m.userId);
  return [...ids];
}
