import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { SYSTEM_ROLE_META } from "@/lib/permissions-catalog";

type Ctx = { params: Promise<{ id: string; memberId: string }> };

const patchSchema = z.object({
  roleId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "INVITED", "DISABLED"]).optional(),
});

async function countOwners(workspaceId: string) {
  return prisma.workspaceMember.count({
    where: {
      workspaceId,
      status: "ACTIVE",
      role: { name: SYSTEM_ROLE_META.OWNER.name, isSystem: true },
    },
  });
}

/** PATCH /api/workspaces/[id]/members/[memberId] */
export async function PATCH(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, memberId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:members"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
    include: { role: true },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (parsed.data.roleId) {
    const newRole = await prisma.role.findFirst({
      where: { id: parsed.data.roleId, workspaceId },
    });
    if (!newRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    const wasOwner = member.role.name === SYSTEM_ROLE_META.OWNER.name;
    const willBeOwner = newRole.name === SYSTEM_ROLE_META.OWNER.name;
    if (wasOwner && !willBeOwner && (await countOwners(workspaceId)) <= 1) {
      return NextResponse.json({ error: "Cannot demote the last Owner" }, { status: 400 });
    }
  }

  if (
    parsed.data.status &&
    parsed.data.status !== "ACTIVE" &&
    member.role.name === SYSTEM_ROLE_META.OWNER.name &&
    (await countOwners(workspaceId)) <= 1
  ) {
    return NextResponse.json({ error: "Cannot disable the last Owner" }, { status: 400 });
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: {
      roleId: parsed.data.roleId,
      status: parsed.data.status,
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      role: { select: { id: true, name: true } },
    },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "member.update",
    metadata: parsed.data,
    severity: "info",
  });

  return NextResponse.json({ data: updated });
}

/** DELETE /api/workspaces/[id]/members/[memberId] */
export async function DELETE(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, memberId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:members"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
    include: { role: true, user: { select: { email: true } } },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (
    member.role.name === SYSTEM_ROLE_META.OWNER.name &&
    (await countOwners(workspaceId)) <= 1
  ) {
    return NextResponse.json({ error: "Cannot remove the last Owner" }, { status: 400 });
  }

  await prisma.workspaceMember.delete({ where: { id: memberId } });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "member.remove",
    metadata: { memberId, email: member.user.email },
    severity: "warning",
  });

  return NextResponse.json({ ok: true });
}
