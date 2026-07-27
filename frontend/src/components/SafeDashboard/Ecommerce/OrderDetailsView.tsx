'use client';

import { textPrimary, textSecondary, textMuted, borderSubtle, panelFill } from '../theme';

interface OrderDetailsViewProps {
  isDark: boolean;
}

export default function OrderDetailsView({ isDark }: OrderDetailsViewProps) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const steps = [
    { title: 'Processing', date: 'Jun 17, 2026', done: true },
    { title: 'Shipped', date: 'Jun 18, 2026', done: true },
    { title: 'In Transit', date: 'Jun 19, 2026', done: false },
    { title: 'Delivered', date: 'Est: Jun 20, 2026', done: false },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Order Details</h2>
        <p className="text-xs" style={{ color: sec }}>Detailed invoice statements and shipping progress trackers</p>
      </div>

      {/* Invoice Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Columns: Invoice Items */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl border space-y-6" style={{ background: bg, borderColor: border }}>
          <div className="flex flex-wrap justify-between items-start gap-2 border-b pb-4" style={{ borderColor: borderSubtle(isDark) }}>
            <div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Receipt</span>
              <h3 className="text-base font-bold mt-0.5" style={{ color: pri }}>Order ID: #ORD-8922</h3>
              <p className="text-xs mt-0.5" style={{ color: mut }}>Date: June 17, 2026</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              Shipped
            </span>
          </div>

          {/* Stepper progress — vertical timeline on mobile, horizontal on sm+ */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-2 py-2">
            {steps.map((step, idx) => (
              <div key={step.title} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-0 sm:text-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10"
                  style={{
                    background: step.done ? '#10b981' : isDark ? '#222' : '#eee',
                    color: step.done ? '#fff' : sec,
                    border: `1px solid ${step.done ? '#10b981' : borderSubtle(isDark)}`,
                  }}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <div className="min-w-0 sm:mt-2">
                  <span className="text-[13px] sm:text-[10px] font-bold block" style={{ color: pri }}>{step.title}</span>
                  <span className="text-[11px] sm:text-[8px] block" style={{ color: mut }}>{step.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Product Items list */}
          <div className="border-t pt-4" style={{ borderColor: borderSubtle(isDark) }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: sec }}>Product Items</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl border" style={{ borderColor: borderSubtle(isDark) }}>
                <div>
                  <h5 className="text-xs font-bold" style={{ color: pri }}>Industrial Fire Extinguisher</h5>
                  <p className="text-[10px]" style={{ color: mut }}>NFPA 10 compliance standard</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block" style={{ color: pri }}>$155.00 x 2</span>
                  <span className="text-xs font-black block text-primary" style={{ color: 'var(--primary)' }}>$310.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Info Summary */}
        <div className="p-4 sm:p-6 rounded-2xl border space-y-5" style={{ background: bg, borderColor: border }}>
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Client Information</h4>
          <div className="space-y-1 text-xs">
            <span className="block font-bold" style={{ color: pri }}>Sarah Jenkins</span>
            <span className="block" style={{ color: sec }}>Safety Compliance Lead</span>
            <span className="block" style={{ color: mut }}>s.jenkins@safetydrill.co</span>
          </div>

          <div className="border-t pt-3" style={{ borderColor: borderSubtle(isDark) }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: sec }}>Shipping Address</h4>
            <address className="not-italic text-xs leading-relaxed" style={{ color: sec }}>
              DrillTech Solutions HQ<br />
              100 Industrial Pkwy, Suite B<br />
              Houston, TX 77001, USA
            </address>
          </div>

          <div className="border-t pt-3 space-y-2" style={{ borderColor: borderSubtle(isDark) }}>
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Payment Details</h4>
            <div className="flex justify-between text-xs">
              <span style={{ color: sec }}>Method:</span>
              <span className="font-bold" style={{ color: pri }}>PayPal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: sec }}>Shipping:</span>
              <span className="font-bold" style={{ color: pri }}>Free (Ground)</span>
            </div>
            <div className="flex justify-between text-xs border-t pt-2 mt-1" style={{ borderColor: borderSubtle(isDark) }}>
              <span className="font-bold" style={{ color: pri }}>Total Amount:</span>
              <span className="font-black text-primary" style={{ color: 'var(--primary)' }}>$310.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
