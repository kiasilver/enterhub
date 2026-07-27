'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  glassStyle,
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import { X } from 'lucide-react';

type AuditRow = {
  id: string;
  action: string;
  severity: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  createdAt: string;
  user: { id: string; email: string; name: string | null } | null;
  workspace: { id: string; name: string } | null;
};

export default function SuperAdminAuditPage() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    if (!session?.user?.isSuperAdmin) return;
    const res = await fetch('/api/superadmin/audit');
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load audit');
      return;
    }
    setError(null);
    setRows(json.data || []);
  }, [session]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            Audit log
          </h2>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            Platform activity · refreshes every 8s
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ color: textMuted(isDark) }}>
                <th className="text-left font-medium py-2">When</th>
                <th className="text-left font-medium py-2">Action</th>
                <th className="text-left font-medium py-2">Severity</th>
                <th className="text-left font-medium py-2">User</th>
                <th className="text-left font-medium py-2">Workspace</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className="cursor-pointer"
                  style={{
                    borderTop: `1px solid ${borderSubtle(isDark)}`,
                    background: tableRowBg(isDark, i),
                  }}
                  onClick={() => setSelected(r)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = tableRowBg(isDark, i);
                  }}
                >
                  <td className="py-2.5 whitespace-nowrap" style={{ color: textSecondary(isDark) }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5" style={{ color: textPrimary(isDark) }}>
                    {r.action}
                  </td>
                  <td className="py-2.5" style={{ color: textSecondary(isDark) }}>
                    {r.severity}
                  </td>
                  <td className="py-2.5" style={{ color: textSecondary(isDark) }}>
                    {r.user?.email || '—'}
                  </td>
                  <td className="py-2.5" style={{ color: textSecondary(isDark) }}>
                    {r.workspace?.name || '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !error && (
                <tr>
                  <td colSpan={5} className="py-6" style={{ color: textMuted(isDark) }}>
                    No audit events yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="Close drawer"
            onClick={() => setSelected(null)}
          />
          <aside
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md p-6 overflow-auto"
            style={glassStyle(isDark)}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-semibold" style={{ color: textPrimary(isDark) }}>
                  {selected.action}
                </h3>
                <p className="text-xs mt-1" style={{ color: textMuted(isDark) }}>
                  {selected.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg"
                style={{ color: textSecondary(isDark) }}
              >
                <X size={18} />
              </button>
            </div>
            <pre
              className="text-xs overflow-auto p-4 rounded-xl whitespace-pre-wrap break-all"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textSecondary(isDark),
                background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.03)',
              }}
            >
              {JSON.stringify(selected.metadata, null, 2)}
            </pre>
          </aside>
        </>
      )}
    </SuperAdminShell>
  );
}
