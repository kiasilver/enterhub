import {
  isChecklistBookend,
  isChecklistEnd,
  isChecklistStart,
} from '@/lib/checklist-defaults';
import type { MyTaskItem } from '@/components/dashboards/MyTasksViews';
import type { KanbanColumnId } from '@/components/dashboards/MyTasksKanban';

export type MyTasksColumns = Record<KanbanColumnId, MyTaskItem[]>;

export function taskLooksCompleted(task: MyTaskItem): boolean {
  return task.status === 'done' || task.workflowStatus === 'APPROVED';
}

export function finishBlockReason(
  task: MyTaskItem,
): 'done' | 'milestones' | null {
  if (
    taskLooksCompleted(task) ||
    task.status === 'review' ||
    task.workflowStatus === 'PENDING_APPROVAL'
  ) {
    return 'done';
  }
  const milestones = (task.checklistItems || []).filter(
    (i) => !isChecklistBookend(i.title),
  );
  if (milestones.some((m) => !m.isDone)) return 'milestones';
  return null;
}

export function applyColumnMove(
  task: MyTaskItem,
  to: KanbanColumnId,
): MyTaskItem {
  const hasSupervisor = !!task.supervisor?.id;
  const effectiveTo: KanbanColumnId =
    to === 'done' && hasSupervisor ? 'review' : to;
  return {
    ...task,
    status: effectiveTo === 'todo' ? 'todo' : effectiveTo,
    workflowStatus:
      effectiveTo === 'todo'
        ? 'ASSIGNED'
        : effectiveTo === 'review'
          ? 'PENDING_APPROVAL'
          : effectiveTo === 'done'
            ? 'APPROVED'
            : 'IN_PROGRESS',
    checklistItems: (task.checklistItems || []).map((i) => {
      if (isChecklistEnd(i.title)) {
        return {
          ...i,
          isDone: effectiveTo === 'done' || effectiveTo === 'review',
        };
      }
      if (isChecklistStart(i.title)) {
        return { ...i, isDone: effectiveTo !== 'todo' };
      }
      return i;
    }),
  };
}

/** Resolve finish destination: supervisor → review, else completed. */
export function finishDestination(task: MyTaskItem): 'review' | 'done' {
  return task.supervisor?.id ? 'review' : 'done';
}

export function markTaskFinished(task: MyTaskItem): MyTaskItem {
  return applyColumnMove(task, finishDestination(task));
}

export function relocateTaskToColumn(
  board: MyTasksColumns,
  taskId: string,
  to: KanbanColumnId,
): MyTasksColumns {
  const found =
    board.todo.find((t) => t.id === taskId) ||
    board.progress.find((t) => t.id === taskId) ||
    board.review.find((t) => t.id === taskId) ||
    board.done.find((t) => t.id === taskId);
  if (!found) return board;
  const moved = applyColumnMove(found, to);
  const effective = (moved.status as KanbanColumnId) || to;
  return {
    todo: board.todo.filter((t) => t.id !== taskId),
    progress: board.progress.filter((t) => t.id !== taskId),
    review: board.review.filter((t) => t.id !== taskId),
    done: board.done.filter((t) => t.id !== taskId),
    [effective]: [
      moved,
      ...(
        {
          todo: board.todo,
          progress: board.progress,
          review: board.review,
          done: board.done,
        }[effective] || []
      ).filter((t) => t.id !== taskId),
    ],
  };
}

export function relocateTaskToReview(
  board: MyTasksColumns,
  taskId: string,
): MyTasksColumns {
  return relocateTaskToColumn(board, taskId, 'review');
}
