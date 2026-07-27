'use client';


import React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
const areaData = MONTHS.map((m, i) => ({ name: m, revenue: [42, 55, 48, 67, 60, 78, 72, 90][i], expenses: [30, 38, 34, 45, 40, 52, 48, 58][i] }));
const lineData = MONTHS.map((m, i) => ({ name: m, visitors: [120, 145, 130, 178, 165, 210, 198, 240][i], signups: [40, 55, 48, 72, 68, 95, 88, 110][i], active: [80, 92, 85, 120, 110, 150, 140, 175][i] }));
const barData = [
  { name: 'Q1', thisYear: 320, lastYear: 240 },
  { name: 'Q2', thisYear: 410, lastYear: 300 },
  { name: 'Q3', thisYear: 380, lastYear: 350 },
  { name: 'Q4', thisYear: 520, lastYear: 410 },
];
const donutData = [
  { name: 'Direct', value: 38 },
  { name: 'Organic', value: 27 },
  { name: 'Referral', value: 18 },
  { name: 'Social', value: 11 },
  { name: 'Email', value: 6 },
];
const radarData = [
  { metric: 'Speed', a: 88, b: 70 },
  { metric: 'Reliability', a: 75, b: 82 },
  { metric: 'Security', a: 92, b: 78 },
  { metric: 'UX', a: 80, b: 88 },
  { metric: 'Support', a: 68, b: 74 },
  { metric: 'Value', a: 84, b: 66 },
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
      {label !== undefined && <p style={{ fontSize: 11, fontWeight: 700, color: textPrimary(isDark), marginBottom: 5 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, marginTop: i ? 3 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 3, background: p.color || p.payload?.fill }} />
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

export default function SafeApexCharts({ isDark }: Props) {
  const { primaryColor } = useTheme();

  /* coordinated cool palette — 12-colour brand system */
  const C = {
    indigo: primaryColor,
    violet: 'var(--accent-violet)',
    purple: 'var(--accent-indigo)',
    pink: 'var(--accent-pink)',
    cyan: 'var(--accent-cyan)',
    blue: 'var(--accent-sky)',
  };
  const DONUT = [
    primaryColor,
    'var(--accent-violet)',
    'var(--accent-indigo)',
    'var(--accent-pink)',
    'var(--accent-cyan)',
    'var(--accent-emerald)',
  ];
  const radialData = [
    { name: 'Mobile', value: 82, fill: C.indigo },
    { name: 'Tablet', value: 64, fill: C.violet },
    { name: 'Desktop', value: 47, fill: C.cyan },
  ];

  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisTick = { fontSize: 11, fill: textSecondary(isDark) };
  const tip = <ChartTooltip isDark={isDark} />;
  const tipPct = <ChartTooltip isDark={isDark} suffix="%" />;
  const cursorFill = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-5xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Charts / Apex Charts</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Apex Charts</h2>
      </motion.div>

      <div className="max-w-5xl grid gap-5">

        {/* Hero area chart */}
        <Card
          isDark={isDark}
          title="Revenue Overview"
          subtitle="Monthly revenue vs expenses"
          legend={[{ label: 'Revenue', color: C.indigo }, { label: 'Expenses', color: C.cyan }]}
        >
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={areaData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.indigo} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.cyan} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip content={tip} cursor={{ stroke: C.indigo, strokeOpacity: 0.3 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.indigo} strokeWidth={2.5} fill="url(#gRev)" activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke={C.cyan} strokeWidth={2.5} fill="url(#gExp)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Line + Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            isDark={isDark}
            title="Engagement"
            subtitle="Visitors, sign-ups & active users"
            legend={[{ label: 'Visitors', color: C.indigo }, { label: 'Sign-ups', color: C.violet }, { label: 'Active', color: C.pink }]}
          >
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={lineData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={tip} cursor={{ stroke: grid }} />
                  <Line type="monotone" dataKey="visitors" name="Visitors" stroke={C.indigo} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="signups" name="Sign-ups" stroke={C.violet} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="active" name="Active" stroke={C.pink} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card
            isDark={isDark}
            title="Quarterly Sales"
            subtitle="This year vs last year"
            legend={[{ label: 'This year', color: C.indigo }, { label: 'Last year', color: C.violet }]}
          >
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={tip} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="thisYear" name="This year" fill={C.indigo} radius={[6, 6, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="lastYear" name="Last year" fill={C.violet} radius={[6, 6, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Donut + Radial + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Donut */}
          <Card isDark={isDark} title="Traffic Sources" subtitle="Where visitors come from">
            <div className="relative" style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip content={tipPct} />
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
                    {donutData.map((d, i) => <Cell key={d.name} fill={DONUT[i % DONUT.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[22px] font-bold" style={{ color: pri }}>{donutTotal}%</span>
                <span className="text-[10.5px]" style={{ color: mut }}>total</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 justify-center mt-3">
              {donutData.map((d, i) => (
                <span key={d.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: DONUT[i % DONUT.length] }} /> {d.name}
                </span>
              ))}
            </div>
          </Card>

          {/* Radial */}
          <Card isDark={isDark} title="Device Usage" subtitle="Share by device type">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <RadialBarChart data={radialData} cx="50%" cy="50%" innerRadius="32%" outerRadius="100%" startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" background={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} cornerRadius={10} />
                  <Tooltip content={tipPct} cursor={{ stroke: grid }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 justify-center mt-1">
              {radialData.map(d => (
                <span key={d.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.fill }} /> {d.name}
                </span>
              ))}
            </div>
          </Card>

          {/* Radar */}
          <Card
            isDark={isDark}
            title="Performance"
            subtitle="Current vs target"
            legend={[{ label: 'Current', color: C.indigo }, { label: 'Target', color: C.pink }]}
          >
            <div style={{ width: '100%', height: 270 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={grid} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10.5, fill: textSecondary(isDark) }} />
                  <Tooltip content={tip} cursor={{ stroke: grid }} />
                  <Radar name="Current" dataKey="a" stroke={C.indigo} fill={C.indigo} fillOpacity={0.35} strokeWidth={2} />
                  <Radar name="Target" dataKey="b" stroke={C.pink} fill={C.pink} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

      </div>
    </motion.div>
  );
}
