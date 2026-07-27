'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, CreditCard, Plus, Download, CheckCircle, ArrowUpRight, Calendar } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import SafeAccountShell, { accountFadeUp, iconTile, getIconColors } from './SafeAccountShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props { isDark: boolean; setActivePage: (id: string) => void; }

const ACCENT = 'var(--primary)';
const DANGER = '#ef4444';
const SUCCESS = '#10b981';

interface UsageBar { label: string; used: number; total: number; unit: string; }
interface Invoice { id: string; date: string; amount: string; status: 'Paid'; }

const USAGE: UsageBar[] = [
  { label: 'Seats', used: 12, total: 20, unit: '' },
  { label: 'Storage', used: 64, total: 100, unit: 'GB' },
];

const INVOICES: Invoice[] = [
  { id: 'INV-2026-004', date: 'Mar 12, 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2026-003', date: 'Feb 12, 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2026-002', date: 'Jan 12, 2026', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-012', date: 'Dec 12, 2025', amount: '$29.00', status: 'Paid' },
  { id: 'INV-2025-011', date: 'Nov 12, 2025', amount: '$29.00', status: 'Paid' },
];

export default function SafeAccountBilling({ isDark, setActivePage }: Props) {
  const { primaryColor } = useTheme();
  const ICON_COLORS = getIconColors(primaryColor);
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [downloaded, setDownloaded] = useState<string[]>([]);

  return (
    <SafeAccountShell isDark={isDark} active="account-billing" setActivePage={setActivePage}>

      {/* 1) Current plan */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="relative rounded-3xl p-6 overflow-hidden">
        {/* subtle accent top hairline */}
        <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${ACCENT}, rgba(var(--primary-rgb), 0))` }} />

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={iconTile(ICON_COLORS[0])}>
              <Crown size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold" style={{ color: pri }}>PRO Plan</h3>
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `rgba(var(--primary-rgb), 0.1)`, color: ACCENT, border: `1px solid rgba(var(--primary-rgb), 0.25)` }}
                >
                  Current
                </span>
              </div>
              <p className="text-[12.5px] mt-1" style={{ color: sec }}>
                <span className="font-semibold" style={{ color: pri }}>$29</span> / month, billed monthly
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[11px]" style={{ color: mut }}>
                <Calendar size={12} />
                <span>Renews on April 12, 2026</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2.5">
            <UpgradeButton />
            <CancelLink />
          </div>
        </div>

        {/* usage bars */}
        <div className="mt-6 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderTop: `1px solid ${border}` }}>
          {USAGE.map((u) => {
            const pct = Math.min(100, Math.round((u.used / u.total) * 100));
            return (
              <div key={u.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: mut }}>{u.label}</span>
                  <span className="text-[12.5px] font-semibold" style={{ color: sec }}>
                    {u.used}{u.unit} <span style={{ color: mut }}>/ {u.total}{u.unit}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: ACCENT }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 24, delay: 0.15 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 2) Payment method */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold" style={{ color: pri }}>Payment Method</h3>
          <AddMethodButton />
        </div>

        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-4"
          style={{ background: bg, border: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={iconTile(ICON_COLORS[1])}>
              <CreditCard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold" style={{ color: pri }}>Visa ending in 4242</span>
                <span
                  className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `rgba(var(--primary-rgb), 0.1)`, color: ACCENT, border: `1px solid rgba(var(--primary-rgb), 0.25)` }}
                >
                  Default
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: mut }}>Expires 08/27 &middot; Ali Mohammadi</p>
            </div>
          </div>
          <UpdateButton />
        </div>
      </motion.div>

      {/* 3) Billing history */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold" style={{ color: pri }}>Billing History</h3>
          <span className="text-[11px]" style={{ color: mut }}>{INVOICES.length} invoices</span>
        </div>

        {/* header row */}
        <div
          className="hidden sm:grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] gap-4 px-3 pb-2.5 mb-1"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          {['Invoice', 'Date', 'Amount', 'Status', ''].map((h, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-wider" style={{ color: mut }}>{h}</span>
          ))}
        </div>

        <div className="space-y-1">
          {INVOICES.map((inv) => {
            const isDone = downloaded.includes(inv.id);
            return (
              <div
                key={inv.id}
                className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto] gap-x-4 gap-y-1.5 items-center rounded-xl px-3 py-3 transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: pri }}>{inv.id}</span>
                <span className="text-[12.5px] tabular-nums" style={{ color: sec }}>{inv.date}</span>
                <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: pri }}>{inv.amount}</span>
                <span>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${SUCCESS}1a`, color: SUCCESS, border: `1px solid ${SUCCESS}40` }}
                  >
                    <CheckCircle size={11} /> {inv.status}
                  </span>
                </span>
                <div className="col-span-2 sm:col-span-1 flex sm:justify-end">
                  <DownloadButton done={isDone} onClick={() => setDownloaded((d) => d.includes(inv.id) ? d : [...d, inv.id])} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </SafeAccountShell>
  );
}

/* ---------- Buttons (outline style, self-contained) ---------- */

function UpgradeButton() {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold rounded-xl px-4 py-2 transition-colors"
      style={{ background: hover ? `rgba(var(--primary-rgb), 0.08)` : 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ArrowUpRight size={15} /> Upgrade plan
    </button>
  );
}

function CancelLink() {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className="text-[11px] font-semibold transition-colors"
      style={{ color: hover ? DANGER : `${DANGER}cc`, textDecoration: hover ? 'underline' : 'none' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      Cancel subscription
    </button>
  );
}

function AddMethodButton() {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 text-[12px] font-semibold rounded-xl px-3 py-1.5 transition-colors"
      style={{ background: hover ? `rgba(var(--primary-rgb), 0.08)` : 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Plus size={15} /> Add method
    </button>
  );
}

function UpdateButton() {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center text-[12px] font-semibold rounded-xl px-4 py-1.5 transition-colors flex-shrink-0"
      style={{ background: hover ? `rgba(var(--primary-rgb), 0.08)` : 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      Update
    </button>
  );
}

function DownloadButton({ done, onClick }: { done: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Download invoice"
      className="inline-flex items-center justify-center gap-1.5 text-[11.5px] font-semibold rounded-lg w-8 h-8 sm:w-auto sm:px-3 sm:h-8 transition-colors"
      style={{ background: hover ? `rgba(var(--primary-rgb), 0.08)` : 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {done ? <CheckCircle size={15} /> : <Download size={15} />}
      <span className="hidden sm:inline">{done ? 'Saved' : 'Download'}</span>
    </button>
  );
}
