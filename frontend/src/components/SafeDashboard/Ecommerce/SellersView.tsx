'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from '../theme';

interface Seller {
  id: string;
  name: string;
  storeName: string;
  rating: number;
  activeListings: number;
  revenue: number;
}

const INITIAL_SELLERS: Seller[] = [
  { id: 'SEL-401', name: 'Alireza Karimi', storeName: 'Karimi PPE Supply', rating: 4.8, activeListings: 120, revenue: 154000 },
  { id: 'SEL-402', name: 'John Jenkins', storeName: 'Texas Drill & Guard', rating: 4.6, activeListings: 45, revenue: 87500 },
  { id: 'SEL-403', name: 'Zahra Sadri', storeName: 'Tehran Fire Equipment', rating: 4.9, activeListings: 85, revenue: 215000 },
];

interface SellersViewProps {
  isDark: boolean;
}

export default function SellersView({ isDark }: SellersViewProps) {
  const [sellers] = useState<Seller[]>(INITIAL_SELLERS);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Sellers</h2>
        <p className="text-xs" style={{ color: sec }}>Safety equipment vendors and approved contractors directory</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sellers.map(seller => (
          <div
            key={seller.id}
            className="p-5 rounded-2xl border flex flex-col justify-between min-h-[180px] transition-all hover:-translate-y-0.5"
            style={{ background: bg, borderColor: border }}
          >
            <div>
              <span className="text-[9px] font-bold" style={{ color: mut }}>{seller.id}</span>
              <h4 className="text-sm font-bold mt-1.5" style={{ color: pri }}>{seller.storeName}</h4>
              <p className="text-[10px] mt-0.5" style={{ color: sec }}>Owner: {seller.name}</p>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-between items-center" style={{ borderColor: borderSubtle(isDark) }}>
              <div>
                <span className="text-[9px] block" style={{ color: mut }}>Revenue volume</span>
                <span className="text-xs font-black block text-primary" style={{ color: 'var(--primary)' }}>${seller.revenue.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold block" style={{ color: pri }}>★ {seller.rating} rating</span>
                <span className="text-[9px]" style={{ color: mut }}>{seller.activeListings} items</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
