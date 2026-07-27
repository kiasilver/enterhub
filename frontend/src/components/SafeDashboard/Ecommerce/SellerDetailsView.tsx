'use client';

import { textPrimary, textSecondary, textMuted, borderSubtle, panelFill } from '../theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface SellerDetailsViewProps {
  isDark: boolean;
}

export default function SellerDetailsView({ isDark }: SellerDetailsViewProps) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Seller Details</h2>
        <p className="text-xs" style={{ color: sec }}>Detailed stats, safety certifications, and catalog listings for sellers</p>
      </div>

      {/* Seller Spec Card */}
      <div className="p-6 rounded-2xl border space-y-6" style={{ background: bg, borderColor: border }}>
        <div className="flex justify-between items-start border-b pb-4" style={{ borderColor: borderSubtle(isDark) }}>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Approved HSE Supplier</span>
            <h3 className="text-base font-bold mt-0.5" style={{ color: pri }}>Tehran Fire Equipment</h3>
            <p className="text-xs mt-0.5" style={{ color: mut }}>Owner: Zahra Sadri</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            Gold Tier
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
          <div className="p-4 rounded-xl border" style={{ borderColor: borderSubtle(isDark) }}>
            <span className="text-[10px] uppercase font-bold" style={{ color: mut }}>Average Rating</span>
            <span className="text-xl font-black block mt-1" style={{ color: pri }}>★ 4.9</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ borderColor: borderSubtle(isDark) }}>
            <span className="text-[10px] uppercase font-bold" style={{ color: mut }}>Active Listings</span>
            <span className="text-xl font-black block mt-1" style={{ color: pri }}>85 items</span>
          </div>
          <div className="p-4 rounded-xl border" style={{ borderColor: borderSubtle(isDark) }}>
            <span className="text-[10px] uppercase font-bold" style={{ color: mut }}>All Time Volume</span>
            <span className="text-xl font-black block mt-1" style={{ color: primaryColor }}>$215,000</span>
          </div>
        </div>

        {/* Certifications and Compliance */}
        <div className="border-t pt-4 space-y-3" style={{ borderColor: borderSubtle(isDark) }}>
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Safety Certifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border" style={{ borderColor: borderSubtle(isDark) }}>
              <span className="font-bold block" style={{ color: pri }}>NFPA Compliance Provider</span>
              <span className="block mt-0.5" style={{ color: sec }}>Qualified to distribute industrial suppression systems.</span>
            </div>
            <div className="p-3 rounded-xl border" style={{ borderColor: borderSubtle(isDark) }}>
              <span className="font-bold block" style={{ color: pri }}>EN 361 Fall Protection Specialist</span>
              <span className="block mt-0.5" style={{ color: sec }}>Authorized vendor for standard fall arrest harnesses.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
