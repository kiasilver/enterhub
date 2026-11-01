import { EventEmitter } from 'events';

/**
 * Workspace-scoped board/department live events (SSE /boards/stream).
 * Prefer coarse `*.changed` invalidate events for department/projects UIs
 * that already reload from GET — keeps publishers cheap and clients consistent.
 */
export type BoardLiveEvent =
  | {
      type: 'board.archived';
      workspaceId: string;
      boardId: string;
      departmentId?: string | null;
    }
  | {
      type: 'board.changed';
      workspaceId: string;
      boardId: string;
      departmentId?: string | null;
      reason?: 'created' | 'updated' | 'restored';
    }
  | {
      type: 'card.deleted';
      workspaceId: string;
      boardId: string;
      cardId: string;
      departmentId?: string | null;
    }
  | {
      type: 'card.changed';
      workspaceId: string;
      boardId: string;
      cardId?: string;
      departmentId?: string | null;
      reason?: 'created' | 'updated' | 'moved' | 'completed';
    }
  | {
      type: 'department.changed';
      workspaceId: string;
      departmentId: string;
      reason?: 'created' | 'updated' | 'deleted' | 'members';
    }
  | {
      /** Force any boards/dept subscribers to refetch */
      type: 'workspace.invalidate';
      workspaceId: string;
      departmentId?: string | null;
    };

declare global {
  // eslint-disable-next-line no-var
  var __boardsLiveBus: EventEmitter | undefined;
}

function bus() {
  if (!global.__boardsLiveBus) {
    global.__boardsLiveBus = new EventEmitter();
    global.__boardsLiveBus.setMaxListeners(500);
  }
  return global.__boardsLiveBus;
}

export function publishBoardLive(event: BoardLiveEvent) {
  bus().emit(`boards:${event.workspaceId}`, event);
}

export function subscribeBoardLive(
  workspaceId: string,
  handler: (event: BoardLiveEvent) => void,
) {
  const key = `boards:${workspaceId}`;
  bus().on(key, handler);
  return () => bus().off(key, handler);
}

/** Helper for mutation routes */
export function publishWorkspaceBoardInvalidate(
  workspaceId: string,
  opts?: { departmentId?: string | null; boardId?: string; cardId?: string; reason?: string },
) {
  if (opts?.departmentId) {
    publishBoardLive({
      type: 'department.changed',
      workspaceId,
      departmentId: opts.departmentId,
      reason: (opts.reason as 'updated') || 'updated',
    });
  }
  if (opts?.boardId && opts?.cardId) {
    publishBoardLive({
      type: 'card.changed',
      workspaceId,
      boardId: opts.boardId,
      cardId: opts.cardId,
      departmentId: opts.departmentId,
      reason: (opts.reason as 'updated') || 'updated',
    });
    return;
  }
  if (opts?.boardId) {
    publishBoardLive({
      type: 'board.changed',
      workspaceId,
      boardId: opts.boardId,
      departmentId: opts.departmentId,
      reason: (opts.reason as 'updated') || 'updated',
    });
    return;
  }
  publishBoardLive({
    type: 'workspace.invalidate',
    workspaceId,
    departmentId: opts?.departmentId,
  });
}
