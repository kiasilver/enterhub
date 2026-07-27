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

/** Manager must set due date + estimated hours before employee can start. */
export function assignmentReady(card: {
  dueDate: Date | null;
  startDate?: Date | null;
  estimatedHours: number | null;
}): { ok: true } | { ok: false; error: string } {
  if (!card.startDate || !card.dueDate) {
    return {
      ok: false,
      error: "Manager must set a due date range before work can start",
    };
  }
  if (card.estimatedHours == null || card.estimatedHours <= 0) {
    return {
      ok: false,
      error: "Manager must set estimated hours before work can start",
    };
  }
  return { ok: true };
}

/** Mark the Start task / End of task bookend checklist item done. */
export async function markChecklistBookend(
  cardId: string,
  which: "start" | "end",
) {
  const title = which === "start" ? CHECKLIST_START : CHECKLIST_END;
  await prisma.checklistItem.updateMany({
    where: {
      cardId,
      title: { equals: title, mode: "insensitive" },
      isDone: false,
    },
    data: { isDone: true },
  });
}

export async function checklistAllDone(cardId: string): Promise<{
  total: number;
  done: number;
  complete: boolean;
}> {
  const items = await prisma.checklistItem.findMany({
    where: { cardId },
    select: { isDone: true },
  });
  const total = items.length;
  const done = items.filter((i) => i.isDone).length;
  return { total, done, complete: total === 0 || done === total };
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
  let list = lists.find((l) => /review|approval|pending|qa/i.test(l.title));
  if (!list) {
    const max = await prisma.list.aggregate({
      where: { boardId },
      _max: { order: true },
    });
    list = await prisma.list.create({
      data: {
        boardId,
        title: "Pending Approval",
        order: (max._max.order ?? 1) + 0.5,
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
): Promise<string[]> {
  const ids = new Set<string>();
  if (createdById) ids.add(createdById);
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
