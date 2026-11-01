import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  mergeChannelPrefs,
  NOTIFICATION_EVENT_KEYS,
} from "@/lib/notification-prefs";

/** GET /api/account/notification-prefs */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let prefs = await prisma.userNotificationPrefs.findUnique({
    where: { userId: session.user.id },
  });
  if (!prefs) {
    prefs = await prisma.userNotificationPrefs.create({
      data: { userId: session.user.id },
    });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, phoneVerifiedAt: true },
  });

  return NextResponse.json({
    data: {
      ...prefs,
      channels: mergeChannelPrefs(prefs.channels),
      hasVerifiedPhone: Boolean(me?.phone && me.phoneVerifiedAt),
    },
  });
}

const channelPrefSchema = z.object({
  inApp: z.boolean().optional(),
  telegram: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
});

const patchSchema = z.object({
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().trim().max(64).nullable().optional(),
  telegramUsername: z.string().trim().max(64).nullable().optional(),
  channels: z.record(z.string(), channelPrefSchema).optional(),
});

/** PATCH /api/account/notification-prefs */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid prefs" }, { status: 400 });
  }

  const existing = await prisma.userNotificationPrefs.findUnique({
    where: { userId: session.user.id },
  });
  const merged = mergeChannelPrefs(existing?.channels);
  if (parsed.data.channels) {
    for (const key of NOTIFICATION_EVENT_KEYS) {
      const patch = parsed.data.channels[key];
      if (!patch) continue;
      merged[key] = {
        inApp:
          typeof patch.inApp === "boolean" ? patch.inApp : merged[key].inApp,
        email:
          typeof patch.email === "boolean" ? patch.email : merged[key].email,
        telegram:
          typeof patch.telegram === "boolean"
            ? patch.telegram
            : merged[key].telegram,
        sms: typeof patch.sms === "boolean" ? patch.sms : merged[key].sms,
      };
    }
  }

  const { channels: _ch, ...rest } = parsed.data;
  const prefs = await prisma.userNotificationPrefs.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...rest,
      channels: merged,
    },
    update: {
      ...rest,
      ...(parsed.data.channels ? { channels: merged } : {}),
    },
  });

  return NextResponse.json({
    data: {
      ...prefs,
      channels: mergeChannelPrefs(prefs.channels),
    },
  });
}
