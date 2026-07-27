import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import { notifyUsers } from "@/lib/card-permissions";
import {
  activateInviteMembership,
  shouldAutoApproveAfterAccept,
} from "@/lib/department-invites";

type Ctx = { params: Promise<{ id: string; inviteId: string }> };

/**
 * POST /api/workspaces/[id]/invites/[inviteId]/accept
 * Invitee accepts → PENDING_APPROVAL or auto-activate.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, inviteId } = await ctx.params;

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId },
  });
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    invite.inviteeUserId !== session.user.id &&
    invite.email.toLowerCase() !== (session.user.email || "").toLowerCase()
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (invite.status !== "PENDING_ACCEPT") {
    return NextResponse.json(
      { error: `Cannot accept from status ${invite.status}` },
      { status: 400 },
    );
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ error: "Invite expired" }, { status: 410 });
  }

  // Ensure inviteeUserId is set
  if (!invite.inviteeUserId) {
    await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { inviteeUserId: session.user.id },
    });
  }

  const auto = await shouldAutoApproveAfterAccept({
    invitedById: invite.invitedById,
    workspaceId,
    departmentId: invite.departmentId,
  });

  if (auto) {
    await activateInviteMembership(inviteId, session.user.id);
    await AuditLogger.fromRequest(req, {
      userId: session.user.id,
      workspaceId,
      action: "invite.accept_auto_approved",
      metadata: { inviteId },
    });
    return NextResponse.json({
      data: { status: "ACCEPTED", autoApproved: true },
    });
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: {
      status: "PENDING_APPROVAL",
      acceptedAt: new Date(),
      inviteeUserId: session.user.id,
    },
  });

  // Notify department managers (or supervisors if none)
  const managers = await prisma.departmentMember.findMany({
    where: {
      departmentId: invite.departmentId || undefined,
      role: "MANAGER",
    },
    select: { userId: true },
  });
  let approverIds = managers.map((m) => m.userId);
  if (!approverIds.length && invite.departmentId) {
    const supers = await prisma.departmentMember.findMany({
      where: { departmentId: invite.departmentId, role: "SUPERVISOR" },
      select: { userId: true },
    });
    approverIds = supers.map((m) => m.userId);
  }
  if (approverIds.length) {
    await notifyUsers({
      userIds: approverIds,
      workspaceId,
      actorId: session.user.id,
      type: "invite.pending_approval",
      title: "Invite awaiting approval",
      body: `${invite.email} accepted and needs your approval`,
    });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "invite.accept_pending_approval",
    metadata: { inviteId },
  });

  return NextResponse.json({
    data: { status: "PENDING_APPROVAL", autoApproved: false },
  });
}
