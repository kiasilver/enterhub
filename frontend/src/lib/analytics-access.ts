import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export type AnalyticsDepartment = {
  id: string;
  name: string;
  key: string;
  role: "MANAGER" | "SUPERVISOR" | "ADMIN";
};

export type AnalyticsMode = "company" | "team";

export type AnalyticsScope = {
  canCompany: boolean;
  canTeam: boolean;
  departments: AnalyticsDepartment[];
  /** null = all workspace members; [] = none; ids = filtered */
  employeeUserIds: string[] | null;
  mode: AnalyticsMode;
};

/**
 * Resolve Analytics people scope.
 * - company: entire workspace (needs analytics:company / org powers)
 * - team: exactly one department (departmentId required).
 *   Org admins are often MANAGER of every dept in seed data; without a
 *   required departmentId, "all managed" would equal company — so team
 *   mode returns empty people until a department is chosen.
 */
export async function resolveAnalyticsScope(
  userId: string,
  workspaceId: string,
  departmentId?: string | null,
  mode: AnalyticsMode = "company",
): Promise<AnalyticsScope> {
  const [canCompanyPerm, canTeamPerm] = await Promise.all([
    hasPermission(userId, workspaceId, "analytics:company"),
    hasPermission(userId, workspaceId, "analytics:team"),
  ]);

  const canCompany =
    canCompanyPerm ||
    (await hasPermission(userId, workspaceId, "department:manage")) ||
    (await hasPermission(userId, workspaceId, "workspace:roles"));

  const leadRows = await prisma.departmentMember.findMany({
    where: {
      userId,
      role: { in: ["MANAGER", "SUPERVISOR"] },
      department: { workspaceId },
    },
    include: {
      department: { select: { id: true, name: true, key: true } },
    },
  });

  let departments: AnalyticsDepartment[] = leadRows.map((r) => ({
    id: r.department.id,
    name: r.department.name,
    key: r.department.key,
    role: r.role as "MANAGER" | "SUPERVISOR",
  }));

  // Org admins can open any department even if not listed as MANAGER
  if (canCompany) {
    const allDepts = await prisma.department.findMany({
      where: { workspaceId },
      orderBy: { order: "asc" },
      select: { id: true, name: true, key: true },
    });
    const known = new Set(departments.map((d) => d.id));
    for (const d of allDepts) {
      if (!known.has(d.id)) {
        departments.push({
          id: d.id,
          name: d.name,
          key: d.key,
          role: "ADMIN",
        });
      }
    }
  }

  const canTeam = canCompany || canTeamPerm || leadRows.length > 0;

  if (!canTeam) {
    return {
      canCompany: false,
      canTeam: false,
      departments: [],
      employeeUserIds: [userId],
      mode: "team",
    };
  }

  // —— Company mode: everyone in the workspace ——
  if (mode === "company") {
    if (!canCompany) {
      // Fall back to team union
      return resolveAnalyticsScope(userId, workspaceId, departmentId, "team");
    }
    return {
      canCompany: true,
      canTeam: true,
      departments,
      employeeUserIds: null,
      mode: "company",
    };
  }

  // —— Team mode: must be a single department ——
  if (!departmentId) {
    // Caller should pick a dept; return empty people so UI is forced to select
    return {
      canCompany,
      canTeam: true,
      departments,
      employeeUserIds: [],
      mode: "team",
    };
  }

  const allowed =
    canCompany || departments.some((d) => d.id === departmentId);
  if (!allowed) {
    return {
      canCompany,
      canTeam: false,
      departments,
      employeeUserIds: [],
      mode: "team",
    };
  }

  const members = await prisma.departmentMember.findMany({
    where: { departmentId },
    select: { userId: true },
  });

  return {
    canCompany,
    canTeam: true,
    departments,
    employeeUserIds: members.map((m) => m.userId),
    mode: "team",
  };
}

/**
 * Who may open another member’s people analytics dossier.
 * - Self: always
 * - Org / company analytics: anyone in workspace
 * - Department MANAGER/SUPERVISOR: only members of departments they lead
 * - Regular member with people:analytics: entire team directory
 */
export async function canViewPersonAnalytics(
  viewerId: string,
  workspaceId: string,
  targetUserId: string,
): Promise<{ allowed: boolean; reason?: string; scope: "self" | "company" | "managed" | "team" }> {
  if (viewerId === targetUserId) {
    return { allowed: true, scope: "self" };
  }

  const [peoplePerm, companyPerm, teamPerm, managePerm, rolesPerm] =
    await Promise.all([
      hasPermission(viewerId, workspaceId, "people:analytics"),
      hasPermission(viewerId, workspaceId, "analytics:company"),
      hasPermission(viewerId, workspaceId, "analytics:team"),
      hasPermission(viewerId, workspaceId, "department:manage"),
      hasPermission(viewerId, workspaceId, "workspace:roles"),
    ]);

  const canCompany = companyPerm || managePerm || rolesPerm;

  if (!peoplePerm && !canCompany && !teamPerm) {
    return {
      allowed: false,
      reason: "Missing people:analytics permission",
      scope: "team",
    };
  }

  if (canCompany) {
    return { allowed: true, scope: "company" };
  }

  const managed = await prisma.departmentMember.findMany({
    where: {
      userId: viewerId,
      role: { in: ["MANAGER", "SUPERVISOR"] },
      department: { workspaceId },
    },
    select: { departmentId: true },
  });

  if (managed.length > 0) {
    const hit = await prisma.departmentMember.findFirst({
      where: {
        userId: targetUserId,
        departmentId: { in: managed.map((m) => m.departmentId) },
      },
      select: { id: true },
    });
    if (!hit) {
      return {
        allowed: false,
        reason: "Department managers can only view analytics for their own team",
        scope: "managed",
      };
    }
    return { allowed: true, scope: "managed" };
  }

  if (peoplePerm) {
    return { allowed: true, scope: "team" };
  }

  return {
    allowed: false,
    reason: "Forbidden",
    scope: "team",
  };
}
