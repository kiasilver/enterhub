import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { SYSTEM_ROLE_META } from "@/lib/permissions-catalog";

type Ctx = { params: Promise<{ id: string }> };

const inviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string().min(1),
  name: z.string().max(120).optional(),
});

/** GET /api/workspaces/[id]/members */
export async function GET(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  const canList =
    (await hasPermission(session.user.id, workspaceId, "workspace:members")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:read"));
  if (!canList) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          lastLoginAt: true,
          presenceStatus: true,
          presenceUpdatedAt: true,
        },
      },
      role: { select: { id: true, name: true, isSystem: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ data: members });
}

/** POST /api/workspaces/[id]/members — invite (creates user stub if needed) */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }
  const { id: workspaceId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:members"))) {
    return NextResponse.json({ error: "Forbidden: workspace:members" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const role = await prisma.role.findFirst({
    where: { id: parsed.data.roleId, workspaceId },
  });
  if (!role) {
    return NextResponse.json({ error: "Role not found in workspace" }, { status: 404 });
  }
  if (role.name === SYSTEM_ROLE_META.OWNER.name) {
    return NextResponse.json({ error: "Cannot invite as Owner; use transfer ownership" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const tempHash = await bcrypt.hash(`invite-${Date.now()}-${Math.random()}`, 10);
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name ?? email.split("@")[0],
        passwordHash: tempHash,
      },
    });
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "User already a member" }, { status: 409 });
  }

  const member = await prisma.workspaceMember.create({
    data: {
      workspaceId,
      userId: user.id,
      roleId: role.id,
      status: "INVITED",
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
      role: { select: { id: true, name: true } },
    },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "member.invite",
    metadata: { email, roleId: role.id },
    severity: "info",
  });

  return NextResponse.json({ data: member }, { status: 201 });
}
