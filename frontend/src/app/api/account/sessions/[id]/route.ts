import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/account/sessions/[id] — revoke one session */
export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await ctx.params;

  const row = await prisma.session.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.session.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ data: { ok: true } });
}
