import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/account/sessions */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await prisma.session.findMany({
    where: {
      userId: session.user.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const currentJti = session.user.sessionJti;
  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      jti: r.jti,
      userAgent: r.userAgent,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      isCurrent: Boolean(currentJti && r.jti === currentJti),
    })),
  });
}
