import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import {
  acceptWorkspaceInvite,
  sessionMayAcceptInvite,
} from "@/lib/invite-accept";

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

  const allowed = await sessionMayAcceptInvite(
    session.user.id,
    session.user.email,
    invite,
  );
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "Only the invited person can accept this invite. Ask them to sign in and accept from Home, or use Activate as admin.",
      },
      { status: 403 },
    );
  }

  const result = await acceptWorkspaceInvite({
    inviteId,
    workspaceId,
    sessionUserId: session.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: result.autoApproved
      ? "invite.accept_auto_approved"
      : "invite.accept_pending_approval",
    metadata: { inviteId },
  });

  return NextResponse.json({
    data: { status: result.status, autoApproved: result.autoApproved },
  });
}
