/** Default bookend checklist titles for new tasks. */
export const CHECKLIST_START = 'Start task';
export const CHECKLIST_END = 'End of task';

export const DEFAULT_CHECKLIST = [CHECKLIST_START, CHECKLIST_END] as const;

export function isChecklistBookend(title: string): boolean {
  const t = title.trim().toLowerCase();
  return t === CHECKLIST_START.toLowerCase() || t === CHECKLIST_END.toLowerCase();
}

/**
 * Insert a new item between Start and End when those bookends exist.
 * Order becomes: Start → …middle… → End
 */
export function insertChecklistItem(items: string[], title: string): string[] {
  const t = title.trim();
  if (!t) return items;

  const endIdx = items.findIndex(
    (x) => x.trim().toLowerCase() === CHECKLIST_END.toLowerCase(),
  );
  if (endIdx >= 0) {
    const next = [...items];
    next.splice(endIdx, 0, t);
    return next;
  }

  const startIdx = items.findIndex(
    (x) => x.trim().toLowerCase() === CHECKLIST_START.toLowerCase(),
  );
  if (startIdx >= 0) {
    const next = [...items];
    next.splice(startIdx + 1, 0, t);
    return next;
  }

  return [...items, t];
}
