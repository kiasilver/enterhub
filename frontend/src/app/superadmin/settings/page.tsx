'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

const TPL_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'login', label: 'Login OTP', hint: 'CODE' },
  { key: 'register', label: 'Register OTP', hint: 'CODE' },
  { key: 'temp_pass', label: 'Temporary password', hint: 'PASS' },
  { key: 'assignment', label: 'Task assignment', hint: 'TASK' },
  { key: 'supervisor', label: 'Supervisor notice', hint: 'TASK' },
  { key: 'approval', label: 'Task approval', hint: 'TASK' },
  { key: 'invite', label: 'Invite', hint: '—' },
  { key: 'letter', label: 'Letter', hint: 'TASK' },
  { key: 'mail', label: 'Mail', hint: 'TASK' },
];

type Settings = {
  smsOtpEnabled: boolean;
  emailVerifyEnabled: boolean;
  googleAuthEnabled: boolean;
  smsirTemplateId: number | null;
  smsirApiKey: string | null;
  smsirTemplates?: Record<string, number>;
  zarinpalMerchantId: string | null;
  zarinpalSandbox: boolean;
};

export default function SaSettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<{
    settings: Settings;
    env: { smsirConfigured: boolean; smtpConfigured: boolean; googleConfigured: boolean };
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/superadmin/settings');
    const json = await res.json();
    if (res.ok) setData(json.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!data) return;
    const s = data.settings;
    await fetch('/api/superadmin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smsOtpEnabled: s.smsOtpEnabled,
        emailVerifyEnabled: s.emailVerifyEnabled,
        googleAuthEnabled: s.googleAuthEnabled,
        smsirTemplateId: s.smsirTemplateId,
        smsirApiKey: s.smsirApiKey,
        smsirTemplates: s.smsirTemplates ?? {},
        zarinpalMerchantId: s.zarinpalMerchantId,
        zarinpalSandbox: s.zarinpalSandbox,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    void load();
  }

  if (!data) {
    return (
      <SuperAdminShell>
        <p className="p-6">Loading…</p>
      </SuperAdminShell>
    );
  }

  const s = data.settings;
  const toggle = (key: keyof Settings, value: boolean) =>
    setData({ ...data, settings: { ...s, [key]: value } });

  const setTpl = (key: string, raw: string) => {
    const n = raw.trim() ? Number(raw) : 0;
    setData({
      ...data,
      settings: {
        ...s,
        smsirTemplates: {
          ...(s.smsirTemplates ?? {}),
          [key]: Number.isFinite(n) && n > 0 ? n : 0,
        },
      },
    });
  };

  const inputStyle = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: 'transparent',
    color: textPrimary(isDark),
  } as const;

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          Platform settings
        </h1>
        <p className="text-sm" style={{ color: textMuted(isDark) }}>
          When a channel is off or keys are missing, signup skips that verification.
        </p>

        <div className="rounded-2xl p-4 space-y-3 text-sm" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
          {(
            [
              ['smsOtpEnabled', 'SMS OTP (sms.ir)', data.env.smsirConfigured],
              ['emailVerifyEnabled', 'Email verification (SMTP)', data.env.smtpConfigured],
              ['googleAuthEnabled', 'Google sign-in', data.env.googleConfigured],
            ] as const
          ).map(([key, label, configured]) => (
            <label key={key} className="flex items-center justify-between gap-3" style={{ color: textSecondary(isDark) }}>
              <span>
                {label}
                <span className="block text-[10px]" style={{ color: textMuted(isDark) }}>
                  {configured ? 'configured' : 'missing API / templates'}
                </span>
              </span>
              <input type="checkbox" checked={Boolean(s[key])} onChange={(e) => toggle(key, e.target.checked)} />
            </label>
          ))}

          <label className="flex items-center justify-between" style={{ color: textSecondary(isDark) }}>
            Zarinpal sandbox
            <input
              type="checkbox"
              checked={s.zarinpalSandbox}
              onChange={(e) =>
                setData({ ...data, settings: { ...s, zarinpalSandbox: e.target.checked } })
              }
            />
          </label>

          <label className="block" style={{ color: textSecondary(isDark) }}>
            Zarinpal merchant id
            <input
              value={s.zarinpalMerchantId ?? ''}
              onChange={(e) =>
                setData({
                  ...data,
                  settings: { ...s, zarinpalMerchantId: e.target.value || null },
                })
              }
              className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
              style={inputStyle}
            />
          </label>
        </div>

        <div className="rounded-2xl p-4 space-y-3 text-sm" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
          <h2 className="text-base font-bold" style={{ color: textPrimary(isDark) }}>
            OTP / SMS.IR
          </h2>
          <p className="text-xs" style={{ color: textMuted(isDark) }}>
            After SMS.IR approves templates, paste the API key and numeric Template IDs. Until then OTP stays skipped.
          </p>

          <label className="block" style={{ color: textSecondary(isDark) }}>
            API Key (x-api-key)
            <div className="mt-1 flex gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                value={s.smsirApiKey ?? ''}
                onChange={(e) =>
                  setData({
                    ...data,
                    settings: { ...s, smsirApiKey: e.target.value || null },
                  })
                }
                placeholder="Paste after SMS.IR approval"
                className="w-full rounded-xl px-3 py-2 outline-none"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="shrink-0 rounded-xl px-3 text-xs"
                style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textMuted(isDark) }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {TPL_FIELDS.map((f) => (
              <label key={f.key} className="block" style={{ color: textSecondary(isDark) }}>
                {f.label}
                <span className="ms-1 text-[10px]" style={{ color: textMuted(isDark) }}>
                  {f.hint}
                </span>
                <input
                  type="number"
                  value={s.smsirTemplates?.[f.key] || ''}
                  onChange={(e) => setTpl(f.key, e.target.value)}
                  placeholder="Template ID"
                  className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
                  style={inputStyle}
                />
              </label>
            ))}
          </div>

          <label className="block" style={{ color: textSecondary(isDark) }}>
            Fallback template id
            <input
              type="number"
              value={s.smsirTemplateId ?? ''}
              onChange={(e) =>
                setData({
                  ...data,
                  settings: {
                    ...s,
                    smsirTemplateId: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
              className="mt-1 w-full rounded-xl px-3 py-2 outline-none"
              style={inputStyle}
            />
          </label>
        </div>

        <button type="button" onClick={() => void save()} className="w-full rounded-xl py-2.5 font-bold text-white bg-blue-600">
          {saved ? 'Saved' : 'Save settings'}
        </button>
      </div>
    </SuperAdminShell>
  );
}
