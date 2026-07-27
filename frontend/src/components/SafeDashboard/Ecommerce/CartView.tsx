'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, textMuted, borderSubtle, panelFill } from '../theme';
import GlassButton from '../GlassButton';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageColor: string;
}

const INITIAL_CART: CartItem[] = [
  { id: 'PROD-001', name: 'Premium Safety Helmet', price: 49.99, qty: 5, imageColor: 'from-amber-400 to-orange-500' },
  { id: 'PROD-002', name: 'Industrial Fire Extinguisher', price: 85.00, qty: 2, imageColor: 'from-red-500 to-rose-600' },
];

interface CartViewProps {
  isDark: boolean;
}

export default function CartView({ isDark }: CartViewProps) {
  const [cart, setCart] = useState<CartItem[]>(INITIAL_CART);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Shopping Cart</h2>
        <p className="text-xs" style={{ color: sec }}>Configure and purchase protective equipment and sensor nodes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border text-xs" style={{ background: bg, borderColor: border, color: mut }}>
              Your shopping cart is empty
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border flex flex-wrap justify-between items-center gap-4"
                style={{ background: bg, borderColor: border }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.imageColor} rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold`} />
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: pri }}>{item.name}</h4>
                    <span className="text-[10px] block" style={{ color: mut }}>${item.price.toFixed(2)} each</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Quantity adjustment */}
                  <div className="flex items-center rounded-xl border border-dashed p-1" style={{ borderColor: borderSubtle(isDark) }}>
                    <button onClick={() => updateQty(item.id, -1)} className="px-2 font-bold cursor-pointer" style={{ color: pri }}>-</button>
                    <span className="px-2 text-xs font-bold" style={{ color: pri }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="px-2 font-bold cursor-pointer" style={{ color: pri }}>+</button>
                  </div>

                  {/* Total price */}
                  <span className="text-xs font-bold text-primary" style={{ color: 'var(--primary)' }}>${(item.price * item.qty).toFixed(2)}</span>

                  {/* Remove button */}
                  <button onClick={() => removeItem(item.id)} className="text-xs hover:text-red-500 font-bold cursor-pointer" style={{ color: mut }}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Card */}
        {cart.length > 0 && (
          <div className="p-6 rounded-2xl border space-y-4 h-fit" style={{ background: bg, borderColor: border }}>
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>Order Summary</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span style={{ color: sec }}>Subtotal:</span>
                <span className="font-bold" style={{ color: pri }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: sec }}>Sales Tax (8%):</span>
                <span className="font-bold" style={{ color: pri }}>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2.5" style={{ borderColor: borderSubtle(isDark) }}>
                <span className="font-bold text-sm" style={{ color: pri }}>Total Amount:</span>
                <span className="font-black text-primary text-sm" style={{ color: 'var(--primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <GlassButton className="w-full">
                Proceed to Checkout
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
