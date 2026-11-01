export const DEFAULT_BOARD_LISTS = [
  { title: "To Do", order: 0 },
  { title: "In Progress", order: 1 },
  { title: "On Review", order: 2 },
  { title: "Done", order: 3 },
] as const;

export const GENERAL_BOARD_NAME = "General";

export function isGeneralBoardName(name: string | null | undefined): boolean {
  const n = (name || "").trim().toLowerCase();
  return n === "general" || n === "عمومی";
}

export function listBucket(
  title: string,
): "todo" | "progress" | "review" | "done" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

export function pickMatchingList<T extends { id: string; title: string; order?: number }>(
  sourceTitle: string,
  lists: T[],
): T | null {
  if (!lists.length) return null;
  const ranked = [...lists].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const bucket = listBucket(sourceTitle);
  if (bucket !== "other") {
    const match = ranked.find((l) => listBucket(l.title) === bucket);
    if (match) return match;
  }
  return ranked.find((l) => listBucket(l.title) === "todo") || ranked[0];
}
