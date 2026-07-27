'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

type UserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  isSuperAdmin: boolean;
  blockedAt: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { memberships: number; ownedWorkspaces: number };
};

export default function SaUsersPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/superadmin/users?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    if (res.ok) setRows(json.data || []);
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(userId: string, action: string, extra?: Record<string, unknown>) {
    const res = await fetch('/api/superadmin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const json = await res.json();
    if (json.data?.temporaryPassword) {
      setMsg(`Temp password: ${json.data.temporaryPassword}`);
    } else {
      setMsg(action + ' ok');
    }
    await load();
  }

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          Users
        </h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-full max-w-md rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, color: textPrimary(isDark) }}
        />
        {msg && <p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p>}
        <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${borderSubtle(isDark)}` }}>
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr style={{ color: textMuted(isDark), borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                {['User', 'Contact', 'Orgs', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-3 py-2 text-[10px] uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold" style={{ color: textPrimary(isDark) }}>
                      {u.name || '—'}
                    </p>
                    <p className="text-[10px]">{u.isSuperAdmin ? 'Super Admin' : 'User'}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {u.phone || '—'}
                    <br />
                    {u.email || '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    {u._count.ownedWorkspaces} owned · {u._count.memberships} mem
                  </td>
                  <td className="px-3 py-2.5">
                    {u.blockedAt ? <span className="text-red-500">Blocked</span> : 'Active'}
                  </td>
                  <td className="px-3 py-2.5 space-x-2 text-xs">
                    {u.blockedAt ? (
                      <button type="button" className="underline" onClick={() => void act(u.id, 'unblock')}>
                        Unblock
                      </button>
                    ) : (
                      <button type="button" className="underline text-red-500" onClick={() => void act(u.id, 'block', { reason: 'Blocked by SA' })}>
                        Block
                      </button>
                    )}
                    <button type="button" className="underline" onClick={() => void act(u.id, 'reset_password')}>
                      Reset pwd
                    </button>
                    <button type="button" className="underline" onClick={() => void act(u.id, 'force_verify')}>
                      Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SuperAdminShell>
  );
}
