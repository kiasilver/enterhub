'use client';


import React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  ComposedChart,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity, Zap } from 'lucide-react';
import { textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

// Non-primary palette colours stay fixed; the indigo "primary" entry is built
// from the live theme inside the component (see SafeChartjs).
const PALETTE = {
  violet: 'var(--accent-violet)',
  purple: 'var(--accent-indigo)',
  pink: 'var(--accent-pink)',
  cyan: 'var(--accent-cyan)',
};
const UP = 'var(--accent-emerald)';
const DOWN = 'var(--accent-rose)';

interface Kpi {
  key: string;
  Icon: typeof DollarSign;
  label: string;
  value: string;
  delta: string;
  up: boolean;
  color: string;
  data: { v: number }[];
}

/* ---------- data ---------- */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const spark = (arr: number[]) => arr.map(v => ({ v }));
const dualData = MONTHS.map((m, i) => ({ name: m, sales: [320, 410, 360, 520, 470, 610, 560, 690][i], conversion: [2.4, 3.1, 2.8, 4.2, 3.7, 4.9, 4.4, 5.6][i] }));
const groupData = [
  { name: 'Q1', americas: 320, europe: 240, asia: 180 },
  { name: 'Q2', americas: 410, europe: 300, asia: 240 },
  { name: 'Q3', americas: 380, europe: 350, asia: 290 },
  { name: 'Q4', americas: 520, europe: 410, asia: 360 },
];
const pieData = [
  { name: 'Chrome', value: 64 },
  { name: 'Safari', value: 18 },
  { name: 'Edge', value: 9 },
  { name: 'Firefox', value: 6 },
  { name: 'Other', value: 3 },
];
const stepData = MONTHS.map((m, i) => ({ name: m, price: [10, 10, 14, 14, 14, 20, 20, 26][i] }));
const compData = [
  { name: 'Engineering', design: 22, build: 58, test: 20 },
  { name: 'Marketing', design: 45, build: 35, test: 20 },
  { name: 'Product', design: 38, build: 40, test: 22 },
  { name: 'Operations', design: 18, build: 52, test: 30 },
];

/* ---------- themed tooltip ---------- */
function ChartTooltip({ active, payload, label, isDark, suffix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: panelFill(isDark),
        border: `1px solid ${borderSubtle(isDark)}`,
        borderRadius: 12,
        padding: '8px 12px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.45)' : '0 12px 32px rgba(0,0,0,0.12)',
      }}
    >
      {label !== undefined && label !== '' && <p style={{ fontSize: 11, fontWeight: 700, color: textPrimary(isDark), marginBottom: 5 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, marginTop: i ? 3 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.fill || p.payload?.fill }} />
          <span style={{ color: textSecondary(isDark) }}>{p.name}</span>
          <span style={{ marginLeft: 18, fontWeight: 700, color: textPrimary(isDark) }}>{p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- KPI stat card with sparkline ---------- */
function StatCard({ isDark, kpi }: { isDark: boolean; kpi: Kpi }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const Delta = kpi.up ? ArrowUpRight : ArrowDownRight;
  const deltaColor = kpi.up ? UP : DOWN;
  const gid = `spark-${kpi.key}`;
  return (
    <motion.section variants={fadeUp} className="p-5 rounded-3xl overflow-hidden" style={glassStyle(isDark)}>
      <div className="flex items-center justify-between mb-3">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}22`, color: kpi.color }}>
          <kpi.Icon size={17} />
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-lg" style={{ background: `${deltaColor}18`, color: deltaColor }}>
          <Delta size={12} /> {kpi.delta}
        </span>
      </div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: mut }}>{kpi.label}</p>
      <p className="text-[23px] font-bold mt-0.5" style={{ color: pri, letterSpacing: '-0.01em' }}>{kpi.value}</p>
      <div style={{ width: '100%', height: 42, marginTop: 6 }}>
        <ResponsiveContainer>
          <AreaChart data={kpi.data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={kpi.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

/* ---------- card ---------- */
function Card({ isDark, title, subtitle, legend, right, children, className = '' }: { isDark: boolean; title: string; subtitle?: string; legend?: { label: string; color: string }[]; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className={`p-5 sm:p-6 rounded-3xl ${className}`} style={glassStyle(isDark)}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: pri }}>{title}</h3>
          {subtitle && <p className="text-[11.5px] mt-0.5" style={{ color: mut }}>{subtitle}</p>}
        </div>
        {right ?? (legend && (
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 justify-end">
            {legend.map(l => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
        ))}
      </div>
      {children}
    </motion.section>
  );
}

export default function SafeChartjs({ isDark }: Props) {
  const { primaryColor } = useTheme();
  // Palette with the live primary; non-primary entries are fixed.
  const C = {
    indigo: primaryColor,
    violet: PALETTE.violet,
    purple: PALETTE.purple,
    pink: PALETTE.pink,
    cyan: PALETTE.cyan,
  };
  const PIE_COLORS = [C.indigo, C.violet, C.purple, C.pink, C.cyan];
  const KPIS: Kpi[] = [
    { key: 'rev', Icon: DollarSign, label: 'Revenue', value: '$48.2k', delta: '12.4%', up: true, color: C.indigo, data: spark([28, 34, 30, 42, 38, 50, 47, 58]) },
    { key: 'users', Icon: Users, label: 'Active Users', value: '8,940', delta: '8.1%', up: true, color: C.violet, data: spark([40, 44, 41, 52, 49, 60, 57, 66]) },
    { key: 'conv', Icon: Activity, label: 'Conversion', value: '5.6%', delta: '2.3%', up: true, color: C.cyan, data: spark([3.1, 2.8, 3.4, 3.2, 4.1, 3.9, 4.6, 5.6]) },
    { key: 'aov', Icon: Zap, label: 'Avg. Order', value: '$126', delta: '1.7%', up: false, color: C.pink, data: spark([140, 132, 138, 130, 134, 128, 130, 126]) },
  ];
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisTick = { fontSize: 11, fill: textSecondary(isDark) };
  const tip = <ChartTooltip isDark={isDark} />;
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent, index }: any) => {
    const RAD = Math.PI / 180;
    const r = outerRadius + 18;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);
    if (percent < 0.04) return null;
    return (
      <text x={x} y={y} fill={PIE_COLORS[index % PIE_COLORS.length]} fontSize={11} fontWeight={700} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {Math.round(percent * 100)}%
      </text>
    );
  };

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-5xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Charts / Chartjs</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Chart.js</h2>
      </motion.div>

      <div className="max-w-5xl grid gap-5">

        {/* KPI row with sparklines */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {KPIS.map(k => <StatCard key={k.key} isDark={isDark} kpi={k} />)}
        </div>

        {/* Hero combo: gradient area + trend line */}
        <Card
          isDark={isDark}
          title="Sales & Conversion"
          subtitle="Volume with conversion-rate trend"
          right={
            <div className="text-right">
              <p className="text-[22px] font-bold leading-none" style={{ color: pri }}>$4.54k</p>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold mt-1" style={{ color: UP }}>
                <ArrowUpRight size={12} /> 14.2% this period
              </span>
            </div>
          }
        >
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.indigo }} /> Sales</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: C.pink }} /> Conversion %</span>
          </div>
          <div style={{ width: '100%', height: 290 }}>
            <ResponsiveContainer>
              <ComposedChart data={dualData} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="cjHero" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.indigo} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={axisTick} />
                <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip content={tip} cursor={{ stroke: C.indigo, strokeOpacity: 0.3 }} />
                <Area yAxisId="l" type="monotone" dataKey="sales" name="Sales" stroke={C.indigo} strokeWidth={2.5} fill="url(#cjHero)" activeDot={{ r: 5, strokeWidth: 0 }} />
                <Line yAxisId="r" type="monotone" dataKey="conversion" name="Conversion %" stroke={C.pink} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Grouped bar + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            isDark={isDark}
            title="Sales by Region"
            subtitle="Three regions across quarters"
            legend={[{ label: 'Americas', color: C.indigo }, { label: 'Europe', color: C.violet }, { label: 'Asia', color: C.cyan }]}
          >
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={groupData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }} barGap={4} barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={tip} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="americas" name="Americas" fill={C.indigo} radius={[5, 5, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="europe" name="Europe" fill={C.violet} radius={[5, 5, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="asia" name="Asia" fill={C.cyan} radius={[5, 5, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card isDark={isDark} title="Browser Share" subtitle="Visitors by browser">
            <div className="relative" style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip content={<ChartTooltip isDark={isDark} suffix="%" />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={56} outerRadius={86} paddingAngle={3} label={renderPieLabel} labelLine={false} stroke="none">
                    {pieData.map((d, i) => <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[20px] font-bold" style={{ color: pri }}>{pieData[0].value}%</span>
                <span className="text-[10px]" style={{ color: mut }}>Chrome</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 justify-center mt-1">
              {pieData.map((d, i) => (
                <span key={d.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} /> {d.name}
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Stepped + 100% stacked horizontal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card isDark={isDark} title="Pricing Tiers" subtitle="Stepped plan changes over time">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={stepData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cjStep" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.violet} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={C.violet} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={<ChartTooltip isDark={isDark} suffix="$" />} cursor={{ stroke: grid }} />
                  <Line type="stepAfter" dataKey="price" name="Price" stroke={C.violet} strokeWidth={2.5} dot={{ r: 3, fill: C.violet, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            isDark={isDark}
            title="Workload Split"
            subtitle="100% stacked per team"
            legend={[{ label: 'Design', color: C.indigo }, { label: 'Build', color: C.violet }, { label: 'Test', color: C.cyan }]}
          >
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={compData} stackOffset="expand" margin={{ top: 0, right: 8, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" hide domain={[0, 1]} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisTick, fontSize: 10.5 }} width={86} />
                  <Tooltip content={tip} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="design" name="Design" stackId="s" fill={C.indigo} maxBarSize={20} radius={[5, 0, 0, 5]} />
                  <Bar dataKey="build" name="Build" stackId="s" fill={C.violet} maxBarSize={20} />
                  <Bar dataKey="test" name="Test" stackId="s" fill={C.cyan} maxBarSize={20} radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
