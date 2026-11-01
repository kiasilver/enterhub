import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import { notifyUsers } from "@/lib/card-permissions";
import {
  activateInviteMembership,
  isFounderOrOrgAdmin,
} from "@/lib/department-invites";

type Ctx = { params: Promise<{ id: string; inviteId: string }> };

/**
 * POST — founder/org-admin force-activates an invite without waiting for accept.
 * Useful when onboarding the first multi-role teammate from Members settings.
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId, inviteId } = await ctx.params;

  if (!(await isFounderOrOrgAdmin(session.user.id, workspaceId))) {
    return NextResponse.json(
      { error: "Only workspace admins can activate invites directly" },
      { status: 403 },
    );
  }

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId },
  });
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!["PENDING_ACCEPT", "PENDING_APPROVAL"].includes(invite.status)) {
    return NextResponse.json(
      { error: `Cannot activate from status ${invite.status}` },
      { status: 400 },
    );
  }
  if (!invite.inviteeUserId) {
    return NextResponse.json(
      { error: "Invite has no target user yet" },
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

  await activateInviteMembership(inviteId, session.user.id);

  await notifyUsers({
    userIds: [invite.inviteeUserId],
    workspaceId,
    actorId: session.user.id,
    type: "invite.approved",
    title: "Welcome — invite activated",
    body: "A workspace admin activated your membership",
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "invite.force_activate",
    metadata: { inviteId },
  });

  return NextResponse.json({ data: { status: "ACCEPTED", activatedByAdmin: true } });
}
