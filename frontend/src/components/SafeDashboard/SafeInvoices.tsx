'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Invoice {
  id: string;
  vendorName: string;
  vendorEmail: string;
  vendorLogo: string; // initials
  amount: number;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  items: InvoiceItem[];
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-081',
    vendorName: 'Apex Safety Consulting',
    vendorEmail: 'billing@apexsafety.com',
    vendorLogo: 'AS',
    amount: 4500.00,
    date: '2026-06-12',
    dueDate: '2026-07-12',
    status: 'pending',
    items: [
      { description: 'OSHA Compliance Readiness Consulting', quantity: 1, unitPrice: 3500.00 },
      { description: 'Plant 1 Pre-Audit Site Survey', quantity: 1, unitPrice: 1000.00 },
    ],
  },
  {
    id: 'INV-2026-078',
    vendorName: 'GuardWare Gear Corp',
    vendorEmail: 'finance@guardware.io',
    vendorLogo: 'GW',
    amount: 12500.00,
    date: '2026-06-05',
    dueDate: '2026-07-05',
    status: 'paid',
    items: [
      { description: 'Fire Retardant Coveralls (Zone A Operators)', quantity: 100, unitPrice: 95.00 },
      { description: 'Heavy Duty Thermal Gloves', quantity: 150, unitPrice: 20.00 },
    ],
  },
  {
    id: 'INV-2026-092',
    vendorName: 'ThermoLogix Sensors',
    vendorEmail: 'accounts@thermologix.net',
    vendorLogo: 'TL',
    amount: 8200.00,
    date: '2026-05-18',
    dueDate: '2026-06-18',
    status: 'overdue',
    items: [
      { description: 'Intrinsically Safe Thermal Sensor Nodes', quantity: 10, unitPrice: 650.00 },
      { description: 'Calibration Hardware Hook & Bracket', quantity: 10, unitPrice: 170.00 },
    ],
  },
  {
    id: 'INV-2026-071',
    vendorName: 'FirstAid Logistics',
    vendorEmail: 'orders@firstaidlog.com',
    vendorLogo: 'FL',
    amount: 1450.00,
    date: '2026-06-01',
    dueDate: '2026-07-01',
    status: 'paid',
    items: [
      { description: 'AED Replacement Battery Packs', quantity: 5, unitPrice: 180.00 },
      { description: 'AED Pediatric Electrode Pads', quantity: 10, unitPrice: 55.00 },
    ],
  },
  {
    id: 'INV-2026-085',
    vendorName: 'Zone B Chemical Co.',
    vendorEmail: 'sales@zonebchem.com',
    vendorLogo: 'ZC',
    amount: 920.00,
    date: '2026-06-18',
    dueDate: '2026-07-18',
    status: 'pending',
    items: [
      { description: 'Acid Absorbent Sponges & Sock Kits', quantity: 15, unitPrice: 48.00 },
      { description: 'Secondary Containment Chemical Shelf Tag', quantity: 4, unitPrice: 50.00 },
    ],
  },
];

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  overdue: { label: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

// SVG icons
const IconCreditCard = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconFileText = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function SafeInvoices({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';

  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [selectedId, setSelectedId] = useState<string>('INV-2026-081');
  const [statusFilter, setStatusFilter] = useState('all');

  // Simulated Paying State
  const [isPaying, setIsPaying] = useState(false);

  // Simulated background activity: adding new invoices & paying pending/overdue invoices
  useEffect(() => {
    const timer = setInterval(() => {
      const r = Math.random();
      if (r < 0.6) {
        // Spawn a new pending invoice
        const mockVendors = [
          {
            name: 'EcoSafe Disposal Services',
            email: 'billing@ecosafedisposal.com',
            logo: 'ED',
            items: [
              { description: 'Hazardous Waste Transport & Incineration', quantity: 1, unitPrice: 2800.00 },
              { description: 'Secondary Storage Barrel Lock tags', quantity: 20, unitPrice: 15.00 },
            ]
          },
          {
            name: 'SecureLock Systems',
            email: 'accounts@securelock.net',
            logo: 'SL',
            items: [
              { description: 'Zone C LOTO Heavy Duty Lockout Station', quantity: 2, unitPrice: 420.00 },
              { description: 'Safety Nylon Padlocks & Cable Tags', quantity: 30, unitPrice: 12.00 },
            ]
          },
          {
            name: 'VentilAir Supply',
            email: 'sales@ventilairsupply.com',
            logo: 'VS',
            items: [
              { description: 'Replacement Emergency HEPA Carbon Filters', quantity: 8, unitPrice: 320.00 },
              { description: 'Airflow Calibration Intake Seal', quantity: 4, unitPrice: 65.00 },
            ]
          },
          {
            name: 'FireShield System Co.',
            email: 'receivables@fireshield.io',
            logo: 'FS',
            items: [
              { description: 'Zone B Sprinkler Pressure Gauge Flush', quantity: 1, unitPrice: 1450.00 },
              { description: 'CO2 Pressure Cylinder Refills (10lb)', quantity: 15, unitPrice: 90.00 },
            ]
          }
        ];

        const selectedVendor = mockVendors[Math.floor(Math.random() * mockVendors.length)];
        const invoiceAmount = selectedVendor.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const invId = `INV-2026-${Math.floor(Math.random() * 900 + 100)}`;
        
        const newInvoice: Invoice = {
          id: invId,
          vendorName: selectedVendor.name,
          vendorEmail: selectedVendor.email,
          vendorLogo: selectedVendor.logo,
          amount: invoiceAmount,
          date: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
          status: 'pending',
          items: selectedVendor.items,
        };

        setInvoices(prev => {
          if (prev.some(inv => inv.vendorName === newInvoice.vendorName && inv.amount === newInvoice.amount)) return prev;
          return [newInvoice, ...prev];
        });

      } else {
        // Auto pay a random pending or overdue invoice
        setInvoices(prev => {
          const active = prev.filter(inv => inv.status !== 'paid');
          if (active.length === 0) return prev;
          const target = active[Math.floor(Math.random() * active.length)];
          return prev.map(inv => inv.id === target.id ? { ...inv, status: 'paid' as 'paid' | 'pending' | 'overdue' } : inv);
        });
      }
    }, 30000); // simulation runs every 30 seconds

    return () => clearInterval(timer);
  }, []);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => statusFilter === 'all' || inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const activeInvoice = useMemo(() => {
    return invoices.find(inv => inv.id === selectedId) || invoices[0];
  }, [invoices, selectedId]);

  const stats = useMemo(() => {
    let paidTotal = 0;
    let pendingTotal = 0;
    let overdueTotal = 0;
    invoices.forEach(inv => {
      if (inv.status === 'paid') paidTotal += inv.amount;
      else if (inv.status === 'pending') pendingTotal += inv.amount;
      else if (inv.status === 'overdue') overdueTotal += inv.amount;
    });
    return { paidTotal, pendingTotal, overdueTotal, grandTotal: paidTotal + pendingTotal + overdueTotal };
  }, [invoices]);

  const handlePayInvoice = (id: string) => {
    setIsPaying(true);
    setTimeout(() => {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
      setIsPaying(false);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col h-full relative">
      
      {/* ─── Top Dashboard Header Widgets ─── */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0 border-b" style={{ borderColor: borderCol }}>
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Invoices
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Procurement & Billing
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            isDark={isDark}
            className="w-44"
          />
        </div>
      </div>

      {/* ─── Summary Cards Bar ─── */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-5 border-b" style={{ borderColor: borderCol }}>
        <div className="rounded-[18px] p-4 flex flex-col justify-between h-[100px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: sec }}>Total Invoiced</span>
          <span className="text-2xl font-black mt-1" style={{ color: pri }}>${stats.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="rounded-[18px] p-4 flex flex-col justify-between h-[100px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: sec }}>Total Paid</span>
          <span className="text-2xl font-black mt-1 text-emerald-500">${stats.paidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="rounded-[18px] p-4 flex flex-col justify-between h-[100px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: sec }}>Total Pending</span>
          <span className="text-2xl font-black mt-1 text-yellow-500">${stats.pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="rounded-[18px] p-4 flex flex-col justify-between h-[100px] transition-colors" style={{ background: bg, border: `1px solid ${borderCol}` }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: sec }}>Overdue Balances</span>
          <span className="text-2xl font-black mt-1 text-red-500">${stats.overdueTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* ─── Split Screen Layout ─── */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">

        {/* Left Side: List Table */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r flex flex-col lg:overflow-y-auto" style={{ borderColor: borderCol, scrollbarWidth: 'none' }}>
          {filteredInvoices.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <span className="text-2xl mb-2">🧾</span>
              <p className="text-sm font-semibold" style={{ color: sec }}>No invoices match this status</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: borderCol }}>
              <AnimatePresence initial={false} mode="popLayout">
                {filteredInvoices.map(inv => {
                  const isSelected = inv.id === selectedId;
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
                  return (
                    <motion.div
                      key={inv.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      onClick={() => setSelectedId(inv.id)}
                      className="p-4 cursor-pointer transition-all hover:bg-gray-500/5 select-none flex items-center justify-between gap-3 relative"
                      style={{
                        background: isSelected ? (isDark ? 'rgba(var(--primary-rgb),0.1)' : 'rgba(var(--primary-rgb),0.05)') : 'transparent',
                      }}
                    >
                      {/* Selected Indicator Bar */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]" />
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border text-xs font-bold flex items-center justify-center shrink-0" style={{ borderColor: borderCol, color: pri }}>
                          {inv.vendorLogo}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold truncate" style={{ color: pri }}>{inv.vendorName}</h4>
                          <span className="text-[11px] mt-0.5 block font-mono" style={{ color: mut }}>{inv.id}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black" style={{ color: pri }}>${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded mt-1.5 inline-block"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Reader */}
        <div className="w-full lg:w-1/2 lg:overflow-y-auto p-4 sm:p-6" style={{ scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">
            {!activeInvoice ? (
              <div className="h-full flex items-center justify-center text-sm" style={{ color: mut }}>
                Select an invoice row to view itemized logs
              </div>
            ) : (
              <motion.div
                key={activeInvoice.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-3 border-b pb-5" style={{ borderColor: borderCol }}>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold break-words" style={{ color: pri }}>{activeInvoice.vendorName}</h3>
                    <p className="text-xs break-words" style={{ color: mut }}>{activeInvoice.vendorEmail}</p>
                    <span className="text-xs mt-2 block font-mono font-bold" style={{ color: pri }}>{activeInvoice.id}</span>
                  </div>

                  <span
                    className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0"
                    style={{
                      backgroundColor: STATUS_CONFIG[activeInvoice.status].bg,
                      color: STATUS_CONFIG[activeInvoice.status].color,
                    }}
                  >
                    {activeInvoice.status}
                  </span>
                </div>

                {/* Billing dates */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: mut }}>Billing Date</p>
                    <p className="mt-1 font-semibold" style={{ color: pri }}>{activeInvoice.date}</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-widest text-[10px]" style={{ color: mut }}>Payment Due</p>
                    <p className="mt-1 font-semibold" style={{ color: pri }}>{activeInvoice.dueDate}</p>
                  </div>
                </div>

                {/* Items log breakdown */}
                <div className="space-y-3.5">
                  <p className="font-bold uppercase tracking-widest text-[10px] pb-1 border-b" style={{ borderColor: borderCol, color: mut }}>Itemized Cost Breakdown</p>
                  {activeInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-3 text-xs p-3 rounded-lg border bg-black/5" style={{ borderColor: borderCol }}>
                      <div className="min-w-0">
                        <p className="font-semibold break-words" style={{ color: pri }}>{item.description}</p>
                        <p className="mt-0.5" style={{ color: mut }}>Qty: {item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <span className="font-bold whitespace-nowrap shrink-0" style={{ color: pri }}>${(item.quantity * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>

                {/* Billing Summary */}
                <div className="p-4 rounded-xl space-y-2 text-xs" style={{ background: surfaceItem(isDark), border: `1px solid ${borderCol}` }}>
                  <div className="flex justify-between">
                    <span style={{ color: sec }}>Subtotal</span>
                    <span className="font-semibold" style={{ color: pri }}>${activeInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: sec }}>Taxes & Handling</span>
                    <span className="font-semibold" style={{ color: pri }}>$0.00</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-1 font-bold text-sm" style={{ borderColor: borderCol }}>
                    <span style={{ color: pri }}>Total Bill</span>
                    <span style={{ color: pri }}>${activeInvoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Simulated Payment actions */}
                <div className="flex flex-wrap justify-end gap-3 pt-3">
                  <GlassButton type="button" style={{ padding: '8px 16px', borderRadius: '10px' }}>
                    <IconFileText /> Export PDF
                  </GlassButton>

                  {activeInvoice.status !== 'paid' && (
                    <GlassButton
                      type="button"
                      disabled={isPaying}
                      onClick={() => handlePayInvoice(activeInvoice.id)}
                      style={{ padding: '8px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                    >
                      {isPaying ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-[#10b981] border-t-transparent animate-spin inline-block shrink-0" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <IconCreditCard /> Pay Invoice
                        </span>
                      )}
                    </GlassButton>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
