'use client';


import { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const AREA_DATA = [
  { name: 'JAN', value: 1200 }, { name: 'FEB', value: 2100 },
  { name: 'MAR', value: 1800 }, { name: 'APR', value: 3200 },
  { name: 'MAY', value: 4500 }, { name: 'JUN', value: 2400 },
  { name: 'JUL', value: 3100 }, { name: 'AUG', value: 2900 },
];

const TOP_PRODUCTS = [
  { id: 1, name: 'Zone A - Manufacturing', val: 127, metric: 'Critical', stock: 120, status: 'Active' },
  { id: 2, name: 'Zone B - Warehouse', val: 540, metric: 'Moderate', stock: 100, status: 'Resolved' },
  { id: 3, name: 'Zone C - Logistics', val: 89, metric: 'Low', stock: 45, status: 'Active' },
];

const GreenAccent = '#10b981';

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconSearch = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPackage = ({ className = 'w-4 h-4', strokeColor = 'currentColor' }: { className?: string; strokeColor?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconGauge = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10a10 10 0 0 0 10-10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconTrendingDown = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function CardWrapper({ children, isDark, delay = 0, noPadd = false }: { children: React.ReactNode; isDark: boolean; delay?: number; noPadd?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className={`rounded-[18px] h-full ${noPadd ? '' : 'p-5'} flex flex-col transition-colors`}
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      {children}
    </motion.div>
  );
}

export default function SafeAnalytics({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const PrimaryAccent = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);

  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('month');
  const [severityFilter, setSeverityFilter] = useState('all');

  const timeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'low', label: 'Low' },
  ];

  const filteredZones = TOP_PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' ? true : p.metric.toLowerCase() === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6" style={{ scrollbarWidth: 'none' }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
        <div>
          <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
            Workspaces / Analytics
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
            Analytics Hub
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton style={{ padding: '8px 16px', borderRadius: '12px' }}>
            Export Report
          </GlassButton>
        </div>
      </div>

      {/* Control Toolbar */}
      <div
        className="p-3 rounded-xl border flex flex-col sm:flex-row gap-3 items-center justify-between"
        style={{
          borderColor: borderSubtle(isDark),
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        }}
      >
        <div className="relative w-full sm:w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: sec }}>
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search risk zones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border outline-none transition-all duration-200"
            style={{
              borderColor: borderSubtle(isDark),
              background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
              color: pri,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <CustomSelect
            value={timeFilter}
            onChange={setTimeFilter}
            options={timeOptions}
            isDark={isDark}
            className="w-32 flex-shrink-0"
          />
          <CustomSelect
            value={severityFilter}
            onChange={setSeverityFilter}
            options={severityOptions}
            isDark={isDark}
            className="w-36 flex-shrink-0"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* 1. Total Incidents */}
        <CardWrapper isDark={isDark} delay={0.1}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>
              Total Incidents
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              <IconAlert />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-3xl font-black block leading-none" style={{ color: pri }}>43,630</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                New: 453
              </span>
              <span className="text-[10px] font-medium" style={{ color: mut }}>this month</span>
            </div>
          </div>
        </CardWrapper>

        {/* 2. Active Risks */}
        <CardWrapper isDark={isDark} delay={0.2}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>
              Active Risks
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
              <IconShield />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-3xl font-black block leading-none" style={{ color: pri }}>$27,064</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 flex items-center gap-0.5">
                <IconTrendingUp /> 12%
              </span>
              <span className="text-[10px] font-medium" style={{ color: mut }}>vs last month</span>
            </div>
          </div>
        </CardWrapper>

        {/* 3. Compliance Score */}
        <CardWrapper isDark={isDark} delay={0.3}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>
              Compliance Score
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <IconCheckCircle />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-3xl font-black block leading-none" style={{ color: pri }}>84.5%</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5">
                <IconTrendingUp /> 7%
              </span>
              <span className="text-[10px] font-medium" style={{ color: mut }}>vs last month</span>
            </div>
          </div>
        </CardWrapper>

        {/* 4. Avg Resolution Time */}
        <CardWrapper isDark={isDark} delay={0.4}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: sec }}>
              Avg Resolution
            </h3>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary)' }}>
              <IconClock />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-3xl font-black block leading-none" style={{ color: pri }}>4.2 hrs</span>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex items-center gap-0.5">
                <IconTrendingDown /> 15%
              </span>
              <span className="text-[10px] font-medium" style={{ color: mut }}>improvement</span>
            </div>
          </div>
        </CardWrapper>

      </div>

      {/* Row 2: Analytics Area Chart & Safety Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Risk Analytics Chart */}
        <div className="lg:col-span-2">
          <CardWrapper isDark={isDark} delay={0.5}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1" style={{ color: pri }}>
                  Risk Analytics <span className="w-3 h-3 rounded-full bg-gray-500/20 text-[8px] flex items-center justify-center">i</span>
                </h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold" style={{ color: pri }}>-4.54%</span>
                  <span className="text-xs mb-1" style={{ color: sec }}>risks</span>
                  <span className="text-[10px] mb-1 px-1 py-0.5 rounded text-[#ef4444] bg-[#ef4444]/10">↓ 0.4%</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xl font-bold" style={{ color: pri }}>0.73%</div>
                  <div className="text-[10px] flex items-center gap-1" style={{ color: sec }}>
                    Conv.rate <span className="px-1 py-0.5 rounded text-[#10b981] bg-[#10b981]/10">↑ 13%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={AREA_DATA} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor={PrimaryAccent} stopOpacity={0} />
                    </linearGradient>
                    <pattern id="stripes" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke={PrimaryAccent} strokeWidth="1" opacity={0.3} />
                    </pattern>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: sec }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: sec }} tickFormatter={(val) => `${val / 1000}K`} />
                  <Tooltip
                    cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
                    contentStyle={{ background: panelFill(isDark), border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: pri }}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#stripes)" activeDot={{ r: 6, fill: PrimaryAccent, stroke: isDark ? 'var(--background)' : '#ffffff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute top-0 bottom-6 flex items-center justify-center w-8 rounded-full pointer-events-none" style={{ left: '46%', border: `2px solid ${PrimaryAccent}`, background: `${PrimaryAccent}20` }}></div>
              <div className="absolute top-[35%] bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full pointer-events-none" style={{ left: '48.5%' }}>+19%</div>
            </div>
          </CardWrapper>
        </div>

        {/* Safety Performance Gauge */}
        <div className="lg:col-span-1">
          <CardWrapper isDark={isDark} delay={0.6}>
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-2" style={{ color: pri }}>
              Safety Performance <span className="w-3 h-3 rounded-full bg-gray-500/20 text-[8px] flex items-center justify-center">i</span>
            </h3>

            <div className="flex-1 flex flex-col items-center justify-center relative mt-6 min-h-[140px]">
              <svg width="180" height="100" viewBox="0 0 180 100">
                <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke={borderSubtle(isDark)} strokeWidth="12" strokeLinecap="round" />
                <path d="M 20 90 A 70 70 0 0 1 80 23" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
                <path d="M 40 90 A 50 50 0 0 1 140 90" fill="none" stroke={borderSubtle(isDark)} strokeWidth="6" strokeLinecap="round" />
                <path d="M 40 90 A 50 50 0 0 1 100 45" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" />
              </svg>
              <div className="absolute bottom-4 text-center">
                <div className="text-2xl font-bold flex items-center justify-center gap-1" style={{ color: pri }}>
                  17.9% <span className="text-[10px] text-[#10b981] bg-[#10b981]/10 px-1 py-0.5 rounded">↑</span>
                </div>
                <div className="text-[10px]" style={{ color: sec }}>Since yesterday</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-gray-500/30 text-xs">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 font-medium" style={{ color: pri }}>
                  <span className="w-2.5 h-1 rounded-full" style={{ background: PrimaryAccent }}></span> Total Risks per day
                </div>
                <span style={{ color: sec }}>For week</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-1.5 font-medium" style={{ color: pri }}>
                  <span className="w-2.5 h-1 rounded-full" style={{ background: `${PrimaryAccent}50` }}></span> Average Risks
                </div>
                <span style={{ color: sec }}>For today</span>
              </div>
            </div>

            <div className="mt-auto flex justify-center border-t border-solid" style={{ borderColor: borderSubtle(isDark), margin: '0 -20px -20px', padding: '12px 0' }}>
              <button className="text-xs font-bold" style={{ color: pri }}>See Details →</button>
            </div>
          </CardWrapper>
        </div>

      </div>

      {/* Row 3: Heatmap & Top Risk Zones Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Hourly Visits Heatmap */}
        <div className="lg:col-span-1">
          <CardWrapper isDark={isDark} delay={0.7}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={{ borderColor: borderSubtle(isDark) }}>
                  <IconGauge />
                </div>
                <div>
                  <h3 className="text-xs font-semibold flex items-center gap-1.5" style={{ color: sec }}>
                    Hourly Visits <span className="w-3 h-3 rounded-full bg-gray-500/20 text-[8px] flex items-center justify-center">i</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-bold" style={{ color: pri }}>288,822</span>
                    <span className="text-[10px] px-1 py-0.5 rounded text-[#10b981] bg-[#10b981]/10">↑ 4%</span>
                  </div>
                </div>
              </div>
              <button className="p-1 rounded border animate-pulse" style={{ borderColor: borderSubtle(isDark), color: sec }}>...</button>
            </div>

            <div className="flex-1 mt-4">
              {['MON', 'TUE', 'WED'].map((day, i) => (
                <div key={day} className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] w-8 font-medium" style={{ color: mut }}>{day}</span>
                  <div className="flex-1 flex gap-1.5 h-4">
                    {[...Array(6)].map((_, j) => {
                      const isActive = (i === 0 && j === 1) || (i === 1 && j === 5) || (i === 2 && j === 3);
                      const opacity = isActive ? 1 : Math.max(0.1, Math.random() * 0.4);
                      const blockColor = isActive
                        ? (i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#10b981')
                        : PrimaryAccent;
                      return (
                        <div
                          key={j}
                          className="flex-1 rounded-full"
                          style={{ background: blockColor, opacity }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardWrapper>
        </div>

        {/* Top Risk Zones Table */}
        <div className="lg:col-span-2">
          <CardWrapper isDark={isDark} delay={0.8}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: pri }}>
                Top Risk Zones <span className="w-3 h-3 rounded-full bg-gray-500/20 text-[8px] flex items-center justify-center">i</span>
              </h3>
              <button className="text-xs font-bold" style={{ color: PrimaryAccent }}>See Details →</button>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-start gap-6">
              <div className="w-full md:w-[160px] rounded-xl p-4 border flex-shrink-0" style={{ borderColor: borderSubtle(isDark), background: 'rgba(var(--primary-rgb), 0.05)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--primary-rgb), 0.15)' }}>
                    <IconAlert />
                  </div>
                  <span className="font-bold text-[13px] leading-tight" style={{ color: pri }}>Zone A<br/>Manufacturing</span>
                </div>
                <div className="text-sm font-bold mb-2 text-[#ef4444]">Critical Risk</div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden mb-1.5">
                  <div className="h-full" style={{ width: '85%', background: '#ef4444' }}></div>
                </div>
                <div className="text-[9.5px]" style={{ color: mut }}>85% risk threshold reached</div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[320px]">
                  <thead>
                    <tr style={{ color: sec, borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                      <th className="pb-3 font-semibold">Zone</th>
                      <th className="pb-3 font-semibold">Incidents</th>
                      <th className="pb-3 font-semibold">Risk Score</th>
                      <th className="pb-3 font-semibold">Inspections</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredZones.map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                        <td className="py-3 font-bold" style={{ color: pri }}>{p.name}</td>
                        <td className="py-3 font-medium" style={{ color: pri }}>{p.val} <span style={{ color: mut }}>cases</span></td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{
                            background: p.metric === 'Critical' ? 'rgba(239, 68, 68, 0.12)' : p.metric === 'Moderate' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: p.metric === 'Critical' ? '#ef4444' : p.metric === 'Moderate' ? '#f59e0b' : '#10b981'
                          }}>
                            {p.metric}
                          </span>
                        </td>
                        <td className="py-3 font-medium" style={{ color: pri }}>{p.stock}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold" style={{
                            background: p.status === 'Active' ? '#ef444415' : '#10b98115',
                            color: p.status === 'Active' ? '#ef4444' : '#10b981'
                          }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardWrapper>
        </div>

      </div>

    </div>
  );
}
