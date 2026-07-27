'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, borderSubtle, panelFill } from '../theme';
import GlassButton from '../GlassButton';

interface CheckoutViewProps {
  isDark: boolean;
}

export default function CheckoutView({ isDark }: CheckoutViewProps) {
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [address, setAddress] = useState('');

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !card.trim() || !address.trim()) return;

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setName('');
      setCard('');
      setExpiry('');
      setCvv('');
      setAddress('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Checkout</h2>
        <p className="text-xs" style={{ color: sec }}>Secure billing portal for Enterhub Safety equipment purchases</p>
      </div>

      <div className="p-6 rounded-2xl border" style={{ background: bg, borderColor: border }}>
        {success ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-sm font-bold" style={{ color: pri }}>Payment Processing Succeeded</h3>
            <p className="text-xs" style={{ color: sec }}>Receipt and shipping codes will be dispatched to your account.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: sec }}>Payment Details</h4>
            
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Cardholder Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ali Mohammadi"
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                style={{ borderColor: borderSubtle(isDark), color: pri }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Card Number</label>
              <input
                type="text"
                required
                value={card}
                onChange={e => setCard(e.target.value)}
                placeholder="0000 0000 0000 0000"
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                style={{ borderColor: borderSubtle(isDark), color: pri }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Expiration Date</label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{ borderColor: borderSubtle(isDark), color: pri }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>CVV</label>
                <input
                  type="text"
                  required
                  value={cvv}
                  onChange={e => setCvv(e.target.value)}
                  placeholder="000"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{ borderColor: borderSubtle(isDark), color: pri }}
                />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: borderSubtle(isDark) }}>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: sec }}>Billing Address</h4>
              <div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street Address, Suite, City..."
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{ borderColor: borderSubtle(isDark), color: pri }}
                />
              </div>
            </div>

            <div className="pt-2">
              <GlassButton type="submit" className="w-full py-2.5">
                Place Order
              </GlassButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
