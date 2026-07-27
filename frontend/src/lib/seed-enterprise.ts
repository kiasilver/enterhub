import { prisma } from "@/lib/prisma";
import {
  POSITION_TEMPLATES,
  positionsForDepartments,
  type DepartmentKey,
} from "@/lib/enterprise-positions";
import { seedDepartmentsWithBoards } from "@/lib/departments";

/**
 * Seed department-based enterprise Roles into a workspace.
 * Skips names that already exist (e.g. system Owner).
 */
export async function seedEnterprisePositions(
  workspaceId: string,
  opts: {
    departments: DepartmentKey[];
    positionKeys: string[];
    customPositions?: { name: string; description?: string }[];
  }
) {
  const permissions = await prisma.permission.findMany({
    select: { id: true, actionName: true },
  });
  const byAction = new Map(permissions.map((p) => [p.actionName, p.id]));

  const wantedKeys = new Set(opts.positionKeys);
  const templates = positionsForDepartments(opts.departments, true).filter((t) =>
    wantedKeys.has(t.key)
  );

  for (const t of POSITION_TEMPLATES) {
    if (wantedKeys.has(t.key) && !templates.find((x) => x.key === t.key)) {
      templates.push(t);
    }
  }

  const created: { id: string; name: string; key: string }[] = [];

  for (const t of templates) {
    if (t.key === "founder") continue;

    const role = await prisma.role.upsert({
      where: { workspaceId_name: { workspaceId, name: t.name } },
      create: {
        workspaceId,
        name: t.name,
        description: t.description,
        isSystem: false,
      },
      update: {
        description: t.description,
      },
    });

    const wantedIds = t.permissions
      .map((a) => byAction.get(a))
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

    created.push({ id: role.id, name: role.name, key: t.key });
  }

  for (const custom of opts.customPositions ?? []) {
    const name = custom.name.trim();
    if (!name || name.length < 2) continue;
    const existing = await prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
    });
    if (existing) continue;

    const memberPerms = POSITION_TEMPLATES.find((p) => p.key === "developer")!.permissions;
    const wantedIds = memberPerms
      .map((a) => byAction.get(a))
      .filter((id): id is string => Boolean(id));

    const role = await prisma.role.create({
      data: {
        workspaceId,
        name,
        description: custom.description || "Custom position",
        isSystem: false,
        permissions: {
          create: wantedIds.map((permissionId) => ({ permissionId })),
        },
      },
    });
    created.push({ id: role.id, name: role.name, key: `custom:${name}` });
  }

  return created;
}

/** Create Department rows + one starter board per selected department. */
export async function seedDepartmentBoards(
  workspaceId: string,
  departments: DepartmentKey[]
) {
  const { boards } = await seedDepartmentsWithBoards(workspaceId, departments);
  return boards;
}
