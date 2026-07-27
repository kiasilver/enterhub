'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MoreHorizontal, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceHover,
  glassDropdown,
  panelFill,
  tableRowBg,
} from '@/components/SafeDashboard/theme';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  planTier: string;
  status: string;
  seatLimit: number;
  capturedDomain: string | null;
  createdAt: string;
  owner: { id: string; email: string; name: string | null };
  memberCount: number;
  boardCount: number;
  storageBytes: number;
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export default function SuperAdminTenantsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [planDialog, setPlanDialog] = useState<Tenant | null>(null);
  const [planTier, setPlanTier] = useState('PRO');
  const [suspendDialog, setSuspendDialog] = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!session?.user?.isSuperAdmin) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (plan) params.set('plan', plan);
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('pageSize', '20');
    const res = await fetch(`/api/superadmin/tenants?${params}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed to load tenants');
      setLoading(false);
      return;
    }
    setTenants(json.data || []);
    setPages(json.pagination?.pages || 1);
    setTotal(json.pagination?.total || 0);
    setLoading(false);
  }, [session, q, plan, status, page]);

  useEffect(() => {
    setPage(1);
  }, [q, plan, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function impersonate(ownerId: string, workspaceId: string) {
    setMsg(null);
    setMenuId(null);
    const res = await fetch('/api/superadmin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: ownerId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || 'Impersonation failed');
      return;
    }
    await update({ impersonateUserId: ownerId });
    setMsg(`Viewing as ${json.data?.target?.email || ownerId} (read-only)`);
    router.push(`/workspace/${workspaceId}`);
    router.refresh();
  }

  async function forcePlan() {
    if (!planDialog) return;
    setMsg(null);
    const res = await fetch(`/api/superadmin/tenants/${planDialog.id}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planTier }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || 'Plan update failed');
      return;
    }
    setPlanDialog(null);
    setMsg(`Plan set to ${planTier}`);
    await load();
  }

  async function suspendTenant() {
    if (!suspendDialog) return;
    setMsg(null);
    const res = await fetch(`/api/superadmin/workspaces/${suspendDialog.id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suspend: suspendDialog.status !== 'SUSPENDED',
        reason: suspendReason || 'admin action',
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || 'Suspend failed');
      return;
    }
    setSuspendDialog(null);
    setSuspendReason('');
    setMsg('Workspace status updated');
    await load();
  }

  const inputStyle = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
    background: 'transparent',
  } as const;

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            Tenants
          </h2>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            Search, filter, impersonate, force plan, suspend
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: textMuted(isDark) }}
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, slug, domain, owner…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            />
          </div>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm"
            style={inputStyle}
          >
            <option value="">All plans</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm"
            style={inputStyle}
          >
            <option value="">All status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="PENDING_DELETE">PENDING_DELETE</option>
          </select>
        </div>

        {msg && <p className="text-sm" style={{ color: textSecondary(isDark) }}>{msg}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading && (
          <p className="text-sm" style={{ color: textMuted(isDark) }}>
            Loading…
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ color: textMuted(isDark) }}>
                <th className="text-left font-medium py-2">Name</th>
                <th className="text-left font-medium py-2">Plan</th>
                <th className="text-left font-medium py-2">Status</th>
                <th className="text-left font-medium py-2">Owner</th>
                <th className="text-right font-medium py-2">Members</th>
                <th className="text-right font-medium py-2">Storage</th>
                <th className="text-right font-medium py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, i) => (
                <tr
                  key={t.id}
                  style={{
                    borderTop: `1px solid ${borderSubtle(isDark)}`,
                    background: tableRowBg(isDark, i),
                  }}
                >
                  <td className="py-3" style={{ color: textPrimary(isDark) }}>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs" style={{ color: textMuted(isDark) }}>
                      {t.slug}
                    </div>
                  </td>
                  <td className="py-3" style={{ color: textSecondary(isDark) }}>
                    {t.planTier}
                  </td>
                  <td className="py-3" style={{ color: textSecondary(isDark) }}>
                    {t.status}
                  </td>
                  <td className="py-3" style={{ color: textSecondary(isDark) }}>
                    {t.owner.email}
                  </td>
                  <td className="py-3 text-right tabular-nums" style={{ color: textSecondary(isDark) }}>
                    {t.memberCount}/{t.seatLimit}
                  </td>
                  <td className="py-3 text-right tabular-nums" style={{ color: textSecondary(isDark) }}>
                    {formatBytes(t.storageBytes)}
                  </td>
                  <td className="py-3 text-right relative">
                    <button
                      type="button"
                      className="p-2 rounded-lg"
                      style={{ color: textSecondary(isDark) }}
                      onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                      aria-label="Actions"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {menuId === t.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-1 z-30 w-44 py-1 text-left"
                        style={glassDropdown(isDark)}
                      >
                        {[
                          {
                            label: 'View',
                            onClick: () => {
                              setMenuId(null);
                              router.push(`/superadmin/tenants/${t.id}`);
                            },
                          },
                          {
                            label: 'Impersonate',
                            onClick: () => void impersonate(t.owner.id, t.id),
                          },
                          {
                            label: 'Force plan',
                            onClick: () => {
                              setPlanTier(t.planTier);
                              setPlanDialog(t);
                              setMenuId(null);
                            },
                          },
                          {
                            label: t.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend',
                            onClick: () => {
                              setSuspendDialog(t);
                              setMenuId(null);
                            },
                          },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm"
                            style={{ color: textPrimary(isDark) }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = surfaceHover(isDark);
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={item.onClick}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && tenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6" style={{ color: textMuted(isDark) }}>
                    No tenants match filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm" style={{ color: textSecondary(isDark) }}>
          <span>
            {total} tenants · page {page}/{pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl disabled:opacity-40"
              style={{ border: `1px solid ${borderSubtle(isDark)}` }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              type="button"
              disabled={page >= pages}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl disabled:opacity-40"
              style={{ border: `1px solid ${borderSubtle(isDark)}` }}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {planDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md p-6 space-y-4 rounded-2xl"
            style={{
              background: panelFill(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
          >
            <h3 className="font-semibold" style={{ color: textPrimary(isDark) }}>
              Force plan — {planDialog.name}
            </h3>
            <select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={inputStyle}
            >
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm"
                style={{ color: textSecondary(isDark) }}
                onClick={() => setPlanDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
                onClick={() => void forcePlan()}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md p-6 space-y-4 rounded-2xl"
            style={{
              background: panelFill(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
          >
            <h3 className="font-semibold" style={{ color: textPrimary(isDark) }}>
              {suspendDialog.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'} — {suspendDialog.name}
            </h3>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
              style={inputStyle}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm"
                style={{ color: textSecondary(isDark) }}
                onClick={() => setSuspendDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
                onClick={() => void suspendTenant()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminShell>
  );
}
