import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { assertWritableSession } from '@/lib/session-guards';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE — disconnect Google Sheets for current user */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.googleSheetsConnection.deleteMany({
    where: { workspaceId, userId: session.user.id },
  });

  return NextResponse.json({ data: { ok: true } });
}
