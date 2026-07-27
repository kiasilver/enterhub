import { EventEmitter } from 'events';

export type ChecklistToggleEvent = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  itemId: string;
  isDone: boolean;
  title?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __myTasksBus: EventEmitter | undefined;
}

function bus() {
  if (!global.__myTasksBus) {
    global.__myTasksBus = new EventEmitter();
    global.__myTasksBus.setMaxListeners(500);
  }
  return global.__myTasksBus;
}

export function publishChecklistToggle(event: ChecklistToggleEvent) {
  bus().emit(`my-tasks:${event.workspaceId}`, event);
}

export function subscribeMyTasks(
  workspaceId: string,
  handler: (event: ChecklistToggleEvent) => void,
) {
  const key = `my-tasks:${workspaceId}`;
  bus().on(key, handler);
  return () => bus().off(key, handler);
}
