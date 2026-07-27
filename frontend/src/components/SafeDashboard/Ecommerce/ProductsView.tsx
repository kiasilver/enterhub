'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from '../theme';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  compliance: string;
  imageColor: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'PROD-001', name: 'Premium Safety Helmet', category: 'PPE Headwear', price: 49.99, stock: 120, rating: 4.8, compliance: 'ANSI Z89.1', imageColor: 'from-amber-400 to-orange-500' },
  { id: 'PROD-002', name: 'Industrial Fire Extinguisher', category: 'Suppression', price: 85.00, stock: 45, rating: 4.9, compliance: 'NFPA 10', imageColor: 'from-red-500 to-rose-600' },
  { id: 'PROD-003', name: 'Universal First Aid Kit', category: 'Medical Rescue', price: 39.50, stock: 89, rating: 4.7, compliance: 'OSHA 1910.151', imageColor: 'from-emerald-400 to-teal-500' },
  { id: 'PROD-004', name: 'Smart Gas Detector', category: 'Gas Monitoring', price: 299.00, stock: 15, rating: 4.9, compliance: 'ATEX Zone 0', imageColor: 'from-cyan-400 to-blue-500' },
  { id: 'PROD-005', name: 'Heavy Duty Safety Harness', category: 'Fall Protection', price: 120.00, stock: 30, rating: 4.6, compliance: 'EN 361', imageColor: 'from-purple-400 to-indigo-500' },
  { id: 'PROD-006', name: 'Anti-Fog Safety Goggles', category: 'PPE Eyewear', price: 15.99, stock: 250, rating: 4.5, compliance: 'ANSI Z87.1', imageColor: 'from-slate-400 to-slate-600' },
];

interface ProductsViewProps {
  isDark: boolean;
}

export default function ProductsView({ isDark }: ProductsViewProps) {
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Products</h2>
        <p className="text-xs" style={{ color: sec }}>Safety items, protective gear, and compliance sensor catalog</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map(product => (
          <div
            key={product.id}
            className="rounded-2xl border overflow-hidden flex flex-col justify-between min-h-[340px] transition-all hover:-translate-y-0.5"
            style={{ background: bg, borderColor: border }}
          >
            {/* Mock Image container */}
            <div className={`h-40 bg-gradient-to-br ${product.imageColor} relative flex items-center justify-center p-6 text-white`}>
              <span className="absolute top-3 left-3 text-[9px] font-black tracking-wider bg-black/35 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {product.compliance}
              </span>
              <span className="text-sm font-black uppercase text-center drop-shadow-md">
                {product.name}
              </span>
            </div>

            {/* Product description / info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mut }}>{product.category}</span>
                <h4 className="text-sm font-bold mt-1" style={{ color: pri }}>{product.name}</h4>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px]" style={{ color: sec }}>
                  <span className="flex items-center gap-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {product.rating}
                  </span>
                  <span>•</span>
                  <span>{product.stock} in stock</span>
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t flex justify-between items-center" style={{ borderColor: borderSubtle(isDark) }}>
                <span className="text-base font-black text-primary" style={{ color: 'var(--primary)' }}>${product.price.toFixed(2)}</span>
                <span className="text-[10px] font-bold px-3 py-1.5 rounded-xl border hover:bg-primary/10 cursor-pointer transition-colors active:scale-95" style={{ borderColor: borderSubtle(isDark), color: pri }}>
                  Add to Cart
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
