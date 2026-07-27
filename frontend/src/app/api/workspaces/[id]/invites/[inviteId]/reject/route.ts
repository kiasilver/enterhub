import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import { notifyUsers } from "@/lib/card-permissions";
import { canApproveDepartmentInvite, isFounderOrOrgAdmin } from "@/lib/department-invites";

type Ctx = { params: Promise<{ id: string; inviteId: string }> };

const bodySchema = z.object({
  note: z.string().min(1).max(500),
});

/**
 * POST — reject invite (manager/supervisor/founder, or invitee declines).
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
    invite.status !== "PENDING_ACCEPT" &&
    invite.status !== "PENDING_APPROVAL"
  ) {
    return NextResponse.json({ error: "Invite is closed" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Rejection note required" },
      { status: 400 },
    );
  }

  const isInvitee =
    invite.inviteeUserId === session.user.id ||
    invite.email.toLowerCase() === (session.user.email || "").toLowerCase();
  const isApprover = await canApproveDepartmentInvite(
    session.user.id,
    workspaceId,
    invite.departmentId,
  );
  const isSender = invite.invitedById === session.user.id;
  const founder = await isFounderOrOrgAdmin(session.user.id, workspaceId);

  if (!isInvitee && !isApprover && !isSender && !founder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionNote: parsed.data.note,
      approvedById: isApprover || founder ? session.user.id : undefined,
    },
  });

  if (invite.inviteeUserId && invite.inviteeUserId !== session.user.id) {
    await notifyUsers({
      userIds: [invite.inviteeUserId],
      workspaceId,
      actorId: session.user.id,
      type: "invite.rejected",
      title: "Invite declined",
      body: parsed.data.note,
    });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "invite.reject",
    metadata: { inviteId },
  });

  return NextResponse.json({ data: { status: "REJECTED" } });
}
