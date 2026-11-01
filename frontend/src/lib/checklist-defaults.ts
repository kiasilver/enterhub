/** Default bookend checklist titles for new tasks. */
export const CHECKLIST_START = 'Start task';
export const CHECKLIST_END = 'End of task';

export const DEFAULT_CHECKLIST = [CHECKLIST_START, CHECKLIST_END] as const;

export type ChecklistDraftItem = {
  title: string;
  description: string;
  noteOpen: boolean;
};

export function defaultChecklistDrafts(): ChecklistDraftItem[] {
  return DEFAULT_CHECKLIST.map((title) => ({
    title,
    description: '',
    noteOpen: false,
  }));
}

export function isChecklistBookend(title: string): boolean {
  const t = title.trim().toLowerCase();
  return t === CHECKLIST_START.toLowerCase() || t === CHECKLIST_END.toLowerCase();
}

export function isChecklistStart(title: string): boolean {
  return title.trim().toLowerCase() === CHECKLIST_START.toLowerCase();
}

export function isChecklistEnd(title: string): boolean {
  return title.trim().toLowerCase() === CHECKLIST_END.toLowerCase();
}

/**
 * Insert a new item between Start and End when those bookends exist.
 * Order becomes: Start → …middle… → End
 */
export function insertChecklistItem(
  items: ChecklistDraftItem[],
  title: string,
): ChecklistDraftItem[] {
  const t = title.trim();
  if (!t) return items;
  const item: ChecklistDraftItem = { title: t, description: '', noteOpen: false };

  const endIdx = items.findIndex(
    (x) => x.title.trim().toLowerCase() === CHECKLIST_END.toLowerCase(),
  );
  if (endIdx >= 0) {
    const next = [...items];
    next.splice(endIdx, 0, item);
    return next;
  }

  const startIdx = items.findIndex(
    (x) => x.title.trim().toLowerCase() === CHECKLIST_START.toLowerCase(),
  );
  if (startIdx >= 0) {
    const next = [...items];
    next.splice(startIdx + 1, 0, item);
    return next;
  }

  return [...items, item];
}

export type ChecklistCreateInput =
  | string
  | { title: string; description?: string | null };

export function normalizeChecklistCreate(
  raw?: ChecklistCreateInput[] | null,
): { title: string; description: string | null }[] {
  if (!raw?.length) {
    return DEFAULT_CHECKLIST.map((title) => ({ title, description: null }));
  }
  return raw.map((item) =>
    typeof item === 'string'
      ? { title: item, description: null }
      : {
          title: item.title,
          description: item.description?.trim() || null,
        },
  );
}
