/**
 * Send a Telegram message when prefs + bot token are configured.
 * No-op when TELEGRAM_BOT_TOKEN is missing.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }
  if (!chatId.trim()) {
    return { ok: false, error: 'Missing chat id' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 3900),
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; description?: string };
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.description || 'Telegram API error' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Telegram failed' };
  }
}

export type NotifChannelKey = 'chatMention' | 'letter' | 'mail' | 'assignment';

export type ChannelPref = { inApp: boolean; telegram: boolean; email: boolean };

export const DEFAULT_CHANNELS: Record<NotifChannelKey, ChannelPref> = {
  chatMention: { inApp: true, telegram: false, email: true },
  letter: { inApp: true, telegram: false, email: true },
  mail: { inApp: true, telegram: false, email: true },
  assignment: { inApp: true, telegram: false, email: true },
};

export function mergeChannels(raw: unknown): Record<NotifChannelKey, ChannelPref> {
  const base = { ...DEFAULT_CHANNELS };
  if (!raw || typeof raw !== 'object') return base;
  for (const key of Object.keys(DEFAULT_CHANNELS) as NotifChannelKey[]) {
    const v = (raw as Record<string, Partial<ChannelPref>>)[key];
    if (v && typeof v === 'object') {
      base[key] = {
        inApp: v.inApp ?? base[key].inApp,
        telegram: v.telegram ?? base[key].telegram,
        email: v.email ?? base[key].email,
      };
    }
  }
  return base;
}
