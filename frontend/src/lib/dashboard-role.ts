import { prisma } from "@/lib/prisma";
import { SYSTEM_ROLE_META } from "@/lib/permissions-catalog";

export type DashboardKind =
  | "superadmin"
  | "org_admin"
  | "board_admin"
  | "member"
  | "guest"
  | "demo";

export type HomeDashboard = {
  kind: DashboardKind;
  homePath: string;
  workspaceId?: string;
  roleName?: string;
};

const OWNER = SYSTEM_ROLE_META.OWNER.name;
const ORG_ADMIN = SYSTEM_ROLE_META.ORG_ADMIN.name;
const BOARD_ADMIN = SYSTEM_ROLE_META.BOARD_ADMIN.name;

/**
 * Resolve post-login home path from platform flag + primary membership + guest boards.
 */
export async function resolveHomeDashboard(input: {
  userId: string;
  isSuperAdmin?: boolean;
}): Promise<HomeDashboard> {
  if (input.isSuperAdmin) {
    return { kind: "superadmin", homePath: "/superadmin" };
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { pendingOnboarding: true },
  });
  if (user?.pendingOnboarding) {
    return { kind: "demo", homePath: "/onboarding/company" };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: input.userId,
      status: "ACTIVE",
      workspace: { status: "ACTIVE" },
    },
    include: { role: { select: { name: true } }, workspace: { select: { id: true } } },
    orderBy: { joinedAt: "desc" },
  });

  if (membership) {
    const roleName = membership.role.name;
    const wsId = membership.workspace.id;

    if (roleName === OWNER || roleName === ORG_ADMIN) {
      return {
        kind: "org_admin",
        homePath: `/workspace/${wsId}`,
        workspaceId: wsId,
        roleName,
      };
    }
    if (roleName === BOARD_ADMIN) {
      return {
        kind: "board_admin",
        homePath: `/workspace/${wsId}/lead`,
        workspaceId: wsId,
        roleName,
      };
    }
    return {
      kind: "member",
      homePath: `/workspace/${wsId}/my-workspace`,
      workspaceId: wsId,
      roleName,
    };
  }

  const guestBoard = await prisma.boardGuest.findFirst({
    where: { userId: input.userId },
    select: { boardId: true },
    orderBy: { createdAt: "desc" },
  });

  if (guestBoard) {
    return { kind: "guest", homePath: "/guest" };
  }

  return { kind: "demo", homePath: "/onboarding/company" };
}
