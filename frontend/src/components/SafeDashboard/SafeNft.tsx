'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface SafeNftProps {
  isDark: boolean;
}

interface NFTItem {
  id: string;
  name: string;
  collection: string;
  priceEth: number;
  highestBidEth: number;
  creator: string;
  gradient: string; // CSS gradient for abstract art representation
}

interface NFTCollection {
  id: string;
  name: string;
  volumeEth: number;
  floorPriceEth: number;
  change24h: number;
  itemsCount: number;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconDiamond = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M6 3h12l4 6-10 13L2 9z" />
    <path d="M11 3v18" />
    <path d="M2 9h20" />
  </svg>
);

const IconImage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconGrid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 ml-1">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_NFTS: NFTItem[] = [
  { id: 'NFT-42', name: 'Enterhub Canvas #42', collection: 'Chrome Liquid', priceEth: 1.85, highestBidEth: 1.55, creator: 'Ali Mohammadi', gradient: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)' },
  { id: 'NFT-88', name: 'Safety Shield #88', collection: 'Chrome Liquid', priceEth: 2.10, highestBidEth: 1.95, creator: 'Sarah Jenkins', gradient: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)' },
  { id: 'NFT-12', name: 'Plasma Flow #12', collection: 'Plasma Waves', priceEth: 0.95, highestBidEth: 0.80, creator: 'Mark Davis', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)' },
  { id: 'NFT-64', name: 'Turbulent Flux #64', collection: 'Plasma Waves', priceEth: 3.40, highestBidEth: 3.10, creator: 'Sarah Jenkins', gradient: 'linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)' },
];

const COLLECTIONS_DATA: NFTCollection[] = [
  { id: 'col1', name: 'Chrome Liquid', volumeEth: 142.5, floorPriceEth: 1.85, change24h: 12.4, itemsCount: 120 },
  { id: 'col2', name: 'Plasma Waves', volumeEth: 98.2, floorPriceEth: 0.95, change24h: -2.1, itemsCount: 85 },
  { id: 'col3', name: 'Compliance Grid', volumeEth: 45.8, floorPriceEth: 0.50, change24h: 4.8, itemsCount: 50 },
];

const WEEKLY_VOLUME_DATA = [
  { day: 'Mon', volume: 12.5 },
  { day: 'Tue', volume: 18.2 },
  { day: 'Wed', volume: 15.4 },
  { day: 'Thu', volume: 22.8 },
  { day: 'Fri', volume: 30.5 },
  { day: 'Sat', volume: 25.1 },
  { day: 'Sun', volume: 28.4 },
];

export default function SafeNft({ isDark }: SafeNftProps) {
  const { primaryColor } = useTheme();
  const [nfts, setNfts] = useState<NFTItem[]>(INITIAL_NFTS);
  const [collections, setCollections] = useState<NFTCollection[]>(COLLECTIONS_DATA);
  const [volumeData, setVolumeData] = useState(WEEKLY_VOLUME_DATA);
  const [searchQuery, setSearchQuery] = useState('');

  // Bid Modal
  const [isBidOpen, setIsBidOpen] = useState(false);
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(12.5);

  // Connect Wallet Modal state
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Simulated background activity: other users placing bids & volume updates
  useEffect(() => {
    const timer = setInterval(() => {
      const r = Math.random();
      if (r < 0.5) {
        // Mock bidding from other accounts
        setNfts(prev => {
          const idx = Math.floor(Math.random() * prev.length);
          return prev.map((n, i) => {
            if (i === idx) {
              const increase = Number((Math.random() * 0.15 + 0.05).toFixed(2));
              return { ...n, highestBidEth: Number((n.highestBidEth + increase).toFixed(2)) };
            }
            return n;
          });
        });
      } else {
        // Adjust floor price and volume for one collection
        setCollections(prev => {
          const idx = Math.floor(Math.random() * prev.length);
          return prev.map((col, i) => {
            if (i === idx) {
              const priceChange = col.floorPriceEth * (Math.random() * 0.06 - 0.03); // -3% to +3%
              const newFloor = Math.max(0.1, Number((col.floorPriceEth + priceChange).toFixed(2)));
              const volInc = Number((Math.random() * 2.5 + 0.5).toFixed(1));
              const newVol = Number((col.volumeEth + volInc).toFixed(1));
              const newChange = Number((col.change24h + (Math.random() * 4 - 2)).toFixed(1));
              return {
                ...col,
                floorPriceEth: newFloor,
                volumeEth: newVol,
                change24h: newChange,
              };
            }
            return col;
          });
        });

        // Add volume activity to today's bar chart
        setVolumeData(prev => {
          return prev.map((d, i) => {
            if (i === prev.length - 1) {
              return { ...d, volume: Number((d.volume + Math.random() * 1.5 + 0.2).toFixed(1)) };
            }
            return d;
          });
        });
      }
    }, 25000); // every 25 seconds

    return () => clearInterval(timer);
  }, []);

  const handleConnectWallet = (provider: string) => {
    setConnectingProvider(provider);
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setConnectingProvider(null);
      setIsConnected(true);
      setWalletAddress('0x7a83...' + Math.floor(Math.random() * 9000 + 1000) + 'c');
      setIsConnectOpen(false);
    }, 1200);
  };

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const filteredNfts = useMemo(() => {
    return nfts.filter(nft => {
      return nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             nft.collection.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [nfts, searchQuery]);

  const selectedNft = useMemo(() => {
    return nfts.find(n => n.id === selectedNftId) || null;
  }, [nfts, selectedNftId]);

  // Handle placing bid
  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNftId || bidAmount <= 0) return;

    if (bidAmount > walletBalance) {
      alert('Insufficient wallet balance!');
      return;
    }

    setNfts(prev => prev.map(n => {
      if (n.id === selectedNftId) {
        return { ...n, highestBidEth: Math.max(n.highestBidEth, bidAmount) };
      }
      return n;
    }));

    setWalletBalance(prev => prev - bidAmount);
    setIsBidOpen(false);
    setBidAmount(0);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6 animate-fadeIn" style={{ scrollbarWidth: 'none' }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Dashboards
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            NFT Collected
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => {
            if (isConnected) {
              if (confirm('Do you want to disconnect wallet?')) {
                setIsConnected(false);
                setWalletAddress(null);
              }
            } else {
              setIsConnectOpen(true);
            }
          }}>
            {isConnected ? (
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                {walletAddress}
              </span>
            ) : (
              'Connect Wallet'
            )}
          </GlassButton>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* 1. Wallet Balance */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Crypto Wallet
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary)' }}>
              <IconDiamond />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>{walletBalance.toFixed(2)} ETH</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1 font-mono">
                Holdings verified
              </span>
            </div>
          </div>
        </div>

        {/* 2. Collected count */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Collected
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconImage />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>34</span>
              <span className="text-[10px] font-semibold text-emerald-500 block mt-1">
                +4 items this week
              </span>
            </div>
          </div>
        </div>

        {/* 3. Floor index */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Average Floor
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IconTrendingUp />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>1.85 ETH</span>
              <span className="text-[10px] font-semibold text-emerald-500 block mt-1">
                ↑ 12% Floor index
              </span>
            </div>
          </div>
        </div>

        {/* 4. Total Volume Spent */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Spent Volume
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>
              <IconGrid />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-2xl font-black block leading-none" style={{ color: pri }}>45.8 ETH</span>
              <span className="text-[10px] font-semibold text-emerald-500 block mt-1">
                Portfolio size active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Graphs & Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* NFT volume bar chart */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Marketplace Volume Analytics</h3>
              <p className="text-xs" style={{ color: sec }}>Daily collection trading index</p>
            </div>
            <button className="text-xs hover:text-primary transition-colors p-0.5" style={{ color: mut }}><IconThreeDots /></button>
          </div>

          <div className="flex-1 min-h-0 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} tickFormatter={val => `${val} ETH`} />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', radius: 4 }}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri, fontSize: 11 }}
                  />
                  <Bar dataKey="volume" fill={primaryColor} radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Collections rankings */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: pri }}>Top Collections</h3>
            <p className="text-xs" style={{ color: sec }}>Highest trading indexes</p>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1" style={{ scrollbarWidth: 'none' }}>
            {collections.map((col, idx) => (
              <div
                key={col.id}
                className="flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-primary/5"
                style={{ borderColor: borderSubtle(isDark), background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black" style={{ color: mut }}>#{idx + 1}</span>
                  <div>
                    <span className="text-xs font-bold block" style={{ color: pri }}>{col.name}</span>
                    <span className="text-[10px]" style={{ color: sec }}>Floor: {col.floorPriceEth} ETH</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold block" style={{ color: pri }}>{col.volumeEth} ETH</span>
                  <span className="text-[9px] font-bold" style={{ color: col.change24h >= 0 ? '#10b981' : '#ef4444' }}>
                    {col.change24h >= 0 ? '+' : ''}{col.change24h}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar / Search panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl transition-colors" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', border: `1px solid ${border}` }}>
        <h3 className="text-sm font-bold" style={{ color: pri }}>Marketplace Gallery</h3>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
          style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, minWidth: 160 }}
        >
          <img src="/search.svg" alt="search" width={12} height={12} style={{ opacity: 0.45, filter: isDark ? 'invert(1)' : 'none' }} />
          <input
            type="text"
            placeholder="Search NFT..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none border-none text-xs w-full"
            style={{ color: textPrimary(isDark) }}
          />
        </div>
      </div>

      {/* NFT marketplace grid - featuring pure CSS geometric gradient designs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredNfts.map((nft) => (
          <div
            key={nft.id}
            className="rounded-2xl p-4 border flex flex-col justify-between min-h-[300px] transition-all duration-200 hover:-translate-y-0.5 group"
            style={{ background: bg, borderColor: border }}
          >
            {/* Visual CSS-only abstract art block */}
            <div
              className="w-full h-[150px] rounded-xl relative overflow-hidden flex items-center justify-center shadow-inner group-hover:scale-[1.02] transition-transform duration-300"
              style={{ background: nft.gradient }}
            >
              {/* Abstract overlay circles */}
              <div className="absolute w-20 h-20 rounded-full bg-white/10 blur-md -top-4 -left-4 animate-pulse" />
              <div className="absolute w-28 h-28 rounded-full bg-black/10 blur-lg -bottom-8 -right-8" />
              <div className="absolute w-12 h-12 border border-white/20 rounded-full rotate-45 flex items-center justify-center backdrop-blur-sm">
                <span className="text-[10px] font-black text-white/80">{nft.id}</span>
              </div>
            </div>

            {/* Info details */}
            <div className="mt-3">
              <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: mut }}>{nft.collection}</span>
              <h4 className="text-xs font-bold leading-snug truncate mt-0.5 group-hover:text-primary transition-colors" style={{ color: pri }}>{nft.name}</h4>
              <p className="text-[9px] mt-1" style={{ color: sec }}>By <span className="font-semibold" style={{ color: pri }}>{nft.creator}</span></p>
            </div>

            {/* Price section and Bid action */}
            <div className="flex justify-between items-center pt-3 mt-3 border-t" style={{ borderColor: borderSubtle(isDark) }}>
              <div>
                <span className="text-[9px] block uppercase font-bold" style={{ color: mut }}>Price</span>
                <span className="text-xs font-black" style={{ color: pri }}>{nft.priceEth} ETH</span>
              </div>
              <div>
                <span className="text-[9px] block uppercase font-bold text-right" style={{ color: mut }}>Highest Bid</span>
                <span className="text-xs font-semibold block text-right" style={{ color: sec }}>{nft.highestBidEth} ETH</span>
              </div>
            </div>

            <GlassButton
              onClick={() => { setSelectedNftId(nft.id); setBidAmount(nft.highestBidEth + 0.1); setIsBidOpen(true); }}
              className="w-full mt-3.5"
            >
              Place Bid
            </GlassButton>
          </div>
        ))}
      </div>

      {/* ── PLACE BID MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isBidOpen && selectedNft && (
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
                onClick={() => setIsBidOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Place Mock Bid</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Bid on {selectedNft.name}</p>
              
              <form onSubmit={handleBidSubmit} className="space-y-4">
                
                {/* Details info */}
                <div className="p-3.5 rounded-xl text-xs space-y-1.5" style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}>
                  <div className="flex justify-between">
                    <span style={{ color: sec }}>Min bid increment:</span>
                    <span className="font-bold" style={{ color: pri }}>&gt; {selectedNft.highestBidEth} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: sec }}>My balance:</span>
                    <span className="font-bold" style={{ color: pri }}>{walletBalance.toFixed(2)} ETH</span>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Bid Value (ETH)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={selectedNft.highestBidEth + 0.01}
                    value={bidAmount || ''}
                    onChange={e => setBidAmount(parseFloat(e.target.value))}
                    placeholder="e.g. 1.75"
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
                >
                  Place Bid Offer
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONNECT WALLET DIALOG MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isConnectOpen && (
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
                onClick={() => setIsConnectOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Connect Wallet</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Select a Web3 provider to link account</p>
              
              {isConnecting ? (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-xs font-bold" style={{ color: pri }}>Connecting to {connectingProvider}...</p>
                  <p className="text-[10px]" style={{ color: mut }}>Please confirm connection in your browser extension</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {[
                    { name: 'MetaMask', desc: 'Popular browser extension', logoBg: '#f59e0b' },
                    { name: 'Coinbase Wallet', desc: 'Secure institutional storage', logoBg: '#3b82f6' },
                    { name: 'WalletConnect', desc: 'Scan QR code with mobile app', logoBg: '#c084fc' }
                  ].map(provider => (
                    <button
                      key={provider.name}
                      onClick={() => handleConnectWallet(provider.name)}
                      className="w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-colors hover:bg-primary/5 cursor-pointer"
                      style={{
                        borderColor: borderSubtle(isDark),
                        background: surfaceItem(isDark)
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white" style={{ background: provider.logoBg }}>
                        {provider.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block" style={{ color: pri }}>{provider.name}</span>
                        <span className="text-[9px]" style={{ color: sec }}>{provider.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
