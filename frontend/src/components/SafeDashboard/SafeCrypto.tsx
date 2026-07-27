'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface SafeCryptoProps {
  isDark: boolean;
}

interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  price: number;
  change24h: number;
  color: string;
}

interface Transaction {
  id: string;
  type: 'Buy' | 'Sell';
  asset: string;
  amount: number;
  value: number;
  date: string;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconWallet = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 4v16" />
    <path d="M2 10h20" />
  </svg>
);

const IconBtc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 8h6a2 2 0 0 1 0 4H8" />
    <path d="M8 12h7a2 2 0 0 1 0 4H8" />
    <line x1="10" y1="6" x2="10" y2="8" />
    <line x1="12" y1="6" x2="12" y2="8" />
    <line x1="10" y1="16" x2="10" y2="18" />
    <line x1="12" y1="16" x2="12" y2="18" />
  </svg>
);

const IconEth = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M12 2L4 11.5L12 16L20 11.5L12 2Z" />
    <path d="M12 16V22" />
    <path d="M4 11.5L12 22L20 11.5" />
  </svg>
);

const IconGas = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M3 22V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v20" />
    <path d="M7 2v4h6V2" />
    <path d="M18 10h4v6" />
    <circle cx="12" cy="15" r="3" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-emerald-500 mr-1">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconTrendingDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-red-500 mr-1">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_ASSETS: CryptoAsset[] = [
  { id: '1', name: 'Bitcoin', symbol: 'BTC', balance: 0.45, price: 66420.00, change24h: 2.4, color: '#f59e0b' },
  { id: '2', name: 'Ethereum', symbol: 'ETH', balance: 4.2, price: 3540.00, change24h: -1.2, color: '#3b82f6' },
  { id: '3', name: 'Solana', symbol: 'SOL', balance: 145.0, price: 145.50, change24h: 5.8, color: '#10b981' },
];
const INITIAL_TXS: Transaction[] = [
  { id: 'TX-1', type: 'Buy', asset: 'BTC', amount: 0.05, value: 3371.00, date: 'Jun 18, 2026' },
  { id: 'TX-2', type: 'Sell', asset: 'ETH', amount: 1.5, value: 5310.00, date: 'Jun 17, 2026' },
  { id: 'TX-3', type: 'Buy', asset: 'SOL', amount: 5.0, value: 727.50, date: 'Jun 16, 2026' },
];

const PRICE_TREND_DATA = [
  { time: '00:00', price: 66200 },
  { time: '04:00', price: 66500 },
  { time: '08:00', price: 67100 },
  { time: '12:00', price: 66800 },
  { time: '16:00', price: 67300 },
  { time: '20:00', price: 67420 },
];

export default function SafeCrypto({ isDark }: SafeCryptoProps) {
  const [assets, setAssets] = useState<CryptoAsset[]>(INITIAL_ASSETS);
  const [txs, setTxs] = useState<Transaction[]>(INITIAL_TXS);
  
  // Trade Modal
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell'>('Buy');
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState('BTC');
  const [tradeAmount, setTradeAmount] = useState<number>(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Total USD portfolio value
  const totalBalanceUsd = useMemo(() => {
    return assets.reduce((sum, asset) => sum + (asset.balance * asset.price), 0);
  }, [assets]);

  // Execute trade logic
  const handleTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeAmount <= 0) return;

    const targetAsset = assets.find(a => a.symbol === selectedAssetSymbol);
    if (!targetAsset) return;

    const value = tradeAmount * targetAsset.price;

    setAssets(prev => prev.map(a => {
      if (a.symbol === selectedAssetSymbol) {
        const newBalance = tradeType === 'Buy' 
          ? a.balance + tradeAmount 
          : Math.max(0, a.balance - tradeAmount);
        return { ...a, balance: newBalance };
      }
      return a;
    }));

    const newTx: Transaction = {
      id: `TX-${txs.length + 1}`,
      type: tradeType,
      asset: selectedAssetSymbol,
      amount: tradeAmount,
      value,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    setTxs(prev => [newTx, ...prev]);
    setIsTradeOpen(false);
    setTradeAmount(0);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6" style={{ scrollbarWidth: 'none' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Dashboards
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Crypto Assets
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => { setTradeType('Buy'); setIsTradeOpen(true); }}>
            Trade Crypto
          </GlassButton>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* 1. Portfolio Balance */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Net Portfolio
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary)' }}>
              <IconWallet />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>${totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 4.2% <span style={{ color: mut }}>(24h)</span>
              </span>
            </div>
            {/* Portfolio Sparkline */}
            <div className="w-[85px] h-[35px] opacity-85">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                <path d="M0 40 Q 25 35, 50 15 T 100 5 L 100 50 L 0 50 Z" fill="rgba(var(--primary-rgb),0.15)" />
                <path d="M0 40 Q 25 35, 50 15 T 100 5" stroke="var(--primary)" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* 2. BTC Price */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Bitcoin (BTC)
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IconBtc />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>$67,420</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 1.8% <span style={{ color: mut }}>Today</span>
              </span>
            </div>
            {/* BTC sparkline */}
            <div className="w-[85px] h-[35px] opacity-80">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                <path d="M0 35 L 20 38 L 40 28 L 60 30 L 80 12 L 100 5" stroke="#f59e0b" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3. ETH Price */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Ethereum (ETH)
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary)' }}>
              <IconEth />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>$3,540</span>
              <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1 mt-1">
                <IconTrendingDown /> 0.5% <span style={{ color: mut }}>Today</span>
              </span>
            </div>
            {/* ETH sparkline */}
            <div className="w-[85px] h-[35px] opacity-80">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                <path d="M0 12 L 20 28 L 40 18 L 60 35 L 80 32 L 100 45" stroke="var(--primary)" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Gas Tracker */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Network Gas
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconGas />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>24 Gwei</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                <IconTrendingUp /> 12% <span style={{ color: mut }}>(Low Load)</span>
              </span>
            </div>
            {/* Gas sparkline bars */}
            <div className="w-[80px] h-[35px] flex items-end justify-between gap-1">
              {[25, 45, 18, 12, 32, 28, 14, 10].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-t-sm bg-gradient-to-t from-emerald-600 to-teal-400"
                  style={{ height: `${(height / 50) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Large Chart */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>BTC/USD Price Index</h3>
              <p className="text-xs" style={{ color: sec }}>Real-time valuation analytics</p>
            </div>
            <button className="text-xs hover:text-primary transition-colors p-0.5" style={{ color: mut }}><IconThreeDots /></button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={PRICE_TREND_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} domain={['dataMin - 100', 'dataMax + 100']} tickFormatter={val => `$${val.toLocaleString()}`} />
                  <Tooltip
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Transaction History Log */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: pri }}>Activity History</h3>
            <p className="text-xs" style={{ color: sec }}>Recent wallet actions</p>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1" style={{ scrollbarWidth: 'none' }}>
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-primary/5"
                style={{ borderColor: borderSubtle(isDark), background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
              >
                <div>
                  <span className="text-xs font-bold block" style={{ color: pri }}>
                    {tx.type === 'Buy' ? 'Bought' : 'Sold'} {tx.asset}
                  </span>
                  <span className="text-[10px]" style={{ color: sec }}>{tx.date}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block" style={{ color: tx.type === 'Buy' ? '#10b981' : '#ef4444' }}>
                    {tx.type === 'Buy' ? '+' : '-'}{tx.amount} {tx.asset}
                  </span>
                  <span className="text-[10px]" style={{ color: mut }}>${tx.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Holdings Table */}
      <div className="rounded-[18px] p-5 flex flex-col min-h-[250px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: pri }}>Assets Holdings</h3>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                <th className="p-3 font-bold">Name</th>
                <th className="p-3 font-bold">Symbol</th>
                <th className="p-3 font-bold">Balance</th>
                <th className="p-3 font-bold">Price</th>
                <th className="p-3 font-bold">24h Change</th>
                <th className="p-3 font-bold">Holdings Value</th>
                <th className="p-3 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(asset => {
                const isPositive = asset.change24h >= 0;
                return (
                  <tr key={asset.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} className="hover:bg-primary/5 transition-colors">
                    <td className="p-3 font-semibold flex items-center gap-2" style={{ color: pri }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: asset.color }} />
                      {asset.name}
                    </td>
                    <td className="p-3" style={{ color: sec }}>{asset.symbol}</td>
                    <td className="p-3 font-semibold" style={{ color: pri }}>{asset.balance}</td>
                    <td className="p-3" style={{ color: pri }}>${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 font-bold" style={{ color: isPositive ? '#10b981' : '#ef4444' }}>
                      {isPositive ? '↑' : '↓'} {Math.abs(asset.change24h)}%
                    </td>
                    <td className="p-3 font-bold" style={{ color: pri }}>
                      ${(asset.balance * asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => { setSelectedAssetSymbol(asset.symbol); setTradeType('Buy'); setIsTradeOpen(true); }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-white cursor-pointer active:scale-95 transition-all mr-1.5"
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => { setSelectedAssetSymbol(asset.symbol); setTradeType('Sell'); setIsTradeOpen(true); }}
                        className="text-[10px] font-bold px-2.5 py-1 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer active:scale-95 transition-all"
                        style={{ borderColor: borderSubtle(isDark), color: pri }}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TRADE DIALOG MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isTradeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-2xl relative shadow-2xl transition-colors"
              style={{
                background: isDark ? 'rgba(20, 20, 20, 0.98)' : '#ffffff',
                border: `1px solid ${borderSubtle(isDark)}`,
                backdropFilter: 'blur(20px)',
              }}
            >
              <button
                onClick={() => setIsTradeOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-4" style={{ color: pri }}>Trade Assets</h3>
              
              <form onSubmit={handleTradeSubmit} className="space-y-4">
                
                {/* Buy vs Sell Switcher */}
                <div className="grid grid-cols-2 p-1 rounded-xl" style={{ background: surfaceItem(isDark) }}>
                  <button
                    type="button"
                    onClick={() => setTradeType('Buy')}
                    className="py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    style={{
                      background: tradeType === 'Buy' ? 'var(--primary)' : 'transparent',
                      color: tradeType === 'Buy' ? '#ffffff' : sec,
                    }}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeType('Sell')}
                    className="py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    style={{
                      background: tradeType === 'Sell' ? '#ef4444' : 'transparent',
                      color: tradeType === 'Sell' ? '#ffffff' : sec,
                    }}
                  >
                    Sell
                  </button>
                </div>

                {/* Asset Selector */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Select Currency</label>
                  <CustomSelect
                    value={selectedAssetSymbol}
                    onChange={setSelectedAssetSymbol}
                    isDark={isDark}
                    options={assets.map(a => ({ value: a.symbol, label: `${a.name} (${a.symbol})` }))}
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Amount ({selectedAssetSymbol})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={tradeAmount || ''}
                    onChange={e => setTradeAmount(parseFloat(e.target.value))}
                    placeholder="e.g. 0.05"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-primary"
                    style={{
                      background: surfaceItem(isDark),
                      borderColor: borderSubtle(isDark),
                      color: pri,
                    }}
                  />
                </div>

                {/* Submit */}
                <GlassButton
                  type="submit"
                  className="w-full mt-4"
                  style={{
                    background: tradeType === 'Buy' ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    borderColor: tradeType === 'Buy' ? 'rgba(var(--primary-rgb), 0.4)' : 'rgba(239, 68, 68, 0.4)',
                    color: tradeType === 'Buy' ? 'var(--primary-hover)' : '#f87171',
                  }}
                >
                  Execute {tradeType}
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
