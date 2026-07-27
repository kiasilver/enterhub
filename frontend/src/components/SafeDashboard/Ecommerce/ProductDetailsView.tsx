'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from '../theme';
import GlassButton from '../GlassButton';

interface ProductDetailsViewProps {
  isDark: boolean;
}

export default function ProductDetailsView({ isDark }: ProductDetailsViewProps) {
  const [qty, setQty] = useState(1);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Product Details</h2>
        <p className="text-xs" style={{ color: sec }}>Deep spec sheet and safety compliance metrics for products</p>
      </div>

      {/* Product Spec Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 rounded-2xl border" style={{ background: bg, borderColor: border }}>
        {/* Left Column: Image placeholder */}
        <div className="h-[280px] bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl relative flex items-center justify-center p-6 text-white text-center">
          <span className="absolute top-3 left-3 text-[9px] font-black tracking-wider bg-black/35 px-2.5 py-1 rounded-full backdrop-blur-sm">
            ANSI Z89.1 Certified
          </span>
          <div>
            <h3 className="text-xl font-black drop-shadow-md">Premium Safety Helmet</h3>
            <p className="text-xs mt-1.5 drop-shadow-sm">Class E Protection (Non-conductive, 20,000V phase-to-ground)</p>
          </div>
        </div>

        {/* Right Column: Spec content */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mut }}>PPE Headwear</span>
              <h3 className="text-lg font-black mt-0.5" style={{ color: pri }}>Premium Safety Helmet</h3>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-yellow-500 font-bold">
                <span>★ 4.8 Rating</span>
                <span style={{ color: mut }}>•</span>
                <span style={{ color: '#10b981' }}>120 In Stock</span>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: sec }}>
              Constructed from high-density polyethylene (HDPE) shell. Designed with a custom 6-point suspension webbing system for top-grade impact absorption. Features universal accessory slots for ear protection, communication attachments, and visors.
            </p>

            <div className="space-y-2 border-t pt-3" style={{ borderColor: borderSubtle(isDark) }}>
              <div className="flex justify-between gap-3 text-xs">
                <span className="shrink-0" style={{ color: sec }}>Material:</span>
                <span className="font-bold text-right" style={{ color: pri }}>High-Density Polyethylene</span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="shrink-0" style={{ color: sec }}>Standard compliance:</span>
                <span className="font-bold text-primary text-right" style={{ color: 'var(--primary)' }}>ANSI Z89.1-2014, CSA Z94.1-15</span>
              </div>
              <div className="flex justify-between gap-3 text-xs">
                <span className="shrink-0" style={{ color: sec }}>Weight:</span>
                <span className="font-bold text-right" style={{ color: pri }}>390 grams</span>
              </div>
            </div>
          </div>

          {/* Pricing & Add to Cart */}
          <div className="mt-6 pt-4 border-t flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-0" style={{ borderColor: borderSubtle(isDark) }}>
            <div>
              <span className="text-[10px] block" style={{ color: mut }}>Unit Price</span>
              <span className="text-2xl font-black block text-primary" style={{ color: 'var(--primary)' }}>$49.99</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-dashed p-1" style={{ borderColor: borderSubtle(isDark) }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-2 font-bold cursor-pointer hover:text-primary" style={{ color: pri }}>-</button>
                <span className="px-2.5 text-xs font-bold" style={{ color: pri }}>{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-2 font-bold cursor-pointer hover:text-primary" style={{ color: pri }}>+</button>
              </div>
              <GlassButton>Add to Cart</GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
