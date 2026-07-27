'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

// Subpage Views
import ProductsView from './Ecommerce/ProductsView';
import ProductDetailsView from './Ecommerce/ProductDetailsView';
import CreateProductView from './Ecommerce/CreateProductView';
import OrdersView from './Ecommerce/OrdersView';
import OrderDetailsView from './Ecommerce/OrderDetailsView';
import CustomersView from './Ecommerce/CustomersView';
import CartView from './Ecommerce/CartView';
import CheckoutView from './Ecommerce/CheckoutView';
import SellersView from './Ecommerce/SellersView';
import SellerDetailsView from './Ecommerce/SellerDetailsView';

interface SafeEcommerceProps {
  isDark: boolean;
  activePage?: string;
}

interface Order {
  id: string;
  customer: string;
  date: string;
  product: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Paid' | 'Shipped' | 'Cancelled';
}

interface Product {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  stock: number;
  image: React.ReactNode;
}

// ─── Inline SVG Icons ────────────────────────────────────────────────────────
const IconDollar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconActivity = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconExpand = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 flex-shrink-0">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 ml-1">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconHelmet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <path d="M2 12a10 10 0 0 1 20 0H2z" />
    <path d="M5 12v3a7 7 0 0 0 14 0v-3" />
    <path d="M12 2v10" />
  </svg>
);

const IconExtinguisher = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <rect x="7" y="9" width="10" height="12" rx="2" />
    <path d="M12 9V6a2 2 0 0 0-2-2H9" />
    <path d="M11 6h2" />
    <path d="M16 9V7a2 2 0 0 0-2-2h-1" />
    <circle cx="12" cy="15" r="2" />
  </svg>
);

const IconFirstAid = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M8 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <line x1="12" y1="9" x2="12" y2="15" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>
);

// ─── Initial Data ─────────────────────────────────────────────────────────────
const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-8921', customer: 'Ali Mohammadi', date: 'Jun 18, 2026', product: 'Safety Helmet (x5)', amount: 240.00, paymentMethod: 'Credit Card', status: 'Paid' },
  { id: 'ORD-8922', customer: 'Sarah Jenkins', date: 'Jun 17, 2026', product: 'Fire Extinguisher (x2)', amount: 310.00, paymentMethod: 'PayPal', status: 'Shipped' },
  { id: 'ORD-8923', customer: 'John Doe', date: 'Jun 17, 2026', product: 'First Aid Kit (x10)', amount: 480.00, paymentMethod: 'Bank Transfer', status: 'Pending' },
  { id: 'ORD-8924', customer: 'Mark Davis', date: 'Jun 16, 2026', product: 'Safety Harness (x3)', amount: 195.00, paymentMethod: 'Credit Card', status: 'Paid' },
  { id: 'ORD-8925', customer: 'David Smith', date: 'Jun 15, 2026', product: 'Gas Detector (x1)', amount: 550.00, paymentMethod: 'PayPal', status: 'Cancelled' },
];

const REVENUE_DATA = [
  { month: 'Jan', sales: 42000, profit: 15000 },
  { month: 'Feb', sales: 48000, profit: 18000 },
  { month: 'Mar', sales: 55000, profit: 21000 },
  { month: 'Apr', sales: 62000, profit: 24000 },
  { month: 'May', sales: 78000, profit: 31000 },
  { month: 'Jun', sales: 98420, profit: 41200 },
];

const PIE_DATA = [
  { name: 'Desktop', value: 58 },
  { name: 'Mobile', value: 32 },
  { name: 'Tablet', value: 10 },
];

const TOP_PRODUCTS: Product[] = [
  { id: 'P1', name: 'Premium Safety Helmet', sales: 540, revenue: 32400, stock: 120, image: <IconHelmet /> },
  { id: 'P2', name: 'Industrial Fire Extinguisher', sales: 320, revenue: 19200, stock: 45, image: <IconExtinguisher /> },
  { id: 'P3', name: 'Universal First Aid Kit', sales: 180, revenue: 14400, stock: 89, image: <IconFirstAid /> },
];

export default function SafeEcommerce({ isDark, activePage }: SafeEcommerceProps) {
  const { primaryColor } = useTheme();
  const PIE_COLORS = [primaryColor, '#10b981', '#f59e0b'];
  // Check for active sub-pages
  if (activePage === 'ecommerce-products') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <ProductsView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-product-details') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <ProductDetailsView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-create-product') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <CreateProductView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-orders') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <OrdersView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-order-details') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <OrderDetailsView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-customers') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <CustomersView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-cart') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <CartView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-checkout') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <CheckoutView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-sellers') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <SellersView isDark={isDark} />
      </div>
    );
  }
  if (activePage === 'ecommerce-seller-details') {
    return (
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5" style={{ scrollbarWidth: 'none' }}>
        <SellerDetailsView isDark={isDark} />
      </div>
    );
  }

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Paid' | 'Shipped' | 'Cancelled'>('All');
  
  // Custom dropdown selector state for editing order status
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  // Export Modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'CSV' | 'XLSX' | 'PDF'>('CSV');
  const [exportRange, setExportRange] = useState<'all' | '30d' | '7d'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setIsExportOpen(false);
    }, 1500);
  };

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Calculations
  const totalRevenue = orders.reduce((sum, o) => o.status !== 'Cancelled' ? sum + o.amount : sum, 98420);
  const totalOrders = orders.length + 1835;

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Update status function
  const updateStatus = (id: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    setEditingOrderId(null);
  };

  const getStatusStyles = (status: Order['status']) => {
    switch (status) {
      case 'Paid':
        return { bg: 'rgba(16,185,129,0.12)', text: '#10b981', border: 'rgba(16,185,129,0.25)' };
      case 'Pending':
        return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' };
      case 'Shipped':
        return { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.25)' };
      case 'Cancelled':
        return { bg: 'rgba(239,68,68,0.12)', text: '#ef4444', border: 'rgba(239,68,68,0.25)' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-6 animate-fadeIn" style={{ scrollbarWidth: 'none' }}>
      
      {/* ── Welcome and header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Dashboards
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Ecommerce Workspace
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton onClick={() => setIsExportOpen(true)}>
            Export Orders
          </GlassButton>
        </div>
      </div>

      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        {/* 1. Total Sales */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Total Revenue
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>
              <IconDollar />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                ↑ 12.5% <span style={{ color: mut }}>(vs last month)</span>
              </span>
            </div>
            {/* Sparkline SVG area */}
            <div className="w-[80px] h-[35px] opacity-80">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                <path d="M0 45 Q 25 35, 50 15 T 100 5 L 100 50 L 0 50 Z" fill="rgba(var(--primary-rgb), 0.15)" />
                <path d="M0 45 Q 25 35, 50 15 T 100 5" stroke="var(--primary)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Total Orders
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconCart />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>{totalOrders}</span>
              <span className="text-[10px] font-semibold text-red-500 flex items-center gap-1 mt-1">
                ↓ 3.2% <span style={{ color: mut }}>(7d)</span>
              </span>
            </div>
            {/* Sparkline SVG bar */}
            <div className="w-[80px] h-[35px] flex items-end justify-between gap-1">
              {[15, 25, 12, 19, 32, 22, 28, 42].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-t-sm bg-gradient-to-t from-emerald-600 to-teal-400"
                  style={{ height: `${(height / 45) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. Customers */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Customers
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
              <IconUsers />
            </div>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>14,320</span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1 mt-1">
                ↑ 8.4% <span style={{ color: mut }}>(30d)</span>
              </span>
            </div>
            {/* Avatars overlaps */}
            <div className="flex -space-x-1.5 overflow-hidden pb-1">
              {['AM', 'SJ', 'JD', 'MD'].map((av, index) => (
                <div
                  key={av}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border"
                  style={{
                    background: index === 0 ? 'var(--primary)' : index === 1 ? 'var(--primary)' : index === 2 ? '#10b981' : '#f59e0b',
                    color: '#ffffff',
                    borderColor: isDark ? 'var(--surface)' : '#ffffff',
                  }}
                >
                  {av}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Conversion Rate */}
        <div className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: sec }}>
              Conv. Rate
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>
              <IconActivity />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-3xl font-black block leading-none" style={{ color: pri }}>2.4%</span>
              <span className="text-[10px] font-medium" style={{ color: mut }}>Target score: 3.5%</span>
            </div>
            {/* SVG radial progress */}
            <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="3" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeDasharray="113" strokeDashoffset="40" strokeLinecap="round" transform="rotate(-90 22 22)" />
              </svg>
              <span className="absolute text-[9px] font-extrabold" style={{ color: pri }}>68%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Revenue Analytics</h3>
              <p className="text-xs" style={{ color: sec }}>Monthly sales and revenue progress</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: pri }}>
                <span className="w-2.5 h-1 rounded-full" style={{ background: 'var(--primary)' }}></span> Sales
              </span>
              <span className="flex items-center gap-1.5 font-medium" style={{ color: pri }}>
                <span className="w-2.5 h-1 rounded-full" style={{ background: '#10b981' }}></span> Profit
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: sec }} tickFormatter={val => `$${val / 1000}k`} />
                  <Tooltip
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="sales" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Traffic / Sales Category Chart */}
        <div className="rounded-[18px] p-5 flex flex-col h-[320px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: pri }}>Sales Device Sources</h3>
            <p className="text-xs" style={{ color: sec }}>Distribution by purchase device</p>
          </div>

          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: isDark ? 'rgba(20,20,20,0.95)' : '#fff', border: `1px solid ${border}`, borderRadius: '10px' }}
                    itemStyle={{ color: pri }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Center percentage summary */}
            <div className="absolute text-center flex flex-col">
              <span className="text-xl font-black" style={{ color: pri }}>58%</span>
              <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: mut }}>Desktop</span>
            </div>
          </div>

          {/* Legends */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t" style={{ borderColor: borderSubtle(isDark) }}>
            {PIE_DATA.map((item, index) => (
              <div key={item.name} className="text-center">
                <span className="text-[10px] font-semibold flex items-center justify-center gap-1" style={{ color: pri }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: PIE_COLORS[index] }} />
                  {item.name}
                </span>
                <span className="text-xs font-bold" style={{ color: sec }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: RECENT ORDERS & TOP PRODUCTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Orders table */}
        <div className="lg:col-span-2 rounded-[18px] p-5 flex flex-col min-h-[350px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Recent Orders</h3>
              <p className="text-xs" style={{ color: sec }}>Manage and track customer checkouts</p>
            </div>
            
            {/* Search + filter panel */}
            <div className="flex gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}`, maxWidth: 160 }}
              >
                <img src="/search.svg" alt="search" width={12} height={12} style={{ opacity: 0.45, filter: isDark ? 'invert(1)' : 'none' }} />
                <input
                  type="text"
                  placeholder="Search order..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none border-none text-xs w-full"
                  style={{ color: textPrimary(isDark) }}
                />
              </div>

              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                isDark={isDark}
                options={[
                  { value: 'All', label: 'All Statuses' },
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Shipped', label: 'Shipped' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
                className="min-w-[130px]"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}`, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <th className="p-3 font-bold">Order ID</th>
                  <th className="p-3 font-bold">Customer</th>
                  <th className="p-3 font-bold">Product</th>
                  <th className="p-3 font-bold">Amount</th>
                  <th className="p-3 font-bold">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const style = getStatusStyles(order.status);
                  const isEditing = editingOrderId === order.id;

                  return (
                    <tr key={order.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }} className="hover:bg-primary/5 transition-colors">
                      <td className="p-3 font-bold" style={{ color: pri }}>{order.id}</td>
                      <td className="p-3 font-semibold" style={{ color: pri }}>{order.customer}</td>
                      <td className="p-3" style={{ color: sec }}>{order.product}</td>
                      <td className="p-3 font-bold" style={{ color: pri }}>${order.amount.toFixed(2)}</td>
                      
                      {/* Fulfillment cell with absolute status dropdown dropdown */}
                      <td className="p-3 relative">
                        <button
                          onClick={() => setEditingOrderId(isEditing ? null : order.id)}
                          className="px-2.5 py-1 rounded-full font-bold flex items-center gap-1 cursor-pointer transition-colors active:scale-95 text-[10px]"
                          style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
                        >
                          {order.status} <IconChevronDown />
                        </button>
                        
                        <AnimatePresence>
                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              className="absolute z-20 mt-1 right-0 rounded-xl p-1 shadow-lg w-28"
                              style={{
                                background: isDark ? 'rgba(30,30,30,0.98)' : '#ffffff',
                                border: `1px solid ${borderSubtle(isDark)}`,
                                backdropFilter: 'blur(10px)',
                              }}
                            >
                              {(['Pending', 'Paid', 'Shipped', 'Cancelled'] as const).map(st => (
                                <button
                                  key={st}
                                  onClick={() => updateStatus(order.id, st)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-primary/10 cursor-pointer block"
                                  style={{ color: getStatusStyles(st).text }}
                                >
                                  {st}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top selling products */}
        <div className="rounded-[18px] p-5 flex flex-col min-h-[350px] transition-colors" style={{ background: bg, border: `1px solid ${border}` }}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: pri }}>Top Products</h3>
              <p className="text-xs" style={{ color: sec }}>Best performing store assets</p>
            </div>
            <button className="text-xs hover:text-primary transition-colors p-0.5" style={{ color: mut }}><IconThreeDots /></button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 flex-1" style={{ scrollbarWidth: 'none' }}>
            {TOP_PRODUCTS.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: borderSubtle(isDark), background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}
              >
                {/* Image Placeholder */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${borderSubtle(isDark)}` }}>
                  {prod.image}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: pri }}>{prod.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: sec }}>{prod.sales} sales • Stock: {prod.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: pri }}>${prod.revenue.toLocaleString()}</p>
                  <p className="text-[8px] text-emerald-500 font-bold" style={{ color: '#10b981' }}>Active</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── EXPORT ORDERS DIALOG MODAL (Glassmorphic) ── */}
      <AnimatePresence>
        {isExportOpen && (
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
                onClick={() => setIsExportOpen(false)}
                className="absolute top-4 right-4 text-xs font-black hover:text-primary cursor-pointer p-1"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Export Orders Report</h3>
              <p className="text-xs mb-4" style={{ color: sec }}>Generate a download link for checkouts data</p>
              
              <form onSubmit={handleExportSubmit} className="space-y-4">
                
                {/* Format selection */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>File Format</label>
                  <CustomSelect
                    value={exportFormat}
                    onChange={setExportFormat}
                    isDark={isDark}
                    options={[
                      { value: 'CSV', label: 'Comma Separated Values (.csv)' },
                      { value: 'XLSX', label: 'Excel Spreadsheet (.xlsx)' },
                      { value: 'PDF', label: 'Portable Document Format (.pdf)' },
                    ]}
                  />
                </div>

                {/* Date range selection */}
                <div>
                  <label className="block text-[10px] uppercase font-bold mb-1" style={{ color: sec }}>Date Range</label>
                  <CustomSelect
                    value={exportRange}
                    onChange={setExportRange}
                    isDark={isDark}
                    options={[
                      { value: 'all', label: 'All time (Default)' },
                      { value: '30d', label: 'Last 30 days' },
                      { value: '7d', label: 'Last 7 days' },
                    ]}
                  />
                </div>

                {/* Action button */}
                <GlassButton
                  type="submit"
                  className="w-full mt-4"
                  disabled={isExporting}
                >
                  {isExporting ? 'Generating Report...' : 'Download Report'}
                </GlassButton>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
