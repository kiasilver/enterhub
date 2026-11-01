/**
 * Per-event notification delivery preferences.
 * Modes: off | web (in-app only) | email | both
 * OTP is reserved for future use but not shown in UI yet.
 */

export type ChannelPref = {
  inApp: boolean;
  email: boolean;
  telegram: boolean;
  sms: boolean;
};

export type DeliveryMode = "off" | "web" | "email" | "both";

/** Event keys stored in UserNotificationPrefs.channels */
export const NOTIFICATION_EVENT_KEYS = [
  "assignment",
  "taskSupervisor",
  "mention",
  "chatMention",
  "taskApproval",
  "invite",
  "department",
  "letter",
  "mail",
  "otp",
] as const;

export type NotificationEventKey = (typeof NOTIFICATION_EVENT_KEYS)[number];

/** Events that may send SMS (opt-in, default off). */
export const NOTIFICATION_SMS_EVENTS: NotificationEventKey[] = [
  "assignment",
  "taskSupervisor",
  "taskApproval",
  "invite",
  "letter",
  "mail",
];
export const NOTIFICATION_UI_EVENTS: NotificationEventKey[] = [
  "assignment",
  "taskSupervisor",
  "mention",
  "chatMention",
  "taskApproval",
  "invite",
  "department",
  "letter",
  "mail",
];

export const DEFAULT_CHANNEL_PREFS: Record<NotificationEventKey, ChannelPref> =
  {
    assignment: { inApp: true, email: true, telegram: false, sms: false },
    taskSupervisor: { inApp: true, email: true, telegram: false, sms: false },
    mention: { inApp: true, email: false, telegram: false, sms: false },
    chatMention: { inApp: true, email: false, telegram: false, sms: false },
    taskApproval: { inApp: true, email: true, telegram: false, sms: false },
    invite: { inApp: true, email: true, telegram: false, sms: false },
    department: { inApp: true, email: false, telegram: false, sms: false },
    letter: { inApp: true, email: true, telegram: false, sms: false },
    mail: { inApp: true, email: true, telegram: false, sms: false },
    otp: { inApp: false, email: true, telegram: false, sms: false },
  };

export function modeFromPref(p: ChannelPref | undefined | null): DeliveryMode {
  if (!p) return "web";
  if (p.inApp && p.email) return "both";
  if (p.email) return "email";
  if (p.inApp) return "web";
  return "off";
}

export function prefFromMode(mode: DeliveryMode, sms = false): ChannelPref {
  switch (mode) {
    case "both":
      return { inApp: true, email: true, telegram: false, sms };
    case "email":
      return { inApp: false, email: true, telegram: false, sms };
    case "web":
      return { inApp: true, email: false, telegram: false, sms };
    case "off":
    default:
      return { inApp: false, email: false, telegram: false, sms };
  }
}

export function mergeChannelPrefs(
  raw: unknown,
): Record<NotificationEventKey, ChannelPref> {
  const out: Record<NotificationEventKey, ChannelPref> = {
    ...DEFAULT_CHANNEL_PREFS,
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const obj = raw as Record<string, unknown>;
  for (const key of NOTIFICATION_EVENT_KEYS) {
    const v = obj[key];
    if (!v || typeof v !== "object" || Array.isArray(v)) continue;
    const c = v as Record<string, unknown>;
    out[key] = {
      inApp: typeof c.inApp === "boolean" ? c.inApp : out[key].inApp,
      email: typeof c.email === "boolean" ? c.email : out[key].email,
      telegram:
        typeof c.telegram === "boolean" ? c.telegram : out[key].telegram,
      sms: typeof c.sms === "boolean" ? c.sms : out[key].sms,
    };
  }
  return out;
}

/** Map Notification.type / notifyUsers type → preference event key. */
export function eventKeyFromNotificationType(
  type: string,
): NotificationEventKey | null {
  const t = (type || "").toLowerCase();
  if (t === "assigned" || t === "assignment" || t === "task.assigned") {
    return "assignment";
  }
  if (
    t === "task.supervisor" ||
    t === "supervisor" ||
    t === "taskSupervisor"
  ) {
    return "taskSupervisor";
  }
  if (t === "chat.mention" || t === "chatmention") return "chatMention";
  if (t === "mention" || t === "card.mention" || t === "comment.mention") {
    return "mention";
  }
  if (
    t.startsWith("task.") ||
    t === "taskapproval" ||
    t === "approval" ||
    t === "approved" ||
    t === "rejected"
  ) {
    return "taskApproval";
  }
  if (t.startsWith("invite.") || t === "invite") return "invite";
  if (t.startsWith("department.") || t === "department") return "department";
  if (t === "letter" || t.startsWith("letter.")) return "letter";
  if (t === "mail" || t.startsWith("mail.")) return "mail";
  if (t === "otp" || t.startsWith("otp.")) return "otp";
  return null;
}

type PrefsClient = {
  userNotificationPrefs: {
    findMany: (args: {
      where: { userId: { in: string[] } };
      select: {
        userId: true;
        channels: true;
        inAppEnabled: true;
        emailEnabled: true;
      };
    }) => Promise<
      Array<{
        userId: string;
        channels: unknown;
        inAppEnabled: boolean;
        emailEnabled: boolean;
      }>
    >;
  };
  user: {
    findMany: (args: {
      where: { id: { in: string[] } };
      select: { id: true; phone: true; phoneVerifiedAt: true };
    }) => Promise<
      Array<{
        id: string;
        phone: string | null;
        phoneVerifiedAt: Date | null;
      }>
    >;
  };
};

async function prefsByUser(prisma: PrefsClient, userIds: string[]) {
  if (!userIds.length) return new Map<string, {
    channels: Record<NotificationEventKey, ChannelPref>;
    inAppEnabled: boolean;
    emailEnabled: boolean;
  }>();
  const rows = await prisma.userNotificationPrefs.findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      channels: true,
      inAppEnabled: true,
      emailEnabled: true,
    },
  });
  const map = new Map<
    string,
    {
      channels: Record<NotificationEventKey, ChannelPref>;
      inAppEnabled: boolean;
      emailEnabled: boolean;
    }
  >();
  for (const row of rows) {
    map.set(row.userId, {
      channels: mergeChannelPrefs(row.channels),
      inAppEnabled: row.inAppEnabled !== false,
      emailEnabled: row.emailEnabled !== false,
    });
  }
  return map;
}

function defaultsForMissing() {
  return {
    channels: mergeChannelPrefs(null),
    inAppEnabled: true,
    emailEnabled: true,
  };
}

/** Filter userIds who allow in-app for this notification type. */
export async function filterUsersForInApp(
  prisma: PrefsClient,
  userIds: string[],
  notificationType: string,
): Promise<string[]> {
  const eventKey = eventKeyFromNotificationType(notificationType);
  if (!eventKey) return userIds;
  const byUser = await prefsByUser(prisma, userIds);
  return userIds.filter((id) => {
    const prefs = byUser.get(id) ?? defaultsForMissing();
    return prefs.inAppEnabled && prefs.channels[eventKey].inApp;
  });
}

/** Filter userIds who allow SMS for this event and have a verified phone. */
export async function filterUsersForSms(
  prisma: PrefsClient,
  userIds: string[],
  eventKey: NotificationEventKey,
): Promise<string[]> {
  if (!NOTIFICATION_SMS_EVENTS.includes(eventKey)) return [];
  const byUser = await prefsByUser(prisma, userIds);
  const allowed = userIds.filter((id) => {
    const prefs = byUser.get(id) ?? defaultsForMissing();
    return prefs.channels[eventKey].sms;
  });
  if (!allowed.length) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: allowed } },
    select: { id: true, phone: true, phoneVerifiedAt: true },
  });
  return users
    .filter((u) => Boolean(u.phone && u.phoneVerifiedAt))
    .map((u) => u.id);
}

/** Filter userIds who allow email for this event key. */
export async function filterUsersForEmail(
  prisma: PrefsClient,
  userIds: string[],
  eventKey: NotificationEventKey,
): Promise<string[]> {
  const byUser = await prefsByUser(prisma, userIds);
  return userIds.filter((id) => {
    const prefs = byUser.get(id) ?? defaultsForMissing();
    return prefs.emailEnabled && prefs.channels[eventKey].email;
  });
}
