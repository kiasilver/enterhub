import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { ensureSystemRoles } from "@/lib/system-roles";
import { DEFAULT_PERMISSIONS, PERMISSION_CATALOG } from "@/lib/permissions-catalog";

type Ctx = { params: Promise<{ id: string }> };

const createRoleSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
});

/** GET /api/workspaces/[id]/roles */
export async function GET(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  const allowed =
    (await hasPermission(session.user.id, workspaceId, "workspace:roles")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:members")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:read"));
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureSystemRoles(workspaceId);

  const roles = await prisma.role.findMany({
    where: { workspaceId },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { members: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({
    data: roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      memberCount: r._count.members,
      permissions: r.permissions.map((rp) => rp.permission.actionName),
    })),
    catalog: DEFAULT_PERMISSIONS,
    catalogMeta: PERMISSION_CATALOG.map((p) => ({
      actionName: p.actionName,
      description: p.description,
      group: p.group,
    })),
  });
}

/** POST /api/workspaces/[id]/roles — custom role */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:roles"))) {
    return NextResponse.json({ error: "Forbidden: workspace:roles" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const perms = await prisma.permission.findMany({
    where: { actionName: { in: parsed.data.permissions } },
  });

  const role = await prisma.role.create({
    data: {
      workspaceId,
      name: parsed.data.name.trim(),
      description: parsed.data.description,
      isSystem: false,
      permissions: {
        create: perms.map((p) => ({ permissionId: p.id })),
      },
    },
    include: { permissions: { include: { permission: true } } },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "role.create",
    metadata: { roleId: role.id, name: role.name },
    severity: "info",
  });

  return NextResponse.json(
    {
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => rp.permission.actionName),
      },
    },
    { status: 201 }
  );
}
