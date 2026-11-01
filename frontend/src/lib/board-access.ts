import { prisma } from "@/lib/prisma";
import type { GuestAccessLevel } from "@prisma/client";
import { hasPermission } from "@/lib/rbac";
import {
  isBoardDepartmentSupervisor,
  isDepartmentMember,
  isWorkspaceAdmin,
} from "@/lib/departments";

export type BoardAccess =
  | { ok: true; via: "member" | "guest"; guestLevel?: GuestAccessLevel }
  | { ok: false; reason: "not_found" | "denied" | "workspace_inactive" };

export function isDoneListTitle(title: string): boolean {
  return /(done|complete|closed|shipped)/i.test(title);
}

export function isReviewListTitle(title: string): boolean {
  return /(on review|review|approval|pending|qa|test|بررسی)/i.test(title);
}

export { isBoardDepartmentSupervisor };

/**
 * Member of workspace (ACTIVE) OR BoardGuest can access the board.
 * Department-scoped boards require department membership (admins exempt).
 * PRIVATE boards: elevated roles, dept members, guests, or people on cards.
 */
export async function canAccessBoard(
  userId: string,
  boardId: string,
): Promise<BoardAccess> {
  if (!userId || !boardId) return { ok: false, reason: "denied" };

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      id: true,
      workspaceId: true,
      visibility: true,
      departmentId: true,
      workspace: { select: { status: true } },
    },
  });

  if (!board) return { ok: false, reason: "not_found" };
  if (board.workspace.status !== "ACTIVE") {
    return { ok: false, reason: "workspace_inactive" };
  }

  const guest = await prisma.boardGuest.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId: board.workspaceId, userId },
    },
  });

  if (membership?.status === "ACTIVE") {
    const admin = await isWorkspaceAdmin(userId, board.workspaceId);

    if (board.departmentId && !admin) {
      const inDept = await isDepartmentMember(userId, board.departmentId);
      if (!inDept) {
        if (guest) {
          return { ok: true, via: "guest", guestLevel: guest.accessLevel };
        }
        const onBoard = await prisma.cardAssignee.findFirst({
          where: {
            userId,
            card: { list: { boardId }, archivedAt: null },
          },
          select: { userId: true },
        });
        if (onBoard) return { ok: true, via: "member" };
        const created = await prisma.card.findFirst({
          where: {
            createdById: userId,
            list: { boardId },
            archivedAt: null,
          },
          select: { id: true },
        });
        if (created) return { ok: true, via: "member" };
        return { ok: false, reason: "denied" };
      }
    }

    if (board.visibility === "PRIVATE") {
      const [canSettings, canMembers, canAudit] = await Promise.all([
        hasPermission(userId, board.workspaceId, "board:settings"),
        hasPermission(userId, board.workspaceId, "workspace:members"),
        hasPermission(userId, board.workspaceId, "workspace:audit"),
      ]);
      if (canSettings || canMembers || canAudit || admin) {
        return { ok: true, via: "member" };
      }
      if (board.departmentId) {
        const inDept = await isDepartmentMember(userId, board.departmentId);
        if (inDept) return { ok: true, via: "member" };
      }
      if (guest) {
        return { ok: true, via: "member" };
      }
      const onBoard = await prisma.cardAssignee.findFirst({
        where: {
          userId,
          card: { list: { boardId }, archivedAt: null },
        },
        select: { userId: true },
      });
      if (onBoard) return { ok: true, via: "member" };

      const created = await prisma.card.findFirst({
        where: {
          createdById: userId,
          list: { boardId },
          archivedAt: null,
        },
        select: { id: true },
      });
      if (created) return { ok: true, via: "member" };

      return { ok: false, reason: "denied" };
    }
    return { ok: true, via: "member" };
  }

  if (guest) {
    return { ok: true, via: "guest", guestLevel: guest.accessLevel };
  }

  return { ok: false, reason: "denied" };
}

export type CardPayload = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  order: number;
  dueDate: Date | null;
  archivedAt: Date | null;
  assignees?: unknown;
  comments?: unknown;
  attachments?: unknown;
  checklistItems?: unknown;
  timeLogs?: unknown;
  financialMeta?: unknown;
  [key: string]: unknown;
};

/**
 * Strip time logs / financial fields for guest observers.
 * ASSIGNED_ONLY filtering is applied by the caller (filter card list).
 */
export function redactCardForGuest<T extends CardPayload>(
  card: T,
  guestLevel?: GuestAccessLevel,
): T {
  const clone = { ...card } as T & { metadata?: Record<string, unknown> };
  delete clone.timeLogs;
  delete clone.financialMeta;
  if (clone.metadata && typeof clone.metadata === "object") {
    const meta = { ...clone.metadata };
    delete meta.billing;
    delete meta.cost;
    delete meta.budget;
    clone.metadata = meta;
  }
  void guestLevel;
  return clone;
}

export function guestCanComment(level: GuestAccessLevel): boolean {
  return level === "COMMENT_ONLY" || level === "ASSIGNED_ONLY";
}

export function guestCanAttach(level: GuestAccessLevel): boolean {
  return level === "COMMENT_ONLY" || level === "ASSIGNED_ONLY";
}

export function guestCanMoveCards(_level: GuestAccessLevel): boolean {
  return false;
}

/** Guests must never create/rename/delete lists or change board structure */
export function guestCanMutateBoardStructure(_level?: GuestAccessLevel): boolean {
  return false;
}

/** Settings / department leads can manage observers on a board. */
export async function canManageBoardGuests(
  userId: string,
  boardId: string,
): Promise<boolean> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) return false;
  if (await hasPermission(userId, board.workspaceId, "board:invite_guest")) return true;
  if (await hasPermission(userId, board.workspaceId, "board:settings")) return true;
  return isBoardDepartmentSupervisor(userId, boardId);
}
