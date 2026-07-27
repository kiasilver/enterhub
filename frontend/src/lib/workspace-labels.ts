/** Default workspace labels (English). */
export const DEFAULT_WORKSPACE_LABELS: {
  name: string;
  color: string;
  sortOrder: number;
}[] = [
  { name: "Report", color: "#3B82F6", sortOrder: 0 },
  { name: "Needs thought", color: "#8B5CF6", sortOrder: 1 },
  { name: "Consult", color: "#06B6D4", sortOrder: 2 },
  { name: "Urgent", color: "#EF4444", sortOrder: 3 },
  { name: "Waiting", color: "#F59E0B", sortOrder: 4 },
  { name: "Blocked", color: "#64748B", sortOrder: 5 },
];

export const CARD_PRIORITIES = [
  { value: "NONE", label: "No priority", color: "#94a3b8" },
  { value: "LOW", label: "Priority 3 · Low", color: "#22c55e" },
  { value: "MEDIUM", label: "Priority 2 · Medium", color: "#3b82f6" },
  { value: "HIGH", label: "Priority 1 · High", color: "#f59e0b" },
  { value: "URGENT", label: "Urgent", color: "#ef4444" },
] as const;

export type CardPriorityValue = (typeof CARD_PRIORITIES)[number]["value"];
