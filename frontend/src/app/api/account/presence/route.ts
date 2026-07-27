import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPresenceStatus } from '@/lib/presence';

const schema = z.object({
  status: z.string().min(1),
  workspaceId: z.string().optional(),
  /** Heartbeat — refresh timestamp without socket broadcast */
  quiet: z.boolean().optional(),
});

/** PATCH /api/account/presence */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success || !isPresenceStatus(parsed.data.status)) {
    return NextResponse.json(
      { error: 'Invalid status (available|meeting|away|leave)' },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      presenceStatus: parsed.data.status,
      presenceUpdatedAt: new Date(),
    },
    select: {
      id: true,
      presenceStatus: true,
      presenceUpdatedAt: true,
    },
  });

  const workspaceId = parsed.data.workspaceId;
  const io = (global as { io?: { to: (r: string) => { emit: (e: string, p: unknown) => void } } }).io;
  if (io && workspaceId && !parsed.data.quiet) {
    io.to(`room:ws_${workspaceId}`).emit('presence:update', {
      userId: user.id,
      status: user.presenceStatus,
      socketId: null,
    });
  }

  return NextResponse.json({
    data: {
      status: user.presenceStatus,
      updatedAt: user.presenceUpdatedAt,
    },
  });
}

/** GET /api/account/presence */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { presenceStatus: true, presenceUpdatedAt: true },
  });
  return NextResponse.json({
    data: {
      status: user?.presenceStatus || 'available',
      updatedAt: user?.presenceUpdatedAt,
    },
  });
}
