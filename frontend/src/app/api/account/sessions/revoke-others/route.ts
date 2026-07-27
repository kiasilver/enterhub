import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** POST /api/account/sessions/revoke-others — revoke all except current */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentJti = session.user.sessionJti;
  await prisma.session.updateMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
      ...(currentJti ? { NOT: { jti: currentJti } } : {}),
    },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ data: { ok: true } });
}
