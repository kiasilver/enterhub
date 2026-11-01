import { NextResponse } from "next/server";
import { z } from "zod";
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
import { findOrCreateInvitee, parseInviteContact } from "@/lib/invite-contact";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  /** Email or Iranian mobile (09…). Kept as `email` for backward-compatible clients. */
  email: z.string().min(3).max(120),
  name: z.string().max(120).optional(),
  roleId: z.string().min(1),
  /** Primary department (backward compatible). */
  departmentId: z.string().min(1).optional().nullable(),
  /** Extra / multi departments — early-stage teammates may need Finance + IT, etc. */
  departmentIds: z.array(z.string().min(1)).max(20).optional().default([]),
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
      invitee: { select: { id: true, name: true, email: true, phone: true } },
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
 * Invitee may be identified by email or Iranian phone number.
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

  const contact = parseInviteContact(parsed.data.email);
  if (!contact) {
    return NextResponse.json(
      { error: "Enter a valid email or Iranian phone number (09…)" },
      { status: 400 },
    );
  }

  const deptIdSet = new Set<string>();
  if (parsed.data.departmentId) deptIdSet.add(parsed.data.departmentId);
  for (const id of parsed.data.departmentIds || []) {
    if (id) deptIdSet.add(id);
  }
  const allDepartmentIds = Array.from(deptIdSet);
  const departmentId = allDepartmentIds[0] || null;

  for (const deptId of allDepartmentIds) {
    if (!(await canInviteToDepartment(session.user.id, workspaceId, deptId))) {
      return NextResponse.json(
        { error: "Forbidden: you cannot invite into one of the selected departments" },
        { status: 403 },
      );
    }
  }
  if (
    !allDepartmentIds.length &&
    !(await canInviteToDepartment(session.user.id, workspaceId, null))
  ) {
    return NextResponse.json(
      { error: "Forbidden: you cannot invite into this workspace" },
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

  if (allDepartmentIds.length) {
    const depts = await prisma.department.findMany({
      where: { id: { in: allDepartmentIds }, workspaceId },
      select: { id: true },
    });
    if (depts.length !== allDepartmentIds.length) {
      return NextResponse.json(
        { error: "One or more departments were not found" },
        { status: 404 },
      );
    }
  }

  const resolved = await findOrCreateInvitee({
    contact,
    name: parsed.data.name,
  });
  const user = resolved.user;
  const email = resolved.contact.email.toLowerCase();

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
      status: { in: ["PENDING_ACCEPT", "PENDING_APPROVAL"] },
      OR: [{ email }, { inviteeUserId: user.id }],
    },
  });
  if (openInvite) {
    return NextResponse.json(
      { error: "An open invite already exists for this person" },
      { status: 409 },
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      departmentId,
      departmentIds: allDepartmentIds.length ? allDepartmentIds : undefined,
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
      invitee: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

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

  // Always email when we have a real address (invite-by-email, or phone user who already set email).
  const inviteEmail =
    (contact.kind === "email" && email) ||
    (user.email && !user.email.endsWith("@users.enterhub.local")
      ? user.email
      : null);
  if (inviteEmail) {
    try {
      const { emailInviteLink } = await import("@/lib/notify-email");
      await emailInviteLink({
        toEmail: inviteEmail,
        name: user.name,
        inviteToken: invite.token,
        workspaceLabel: invite.department?.name || "workspace",
      });
    } catch (e) {
      console.error("[invite] email send failed", e);
    }
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "invite.create",
    metadata: {
      email,
      phone: contact.kind === "phone" ? contact.phone : null,
      departmentId,
      departmentIds: allDepartmentIds,
      departmentRole: parsed.data.departmentRole,
      inviteId: invite.id,
    },
  });

  return NextResponse.json(
    {
      data: {
        ...invite,
        joinPath: `/join/${invite.token}`,
      },
    },
    { status: 201 },
  );
}

void activateInviteMembership;
void shouldAutoApproveAfterAccept;
