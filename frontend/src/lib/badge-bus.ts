import { EventEmitter } from 'events';

export type WorkspaceBadgeCounts = {
  chat: number;
  email: number;
  mentions: number;
  letters: number;
  /** chat + mentions + letters (sidebar Chat badge) */
  chatTotal: number;
};

type BadgeEvent = {
  workspaceId: string;
  userId?: string;
  counts?: WorkspaceBadgeCounts;
};

declare global {
  // eslint-disable-next-line no-var
  var __workspaceBadgeBus: EventEmitter | undefined;
}

function bus() {
  if (!global.__workspaceBadgeBus) {
    global.__workspaceBadgeBus = new EventEmitter();
    global.__workspaceBadgeBus.setMaxListeners(500);
  }
  return global.__workspaceBadgeBus;
}

export function publishBadgeRefresh(event: BadgeEvent) {
  bus().emit(`badges:${event.workspaceId}`, event);
  if (event.userId) {
    bus().emit(`badges:${event.workspaceId}:${event.userId}`, event);
  }
}

export function subscribeWorkspaceBadges(
  workspaceId: string,
  handler: (event: BadgeEvent) => void,
) {
  const key = `badges:${workspaceId}`;
  bus().on(key, handler);
  return () => bus().off(key, handler);
}

export function subscribeUserBadges(
  workspaceId: string,
  userId: string,
  handler: (event: BadgeEvent) => void,
) {
  const key = `badges:${workspaceId}:${userId}`;
  const unsubWs = subscribeWorkspaceBadges(workspaceId, handler);
  bus().on(key, handler);
  return () => {
    unsubWs();
    bus().off(key, handler);
  };
}
