'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

export default function SecurityPage() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const [enforce2FA, setEnforce2FA] = useState(false);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(168);
  const [ipText, setIpText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/security`);
      const json = await res.json();
      if (res.status === 403) {
        setError('403 — Need security:policies');
        return;
      }
      if (!res.ok) throw new Error(json.error || 'Failed');
      setEnforce2FA(Boolean(json.data.enforce2FA));
      setSessionTimeoutHours(json.data.sessionTimeoutHours ?? 168);
      const list = Array.isArray(json.data.ipAllowlist) ? json.data.ipAllowlist : [];
      setIpText(list.join('\n'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setOk(null);
    setError(null);
    const ipAllowlist = ipText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/workspaces/${workspaceId}/security`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enforce2FA,
        sessionTimeoutHours,
        ipAllowlist: ipAllowlist.length ? ipAllowlist : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Save failed');
      return;
    }
    setOk(t('settingsUi.securitySaved'));
  }

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  return (
    <SettingsGlassCard accent="#ef4444" className="w-full max-w-xl">
      <SettingsSectionTitle
        title={t('settingsUi.securityTitle')}
        subtitle={t('settingsUi.securitySubtitle')}
        badge={t('settingsUi.securityBadge')}
        badgeColor="#ef4444"
      />

      {loading ? (
        <p style={{ color: textMuted(isDark) }}>{t('common.loading')}</p>
      ) : error && error.startsWith('403') ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <form onSubmit={save} className="space-y-5">
          <label className="flex items-center gap-3 text-sm" style={{ color: textPrimary(isDark) }}>
            <input type="checkbox" checked={enforce2FA} onChange={(e) => setEnforce2FA(e.target.checked)} />
            {t('settingsUi.enforce2fa')}
          </label>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: textSecondary(isDark) }}>
              {t('settingsUi.sessionTimeout')}
            </label>
            <input
              type="number"
              min={1}
              max={720}
              value={sessionTimeoutHours}
              onChange={(e) => setSessionTimeoutHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl outline-none"
              style={field}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: textSecondary(isDark) }}>
              {t('settingsUi.ipAllowlist')}
            </label>
            <textarea
              rows={4}
              value={ipText}
              onChange={(e) => setIpText(e.target.value)}
              placeholder={'10.0.0.0/8\n203.0.113.0/24'}
              className="w-full px-4 py-2.5 rounded-xl font-mono text-sm outline-none"
              style={field}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {ok && <p className="text-sm text-green-500">{ok}</p>}

          <GlassButton type="submit" className="px-5 py-2.5 rounded-xl font-semibold">
            {t('settingsUi.savePolicies')}
          </GlassButton>
        </form>
      )}
    </SettingsGlassCard>
  );
}
