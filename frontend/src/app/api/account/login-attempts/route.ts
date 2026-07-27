import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/account/login-attempts */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 30)));

  const rows = await prisma.loginAttempt.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email?.toLowerCase() || '' },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      email: r.email,
      success: r.success,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt,
    })),
  });
}
