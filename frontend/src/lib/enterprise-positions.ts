/**
 * Enterprise position templates seeded into a workspace during company onboarding.
 * These create workspace Roles (permission matrices) — not system Owner/Member roles.
 */

export type EmployeeBand = "SOLO" | "SMALL" | "MEDIUM" | "LARGE";

export type DepartmentKey = "finance" | "marketing" | "it" | "hr" | "operations";

export const DEPARTMENTS: {
  key: DepartmentKey;
  label: string;
  description: string;
  defaultChecked: boolean;
}[] = [
  { key: "finance", label: "Finance", description: "Accounting, budgets, invoices", defaultChecked: true },
  { key: "it", label: "IT / Engineering", description: "Dev, infrastructure, support", defaultChecked: true },
  { key: "hr", label: "Human Resources", description: "Hiring, people ops", defaultChecked: false },
  { key: "marketing", label: "Marketing", description: "Growth, content, campaigns", defaultChecked: false },
  { key: "operations", label: "Operations", description: "Ops, facilities, delivery", defaultChecked: false },
];

export const EMPLOYEE_BANDS: {
  key: EmployeeBand;
  label: string;
  seatHint: number;
}[] = [
  { key: "SOLO", label: "Just me", seatHint: 1 },
  { key: "SMALL", label: "2–10 people", seatHint: 10 },
  { key: "MEDIUM", label: "11–50 people", seatHint: 25 },
  { key: "LARGE", label: "51+ people", seatHint: 50 },
];

export type PositionTemplate = {
  /** Stable key for custom checkbox ids */
  key: string;
  name: string;
  description: string;
  department: DepartmentKey | "leadership";
  /** Default checked when parent department is selected */
  defaultChecked: boolean;
  /** Permission actions (subset of catalog) */
  permissions: readonly string[];
};

const MEMBER_CORE = [
  "workspace:read",
  "board:read",
  "card:create",
  "card:update",
  "comment:create",
  "attachment:create",
  "timesheet:write",
  "people:analytics",
  "letter:send",
  "calendar:create",
] as const;

const MANAGER_EXTRA = [
  "board:create",
  "board:settings",
  "board:update",
  "list:create",
  "list:update",
  "list:delete",
  "card:assign",
  "card:delete",
  "card:views",
  "card:complete_done",
  "label:manage",
  "board:invite_guest",
  "timesheet:read",
  "department:invite",
  "department:approve_invite",
  "analytics:team",
  "people:analytics",
  "letter:send",
  "letter:read_all",
  "calendar:create",
  "calendar:manage",
] as const;

const SUPERVISOR_EXTRA = [
  "board:create",
  "board:settings",
  "board:update",
  "board:invite_guest",
  "list:create",
  "list:update",
  "card:assign",
  "card:views",
  "card:complete_done",
  "label:manage",
  "department:invite",
  "timesheet:read",
  "analytics:team",
  "people:analytics",
] as const;

export const POSITION_TEMPLATES: PositionTemplate[] = [
  // Leadership (always offered)
  {
    key: "ceo",
    name: "CEO",
    description: "Executive oversight — Org Admin–level access",
    department: "leadership",
    defaultChecked: false,
    permissions: [
      "workspace:read",
      "workspace:update",
      "workspace:members",
      "workspace:roles",
      "workspace:audit",
      "workspace:billing",
      "department:manage",
      "department:invite",
      "department:approve_invite",
      "analytics:team",
      "analytics:company",
      "people:analytics",
      "board:create",
      "board:read",
      "board:update",
      "board:delete",
      "board:settings",
      "board:invite_guest",
      "list:create",
      "list:update",
      "list:delete",
      "card:create",
      "card:update",
      "card:delete",
      "card:assign",
      "card:views",
      "label:manage",
      "comment:create",
      "attachment:create",
      "timesheet:write",
      "timesheet:read",
      "automation:manage",
    ],
  },
  {
    key: "founder",
    name: "Founder",
    description: "Company founder title (Owner keeps full control)",
    department: "leadership",
    defaultChecked: true,
    permissions: MEMBER_CORE, // title role for others; owner stays Owner
  },

  // Finance
  {
    key: "finance_manager",
    name: "Finance Manager",
    description: "Leads finance boards and approvals",
    department: "finance",
    defaultChecked: true,
    permissions: [...MEMBER_CORE, ...MANAGER_EXTRA, "timesheet:read", "field:financial"],
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Day-to-day finance tasks and invoices",
    department: "finance",
    defaultChecked: true,
    permissions: [...MEMBER_CORE, "field:financial", "timesheet:read"],
  },

  // IT
  {
    key: "it_supervisor",
    name: "IT Supervisor",
    description: "Leads engineering / IT boards (department supervisor)",
    department: "it",
    defaultChecked: true,
    permissions: [...MEMBER_CORE, ...SUPERVISOR_EXTRA, "automation:manage", "webhook:manage"],
  },
  {
    key: "developer",
    name: "Developer",
    description: "Engineering contributor",
    department: "it",
    defaultChecked: true,
    permissions: MEMBER_CORE,
  },

  // HR
  {
    key: "hr_manager",
    name: "HR Manager",
    description: "People ops and hiring boards",
    department: "hr",
    defaultChecked: true,
    permissions: [...MEMBER_CORE, ...MANAGER_EXTRA, "workspace:members"],
  },
  {
    key: "recruiter",
    name: "Recruiter",
    description: "Hiring pipeline contributor",
    department: "hr",
    defaultChecked: true,
    permissions: MEMBER_CORE,
  },

  // Marketing
  {
    key: "marketing_manager",
    name: "Marketing Manager",
    description: "Campaigns and growth boards",
    department: "marketing",
    defaultChecked: true,
    permissions: [...MEMBER_CORE, ...MANAGER_EXTRA],
  },
  {
    key: "marketer",
    name: "Marketing Specialist",
    description: "Marketing contributor",
    department: "marketing",
    defaultChecked: true,
    permissions: MEMBER_CORE,
  },

  // Operations
  {
    key: "ops_manager",
    name: "Operations Manager",
    description: "Ops delivery lead",
    department: "operations",
    defaultChecked: true,
    permissions: [...MEMBER_CORE, ...MANAGER_EXTRA],
  },
  {
    key: "ops_specialist",
    name: "Operations Specialist",
    description: "Ops contributor",
    department: "operations",
    defaultChecked: true,
    permissions: MEMBER_CORE,
  },
];

export function positionsForDepartments(
  departments: DepartmentKey[],
  includeLeadership = true
): PositionTemplate[] {
  const set = new Set(departments);
  return POSITION_TEMPLATES.filter((p) => {
    if (p.department === "leadership") return includeLeadership;
    return set.has(p.department);
  });
}

const AVATAR_COLORS = [
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#6366F1",
];

/** Deterministic letter-avatar color from company name (Trello/Google style). */
export function letterAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function companyInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toUpperCase();
}

export function seatLimitForBand(band: EmployeeBand): number {
  return EMPLOYEE_BANDS.find((b) => b.key === band)?.seatHint ?? 5;
}
