/**
 * Full permission catalog for Enterhub RBAC (User Management & Access Control).
 * actionName values are stored in Permission.actionName and checked via hasPermission().
 */

export type PermissionGroup =
  | "workspace"
  | "security"
  | "billing"
  | "department"
  | "board"
  | "list"
  | "card"
  | "collab"
  | "automation"
  | "guest";

export interface PermissionDef {
  actionName: string;
  description: string;
  group: PermissionGroup;
}

export const PERMISSION_CATALOG: PermissionDef[] = [
  // —— Workspace / Org Admin ——
  { actionName: "workspace:read", description: "View workspace overview and settings (non-secret)", group: "workspace" },
  { actionName: "workspace:update", description: "Update workspace name, branding, defaults", group: "workspace" },
  { actionName: "workspace:delete", description: "Request soft-delete / close workspace", group: "workspace" },
  { actionName: "workspace:transfer_ownership", description: "Transfer workspace ownership to another member", group: "workspace" },
  { actionName: "workspace:members", description: "Invite, remove, and list workspace members", group: "workspace" },
  { actionName: "workspace:roles", description: "Create/edit custom roles and permission matrix", group: "workspace" },
  { actionName: "workspace:audit", description: "Read workspace security/activity audit logs", group: "workspace" },
  { actionName: "workspace:export", description: "Export workspace data (GDPR / backup)", group: "workspace" },

  // —— Departments / org units ——
  {
    actionName: "department:manage",
    description: "Create and edit departments; assign department managers (Founder / Org Admin)",
    group: "department",
  },
  {
    actionName: "department:invite",
    description: "Invite people into a department you manage or supervise",
    group: "department",
  },
  {
    actionName: "department:approve_invite",
    description: "Approve department invites after the employee accepts (manager; or supervisor if no manager)",
    group: "department",
  },

  // —— Security policies ——
  { actionName: "security:policies", description: "Enforce 2FA, IP allowlist, session timeout", group: "security" },
  { actionName: "security:force_logout", description: "Force-logout a member from all devices", group: "security" },

  // —— Billing ——
  { actionName: "workspace:billing", description: "View invoices, seats, and plan changes", group: "billing" },

  // —— Boards ——
  { actionName: "board:create", description: "Create boards in the workspace", group: "board" },
  { actionName: "board:read", description: "View boards the member can access", group: "board" },
  { actionName: "board:update", description: "Rename/update boards", group: "board" },
  { actionName: "board:delete", description: "Archive or delete boards", group: "board" },
  { actionName: "board:settings", description: "Board settings, custom fields, default view, visibility", group: "board" },
  { actionName: "board:invite_guest", description: "Invite guests/observers to a board", group: "board" },

  // —— Lists ——
  { actionName: "list:create", description: "Create lists/columns", group: "list" },
  { actionName: "list:update", description: "Reorder/rename lists", group: "list" },
  { actionName: "list:delete", description: "Archive/delete lists", group: "list" },

  // —— Cards ——
  { actionName: "card:create", description: "Create cards", group: "card" },
  { actionName: "card:update", description: "Edit and move cards (DnD)", group: "card" },
  { actionName: "card:delete", description: "Archive/delete cards", group: "card" },
  { actionName: "card:assign", description: "Assign members to cards", group: "card" },
  {
    actionName: "card:views",
    description: "See who viewed a card (read receipts). Hidden from members/assignees by default",
    group: "card",
  },
  {
    actionName: "card:complete_done",
    description: "Move cards into Done / final column (project lead or QA)",
    group: "card",
  },
  {
    actionName: "field:financial",
    description: "View and edit financial custom fields (cost, rate, budget)",
    group: "card",
  },
  {
    actionName: "label:manage",
    description: "Create and edit workspace labels (colors/tags) for cards",
    group: "card",
  },

  // —— Analytics / work trends ——
  {
    actionName: "analytics:team",
    description:
      "View work analytics for your department team (scores, delays, completion, extensions)",
    group: "department",
  },
  {
    actionName: "analytics:company",
    description:
      "View company-wide work analytics across all departments (Org Admin / leadership)",
    group: "department",
  },
  {
    actionName: "people:analytics",
    description:
      "View an employee’s full people analytics dossier (workload, scores, trends, HR insights). Department managers are limited to their own team; members may view the whole team directory",
    group: "department",
  },

  // —— Collaboration ——
  { actionName: "comment:create", description: "Comment on cards", group: "collab" },
  { actionName: "attachment:create", description: "Upload attachments", group: "collab" },
  { actionName: "timesheet:write", description: "Log time on cards", group: "collab" },
  { actionName: "timesheet:read", description: "View time logs (sensitive — redact for guests)", group: "collab" },
  {
    actionName: "letter:send",
    description: "Compose formal workspace letters (excuse / admin / general)",
    group: "collab",
  },
  {
    actionName: "letter:read_all",
    description: "Read all workspace letters (managers / org admins)",
    group: "collab",
  },
  {
    actionName: "calendar:create",
    description: "Create calendar events / meetings and invite members",
    group: "collab",
  },
  {
    actionName: "calendar:manage",
    description: "Edit or delete any workspace calendar event",
    group: "collab",
  },

  // —— Automations ——
  { actionName: "automation:manage", description: "Manage board automations", group: "automation" },
  { actionName: "webhook:manage", description: "Manage board webhooks/integrations", group: "automation" },

  // —— Guest-oriented (usually granted via BoardGuest, not workspace role) ——
  { actionName: "guest:comment", description: "Guest may comment", group: "guest" },
  { actionName: "guest:attach", description: "Guest may upload files", group: "guest" },
];

/** Flat list for seeds / Zod enums */
export const DEFAULT_PERMISSIONS = PERMISSION_CATALOG.map((p) => p.actionName);

export type PermissionAction = (typeof DEFAULT_PERMISSIONS)[number];

/** System role templates (cloned per workspace). */
export type SystemRoleKey = "OWNER" | "ORG_ADMIN" | "BOARD_ADMIN" | "MEMBER" | "GUEST";

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRoleKey, readonly string[]> = {
  OWNER: DEFAULT_PERMISSIONS.filter((a) => !a.startsWith("guest:")),
  ORG_ADMIN: [
    "workspace:read",
    "workspace:update",
    "workspace:members",
    "workspace:roles",
    "workspace:audit",
    "workspace:export",
    "workspace:billing",
    "department:manage",
    "department:invite",
    "department:approve_invite",
    "analytics:team",
    "analytics:company",
    "people:analytics",
    "security:policies",
    "security:force_logout",
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
    "card:complete_done",
    "field:financial",
    "label:manage",
    "comment:create",
    "attachment:create",
    "timesheet:write",
    "timesheet:read",
    "letter:send",
    "letter:read_all",
    "calendar:create",
    "calendar:manage",
    "automation:manage",
    "webhook:manage",
  ],
  BOARD_ADMIN: [
    "workspace:read",
    "department:invite",
    "department:approve_invite",
    "analytics:team",
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
    "card:complete_done",
    "field:financial",
    "label:manage",
    "comment:create",
    "attachment:create",
    "timesheet:write",
    "timesheet:read",
    "letter:send",
    "letter:read_all",
    "calendar:create",
    "calendar:manage",
    "automation:manage",
    "webhook:manage",
  ],
  MEMBER: [
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
  ],
  /** Workspace-level Guest template — real guests usually use BoardGuest accessLevel */
  GUEST: ["workspace:read", "board:read", "comment:create", "guest:comment", "guest:attach"],
};

export const SYSTEM_ROLE_META: Record<
  SystemRoleKey,
  { name: string; description: string }
> = {
  OWNER: {
    name: "Owner",
    description: "Full control including ownership transfer and workspace delete",
  },
  ORG_ADMIN: {
    name: "Org Admin",
    description: "Manage members, roles, billing, and security — not ownership transfer",
  },
  BOARD_ADMIN: {
    name: "Board Admin",
    description: "Configure boards, automations, webhooks, and board guests — not org billing/roles",
  },
  MEMBER: {
    name: "Member",
    description:
      "Day-to-day work on assigned cards — cannot create boards, delete cards, or move to Done",
  },
  GUEST: {
    name: "Guest",
    description: "Minimal workspace role template for external collaborators",
  },
};
