'use client';

import { useCallback, useEffect, useState } from 'react';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

type Row = {
  id: string;
  planTier: string;
  amount: number;
  currency: string;
  seats: number;
  billingCycle: string;
  status: string;
  planDays: number | null;
  createdAt: string;
  user: { name: string | null; email: string | null; phone: string | null };
  workspace: { id: string; name: string; slug: string };
  receipt: {
    receiptImageUrl: string;
    amountClaimed: number;
    paidAtClaimed: string | null;
    note: string | null;
    bankCard: { bankName: string; last4: string; holderName: string } | null;
  } | null;
};

export default function C2CQueuePage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('PENDING_REVIEW');
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/superadmin/payments/c2c?status=${status}`);
    const json = await res.json();
    if (res.ok) setRows(json.data || []);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusy(id);
    await fetch('/api/superadmin/payments/c2c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id, decision, reason: reason[id] }),
    });
    setBusy(null);
    await load();
  }

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
              C2C payment queue
            </h1>
            <p className="text-sm" style={{ color: textMuted(isDark) }}>
              Review receipts, amounts, plans, and approve or reject with a reason (Inbox + notification).
            </p>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm"
            style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, color: textPrimary(isDark) }}
          >
            {['PENDING_REVIEW', 'PENDING_RECEIPT', 'APPROVED', 'REJECTED', 'all'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl p-4 grid lg:grid-cols-[160px_1fr_220px] gap-4"
              style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
            >
              <div>
                {r.receipt?.receiptImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.receipt.receiptImageUrl}
                    alt="Receipt"
                    className="w-full h-36 object-cover rounded-xl"
                  />
                ) : (
                  <div className="h-36 rounded-xl flex items-center justify-center text-xs" style={{ color: textMuted(isDark), border: `1px dashed ${borderSubtle(isDark)}` }}>
                    No receipt
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm" style={{ color: textSecondary(isDark) }}>
                <p className="font-bold text-base" style={{ color: textPrimary(isDark) }}>
                  {r.workspace.name} · {r.planTier}
                </p>
                <p>
                  Buyer: {r.user.name || '—'} · {r.user.phone || r.user.email}
                </p>
                <p>
                  Amount: {r.amount.toLocaleString()} {r.currency} · seats {r.seats} · {r.billingCycle}
                  {r.planDays ? ` · ${r.planDays} days` : ''}
                </p>
                {r.receipt && (
                  <p>
                    Claimed {r.receipt.amountClaimed.toLocaleString()} · card{' '}
                    {r.receipt.bankCard
                      ? `${r.receipt.bankCard.bankName} …${r.receipt.bankCard.last4}`
                      : '—'}
                  </p>
                )}
                {r.receipt?.note && <p>Note: {r.receipt.note}</p>}
                <p className="text-xs" style={{ color: textMuted(isDark) }}>
                  {new Date(r.createdAt).toLocaleString()} · {r.status}
                </p>
              </div>
              <div className="space-y-2">
                {r.status === 'PENDING_REVIEW' && (
                  <>
                    <textarea
                      placeholder="Reject reason (sent to Inbox)"
                      value={reason[r.id] || ''}
                      onChange={(e) => setReason((p) => ({ ...p, [r.id]: e.target.value }))}
                      className="w-full rounded-xl px-2 py-2 text-xs outline-none min-h-[64px]"
                      style={{ background: 'transparent', border: `1px solid ${borderSubtle(isDark)}`, color: textPrimary(isDark) }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => void decide(r.id, 'approve')}
                        className="flex-1 rounded-xl py-2 text-xs font-bold text-white bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy === r.id}
                        onClick={() => void decide(r.id, 'reject')}
                        className="flex-1 rounded-xl py-2 text-xs font-bold text-white bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="text-sm py-10 text-center" style={{ color: textMuted(isDark) }}>
              No requests
            </p>
          )}
        </div>
      </div>
    </SuperAdminShell>
  );
}
