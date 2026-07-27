/**
 * Client-safe department metadata (no Prisma / Node APIs).
 * Server code may re-export from `@/lib/departments`.
 */

import { DEPARTMENTS } from "@/lib/enterprise-positions";

export const DEPT_COLORS: Record<string, string> = {
  finance: "#10B981",
  it: "#3B82F6",
  hr: "#8B5CF6",
  marketing: "#F59E0B",
  operations: "#06B6D4",
  general: "#6B7280",
};

/** Default Material Icons ligature per department key */
export const DEPT_ICONS: Record<string, string> = {
  finance: "account_balance",
  it: "computer",
  hr: "groups",
  marketing: "campaign",
  operations: "precision_manufacturing",
  general: "business",
};

export function departmentLabel(key: string): string {
  return DEPARTMENTS.find((d) => d.key === key)?.label || key;
}

export function departmentColor(key: string): string {
  return DEPT_COLORS[key] || DEPT_COLORS.general;
}

export function departmentIcon(key: string): string {
  return DEPT_ICONS[key] || DEPT_ICONS.general;
}
