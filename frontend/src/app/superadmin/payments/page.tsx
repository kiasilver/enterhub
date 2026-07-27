'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { SuperAdminShell } from '@/components/superadmin/SuperAdminShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textMuted, textPrimary, textSecondary, surfaceItem, borderSubtle } from '@/components/SafeDashboard/theme';

export default function PaymentsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [cards, setCards] = useState<
    { id: string; holderName: string; bankName: string; cardNumber: string; last4: string; isActive: boolean }[]
  >([]);
  const [form, setForm] = useState({ holderName: '', bankName: '', cardNumber: '', iban: '' });
  const [c2cOn, setC2cOn] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cRes, sRes] = await Promise.all([
      fetch('/api/superadmin/payments/cards'),
      fetch('/api/superadmin/settings'),
    ]);
    const cJson = await cRes.json();
    const sJson = await sRes.json();
    if (cRes.ok) setCards(cJson.data || []);
    if (sRes.ok) {
      const m = (sJson.data?.methods || []).find((x: { kind: string }) => x.kind === 'C2C');
      setC2cOn(m ? m.enabled : true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCard(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/superadmin/payments/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      setMsg('Failed to add card');
      return;
    }
    setForm({ holderName: '', bankName: '', cardNumber: '', iban: '' });
    setMsg('Card added');
    await load();
  }

  async function removeCard(id: string) {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/superadmin/payments/cards/${id}`, { method: 'DELETE' });
    await load();
  }

  async function toggleC2c(enabled: boolean) {
    await fetch('/api/superadmin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c2cEnabled: enabled }),
    });
    setC2cOn(enabled);
  }

  const field = {
    background: 'transparent',
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  return (
    <SuperAdminShell>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            Payments
          </h1>
          <p className="text-sm" style={{ color: textMuted(isDark) }}>
            C2C bank cards and gateways.{' '}
            <Link href="/superadmin/payments/c2c" className="underline">
              Open C2C queue
            </Link>
          </p>
        </div>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: textPrimary(isDark) }}>
              Card-to-card (C2C)
            </h2>
            <label className="text-sm flex items-center gap-2" style={{ color: textSecondary(isDark) }}>
              <input type="checkbox" checked={c2cOn} onChange={(e) => void toggleC2c(e.target.checked)} />
              Enabled
            </label>
          </div>
          <p className="text-xs" style={{ color: textMuted(isDark) }}>
            Zarinpal merchant id is configured under Settings (checkout stub for later).
          </p>
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
          <h2 className="font-semibold" style={{ color: textPrimary(isDark) }}>
            Bank cards
          </h2>
          <form onSubmit={(e) => void addCard(e)} className="grid sm:grid-cols-2 gap-2">
            <input required placeholder="Holder name" value={form.holderName} onChange={(e) => setForm({ ...form, holderName: e.target.value })} className="rounded-xl px-3 py-2 text-sm outline-none" style={field} />
            <input required placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="rounded-xl px-3 py-2 text-sm outline-none" style={field} />
            <input required placeholder="Card number" value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} className="rounded-xl px-3 py-2 text-sm outline-none" style={field} />
            <input placeholder="IBAN (optional)" value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} className="rounded-xl px-3 py-2 text-sm outline-none" style={field} />
            <button type="submit" className="sm:col-span-2 rounded-xl py-2.5 text-sm font-bold text-white bg-blue-600">
              Add card
            </button>
          </form>
          {msg && <p className="text-xs" style={{ color: '#22c55e' }}>{msg}</p>}
          <ul className="space-y-2">
            {cards.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 text-sm rounded-xl px-3 py-2" style={{ border: `1px solid ${borderSubtle(isDark)}` }}>
                <span style={{ color: textPrimary(isDark) }}>
                  {c.bankName} · {c.holderName}
                  <span className="block text-xs font-mono" style={{ color: textMuted(isDark) }}>
                    {c.cardNumber} {c.isActive ? '' : '(inactive)'}
                  </span>
                </span>
                <button type="button" onClick={() => void removeCard(c.id)} className="text-xs text-red-500 font-semibold">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SuperAdminShell>
  );
}
