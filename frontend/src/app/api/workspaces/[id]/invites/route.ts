import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { SYSTEM_ROLE_META } from "@/lib/permissions-catalog";
import { getDepartmentMembership } from "@/lib/departments";
import {
  activateInviteMembership,
  canAssignDepartmentRole,
  canInviteToDepartment,
  isFounderOrOrgAdmin,
  shouldAutoApproveAfterAccept,
} from "@/lib/department-invites";
import { notifyUsers } from "@/lib/card-permissions";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  roleId: z.string().min(1),
  departmentId: z.string().min(1).optional().nullable(),
  departmentRole: z.enum(["MANAGER", "SUPERVISOR", "MEMBER"]).default("MEMBER"),
  note: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/workspaces/[id]/invites
 * Lists invites relevant to the caller (sent, pending accept, pending approval).
 */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    // Allow invitees who are not yet ACTIVE to see their pending accepts
    const pending = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId,
        inviteeUserId: session.user.id,
        status: { in: ["PENDING_ACCEPT", "PENDING_APPROVAL"] },
      },
      include: {
        department: { select: { id: true, name: true, key: true } },
        role: { select: { id: true, name: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!pending.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ data: pending, meta: { scope: "mine" } });
  }

  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") || "relevant";

  const founder = await isFounderOrOrgAdmin(session.user.id, workspaceId);
  const myDepts = await prisma.departmentMember.findMany({
    where: {
      userId: session.user.id,
      department: { workspaceId },
      role: { in: ["MANAGER", "SUPERVISOR"] },
    },
    select: { departmentId: true, role: true },
  });

  const where =
    scope === "all" && founder
      ? { workspaceId }
      : {
          workspaceId,
          OR: [
            { invitedById: session.user.id },
            { inviteeUserId: session.user.id },
            ...(myDepts.length
              ? [
                  {
                    departmentId: { in: myDepts.map((d) => d.departmentId) },
                    status: "PENDING_APPROVAL" as const,
                  },
                ]
              : []),
          ],
        };

  const invites = await prisma.workspaceInvite.findMany({
    where,
    include: {
      department: { select: { id: true, name: true, key: true, color: true } },
      role: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      invitee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    data: invites,
    meta: {
      isFounder: founder,
      myDeptRoles: myDepts,
    },
  });
}

/**
 * POST — create department/workspace invite.
 * Flow: PENDING_ACCEPT → (employee accept) → PENDING_APPROVAL or auto ACTIVE.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId } = await ctx.params;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const departmentId = parsed.data.departmentId || null;
  if (!(await canInviteToDepartment(session.user.id, workspaceId, departmentId))) {
    return NextResponse.json(
      { error: "Forbidden: you cannot invite into this department" },
      { status: 403 },
    );
  }

  const actorDept = departmentId
    ? await getDepartmentMembership(session.user.id, departmentId)
    : null;
  const actorRole =
    (await isFounderOrOrgAdmin(session.user.id, workspaceId))
      ? ("FOUNDER" as const)
      : actorDept?.role || null;
  if (
    actorRole &&
    !canAssignDepartmentRole(actorRole, parsed.data.departmentRole)
  ) {
    return NextResponse.json(
      {
        error:
          "Supervisors may only invite employees (MEMBER). Managers can assign Supervisor or Member.",
      },
      { status: 403 },
    );
  }

  const role = await prisma.role.findFirst({
    where: { id: parsed.data.roleId, workspaceId },
  });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
  if (role.name === SYSTEM_ROLE_META.OWNER.name) {
    return NextResponse.json(
      { error: "Cannot invite as Owner" },
      { status: 400 },
    );
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, workspaceId },
    });
    if (!dept) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }
  }

  const email = parsed.data.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const tempHash = await bcrypt.hash(
      `invite-${Date.now()}-${Math.random()}`,
      10,
    );
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name ?? email.split("@")[0],
        passwordHash: tempHash,
      },
    });
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: user.id } },
  });
  if (existingMember?.status === "ACTIVE") {
    return NextResponse.json(
      { error: "User is already an active member" },
      { status: 409 },
    );
  }

  const openInvite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      email,
      status: { in: ["PENDING_ACCEPT", "PENDING_APPROVAL"] },
    },
  });
  if (openInvite) {
    return NextResponse.json(
      { error: "An open invite already exists for this email" },
      { status: 409 },
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      departmentId,
      email,
      inviteeUserId: user.id,
      invitedById: session.user.id,
      roleId: role.id,
      departmentRole: parsed.data.departmentRole,
      status: "PENDING_ACCEPT",
      note: parsed.data.note || null,
      expiresAt,
    },
    include: {
      department: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    },
  });

  // Keep legacy INVITED membership for visibility in members list
  if (!existingMember) {
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        roleId: role.id,
        status: "INVITED",
      },
    });
  }

  await notifyUsers({
    userIds: [user.id],
    workspaceId,
    actorId: session.user.id,
    type: "invite.pending_accept",
    title: `You're invited to join`,
    body: invite.department
      ? `Accept to join ${invite.department.name}`
      : "Accept the workspace invitation",
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "invite.create",
    metadata: {
      email,
      departmentId,
      departmentRole: parsed.data.departmentRole,
      inviteId: invite.id,
    },
  });

  return NextResponse.json({ data: invite }, { status: 201 });
}

// re-export helpers used by accept route siblings (keep module graph simple)
void activateInviteMembership;
void shouldAutoApproveAfterAccept;
