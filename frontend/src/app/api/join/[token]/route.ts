import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit-logger';
import {
  acceptWorkspaceInvite,
  sessionMayAcceptInvite,
} from '@/lib/invite-accept';

type Ctx = { params: Promise<{ token: string }> };

function publicInviteView(invite: {
  email: string;
  status: string;
  expiresAt: Date | null;
  workspace: { id: string; name: string };
  role: { name: string };
}) {
  const used = !['PENDING_ACCEPT'].includes(invite.status);
  const expired = Boolean(invite.expiresAt && invite.expiresAt < new Date());
  return {
    workspaceId: invite.workspace.id,
    workspaceName: invite.workspace.name,
    roleName: invite.role.name,
    email: invite.email,
    status: expired && !used ? 'EXPIRED' : invite.status,
    used,
    expired,
    oneTime: true,
  };
}

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
      role: { select: { name: true } },
    },
  });
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }
  return NextResponse.json({ data: publicInviteView(invite) });
}

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { token } = await ctx.params;
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
      role: { select: { name: true } },
    },
  });
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
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
          'This one-time link is for a different email. Sign in with the invited account.',
      },
      { status: 403 },
    );
  }

  const result = await acceptWorkspaceInvite({
    inviteId: invite.id,
    workspaceId: invite.workspaceId,
    sessionUserId: session.user.id,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: invite.workspaceId,
    action: result.autoApproved
      ? 'invite.accept_auto_approved'
      : 'invite.accept_pending_approval',
    metadata: { inviteId: invite.id, via: 'one_time_link' },
  });

  return NextResponse.json({
    data: {
      ...result,
      workspaceId: invite.workspaceId,
    },
  });
}
