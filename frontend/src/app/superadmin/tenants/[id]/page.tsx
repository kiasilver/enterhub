'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { KpiCard } from '@/components/dashboards/KpiCard';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
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

export default function TenantDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data: session, update } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/superadmin/tenants/${id}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Failed');
      return;
    }
    setTenant(json.data);
  }, [id]);

  useEffect(() => {
    if (session?.user?.isSuperAdmin) void load();
  }, [session, load]);

  async function impersonate() {
    if (!tenant) return;
    const res = await fetch('/api/superadmin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: tenant.owner.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMsg(json.error || 'Failed');
      return;
    }
    await update({ impersonateUserId: tenant.owner.id });
    router.push(`/workspace/${tenant.id}`);
    router.refresh();
  }

  return (
    <SuperAdminShell>
      <div className="space-y-6">
        <Link
          href="/superadmin/tenants"
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: textSecondary(isDark) }}
        >
          <ArrowLeft size={16} /> Back to tenants
        </Link>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {msg && <p className="text-sm" style={{ color: textSecondary(isDark) }}>{msg}</p>}

        {tenant && (
          <>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
                {tenant.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: textMuted(isDark) }}>
                {tenant.slug} · {tenant.capturedDomain || 'no domain'} · created{' '}
                {new Date(tenant.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Plan" value={tenant.planTier} isDark={isDark} />
              <KpiCard title="Status" value={tenant.status} isDark={isDark} />
              <KpiCard
                title="Seats"
                value={`${tenant.memberCount}/${tenant.seatLimit}`}
                isDark={isDark}
              />
              <KpiCard title="Storage" value={formatBytes(tenant.storageBytes)} isDark={isDark} />
            </div>

            <div
              className="rounded-2xl p-5 space-y-2 text-sm"
              style={{ border: `1px solid ${borderSubtle(isDark)}` }}
            >
              <p style={{ color: textMuted(isDark) }}>Owner</p>
              <p style={{ color: textPrimary(isDark) }}>
                {tenant.owner.name || '—'} · {tenant.owner.email}
              </p>
              <p style={{ color: textSecondary(isDark) }}>{tenant.boardCount} boards</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#000' : '#fff' }}
                onClick={() => void impersonate()}
              >
                Impersonate owner (read-only)
              </button>
              {(
                [
                  { label: '+3 bonus days', body: { action: 'add_bonus_days', bonusDays: 3 } },
                  { label: '+2 bonus days', body: { action: 'add_bonus_days', bonusDays: 2 } },
                  { label: 'Force PRO', body: { action: 'force_plan', planTier: 'PRO', seats: 10 } },
                  { label: 'Force ENTERPRISE', body: { action: 'force_plan', planTier: 'ENTERPRISE', seats: 25 } },
                  { label: '+5GB storage', body: { action: 'add_storage', extraStorageMb: 5120 } },
                  { label: 'Reset extra storage', body: { action: 'reset_storage_extra' } },
                  { label: 'Suspend', body: { action: 'suspend' } },
                  { label: 'Unsuspend', body: { action: 'unsuspend' } },
                  { label: 'Create IT dept', body: { action: 'create_department', deptKey: 'it', deptName: 'IT' } },
                  { label: 'Purge company', body: { action: 'purge_company' }, danger: true },
                ] as const
              ).map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    border: `1px solid ${'danger' in a && a.danger ? '#ef4444' : borderSubtle(isDark)}`,
                    color: 'danger' in a && a.danger ? '#ef4444' : textPrimary(isDark),
                  }}
                  onClick={async () => {
                    if ('danger' in a && a.danger && !confirm('Mark this company for deletion?')) return;
                    const res = await fetch(`/api/superadmin/tenants/${id}/actions`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(a.body),
                    });
                    const json = await res.json();
                    setMsg(res.ok ? `${a.label} ok` : json.error || 'Failed');
                    await load();
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </SuperAdminShell>
  );
}
