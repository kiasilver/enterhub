/**
 * Optional Telegram delivery for notifications.
 * Prefer TELEGRAM_BOT_TOKEN + per-user telegramChatId in UserNotificationPrefs.
 * Falls back to TELEGRAM_CHAT_ID (single ops chat) when set.
 */

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_CHANNEL_PREFS,
  mergeChannelPrefs,
  type ChannelPref,
  type NotificationEventKey,
} from "@/lib/notification-prefs";

export type { ChannelPref };

/** @deprecated use DEFAULT_CHANNEL_PREFS — kept for callers */
export const DEFAULT_CHANNELS = DEFAULT_CHANNEL_PREFS;

export function mergeChannels(raw: unknown): Record<string, ChannelPref> {
  return mergeChannelPrefs(raw);
}

async function getBotToken(): Promise<string | null> {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  const token = await getBotToken();
  if (!token || !chatId) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4000),
          disable_web_page_preview: true,
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

type NotifyPayload = {
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

export async function deliverTelegramForUsers(
  userIds: string[],
  payload: NotifyPayload,
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (!unique.length) return;
  const token = await getBotToken();
  if (!token) return;

  const prefs = await prisma.userNotificationPrefs.findMany({
    where: { userId: { in: unique } },
  });
  const byUser = new Map(prefs.map((p) => [p.userId, p]));

  const channelKey = (payload.type || "") as NotificationEventKey | string;
  const fallbackChat = process.env.TELEGRAM_CHAT_ID?.trim() || null;

  await Promise.all(
    unique.map(async (uid) => {
      const row = byUser.get(uid);
      if (!row?.telegramEnabled) return;
      const channels = mergeChannelPrefs(row.channels);
      const key = (
        channelKey in channels ? channelKey : "assignment"
      ) as NotificationEventKey;
      const ch = channels[key] ?? channels.assignment;
      if (!ch?.telegram) return;
      const chatId = row.telegramChatId?.trim() || fallbackChat;
      if (!chatId) return;
      const text = [
        `Enterhub · ${payload.title}`,
        payload.body || "",
        payload.link || "",
      ]
        .filter(Boolean)
        .join("\n");
      await sendTelegramMessage(chatId, text);
    }),
  );
}
