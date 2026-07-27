import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember, hasPermission } from '@/lib/rbac';
import { assertWritableSession } from '@/lib/session-guards';
import { syncConnectedMailbox } from '@/lib/imap-sync';

type Ctx = { params: Promise<{ id: string; accountId: string }> };

async function canAccessMailbox(
  userId: string,
  workspaceId: string,
  accountId: string,
) {
  const box = await prisma.connectedMailbox.findFirst({
    where: { id: accountId, workspaceId },
  });
  if (!box) return { box: null, ok: false };
  if (box.userId === userId) return { box, ok: true };
  if (box.scope === 'ORG') {
    const ok = await hasPermission(userId, workspaceId, 'workspace:update');
    return { box, ok };
  }
  return { box, ok: false };
}

/** DELETE connected mailbox */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId, accountId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { box, ok } = await canAccessMailbox(session.user.id, workspaceId, accountId);
  if (!box || !ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.connectedMailbox.delete({ where: { id: accountId } });
  return NextResponse.json({ data: { ok: true } });
}

/** POST sync mailbox now */
export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId, accountId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { box, ok } = await canAccessMailbox(session.user.id, workspaceId, accountId);
  if (!box || !ok) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const result = await syncConnectedMailbox(accountId);
  if (result.error && result.imported === 0) {
    return NextResponse.json({ error: result.error, data: result }, { status: 502 });
  }
  return NextResponse.json({ data: result });
}
