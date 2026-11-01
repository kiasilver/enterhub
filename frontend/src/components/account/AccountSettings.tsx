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
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { useSession } from 'next-auth/react';

type SessionRow = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type Attempt = {
  id: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export function AccountSettings({ isDark }: { isDark: boolean }) {
  const { t } = useLang();
  const { calendar, setCalendar } = useCalendar();
  const { data: session } = useSession();
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.85)';
  const card = {
    ...glassStyle(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
  };

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [busy, setBusy] = useState(false);

  const loadSecurity = useCallback(async () => {
    const [sRes, aRes] = await Promise.all([
      fetch('/api/account/sessions'),
      fetch('/api/account/login-attempts?limit=40'),
    ]);
    const sJson = await sRes.json();
    const aJson = await aRes.json();
    if (sRes.ok) setSessions(sJson.data || []);
    if (aRes.ok) setAttempts(aJson.data || []);
  }, []);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    if (pw.next !== pw.confirm) {
      setPwErr(t('account.passwordsMismatch'));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('common.failed'));
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg(t('common.success'));
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/account/sessions/${id}`, { method: 'DELETE' });
    await loadSecurity();
  }

  async function revokeOthers() {
    await fetch('/api/account/sessions/revoke-others', { method: 'POST' });
    await loadSecurity();
  }


  const inputStyle = {
    borderColor: borderSubtle(isDark),
    background: inputBg,
    color: pri,
  };

  return (
    <div className="space-y-5">
      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div>
          <h3 className="text-base font-bold" style={{ color: pri }}>
            {t('account.language')}
          </h3>
          <p className="text-xs mt-1" style={{ color: mut }}>
            {t('account.languageHint')}
          </p>
        </div>
        <LanguageSwitcher />
      </motion.div>

      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div>
          <h3 className="text-base font-bold" style={{ color: pri }}>
            {t('account.calendar')}
          </h3>
          <p className="text-xs mt-1" style={{ color: mut }}>
            {t('account.calendarHint')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'gregorian' as const, label: t('account.calendarGregorian') },
              { id: 'jalali' as const, label: t('account.calendarJalali') },
            ] as const
          ).map((opt) => {
            const on = calendar === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setCalendar(opt.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: on ? primaryColor : surfaceItem(isDark),
                  color: on ? '#fff' : pri,
                  border: `1px solid ${on ? primaryColor : borderSubtle(isDark)}`,
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Password */}
      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div>
          <h3 className="text-base font-bold" style={{ color: pri }}>
            {t('account.changePassword')}
          </h3>
          <p className="text-xs mt-1" style={{ color: mut }}>
            {t('account.passwordHint')}
          </p>
          {session?.user?.mustChangePassword && (
            <p className="text-sm font-semibold mt-2" style={{ color: primaryColor }}>
              {t('account.mustChangePassword')}
            </p>
          )}
        </div>
        <form onSubmit={(e) => void changePassword(e)} className="grid sm:grid-cols-3 gap-3">
          <input
            type="password"
            required
            placeholder={t('account.currentPassword')}
            value={pw.current}
            onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            className="px-3.5 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder={t('account.newPassword')}
            value={pw.next}
            onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
            className="px-3.5 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder={t('account.confirmPassword')}
            value={pw.confirm}
            onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
            className="px-3.5 py-3 rounded-xl text-sm border outline-none"
            style={inputStyle}
          />
          <div className="sm:col-span-3 flex items-center justify-between gap-3">
            <div>
              {pwErr && <p className="text-sm text-red-500">{pwErr}</p>}
              {pwMsg && (
                <p className="text-sm font-medium" style={{ color: primaryColor }}>
                  {pwMsg}
                </p>
              )}
            </div>
            <GlassButton type="submit" disabled={busy} style={{ padding: '8px 16px', borderRadius: 12 }}>
              {t('account.updatePassword')}
            </GlassButton>
          </div>
        </form>
      </motion.div>

      {/* Sessions */}
      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold" style={{ color: pri }}>
              {t('account.activeSessions')}
            </h3>
            <p className="text-xs mt-1" style={{ color: mut }}>
              {t('account.sessionsHint')}
            </p>
          </div>
          <GlassButton
            type="button"
            onClick={() => void revokeOthers()}
            style={{ padding: '8px 12px', borderRadius: 10, fontSize: 12 }}
          >
            {t('account.revokeOthers')}
          </GlassButton>
        </div>
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: surfaceItem(isDark) }}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: pri }}>
                  {s.userAgent || t('account.unknownDevice')}
                  {s.isCurrent && (
                    <span className="ml-2 text-[10px] font-bold" style={{ color: primaryColor }}>
                      {t('account.currentSession')}
                    </span>
                  )}
                </p>
                <p className="text-xs" style={{ color: mut }}>
                  {s.ipAddress || '—'} · {new Date(s.createdAt).toLocaleString()}
                </p>
              </div>
              {!s.isCurrent && (
                <button
                  type="button"
                  onClick={() => void revoke(s.id)}
                  className="text-xs font-semibold text-red-500"
                >
                  {t('account.revoke')}
                </button>
              )}
            </li>
          ))}
          {sessions.length === 0 && (
            <p className="text-xs" style={{ color: mut }}>
              {t('account.noActiveSessions')}
            </p>
          )}
        </ul>
      </motion.div>

      {/* Login attempts */}
      <motion.div variants={accountFadeUp} className="rounded-2xl p-5 sm:p-6 space-y-4" style={card}>
        <div>
          <h3 className="text-base font-bold" style={{ color: pri }}>
            {t('account.loginAttempts')}
          </h3>
          <p className="text-xs mt-1" style={{ color: mut }}>
            {t('account.loginAttemptsHint')}
          </p>
        </div>
        <ul className="space-y-2 max-h-64 overflow-auto">
          {attempts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: surfaceItem(isDark) }}
            >
              <div className="min-w-0">
                <p style={{ color: pri }} className="truncate">
                  {a.ip || '—'} · {a.userAgent?.slice(0, 48) || 'Unknown'}
                </p>
                <p style={{ color: mut }}>{new Date(a.createdAt).toLocaleString()}</p>
              </div>
              <span
                className="shrink-0 px-2 py-0.5 rounded-md font-bold"
                style={{
                  background: a.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: a.success ? '#22c55e' : '#ef4444',
                }}
              >
                {a.success ? t('common.success') : t('common.failed')}
              </span>
            </li>
          ))}
          {attempts.length === 0 && (
            <p className="text-xs" style={{ color: mut }}>
              {t('account.noAttemptsLogged')}
            </p>
          )}
        </ul>
      </motion.div>

    </div>
  );
}
