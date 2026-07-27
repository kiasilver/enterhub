'use client';

import { useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

export default function SystemPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<{
    memory: { totalMb: number; freeMb: number; usedMb: number };
    cpu: { count: number; model?: string; loadavg: number[] };
    disk: { totalMb: number | null; freeMb: number | null };
    process: { uptimeSec: number; node: string; platform: string };
    counts: { users: number; workspaces: number; pendingC2c: number; signupsToday: number };
  } | null>(null);

  useEffect(() => {
    void fetch('/api/superadmin/system/health')
      .then((r) => r.json())
      .then((j) => setData(j.data));
  }, []);

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          System health
        </h1>
        {!data ? (
          <p>Loading…</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['RAM used', `${data.memory.usedMb} / ${data.memory.totalMb} MB`],
              ['CPU', `${data.cpu.count} cores`],
              ['Disk free', data.disk.freeMb != null ? `${data.disk.freeMb} MB` : 'n/a'],
              ['Uptime', `${Math.round(data.process.uptimeSec / 60)} min`],
              ['Users', String(data.counts.users)],
              ['Active orgs', String(data.counts.workspaces)],
              ['Pending C2C', String(data.counts.pendingC2c)],
              ['Signups today', String(data.counts.signupsToday)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl p-4" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: textMuted(isDark) }}>
                  {label}
                </p>
                <p className="text-lg font-bold mt-1" style={{ color: textPrimary(isDark) }}>
                  {value}
                </p>
              </div>
            ))}
            <div className="sm:col-span-2 rounded-2xl p-4 text-sm" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}>
              <p>Node {data.process.node} · {data.process.platform}</p>
              <p className="text-xs mt-1" style={{ color: textMuted(isDark) }}>
                {data.cpu.model}
              </p>
              <p className="text-xs mt-1">loadavg: {data.cpu.loadavg.map((n) => n.toFixed(2)).join(', ')}</p>
            </div>
          </div>
        )}
      </div>
    </SuperAdminShell>
  );
}
