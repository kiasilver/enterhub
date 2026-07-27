import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";

type Ctx = { params: Promise<{ id: string; roleId: string }> };

const putSchema = z.object({
  permissions: z.array(z.string()).optional(),
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
});

const LOCKED_SYSTEM_NAMES = ["Owner", "Org Admin", "Board Admin", "Member", "Guest"] as const;

function isLockedSystemRole(role: { name: string; isSystem: boolean }) {
  return role.isSystem && (LOCKED_SYSTEM_NAMES as readonly string[]).includes(role.name);
}

/** PUT /api/workspaces/[id]/roles/[roleId] — rename and/or update permissions */
export async function PUT(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, roleId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:roles"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = await prisma.role.findFirst({ where: { id: roleId, workspaceId } });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  if (
    parsed.data.name === undefined &&
    parsed.data.description === undefined &&
    parsed.data.permissions === undefined
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (
    isLockedSystemRole(role) &&
    parsed.data.name !== undefined &&
    parsed.data.name !== role.name
  ) {
    return NextResponse.json(
      { error: "Cannot rename system roles (Owner, Org Admin, Board Admin, Member, Guest)" },
      { status: 400 }
    );
  }

  const nextName =
    parsed.data.name !== undefined && !isLockedSystemRole(role)
      ? parsed.data.name.trim()
      : undefined;

  if (nextName && nextName !== role.name) {
    const clash = await prisma.role.findFirst({
      where: { workspaceId, name: nextName, NOT: { id: roleId } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: `A role named “${nextName}” already exists` }, { status: 409 });
    }
  }

  if (parsed.data.permissions !== undefined) {
    const perms = await prisma.permission.findMany({
      where: { actionName: { in: parsed.data.permissions } },
    });
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId, permissionId: p.id })),
      }),
      prisma.role.update({
        where: { id: roleId },
        data: {
          ...(nextName ? { name: nextName } : {}),
          ...(parsed.data.description !== undefined
            ? { description: parsed.data.description }
            : {}),
        },
      }),
    ]);
  } else {
    await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description }
          : {}),
      },
    });
  }

  const updated = await prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: nextName && nextName !== role.name ? "role.rename" : "role.permissions.update",
    metadata: { roleId, name: updated?.name, count: updated?.permissions.length },
    severity: "warning",
  });

  return NextResponse.json({
    data: {
      id: updated!.id,
      name: updated!.name,
      description: updated!.description,
      isSystem: updated!.isSystem,
      permissions: updated!.permissions.map((rp) => rp.permission.actionName),
    },
  });
}

/** DELETE custom role */
export async function DELETE(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, roleId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:roles"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, workspaceId },
    include: { _count: { select: { members: true } } },
  });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (role.isSystem && ["Owner", "Org Admin", "Board Admin", "Member", "Guest"].includes(role.name)) {
    return NextResponse.json({ error: "Cannot delete system roles" }, { status: 400 });
  }
  if (role._count.members > 0) {
    return NextResponse.json({ error: "Reassign members before deleting role" }, { status: 400 });
  }

  await prisma.role.delete({ where: { id: roleId } });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "role.delete",
    metadata: { roleId, name: role.name },
    severity: "warning",
  });

  return NextResponse.json({ ok: true });
}
