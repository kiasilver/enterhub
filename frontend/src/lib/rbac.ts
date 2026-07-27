import { prisma } from "@/lib/prisma";

/**
 * RBAC check: does this user hold `requiredAction` in the given workspace?
 */
export async function hasPermission(
  userId: string,
  workspaceId: string,
  requiredAction: string
): Promise<boolean> {
  if (!userId || !workspaceId || !requiredAction) {
    return false;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
      workspace: { select: { status: true } },
    },
  });

  if (!membership || membership.status !== "ACTIVE") {
    return false;
  }

  if (membership.workspace.status === "SUSPENDED" || membership.workspace.status === "DELETED") {
    return false;
  }

  return membership.role.permissions.some(
    (rp) => rp.permission.actionName === requiredAction
  );
}

export async function assertPermission(
  userId: string,
  workspaceId: string,
  requiredAction: string
): Promise<void> {
  const allowed = await hasPermission(userId, workspaceId, requiredAction);
  if (!allowed) {
    const err = new Error("Forbidden: missing permission " + requiredAction);
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

export async function isWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const m = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: { select: { status: true } } },
  });
  if (!m || m.status !== "ACTIVE") return false;
  return m.workspace.status === "ACTIVE";
}

/** All permission actionNames for a user in a workspace (empty if not a member). */
export async function getUserPermissions(
  userId: string,
  workspaceId: string
): Promise<string[]> {
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
      workspace: { select: { status: true } },
    },
  });

  if (!membership || membership.status !== "ACTIVE") return [];
  if (membership.workspace.status !== "ACTIVE") return [];

  return membership.role.permissions.map((rp) => rp.permission.actionName);
}
