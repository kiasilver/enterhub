import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import type { BoardAccess } from "@/lib/board-access";
import { isDoneListTitle } from "@/lib/board-access";
import { isBoardDepartmentSupervisor } from "@/lib/departments";

type BoardRef = { id?: string; workspaceId: string };
type CardRef = { id?: string; createdById?: string | null };

/** Contextual role on a single card */
export type CardRole =
  | "board_admin"
  | "creator"
  | "assignee"
  | "watcher"
  | "guest"
  | "none";

export type CardCapabilities = {
  role: CardRole;
  canView: boolean;
  /** Edit title / core description — creator or board admin only */
  canEditTitle: boolean;
  canEditDescription: boolean;
  canEditDueDate: boolean;
  canEditPriority: boolean;
  canEditLabels: boolean;
  /** Remove automation/system labels */
  canOverrideAutomation: boolean;
  canDelete: boolean;
  canAssign: boolean;
  /** Drag between columns (not into Done unless canMoveToDone) */
  canMove: boolean;
  /** Move into Done / complete */
  canMoveToDone: boolean;
  canChecklist: boolean;
  canAttach: boolean;
  canComment: boolean;
  canSeeFinancialFields: boolean;
  canSeeViews: boolean;
};

const DENY: CardCapabilities = {
  role: "none",
  canView: false,
  canEditTitle: false,
  canEditDescription: false,
  canEditDueDate: false,
  canEditPriority: false,
  canEditLabels: false,
  canOverrideAutomation: false,
  canDelete: false,
  canAssign: false,
  canMove: false,
  canMoveToDone: false,
  canChecklist: false,
  canAttach: false,
  canComment: false,
  canSeeFinancialFields: false,
  canSeeViews: false,
};

function adminCaps(extra: Partial<CardCapabilities> = {}): CardCapabilities {
  return {
    role: "board_admin",
    canView: true,
    canEditTitle: true,
    canEditDescription: true,
    canEditDueDate: true,
    canEditPriority: true,
    canEditLabels: true,
    canOverrideAutomation: true,
    canDelete: true,
    canAssign: true,
    canMove: true,
    canMoveToDone: true,
    canChecklist: true,
    canAttach: true,
    canComment: true,
    canSeeFinancialFields: true,
    canSeeViews: true,
    ...extra,
  };
}

/**
 * Resolve dynamic task-level RBAC: creator / assignee / watcher / board admin / guest.
 */
export async function resolveCardCapabilities(
  userId: string,
  board: BoardRef,
  card: CardRef,
  access?: BoardAccess,
): Promise<CardCapabilities> {
  if (!userId) return DENY;

  const boardId = board.id;
  const cardId = card.id;

  const [
    isAssignee,
    canDeletePerm,
    canSettings,
    canAssignPerm,
    canCompleteDone,
    canViews,
    canFinancial,
    canCommentPerm,
    canAttachPerm,
    canAutomate,
  ] = await Promise.all([
    cardId
      ? prisma.cardAssignee
          .findUnique({
            where: { cardId_userId: { cardId, userId } },
            select: { userId: true },
          })
          .then((r) => !!r)
      : Promise.resolve(false),
    hasPermission(userId, board.workspaceId, "card:delete"),
    hasPermission(userId, board.workspaceId, "board:settings"),
    hasPermission(userId, board.workspaceId, "card:assign"),
    hasPermission(userId, board.workspaceId, "card:complete_done"),
    hasPermission(userId, board.workspaceId, "card:views"),
    hasPermission(userId, board.workspaceId, "field:financial"),
    hasPermission(userId, board.workspaceId, "comment:create"),
    hasPermission(userId, board.workspaceId, "attachment:create"),
    hasPermission(userId, board.workspaceId, "automation:manage"),
  ]);

  const isCreator = !!(card.createdById && card.createdById === userId);
  const deptSupervisor = boardId
    ? await isBoardDepartmentSupervisor(userId, boardId)
    : false;
  const isBoardAdmin = canDeletePerm || canSettings || deptSupervisor;

  if (access?.ok && access.via === "guest") {
    const level = access.guestLevel;
    if (level === "ASSIGNED_ONLY" && !isAssignee && !isCreator) {
      return { ...DENY, role: "guest" };
    }
    const canComment =
      level === "COMMENT_ONLY" || level === "ASSIGNED_ONLY";
    const canAttach = canComment;
    return {
      ...DENY,
      role: "guest",
      canView: true,
      canComment,
      canAttach,
      canChecklist: level === "ASSIGNED_ONLY" && isAssignee,
      // Guests never move / edit structure / delete
      canMove: false,
      canMoveToDone: false,
      canEditTitle: false,
      canDelete: false,
      canAssign: false,
    };
  }

  if (isBoardAdmin) {
    return adminCaps({
      canSeeViews: canViews,
      canSeeFinancialFields: canFinancial || true,
      canOverrideAutomation: canAutomate || canSettings,
    });
  }

  if (isCreator) {
    return {
      role: "creator",
      canView: true,
      canEditTitle: true,
      canEditDescription: true,
      canEditDueDate: true,
      canEditPriority: true,
      canEditLabels: true,
      canOverrideAutomation: canAutomate,
      canDelete: true,
      canAssign: true,
      canMove: true,
      canMoveToDone: canCompleteDone,
      canChecklist: true,
      canAttach: canAttachPerm,
      canComment: canCommentPerm,
      canSeeFinancialFields: canFinancial,
      canSeeViews: canViews,
    };
  }

  if (isAssignee) {
    return {
      role: "assignee",
      canView: true,
      canEditTitle: false,
      canEditDescription: false,
      canEditDueDate: false,
      canEditPriority: false,
      canEditLabels: false,
      canOverrideAutomation: false,
      canDelete: false,
      canAssign: false,
      canMove: true,
      canMoveToDone: canCompleteDone,
      canChecklist: true,
      canAttach: canAttachPerm,
      canComment: canCommentPerm,
      canSeeFinancialFields: canFinancial,
      canSeeViews: canViews,
    };
  }

  // Watcher / board member — observe & collaborate lightly
  return {
    role: "watcher",
    canView: true,
    canEditTitle: false,
    canEditDescription: false,
    canEditDueDate: false,
    canEditPriority: false,
    canEditLabels: false,
    canOverrideAutomation: false,
    canDelete: false,
    canAssign: canAssignPerm,
    canMove: false,
    canMoveToDone: false,
    canChecklist: false,
    canAttach: canAttachPerm,
    canComment: canCommentPerm,
    canSeeFinancialFields: canFinancial,
    canSeeViews: canViews,
  };
}

/** @deprecated Prefer resolveCardCapabilities — true if title/desc editable */
export async function canEditCard(
  userId: string,
  board: BoardRef,
  card: CardRef,
): Promise<boolean> {
  const caps = await resolveCardCapabilities(userId, board, card);
  return caps.canEditTitle || caps.canEditDescription;
}

export async function canDeleteCard(
  userId: string,
  board: BoardRef,
  card: CardRef,
): Promise<boolean> {
  const caps = await resolveCardCapabilities(userId, board, card);
  return caps.canDelete;
}

export async function canAssignCard(
  userId: string,
  board: BoardRef,
  card: CardRef,
): Promise<boolean> {
  const caps = await resolveCardCapabilities(userId, board, card);
  return caps.canAssign;
}

/** Custom field names that require field:financial */
export function isFinancialFieldName(name: string): boolean {
  return /(cost|budget|billing|hourly|rate|salary|wage|invoice|مالی|هزینه|حقوق|بودجه)/i.test(
    name,
  );
}

export function filterCustomFieldsForUser<T extends { name: string }>(
  fields: T[],
  canSeeFinancial: boolean,
): T[] {
  if (canSeeFinancial) return fields;
  return fields.filter((f) => !isFinancialFieldName(f.name));
}

/**
 * When applying labelIds, block removal of isSystem labels unless override allowed.
 * Returns error message or null.
 */
export async function assertLabelChangeAllowed(
  workspaceId: string,
  cardId: string,
  nextLabelIds: string[],
  canOverrideAutomation: boolean,
): Promise<string | null> {
  if (canOverrideAutomation) return null;
  const current = await prisma.cardLabel.findMany({
    where: { cardId },
    include: { label: { select: { id: true, name: true, isSystem: true } } },
  });
  const protectedIds = current
    .filter((cl) => cl.label.isSystem)
    .map((cl) => cl.label.id);
  const next = new Set(nextLabelIds);
  const removed = protectedIds.filter((id) => !next.has(id));
  if (removed.length) {
    return "Cannot remove automation/system labels without automation:manage";
  }
  return null;
}

/** Validate moving a card into a target list given capabilities */
export function assertMoveAllowed(
  caps: CardCapabilities,
  targetListTitle: string,
): string | null {
  if (!caps.canMove) return "Forbidden: cannot move this card";
  if (isDoneListTitle(targetListTitle) && !caps.canMoveToDone) {
    return "Forbidden: only project leads / QA can move cards to Done";
  }
  return null;
}

export async function notifyUsers(input: {
  userIds: string[];
  workspaceId: string;
  boardId?: string | null;
  cardId?: string | null;
  calendarEventId?: string | null;
  href?: string | null;
  actorId?: string | null;
  type: string;
  title: string;
  body?: string | null;
}): Promise<void> {
  const recipients = [...new Set(input.userIds)].filter(
    (id) => id && id !== input.actorId,
  );
  if (!recipients.length) return;
  try {
    await prisma.notification.createMany({
      data: recipients.map((uid) => ({
        userId: uid,
        workspaceId: input.workspaceId,
        boardId: input.boardId ?? null,
        cardId: input.cardId ?? null,
        calendarEventId: input.calendarEventId ?? null,
        href: input.href ?? null,
        actorId: input.actorId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifyUsers] failed", err);
  }
}

/** Resolve @Name / @email tokens against an allowlist of users. */
export function resolveMentions(
  body: string,
  members: { userId: string; name: string | null; email: string }[],
): string[] {
  const found = new Set<string>();
  const sorted = [...members].sort((a, b) => {
    const la = (a.name || a.email).length;
    const lb = (b.name || b.email).length;
    return lb - la;
  });
  for (const m of sorted) {
    const labels = [m.name, m.email].filter(Boolean) as string[];
    for (const label of labels) {
      const re = new RegExp(`@(?:${escapeRegExp(label)})\\b`, "i");
      if (re.test(body)) found.add(m.userId);
    }
  }
  for (const match of body.matchAll(/@\[([a-z0-9]+)\]/gi)) {
    found.add(match[1]);
  }
  return [...found];
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Guests may only mention users who share the board (guests + assignees on board cards).
 * Members may mention any ACTIVE workspace member.
 */
export async function getMentionableUsers(
  workspaceId: string,
  boardId: string,
  asGuest: boolean,
): Promise<{ userId: string; name: string | null; email: string }[]> {
  if (!asGuest) {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
    }));
  }

  const [guests, assignees] = await Promise.all([
    prisma.boardGuest.findMany({
      where: { boardId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.cardAssignee.findMany({
      where: { card: { list: { boardId }, archivedAt: null } },
      include: { user: { select: { id: true, name: true, email: true } } },
      take: 200,
    }),
  ]);

  const map = new Map<string, { userId: string; name: string | null; email: string }>();
  for (const g of guests) {
    map.set(g.userId, {
      userId: g.userId,
      name: g.user.name,
      email: g.user.email,
    });
  }
  for (const a of assignees) {
    map.set(a.userId, {
      userId: a.userId,
      name: a.user.name,
      email: a.user.email,
    });
  }
  return [...map.values()];
}
