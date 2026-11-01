import { prisma } from '@/lib/prisma';
import { notifyUsers } from '@/lib/card-permissions';
import { normalizeIranPhone } from '@/lib/smsir';
import {
  activateInviteMembership,
  shouldAutoApproveAfterAccept,
} from '@/lib/department-invites';

export async function sessionMayAcceptInvite(
  sessionUserId: string,
  sessionEmail: string | null | undefined,
  invite: { inviteeUserId: string | null; email: string },
): Promise<boolean> {
  if (invite.inviteeUserId && invite.inviteeUserId === sessionUserId) {
    return true;
  }

  const me = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, email: true, phone: true },
  });
  if (!me) return false;

  const inviteEmail = invite.email.toLowerCase();
  if (me.email && me.email.toLowerCase() === inviteEmail) return true;

  const sessionLogin = (sessionEmail || '').trim().toLowerCase();
  if (sessionLogin && sessionLogin === inviteEmail) return true;

  const sessionPhone = normalizeIranPhone(sessionLogin);
  if (me.phone && sessionPhone && me.phone === sessionPhone) return true;

  if (invite.inviteeUserId) {
    const invitee = await prisma.user.findUnique({
      where: { id: invite.inviteeUserId },
      select: { phone: true, email: true },
    });
    if (invitee?.phone && me.phone && invitee.phone === me.phone) return true;
    if (
      invitee?.email &&
      me.email &&
      invitee.email.toLowerCase() === me.email.toLowerCase()
    ) {
      return true;
    }
  }

  return false;
}

export async function acceptWorkspaceInvite(opts: {
  inviteId: string;
  workspaceId: string;
  sessionUserId: string;
}): Promise<
  | { ok: true; status: 'ACCEPTED' | 'PENDING_APPROVAL'; autoApproved: boolean }
  | { ok: false; status: number; error: string }
> {
  const { inviteId, workspaceId, sessionUserId } = opts;
  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId },
  });
  if (!invite) return { ok: false, status: 404, error: 'Not found' };

  if (invite.status !== 'PENDING_ACCEPT') {
    return {
      ok: false,
      status: 400,
      error: `Cannot accept from status ${invite.status}`,
    };
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    await prisma.workspaceInvite.update({
      where: { id: inviteId },
      data: { status: 'CANCELLED' },
    });
    return { ok: false, status: 410, error: 'Invite expired' };
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { inviteeUserId: sessionUserId },
  });

  const auto = await shouldAutoApproveAfterAccept({
    invitedById: invite.invitedById,
    workspaceId,
    departmentId: invite.departmentId,
  });

  if (auto) {
    await activateInviteMembership(inviteId, sessionUserId);
    return { ok: true, status: 'ACCEPTED', autoApproved: true };
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: {
      status: 'PENDING_APPROVAL',
      acceptedAt: new Date(),
      inviteeUserId: sessionUserId,
    },
  });

  const managers = await prisma.departmentMember.findMany({
    where: {
      departmentId: invite.departmentId || undefined,
      role: 'MANAGER',
    },
    select: { userId: true },
  });
  let approverIds = managers.map((m) => m.userId);
  if (!approverIds.length && invite.departmentId) {
    const supers = await prisma.departmentMember.findMany({
      where: { departmentId: invite.departmentId, role: 'SUPERVISOR' },
      select: { userId: true },
    });
    approverIds = supers.map((m) => m.userId);
  }
  if (approverIds.length) {
    await notifyUsers({
      userIds: approverIds,
      workspaceId,
      actorId: sessionUserId,
      type: 'invite.pending_approval',
      title: 'Invite awaiting approval',
      body: `${invite.email} accepted and needs your approval`,
    });
  }

  return { ok: true, status: 'PENDING_APPROVAL', autoApproved: false };
}
