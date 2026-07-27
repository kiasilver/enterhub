import { prisma } from "@/lib/prisma";
import {
  PERMISSION_CATALOG,
  SYSTEM_ROLE_META,
  SYSTEM_ROLE_PERMISSIONS,
  type SystemRoleKey,
} from "@/lib/permissions-catalog";

const SYSTEM_KEYS = Object.keys(SYSTEM_ROLE_PERMISSIONS) as SystemRoleKey[];

/** Upsert global Permission rows from catalog (safe to call on every roles load). */
export async function ensurePermissionCatalog() {
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { actionName: p.actionName },
      create: {
        actionName: p.actionName,
        description: `[${p.group}] ${p.description}`,
      },
      update: {
        description: `[${p.group}] ${p.description}`,
      },
    });
  }
}

/**
 * Ensure Owner / Org Admin / Board Admin / Member / Guest roles exist for a workspace
 * and are linked to the global Permission catalog.
 */
export async function ensureSystemRoles(workspaceId: string) {
  await ensurePermissionCatalog();

  const permissions = await prisma.permission.findMany({
    select: { id: true, actionName: true },
  });
  const byAction = new Map(permissions.map((p) => [p.actionName, p.id]));

  const roles: Record<SystemRoleKey, { id: string; name: string }> = {} as Record<
    SystemRoleKey,
    { id: string; name: string }
  >;

  for (const key of SYSTEM_KEYS) {
    const meta = SYSTEM_ROLE_META[key];
    const role = await prisma.role.upsert({
      where: {
        workspaceId_name: { workspaceId, name: meta.name },
      },
      create: {
        workspaceId,
        name: meta.name,
        description: meta.description,
        isSystem: true,
      },
      update: {
        description: meta.description,
        isSystem: true,
      },
    });

    const wanted = SYSTEM_ROLE_PERMISSIONS[key];
    const wantedIds = wanted
      .map((action) => byAction.get(action))
      .filter((id): id is string => Boolean(id));

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (wantedIds.length) {
      await prisma.rolePermission.createMany({
        data: wantedIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      });
    }

    roles[key] = { id: role.id, name: role.name };
  }

  return roles;
}

export async function getSystemRoleId(
  workspaceId: string,
  key: SystemRoleKey
): Promise<string | null> {
  const name = SYSTEM_ROLE_META[key].name;
  const role = await prisma.role.findUnique({
    where: { workspaceId_name: { workspaceId, name } },
    select: { id: true },
  });
  return role?.id ?? null;
}
