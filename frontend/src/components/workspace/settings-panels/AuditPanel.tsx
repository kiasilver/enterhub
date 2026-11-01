'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
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
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import { localizeAuditAction, localizeAuditSeverity } from '@/lib/role-i18n';

type Log = {
  id: string;
  action: string;
  severity: string;
  createdAt: string;
  ipAddress: string | null;
  user: { email: string; name: string | null } | null;
};

function severityTone(severity: string, isDark: boolean) {
  const key = severity.toLowerCase();
  if (key === 'critical') {
    return {
      color: isDark ? '#fca5a5' : '#b91c1c',
      background: isDark ? 'rgba(239,68,68,0.16)' : 'rgba(239,68,68,0.08)',
      border: isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.22)',
    };
  }
  if (key === 'warning') {
    return {
      color: isDark ? '#fcd34d' : '#b45309',
      background: isDark ? 'rgba(245,158,11,0.16)' : 'rgba(245,158,11,0.1)',
      border: isDark ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.24)',
    };
  }
  return {
    color: isDark ? '#93c5fd' : '#1d4ed8',
    background: isDark ? 'rgba(59,130,246,0.16)' : 'rgba(59,130,246,0.08)',
    border: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.2)',
  };
}

export default function AuditPanel() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/audit?limit=200`);
    const json = await res.json();
    setLoading(false);
    if (res.status === 403) {
      setError(t('settingsUi.auditForbidden'));
      return;
    }
    if (!res.ok) {
      setError(json.error || t('settingsUi.auditFailed'));
      return;
    }
    setLogs(json.data || []);
  }, [workspaceId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const action = localizeAuditAction(l.action, t).toLowerCase();
      const severity = localizeAuditSeverity(l.severity, t).toLowerCase();
      const actor = (l.user?.name || l.user?.email || t('settingsUi.auditSystem')).toLowerCase();
      const ip = (l.ipAddress || '').toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        action.includes(q) ||
        severity.includes(q) ||
        actor.includes(q) ||
        ip.includes(q)
      );
    });
  }, [logs, filter, t]);

  const locale = lang === 'fa' ? 'fa-IR' : 'en-US';

  return (
    <SettingsGlassCard accent="#f59e0b" className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <SettingsSectionTitle
            title={t('settingsUi.auditTitle')}
            subtitle={t('settingsUi.auditSubtitle')}
            badge={t('settingsUi.auditBadge')}
            badgeColor="#f59e0b"
          />
        </div>
        <div className="shrink-0 sm:mt-0.5 space-y-1.5">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('settingsUi.auditFilter')}
            className="w-full sm:w-72 px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              background: surfaceItem(isDark),
              color: textPrimary(isDark),
            }}
          />
          {!loading && !error && (
            <p className="text-[11px] text-end sm:text-start" style={{ color: textMuted(isDark) }}>
              {visible.length === 1
                ? t('settingsUi.auditEntriesOne')
                : t('settingsUi.auditEntries', { n: visible.length })}
            </p>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm" style={{ color: textMuted(isDark) }}>{t('common.loading')}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm" style={{ color: textMuted(isDark) }}>{t('settingsUi.auditEmpty')}</p>
      ) : (
        <div
          className="rounded-2xl overflow-x-auto table-scroll"
          style={{
            border: `1px solid ${borderSubtle(isDark)}`,
            background: surfaceItem(isDark),
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: textMuted(isDark), borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                <th className="text-start p-3 font-medium">{t('settingsUi.auditWhen')}</th>
                <th className="text-start p-3 font-medium">{t('settingsUi.auditActor')}</th>
                <th className="text-start p-3 font-medium">{t('settingsUi.auditAction')}</th>
                <th className="text-start p-3 font-medium">{t('settingsUi.auditSeverity')}</th>
                <th className="text-start p-3 font-medium">{t('settingsUi.auditIp')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l, i) => {
                const tone = severityTone(l.severity, isDark);
                return (
                  <tr
                    key={l.id}
                    style={{
                      borderBottom: `1px solid ${borderSubtle(isDark)}`,
                      background: tableRowBg(isDark, i),
                    }}
                  >
                    <td className="p-3 whitespace-nowrap" style={{ color: textSecondary(isDark) }}>
                      {new Date(l.createdAt).toLocaleString(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3">
                      <div className="font-medium" style={{ color: textPrimary(isDark) }}>
                        {l.user?.name || l.user?.email || t('settingsUi.auditSystem')}
                      </div>
                      {l.user?.name && l.user.email && (
                        <div className="text-[11px] mt-0.5" style={{ color: textMuted(isDark) }}>
                          {l.user.email}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div style={{ color: textPrimary(isDark) }}>
                        {localizeAuditAction(l.action, t)}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-flex items-center min-h-[26px] px-2.5 rounded-full text-[11px] font-semibold"
                        style={{
                          color: tone.color,
                          background: tone.background,
                          border: `1px solid ${tone.border}`,
                        }}
                      >
                        {localizeAuditSeverity(l.severity, t)}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px]" style={{ color: textMuted(isDark) }}>
                      {l.ipAddress || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SettingsGlassCard>
  );
}
