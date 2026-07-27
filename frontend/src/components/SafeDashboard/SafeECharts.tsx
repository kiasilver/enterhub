'use client';


import React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  ComposedChart, Bar, Line,
  BarChart,
  ScatterChart, Scatter, ZAxis,
  RadialBarChart, RadialBar, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
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

/* ---------- data ---------- */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const stackData = MONTHS.map((m, i) => ({
  name: m,
  organic: [30, 38, 34, 45, 42, 55, 50, 62][i],
  paid: [20, 24, 22, 30, 28, 36, 33, 40][i],
  referral: [12, 15, 13, 18, 17, 22, 20, 26][i],
}));
const comboData = MONTHS.slice(0, 6).map((m, i) => ({
  name: m,
  revenue: [320, 410, 380, 520, 480, 610][i],
  margin: [22, 28, 25, 34, 31, 39][i],
}));
const rankData = [
  { name: 'Aurora', value: 920 },
  { name: 'Nimbus', value: 760 },
  { name: 'Vertex', value: 640 },
  { name: 'Halcyon', value: 510 },
  { name: 'Pulse', value: 380 },
].reverse();
const scatterA = Array.from({ length: 18 }, (_, i) => ({ x: 10 + i * 4 + ((i * 13) % 9), y: 20 + ((i * 27) % 60) + (i % 3) * 6, z: 120 + ((i * 37) % 200) }));
const scatterB = Array.from({ length: 16 }, (_, i) => ({ x: 14 + i * 4 + ((i * 7) % 8), y: 40 + ((i * 19) % 55) + (i % 4) * 5, z: 100 + ((i * 53) % 220) }));
const gaugeValue = 72;
const compData = [
  { name: 'Team A', design: 40, dev: 35, qa: 25 },
  { name: 'Team B', design: 30, dev: 45, qa: 25 },
  { name: 'Team C', design: 50, dev: 30, qa: 20 },
  { name: 'Team D', design: 35, dev: 40, qa: 25 },
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

/* ---------- card ---------- */
function Card({ isDark, title, subtitle, legend, children, className = '' }: { isDark: boolean; title: string; subtitle?: string; legend?: { label: string; color: string }[]; children: React.ReactNode; className?: string }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className={`p-5 sm:p-6 rounded-3xl ${className}`} style={glassStyle(isDark)}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: pri }}>{title}</h3>
          {subtitle && <p className="text-[11.5px] mt-0.5" style={{ color: mut }}>{subtitle}</p>}
        </div>
        {legend && (
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 justify-end">
            {legend.map(l => (
              <span key={l.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} /> {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
      {children}
    </motion.section>
  );
}

export default function SafeECharts({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const C = {
    indigo: primaryColor,
    violet: 'var(--accent-violet)',
    purple: 'var(--accent-indigo)',
    pink: 'var(--accent-pink)',
    cyan: 'var(--accent-cyan)',
    blue: 'var(--accent-sky)',
  };
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisTick = { fontSize: 11, fill: textSecondary(isDark) };
  const tip = <ChartTooltip isDark={isDark} />;
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const gaugeTrack = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-5xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Charts / ECharts</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>ECharts</h2>
      </motion.div>

      <div className="max-w-5xl grid gap-5">

        {/* Hero stacked area */}
        <Card
          isDark={isDark}
          title="Acquisition Channels"
          subtitle="Stacked traffic by source"
          legend={[{ label: 'Organic', color: C.indigo }, { label: 'Paid', color: C.violet }, { label: 'Referral', color: C.cyan }]}
        >
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={stackData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="sOrg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.indigo} stopOpacity={0.5} /><stop offset="100%" stopColor={C.indigo} stopOpacity={0.05} /></linearGradient>
                  <linearGradient id="sPaid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.violet} stopOpacity={0.5} /><stop offset="100%" stopColor={C.violet} stopOpacity={0.05} /></linearGradient>
                  <linearGradient id="sRef" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.5} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0.05} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip content={tip} cursor={{ stroke: grid }} />
                <Area type="monotone" dataKey="organic" name="Organic" stackId="1" stroke={C.indigo} strokeWidth={2} fill="url(#sOrg)" />
                <Area type="monotone" dataKey="paid" name="Paid" stackId="1" stroke={C.violet} strokeWidth={2} fill="url(#sPaid)" />
                <Area type="monotone" dataKey="referral" name="Referral" stackId="1" stroke={C.cyan} strokeWidth={2} fill="url(#sRef)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Combo + Horizontal bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            isDark={isDark}
            title="Revenue & Margin"
            subtitle="Bars with an overlaid trend line"
            legend={[{ label: 'Revenue', color: C.violet }, { label: 'Margin %', color: C.pink }]}
          >
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <ComposedChart data={comboData} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={tip} cursor={{ stroke: grid }} />
                  <Bar yAxisId="l" dataKey="revenue" name="Revenue" fill={C.violet} radius={[6, 6, 0, 0]} maxBarSize={30} />
                  <Line yAxisId="r" type="monotone" dataKey="margin" name="Margin %" stroke={C.pink} strokeWidth={2.5} dot={{ r: 3, fill: C.pink, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card isDark={isDark} title="Top Products" subtitle="Units sold this quarter">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart layout="vertical" data={rankData} margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisTick, fontSize: 12 }} width={64} />
                  <Tooltip content={tip} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="value" name="Units" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {rankData.map((_, i) => <Cell key={i} fill={[C.cyan, C.blue, C.indigo, C.violet, C.purple][i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Scatter + Gauge + Stacked bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card
            isDark={isDark}
            title="Correlation"
            subtitle="Spend vs conversions"
            legend={[{ label: 'Cohort A', color: C.indigo }, { label: 'Cohort B', color: C.pink }]}
          >
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                  <XAxis type="number" dataKey="x" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis type="number" dataKey="y" axisLine={false} tickLine={false} tick={axisTick} />
                  <ZAxis type="number" dataKey="z" range={[40, 260]} />
                  <Tooltip content={tip} cursor={{ strokeDasharray: '3 3', stroke: grid }} />
                  <Scatter name="Cohort A" data={scatterA} fill={C.indigo} fillOpacity={0.7} />
                  <Scatter name="Cohort B" data={scatterB} fill={C.pink} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card isDark={isDark} title="Satisfaction" subtitle="Overall CSAT score">
            <div className="relative" style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <RadialBarChart cx="50%" cy="68%" innerRadius="78%" outerRadius="118%" startAngle={180} endAngle={0} data={[{ value: gaugeValue }]}>
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: gaugeTrack }} dataKey="value" cornerRadius={12} fill={C.indigo} angleAxisId={0} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '14%' }}>
                <span className="text-[30px] font-bold" style={{ color: pri }}>{gaugeValue}</span>
                <span className="text-[10.5px]" style={{ color: mut }}>out of 100</span>
              </div>
            </div>
          </Card>

          <Card
            isDark={isDark}
            title="Effort Split"
            subtitle="Per team breakdown"
            legend={[{ label: 'Design', color: C.indigo }, { label: 'Dev', color: C.violet }, { label: 'QA', color: C.cyan }]}
          >
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={compData} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...axisTick, fontSize: 10 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={tip} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="design" name="Design" stackId="s" fill={C.indigo} maxBarSize={30} />
                  <Bar dataKey="dev" name="Dev" stackId="s" fill={C.violet} maxBarSize={30} />
                  <Bar dataKey="qa" name="QA" stackId="s" fill={C.cyan} radius={[6, 6, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
