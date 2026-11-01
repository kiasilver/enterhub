'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle,
} from '@/components/SafeDashboard/theme';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { accountFadeUp } from '@/components/account/AccountShell';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  DEFAULT_CHANNEL_PREFS,
  NOTIFICATION_SMS_EVENTS,
  NOTIFICATION_UI_EVENTS,
  mergeChannelPrefs,
  modeFromPref,
  prefFromMode,
  type DeliveryMode,
  type NotificationEventKey,
} from '@/lib/notification-prefs';

const MODES: DeliveryMode[] = ['off', 'web', 'email', 'both'];

function eventLabel(key: NotificationEventKey, t: (k: string) => string): string {
  switch (key) {
    case 'assignment':
      return t('account.notifEventAssignment');
    case 'taskSupervisor':
      return t('account.notifEventSupervisor');
    case 'mention':
      return t('account.notifEventMention');
    case 'chatMention':
      return t('account.notifEventChatMention');
    case 'taskApproval':
      return t('account.notifEventApproval');
    case 'invite':
      return t('account.notifEventInvite');
    case 'department':
      return t('account.notifEventDepartment');
    case 'letter':
      return t('account.notifEventLetter');
    case 'mail':
      return t('account.notifEventMail');
    default:
      return key;
  }
}

function eventHint(key: NotificationEventKey, t: (k: string) => string): string {
  switch (key) {
    case 'assignment':
      return t('account.notifEventAssignmentHint');
    case 'taskSupervisor':
      return t('account.notifEventSupervisorHint');
    case 'mention':
      return t('account.notifEventMentionHint');
    case 'chatMention':
      return t('account.notifEventChatMentionHint');
    case 'taskApproval':
      return t('account.notifEventApprovalHint');
    case 'invite':
      return t('account.notifEventInviteHint');
    case 'department':
      return t('account.notifEventDepartmentHint');
    case 'letter':
      return t('account.notifEventLetterHint');
    case 'mail':
      return t('account.notifEventMailHint');
    default:
      return '';
  }
}

function modeLabel(mode: DeliveryMode, t: (k: string) => string): string {
  switch (mode) {
    case 'off':
      return t('account.notifModeOff');
    case 'web':
      return t('account.notifModeWeb');
    case 'email':
      return t('account.notifModeEmail');
    case 'both':
      return t('account.notifModeBoth');
    default:
      return mode;
  }
}

export function AccountNotifications({ isDark }: { isDark: boolean }) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const card = {
    ...glassStyle(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
  };

  const [channels, setChannels] = useState(() => ({ ...DEFAULT_CHANNEL_PREFS }));
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasVerifiedPhone, setHasVerifiedPhone] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/account/notification-prefs');
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.data) {
      setChannels(mergeChannelPrefs(json.data.channels));
      setHasVerifiedPhone(Boolean(json.data.hasVerifiedPhone));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function setMode(key: NotificationEventKey, mode: DeliveryMode) {
    setChannels((prev) => ({
      ...prev,
      [key]: prefFromMode(mode, prev[key]?.sms),
    }));
  }

  function setSms(key: NotificationEventKey, sms: boolean) {
    setChannels((prev) => ({
      ...prev,
      [key]: { ...prev[key], sms },
    }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/account/notification-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t('common.failed'));
      if (json.data?.channels) {
        setChannels(mergeChannelPrefs(json.data.channels));
      }
      setMsg(t('common.success'));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-5" style={card}>
        <div>
          <h3 className="text-base font-bold" style={{ color: pri }}>
            {t('account.notifications')}
          </h3>
          <p className="text-xs mt-1" style={{ color: mut }}>
            {t('account.notificationsHint')}
          </p>
        </div>

        {!loaded ? (
          <p className="text-sm" style={{ color: mut }}>
            {t('common.loading')}
          </p>
        ) : (
          <div className="space-y-3">
            {NOTIFICATION_UI_EVENTS.map((key) => {
              const mode = modeFromPref(channels[key]);
              return (
                <div
                  key={key}
                  className="px-3.5 py-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3"
                  style={{ background: surfaceItem(isDark) }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: pri }}>
                      {eventLabel(key, t)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: mut }}>
                      {eventHint(key, t)}
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5 shrink-0"
                    role="group"
                    aria-label={eventLabel(key, t)}
                  >
                    {MODES.map((m) => {
                      const on = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(key, m)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                          style={{
                            background: on ? `${primaryColor}22` : 'transparent',
                            color: on ? primaryColor : sec,
                            border: `1px solid ${on ? primaryColor : borderSubtle(isDark)}`,
                          }}
                        >
                          {modeLabel(m, t)}
                        </button>
                      );
                    })}
                    {NOTIFICATION_SMS_EVENTS.includes(key) && (
                      <label
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                        style={{
                          border: `1px solid ${channels[key].sms ? primaryColor : borderSubtle(isDark)}`,
                          color: channels[key].sms ? primaryColor : sec,
                          opacity: hasVerifiedPhone ? 1 : 0.5,
                        }}
                        title={t('account.notifSmsHint')}
                      >
                        <input
                          type="checkbox"
                          className="accent-current"
                          disabled={!hasVerifiedPhone}
                          checked={channels[key].sms}
                          onChange={(e) => setSms(key, e.target.checked)}
                        />
                        {t('account.notifSms')}
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          {msg && (
            <p className="text-sm" style={{ color: sec }}>
              {msg}
            </p>
          )}
          <GlassButton
            type="button"
            disabled={busy || !loaded}
            onClick={() => void save()}
            style={{ padding: '8px 16px', borderRadius: 12, marginLeft: 'auto' }}
          >
            {t('account.savePreferences')}
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
}
