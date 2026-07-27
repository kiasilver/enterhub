'use client';

import { useState } from 'react';
import { textPrimary, textSecondary, borderSubtle, panelFill } from '../theme';
import GlassButton from '../GlassButton';
import CustomSelect from '../CustomSelect';

interface CreateProductViewProps {
  isDark: boolean;
}

export default function CreateProductView({ isDark }: CreateProductViewProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [category, setCategory] = useState('PPE Headwear');
  const [compliance, setCompliance] = useState('');
  const [success, setSuccess] = useState(false);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setName('');
      setPrice(0);
      setStock(0);
      setCompliance('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight" style={{ color: pri }}>Ecommerce / Create Product</h2>
        <p className="text-xs" style={{ color: sec }}>List and distribute new safety protective assets to the team catalog</p>
      </div>

      {/* Form Card */}
      <div className="p-6 rounded-2xl border" style={{ background: bg, borderColor: border }}>
        {success ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-sm font-bold" style={{ color: pri }}>Product Created</h3>
            <p className="text-xs" style={{ color: sec }}>Product has been published and added to active safety assets.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Product Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Arc Flash Protection Suit"
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                style={{ borderColor: borderSubtle(isDark), color: pri }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Category</label>
                <CustomSelect
                  value={category}
                  onChange={setCategory}
                  isDark={isDark}
                  options={[
                    { value: 'PPE Headwear', label: 'PPE Headwear' },
                    { value: 'Suppression', label: 'Suppression' },
                    { value: 'Medical Rescue', label: 'Medical Rescue' },
                    { value: 'Gas Monitoring', label: 'Gas Monitoring' },
                    { value: 'Fall Protection', label: 'Fall Protection' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Compliance Standard</label>
                <input
                  type="text"
                  required
                  value={compliance}
                  onChange={e => setCompliance(e.target.value)}
                  placeholder="e.g. NFPA 70E"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{ borderColor: borderSubtle(isDark), color: pri }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price || ''}
                  onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 199.99"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{ borderColor: borderSubtle(isDark), color: pri }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Initial Stock Level</label>
                <input
                  type="number"
                  required
                  value={stock || ''}
                  onChange={e => setStock(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none border focus:border-primary bg-transparent"
                  style={{ borderColor: borderSubtle(isDark), color: pri }}
                />
              </div>
            </div>

            <div className="pt-2">
              <GlassButton type="submit" className="w-full py-2.5">
                Publish Product
              </GlassButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
