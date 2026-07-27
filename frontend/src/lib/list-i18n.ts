type Translate = (key: string, params?: Record<string, string | number>) => string;

const LIST_TITLE_KEYS: Record<string, string> = {
  'To Do': 'myTasksPage.todo',
  'On Process': 'myTasksPage.onProcess',
  'On Review': 'myTasksPage.onReview',
  Completed: 'myTasksPage.completed',
  Done: 'myTasksPage.completed',
};

const CHECKLIST_TITLE_KEYS: Record<string, string> = {
  'start task': 'boardTask.startTask',
  'end of task': 'boardTask.endOfTask',
};

const WORKSPACE_LABEL_KEYS: Record<string, string> = {
  Report: 'boardTask.labelReport',
  'Needs thought': 'boardTask.labelNeedsThought',
  Consult: 'boardTask.labelConsult',
  Urgent: 'boardTask.labelUrgent',
  Waiting: 'boardTask.labelWaiting',
  Blocked: 'boardTask.labelBlocked',
};

const PRIORITY_SHORT_KEYS: Record<string, string> = {
  URGENT: 'boardTask.priorityUrgent',
  HIGH: 'boardTask.priorityHighShort',
  MEDIUM: 'boardTask.priorityMediumShort',
  LOW: 'boardTask.priorityLowShort',
  NONE: 'boardTask.noPriority',
};

const PRIORITY_SELECT_KEYS: Record<string, string> = {
  NONE: 'boardTask.noPriority',
  LOW: 'boardTask.priorityLow',
  MEDIUM: 'boardTask.priorityMedium',
  HIGH: 'boardTask.priorityHigh',
  URGENT: 'boardTask.priorityUrgent',
};

function translateKey(key: string, t: Translate): string | null {
  const translated = t(key);
  return translated !== key ? translated : null;
}

/** Localize common kanban list column titles from seed/API without changing DB values. */
export function localizeListTitle(title: string, t: Translate): string {
  const key = LIST_TITLE_KEYS[title];
  if (key) return translateKey(key, t) ?? title;
  return title;
}

/** Localize Start task / End of task bookends for display only. */
export function localizeChecklistTitle(title: string, t: Translate): string {
  const key = CHECKLIST_TITLE_KEYS[title.trim().toLowerCase()];
  if (key) return translateKey(key, t) ?? title;
  return title;
}

/** Localize default workspace label names for display only. */
export function localizeWorkspaceLabel(name: string, t: Translate): string {
  const key = WORKSPACE_LABEL_KEYS[name];
  if (key) return translateKey(key, t) ?? name;
  return name;
}

/** Short priority badge label (list / kanban). */
export function localizePriorityShort(priority: string, t: Translate): string {
  const key = PRIORITY_SHORT_KEYS[(priority || 'NONE').toUpperCase()];
  if (key) return translateKey(key, t) ?? priority;
  return priority;
}

/** Full priority option label (create / edit selects). */
export function localizePrioritySelect(priority: string, t: Translate): string {
  const key = PRIORITY_SELECT_KEYS[(priority || 'NONE').toUpperCase()];
  if (key) return translateKey(key, t) ?? priority;
  return priority;
}
