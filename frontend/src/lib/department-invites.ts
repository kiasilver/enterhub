import { prisma } from "@/lib/prisma";
import type { DepartmentMemberRole } from "@prisma/client";
import { hasPermission } from "@/lib/rbac";
import {
  getDepartmentMembership,
  isWorkspaceAdmin,
} from "@/lib/departments";

/** Founder / Owner / Org Admin — bypass all invite gates. */
export async function isFounderOrOrgAdmin(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const [owner, members, manageDept] = await Promise.all([
    prisma.workspace.findFirst({
      where: { id: workspaceId, ownerId: userId },
      select: { id: true },
    }),
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "department:manage"),
  ]);
  return !!owner || members || manageDept;
}

export async function isDepartmentManager(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const m = await getDepartmentMembership(userId, departmentId);
  return m?.role === "MANAGER";
}

export async function isDepartmentLead(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const m = await getDepartmentMembership(userId, departmentId);
  return m?.role === "MANAGER" || m?.role === "SUPERVISOR";
}

export async function departmentHasManager(
  departmentId: string,
): Promise<boolean> {
  const row = await prisma.departmentMember.findFirst({
    where: { departmentId, role: "MANAGER" },
    select: { id: true },
  });
  return !!row;
}

/** Who may approve PENDING_APPROVAL invites for this department. */
export async function canApproveDepartmentInvite(
  userId: string,
  workspaceId: string,
  departmentId: string | null,
): Promise<boolean> {
  if (await isFounderOrOrgAdmin(userId, workspaceId)) return true;
  if (!(await hasPermission(userId, workspaceId, "department:approve_invite"))) {
    // Still allow dept managers without the permission bit (dept role is source of truth)
    if (!departmentId) return false;
  }
  if (!departmentId) {
    return isWorkspaceAdmin(userId, workspaceId);
  }
  if (await isDepartmentManager(userId, departmentId)) return true;
  // Default: if no manager in department, any supervisor may approve
  const hasMgr = await departmentHasManager(departmentId);
  if (!hasMgr && (await getDepartmentMembership(userId, departmentId))?.role === "SUPERVISOR") {
    return true;
  }
  return false;
}

/** Who may send invites into a department. */
export async function canInviteToDepartment(
  userId: string,
  workspaceId: string,
  departmentId: string | null,
): Promise<boolean> {
  if (await isFounderOrOrgAdmin(userId, workspaceId)) return true;
  if (await hasPermission(userId, workspaceId, "workspace:members")) return true;
  if (!departmentId) return false;
  if (!(await hasPermission(userId, workspaceId, "department:invite"))) {
    // Fall back to dept role
    return isDepartmentLead(userId, departmentId);
  }
  return isDepartmentLead(userId, departmentId);
}

/**
 * After employee accepts: skip manager queue when
 * - Founder/Org Admin invited, OR
 * - Inviter is department MANAGER, OR
 * - Inviter is SUPERVISOR and department has no MANAGER
 */
export async function shouldAutoApproveAfterAccept(opts: {
  invitedById: string;
  workspaceId: string;
  departmentId: string | null;
}): Promise<boolean> {
  if (await isFounderOrOrgAdmin(opts.invitedById, opts.workspaceId)) {
    return true;
  }
  if (!opts.departmentId) {
    return isWorkspaceAdmin(opts.invitedById, opts.workspaceId);
  }
  if (await isDepartmentManager(opts.invitedById, opts.departmentId)) {
    return true;
  }
  const hasMgr = await departmentHasManager(opts.departmentId);
  if (
    !hasMgr &&
    (await getDepartmentMembership(opts.invitedById, opts.departmentId))
      ?.role === "SUPERVISOR"
  ) {
    return true;
  }
  return false;
}

/** Collect all department ids stored on an invite (primary + extras). */
export function inviteDepartmentIds(invite: {
  departmentId?: string | null;
  departmentIds?: unknown;
}): string[] {
  const ids = new Set<string>();
  if (invite.departmentId) ids.add(invite.departmentId);
  if (Array.isArray(invite.departmentIds)) {
    for (const raw of invite.departmentIds) {
      const id = String(raw || "").trim();
      if (id) ids.add(id);
    }
  }
  return Array.from(ids);
}

/** Activate workspace + department membership from an invite. */
export async function activateInviteMembership(inviteId: string, approvedById: string) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite || !invite.inviteeUserId) {
    throw new Error("Invite missing invitee");
  }

  const deptIds = inviteDepartmentIds(invite);

  await prisma.$transaction(async (tx) => {
    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: invite.inviteeUserId!,
        },
      },
      create: {
        workspaceId: invite.workspaceId,
        userId: invite.inviteeUserId!,
        roleId: invite.roleId,
        status: "ACTIVE",
      },
      update: {
        roleId: invite.roleId,
        status: "ACTIVE",
      },
    });

    for (const departmentId of deptIds) {
      await tx.departmentMember.upsert({
        where: {
          departmentId_userId: {
            departmentId,
            userId: invite.inviteeUserId!,
          },
        },
        create: {
          departmentId,
          userId: invite.inviteeUserId!,
          role: invite.departmentRole,
        },
        update: { role: invite.departmentRole },
      });
    }

    await tx.workspaceInvite.update({
      where: { id: inviteId },
      data: {
        status: "ACCEPTED",
        approvedById,
        approvedAt: new Date(),
        acceptedAt: invite.acceptedAt || new Date(),
      },
    });
  });
}

export function canAssignDepartmentRole(
  actorDeptRole: DepartmentMemberRole | "FOUNDER",
  targetRole: DepartmentMemberRole,
): boolean {
  if (actorDeptRole === "FOUNDER") return true;
  if (actorDeptRole === "MANAGER") return true;
  // Supervisors may only invite MEMBER (employee/intern), not peers or managers
  if (actorDeptRole === "SUPERVISOR") return targetRole === "MEMBER";
  return false;
}
