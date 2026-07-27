'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
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

type Log = {
  id: string;
  action: string;
  severity: string;
  createdAt: string;
  ipAddress: string | null;
  user: { email: string; name: string | null } | null;
};

export default function AuditPanel() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const q = filter ? `?action=${encodeURIComponent(filter)}` : '';
    const res = await fetch(`/api/workspaces/${workspaceId}/audit${q}`);
    const json = await res.json();
    setLoading(false);
    if (res.status === 403) {
      setError('403 — Need workspace:audit');
      return;
    }
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    setLogs(json.data || []);
  }, [workspaceId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SettingsGlassCard accent="#f59e0b" className="w-full">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <SettingsSectionTitle
            title="Audit log"
            subtitle="Security-sensitive actions in this workspace."
            badge="Trail"
            badgeColor="#f59e0b"
          />
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by action…"
          className="px-3 py-2 rounded-xl text-sm outline-none shrink-0 sm:mt-0.5"
          style={{
            border: `1px solid ${borderSubtle(isDark)}`,
            background: surfaceItem(isDark),
            color: textPrimary(isDark),
          }}
        />
      </div>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm" style={{ color: textMuted(isDark) }}>Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-sm" style={{ color: textMuted(isDark) }}>No audit entries.</p>
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
                <th className="text-left p-3 font-medium">When</th>
                <th className="text-left p-3 font-medium">Actor</th>
                <th className="text-left p-3 font-medium">Action</th>
                <th className="text-left p-3 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr
                  key={l.id}
                  style={{
                    borderBottom: `1px solid ${borderSubtle(isDark)}`,
                    background: tableRowBg(isDark, i),
                  }}
                >
                  <td className="p-3 whitespace-nowrap" style={{ color: textSecondary(isDark) }}>
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3" style={{ color: textPrimary(isDark) }}>
                    {l.user?.name || l.user?.email || '—'}
                  </td>
                  <td className="p-3 font-mono text-xs" style={{ color: textSecondary(isDark) }}>
                    {l.action}
                  </td>
                  <td className="p-3" style={{ color: textSecondary(isDark) }}>
                    {l.severity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsGlassCard>
  );
}
