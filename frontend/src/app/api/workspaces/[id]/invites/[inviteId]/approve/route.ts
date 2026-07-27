import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import { notifyUsers } from "@/lib/card-permissions";
import {
  activateInviteMembership,
  canApproveDepartmentInvite,
} from "@/lib/department-invites";

type Ctx = { params: Promise<{ id: string; inviteId: string }> };

const bodySchema = z.object({
  note: z.string().max(500).optional().nullable(),
});

/**
 * POST — manager (or supervisor if no manager) approves after employee accepted.
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

  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId },
  });
  if (!invite) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invite.status !== "PENDING_APPROVAL") {
    return NextResponse.json(
      { error: "Invite is not awaiting approval" },
      { status: 400 },
    );
  }

  if (
    !(await canApproveDepartmentInvite(
      session.user.id,
      workspaceId,
      invite.departmentId,
    ))
  ) {
    return NextResponse.json(
      {
        error:
          "Only the department manager can approve (or a supervisor if no manager exists)",
      },
      { status: 403 },
    );
  }

  bodySchema.safeParse(await req.json().catch(() => ({})));

  await activateInviteMembership(inviteId, session.user.id);

  if (invite.inviteeUserId) {
    await notifyUsers({
      userIds: [invite.inviteeUserId],
      workspaceId,
      actorId: session.user.id,
      type: "invite.approved",
      title: "Welcome — invite approved",
      body: "Your department manager approved your join request",
    });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "invite.approve",
    metadata: { inviteId },
  });

  return NextResponse.json({ data: { status: "ACCEPTED" } });
}
