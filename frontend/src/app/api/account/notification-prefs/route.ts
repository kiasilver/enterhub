import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeChannels } from '@/lib/telegram';

/** GET /api/account/notification-prefs */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let prefs = await prisma.userNotificationPrefs.findUnique({
    where: { userId: session.user.id },
  });
  if (!prefs) {
    prefs = await prisma.userNotificationPrefs.create({
      data: { userId: session.user.id },
    });
  }

  return NextResponse.json({
    data: {
      ...prefs,
      channels: mergeChannels(prefs.channels),
    },
  });
}

const patchSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().trim().max(64).nullable().optional(),
  telegramUsername: z.string().trim().max(64).nullable().optional(),
  channels: z
    .record(
      z.object({
        inApp: z.boolean().optional(),
        telegram: z.boolean().optional(),
        email: z.boolean().optional(),
      }),
    )
    .optional(),
});

/** PATCH /api/account/notification-prefs */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid prefs' }, { status: 400 });
  }

  const prefs = await prisma.userNotificationPrefs.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...parsed.data,
    },
    update: parsed.data,
  });

  return NextResponse.json({ data: prefs });
}
