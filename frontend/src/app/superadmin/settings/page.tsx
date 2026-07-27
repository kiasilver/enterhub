'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

export default function SaSettingsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<{
    settings: {
      smsOtpEnabled: boolean;
      emailVerifyEnabled: boolean;
      googleAuthEnabled: boolean;
      smsirTemplateId: number | null;
      zarinpalMerchantId: string | null;
      zarinpalSandbox: boolean;
    };
    env: { smsirConfigured: boolean; smtpConfigured: boolean; googleConfigured: boolean };
  } | null>(null);
  const [saved, setSaved] = useState(false);

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
    await fetch('/api/superadmin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!data) {
    return (
      <SuperAdminShell>
        <p className="p-6">Loading…</p>
      </SuperAdminShell>
    );
  }

  const s = data.settings;
  const toggle = (key: keyof typeof s, value: boolean) =>
    setData({ ...data, settings: { ...s, [key]: value } });

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          Platform settings
        </h1>
        <p className="text-sm" style={{ color: textMuted(isDark) }}>
          When a channel is off or env keys are missing, signup skips that verification.
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
                  Env: {configured ? 'configured' : 'missing'}
                </span>
              </span>
              <input type="checkbox" checked={Boolean(s[key])} onChange={(e) => toggle(key, e.target.checked)} />
            </label>
          ))}

          <label className="block" style={{ color: textSecondary(isDark) }}>
            sms.ir template id override
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
              style={{ border: `1px solid ${borderSubtle(isDark)}`, background: 'transparent', color: textPrimary(isDark) }}
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
              style={{ border: `1px solid ${borderSubtle(isDark)}`, background: 'transparent', color: textPrimary(isDark) }}
            />
          </label>

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

          <button type="button" onClick={() => void save()} className="w-full rounded-xl py-2.5 font-bold text-white bg-blue-600">
            {saved ? 'Saved' : 'Save settings'}
          </button>
        </div>
      </div>
    </SuperAdminShell>
  );
}
