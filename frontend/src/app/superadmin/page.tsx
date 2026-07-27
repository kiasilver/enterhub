'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import SafeStatsRow from '@/components/SafeDashboard/SafeStatsRow';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import { Building2, Users, TrendingDown, DollarSign } from 'lucide-react';

type Metrics = {
  totalWorkspaces: number;
  totalUsers?: number;
  newUsersLast30Days: number;
  signupsToday?: number;
  pendingC2c?: number;
  totalActiveBoards: number;
  planBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  dau: number;
  mau: number;
  churnRate: number;
  churned30: number;
  mrrDemo: number | null;
  arrDemo: number | null;
  topStorageTenants: { workspaceId: string; name: string; bytes: number }[];
  telemetry: { heapUsedMb: number; rssMb: number; note: string };
  generatedAt: string;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export default function SuperAdminPage() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.isSuperAdmin) return;
    void (async () => {
      setLoading(true);
      const res = await fetch('/api/superadmin/metrics');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Forbidden');
        setLoading(false);
        return;
      }
      setMetrics(json.data);
      setLoading(false);
    })();
  }, [session]);

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
            Platform / Overview
          </p>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            Platform overview
          </h2>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            SaaS telemetry · signups, C2C queue, storage, and plan mix
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading && !metrics && (
          <p className="text-sm" style={{ color: textMuted(isDark) }}>
            Loading metrics…
          </p>
        )}

        {metrics && (
          <>
            <SafeStatsRow
              isDark={isDark}
              stats={[
                {
                  label: 'Workspaces',
                  value: metrics.totalWorkspaces,
                  unit: 'tenants',
                  sub: `${metrics.totalActiveBoards} active boards`,
                  accentColor: '#3b82f6',
                  icon: Building2,
                },
                {
                  label: 'DAU / MAU',
                  value: `${metrics.dau}`,
                  unit: `/ ${metrics.mau}`,
                  sub: `${metrics.newUsersLast30Days} new users (30d)`,
                  accentColor: '#10b981',
                  icon: Users,
                },
                {
                  label: 'Churn',
                  value: metrics.churnRate,
                  unit: '%',
                  sub: `${metrics.churned30} suspended / pending (30d)`,
                  accentColor: '#ef4444',
                  icon: TrendingDown,
                },
                {
                  label: 'Signups today',
                  value: metrics.signupsToday ?? 0,
                  unit: 'users',
                  sub: `${metrics.totalUsers ?? '—'} total · ${metrics.pendingC2c ?? 0} C2C pending`,
                  accentColor: '#f59e0b',
                  icon: DollarSign,
                },
              ]}
            />

            <div className="grid lg:grid-cols-2 gap-5">
              <WidgetFrame title="Plan breakdown" isDark={isDark}>
                <ul className="space-y-2 text-sm">
                  {Object.entries(metrics.planBreakdown).map(([plan, count]) => (
                    <li
                      key={plan}
                      className="flex justify-between gap-3 px-3 py-2 rounded-xl"
                      style={{ border: `1px solid ${borderSubtle(isDark)}` }}
                    >
                      <span style={{ color: textPrimary(isDark) }}>{plan}</span>
                      <span className="tabular-nums font-semibold" style={{ color: textPrimary(isDark) }}>
                        {count}
                      </span>
                    </li>
                  ))}
                  {Object.keys(metrics.planBreakdown).length === 0 && (
                    <li style={{ color: textMuted(isDark) }}>No active plans</li>
                  )}
                </ul>
              </WidgetFrame>

              <WidgetFrame
                title="Telemetry heap"
                isDark={isDark}
                action={
                  <span className="text-xs" style={{ color: textMuted(isDark) }}>
                    {new Date(metrics.generatedAt).toLocaleString()}
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ border: `1px solid ${borderSubtle(isDark)}` }}
                  >
                    <p style={{ color: textMuted(isDark) }}>Heap used</p>
                    <p className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>
                      {metrics.telemetry.heapUsedMb} MB
                    </p>
                  </div>
                  <div
                    className="px-3 py-2 rounded-xl"
                    style={{ border: `1px solid ${borderSubtle(isDark)}` }}
                  >
                    <p style={{ color: textMuted(isDark) }}>RSS</p>
                    <p className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>
                      {metrics.telemetry.rssMb} MB
                    </p>
                  </div>
                </div>
                <p className="text-xs mt-3" style={{ color: textMuted(isDark) }}>
                  {metrics.telemetry.note}
                </p>
              </WidgetFrame>
            </div>

            <WidgetFrame title="Top storage tenants" isDark={isDark}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: textMuted(isDark) }}>
                      <th className="text-left font-medium py-2">Tenant</th>
                      <th className="text-right font-medium py-2">Storage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.topStorageTenants.map((t, i) => (
                      <tr
                        key={t.workspaceId}
                        style={{
                          borderTop: `1px solid ${borderSubtle(isDark)}`,
                          background: tableRowBg(isDark, i),
                        }}
                      >
                        <td className="py-2.5" style={{ color: textPrimary(isDark) }}>
                          {t.name}
                        </td>
                        <td
                          className="py-2.5 text-right tabular-nums"
                          style={{ color: textSecondary(isDark) }}
                        >
                          {formatBytes(t.bytes)}
                        </td>
                      </tr>
                    ))}
                    {metrics.topStorageTenants.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-3" style={{ color: textMuted(isDark) }}>
                          No storage data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </WidgetFrame>
          </>
        )}
      </div>
    </SuperAdminShell>
  );
}
