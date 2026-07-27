'use client';

import { useEffect, useState } from 'react';
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

type Profile = {
  firstName: string;
  lastName: string;
  birthday: string | null;
  phone: string | null;
  email: string;
};

export function AccountProfile({ isDark }: { isDark: boolean }) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.85)';

  const [form, setForm] = useState<Profile>({
    firstName: '',
    lastName: '',
    birthday: null,
    phone: '',
    email: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/account/profile');
      const json = await res.json();
      if (res.ok && json.data) {
        setForm({
          firstName: json.data.firstName || '',
          lastName: json.data.lastName || '',
          birthday: json.data.birthday,
          phone: json.data.phone || '',
          email: json.data.email || '',
        });
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          birthday: form.birthday || null,
          phone: form.phone || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('common.failed'));
      setMsg(t('account.profileUpdated'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.failed'));
    } finally {
      setBusy(false);
    }
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: sec }}>
        {label}
      </label>
      {children}
    </div>
  );

  const inputStyle = {
    borderColor: borderSubtle(isDark),
    background: inputBg,
    color: pri,
  };

  return (
    <motion.div
      variants={accountFadeUp}
      className="rounded-2xl p-5 sm:p-6 space-y-5"
      style={{ ...glassStyle(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
    >
      <div>
        <h3 className="text-base font-bold" style={{ color: pri }}>
          {t('account.personalInfo')}
        </h3>
        <p className="text-xs mt-1" style={{ color: mut }}>
          {t('account.personalInfoHint')}
        </p>
      </div>

      <form onSubmit={(e) => void save(e)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {field(
            t('account.firstName'),
            <input
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={inputStyle}
            />,
          )}
          {field(
            t('account.lastName'),
            <input
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={inputStyle}
            />,
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {field(
            t('account.birthday'),
            <input
              type="date"
              value={form.birthday || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthday: e.target.value || null }))
              }
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={inputStyle}
            />,
          )}
          {field(
            t('account.phone'),
            <input
              value={form.phone || ''}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+98 …"
              className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none"
              style={inputStyle}
            />,
          )}
        </div>
        {field(
          t('account.email'),
          <input
            disabled
            value={form.email}
            className="w-full px-3.5 py-3 rounded-xl text-sm border outline-none opacity-70"
            style={{ ...inputStyle, background: surfaceItem(isDark) }}
          />,
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {msg && (
          <p className="text-sm font-medium" style={{ color: primaryColor }}>
            {msg}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <GlassButton type="submit" disabled={busy} style={{ padding: '10px 20px', borderRadius: 12 }}>
            {busy ? t('account.saving') : t('account.saveProfile')}
          </GlassButton>
        </div>
      </form>
    </motion.div>
  );
}
