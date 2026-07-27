'use client';



import React from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  LineChart, Line,
  Cell,
  Treemap,
  FunnelChart, Funnel, LabelList,
  Sankey, Tooltip as SankeyTooltip,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceArea,
} from 'recharts';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Dedicated MOBILE design for Charts / Recharts.
 *
 * The desktop page leans on interactions that don't translate to a phone: a
 * drag-to-zoom Brush, a funnel with right-hand labels that need horizontal
 * room, and a Sankey that requires ~520px. This mobile build instead: leads
 * with a KPI strip (the headline numbers, readable without squinting at a
 * chart), drops the Brush for a clean area chart, shrinks chart heights and
 * thins the x-axis ticks, and keeps the unavoidable-width Sankey in a labelled
 * swipe-to-scroll strip. Rendered by SafeRecharts below the `md` breakpoint.
 * ───────────────────────────────────────────────────────────────────────── */

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

/* ---------- data ---------- */
const days = Array.from({ length: 30 }, (_, i) => ({
  name: `${i + 1}`,
  views: Math.round(160 + 70 * Math.sin(i / 3.2) + ((i * 17) % 50) + i * 1.5),
}));
const avgViews = Math.round(days.reduce((s, d) => s + d.views, 0) / days.length);
const peakViews = Math.max(...days.map(d => d.views));

const treeData = [
  { name: 'Hosting', size: 4200 },
  { name: 'Storage', size: 3100 },
  { name: 'Compute', size: 2600 },
  { name: 'Network', size: 1800 },
  { name: 'Database', size: 1500 },
  { name: 'CDN', size: 900 },
  { name: 'Other', size: 620 },
];
const totalCost = treeData.reduce((s, d) => s + d.size, 0);

const thresholdData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((m, i) => ({
  name: m,
  latency: [180, 240, 210, 320, 290, 260, 350, 230][i],
}));

const sankeyData = {
  nodes: [
    { name: 'Direct' }, { name: 'Search' }, { name: 'Social' },
    { name: 'Landing' }, { name: 'Pricing' },
    { name: 'Sign-up' }, { name: 'Bounced' },
  ],
  links: [
    { source: 0, target: 3, value: 24 },
    { source: 1, target: 3, value: 32 },
    { source: 2, target: 4, value: 18 },
    { source: 3, target: 5, value: 30 },
    { source: 3, target: 6, value: 26 },
    { source: 4, target: 5, value: 12 },
    { source: 4, target: 6, value: 6 },
  ],
};

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
          <span style={{ marginLeft: 14, fontWeight: 700, color: textPrimary(isDark) }}>{p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- treemap cell ---------- */
function TreemapCell(props: any) {
  const { x, y, width, height, index, name, value, isDark, palette } = props;
  if (width === undefined) return null;
  const color = palette[index % palette.length];
  const stroke = isDark ? 'var(--background)' : 'rgba(255,255,255,0.7)';
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={8} ry={8} style={{ fill: color, fillOpacity: 0.9, stroke, strokeWidth: 3 }} />
      {width > 54 && height > 26 && (
        <text x={x + 9} y={y + 19} fontSize={11.5} fontWeight={700} fill="#fff">{name}</text>
      )}
      {width > 54 && height > 42 && (
        <text x={x + 9} y={y + 34} fontSize={10.5} fill="rgba(255,255,255,0.85)">{value}</text>
      )}
    </g>
  );
}

/* custom Sankey node that also draws a themed label */
function SankeyNode({ x, y, width, height, payload, isDark, colors }: any) {
  const depth = payload?.depth ?? 0;
  const isFirst = depth === 0;
  const color = [colors.indigo, colors.violet, colors.cyan][depth] ?? colors.indigo;
  const labelX = isFirst ? x - 8 : x + width + 8;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={3} ry={3} style={{ fill: color, fillOpacity: 0.92 }} />
      <text
        x={labelX}
        y={y + height / 2}
        textAnchor={isFirst ? 'end' : 'start'}
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
        fill={textSecondary(isDark)}
      >
        {payload?.name}
      </text>
    </g>
  );
}

export default function SafeRechartsMobile({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisTick = { fontSize: 10.5, fill: textSecondary(isDark) };
  const tip = <ChartTooltip isDark={isDark} />;

  const C = {
    indigo: primaryColor,
    violet: 'var(--accent-violet)',
    purple: 'var(--accent-indigo)',
    pink: 'var(--accent-pink)',
    cyan: 'var(--accent-cyan)',
    blue: 'var(--accent-sky)',
  };
  const PALETTE = [
    primaryColor,
    'var(--chart-10)',
    'var(--chart-11)',
    'var(--chart-9)',
    'var(--chart-3)',
    'var(--chart-2)',
    'var(--chart-5)',
    'var(--chart-6)',
    'var(--chart-7)',
    'var(--chart-8)',
    'var(--chart-4)',
    'var(--chart-12)',
  ];

  const funnelData = [
    { name: 'Visits', value: 9800, fill: C.indigo },
    { name: 'Sign-ups', value: 5400, fill: C.violet },
    { name: 'Trials', value: 3100, fill: C.purple },
    { name: 'Proposals', value: 1850, fill: C.pink },
    { name: 'Paid', value: 1120, fill: C.cyan },
  ];
  const conversion = ((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100).toFixed(1);

  // Nested donut (reliable on mobile; recharts SunburstChart renders blank at
  // this size). Inner ring = device, outer ring = operating system.
  const deviceData = [
    { name: 'Desktop', value: 62, fill: C.indigo },
    { name: 'Mobile', value: 38, fill: C.cyan },
  ];
  const osData = [
    { name: 'Windows', value: 34, fill: primaryColor },
    { name: 'macOS', value: 22, fill: '#a5b4fc' },
    { name: 'Linux', value: 6, fill: '#c7d2fe' },
    { name: 'iOS', value: 24, fill: '#22d3ee' },
    { name: 'Android', value: 14, fill: '#67e8f9' },
  ];

  // ── compact section card ────────────────────────────────────────────────
  const Card = ({ title, subtitle, legend, children }: { title: string; subtitle?: string; legend?: { label: string; color: string }[]; children: React.ReactNode }) => (
    <motion.section variants={fadeUp} className="p-4 rounded-3xl" style={glassStyle(isDark)}>
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14.5px] font-bold leading-tight" style={{ color: pri }}>{title}</h3>
          {legend && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end shrink-0">
              {legend.map(l => (
                <span key={l.label} className="inline-flex items-center gap-1.5 text-[10.5px] font-medium" style={{ color: mut }}>
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} /> {l.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {subtitle && <p className="text-[11px] mt-1" style={{ color: mut }}>{subtitle}</p>}
      </div>
      {children}
    </motion.section>
  );

  // ── KPI chip ─────────────────────────────────────────────────────────────
  const Stat = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
    <div className="p-3.5 rounded-2xl min-w-0" style={glassStyle(isDark)}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
        <span className="text-[10.5px] font-medium truncate" style={{ color: mut }}>{label}</span>
      </div>
      <p className="text-[19px] font-bold leading-none" style={{ color: pri }}>{value}</p>
    </div>
  );

  return (
    <motion.div
      className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-5 pb-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-5 min-w-0">
        <p className="text-[11px] font-medium mb-1" style={{ color: mut }}>Charts / Recharts</p>
        <h2 className="text-[26px] font-bold leading-none" style={{ color: pri, letterSpacing: '-0.02em' }}>Recharts</h2>
        <p className="text-[12.5px] mt-2" style={{ color: sec }}>Key metrics & charts, tuned for mobile.</p>
      </motion.div>

      {/* KPI strip */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3 mb-5">
        <Stat label="Avg Page Views" value={avgViews.toLocaleString()} accent={C.indigo} />
        <Stat label="Peak Views" value={peakViews.toLocaleString()} accent={C.cyan} />
        <Stat label="Conversion" value={`${conversion}%`} accent={C.pink} />
        <Stat label="Cloud Spend" value={`$${(totalCost / 1000).toFixed(1)}k`} accent={C.purple} />
      </motion.div>

      <div className="flex flex-col gap-4 min-w-0">

        {/* Area — no brush on mobile, sparse ticks */}
        <Card title="Page Views" subtitle="Daily views over the last 30 days">
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <AreaChart data={days} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="rcmViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.indigo} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={6} interval={5} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={34} />
                <Tooltip content={tip} cursor={{ stroke: C.indigo, strokeOpacity: 0.3 }} />
                <ReferenceLine y={avgViews} stroke={C.pink} strokeDasharray="5 4" />
                <Area type="monotone" dataKey="views" name="Views" stroke={C.indigo} strokeWidth={2.5} fill="url(#rcmViews)" activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Treemap */}
        <Card title="Infrastructure Cost" subtitle="Spend by service (treemap)">
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <Treemap data={treeData} dataKey="size" nameKey="name" isAnimationActive content={<TreemapCell isDark={isDark} palette={PALETTE} />}>
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Funnel — trimmed right margin so labels fit a phone */}
        <Card title="Conversion Funnel" subtitle="Visitors → paying customers">
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <FunnelChart margin={{ top: 6, right: 76, left: 4, bottom: 6 }}>
                <Tooltip content={tip} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive stroke="none">
                  {funnelData.map(d => <Cell key={d.name} fill={d.fill} />)}
                  <LabelList position="right" dataKey="name" fill={textSecondary(isDark)} stroke="none" fontSize={11} fontWeight={600} />
                  <LabelList position="center" dataKey="value" fill="#fff" stroke="none" fontSize={11} fontWeight={700} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Nested donut: device → OS */}
        <Card
          title="Device & OS"
          subtitle="Share by device & operating system"
          legend={[{ label: 'Desktop', color: C.indigo }, { label: 'Mobile', color: C.cyan }]}
        >
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip content={<ChartTooltip isDark={isDark} suffix="%" />} />
                <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={2} stroke="none">
                  {deviceData.map(d => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Pie data={osData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={68} outerRadius={92} paddingAngle={1.5} stroke="none">
                  {osData.map(d => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center">
            {osData.map(o => (
              <span key={o.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: o.fill }} /> {o.name} {o.value}%
              </span>
            ))}
          </div>
        </Card>

        {/* Line */}
        <Card title="Response Time" subtitle="With SLA threshold & safe band">
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <LineChart data={thresholdData} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} width={34} />
                <Tooltip content={<ChartTooltip isDark={isDark} suffix=" ms" />} cursor={{ stroke: grid }} />
                <ReferenceArea y1={0} y2={300} fill={C.cyan} fillOpacity={0.08} />
                <ReferenceLine y={300} stroke={C.pink} strokeDasharray="5 4" label={{ value: 'SLA 300ms', position: 'insideTopRight', fill: C.pink, fontSize: 10, fontWeight: 700 }} />
                <Line type="monotone" dataKey="latency" name="Latency" stroke={C.indigo} strokeWidth={2.5} dot={{ r: 3, fill: C.indigo, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sankey — keeps its natural width, swipe to explore */}
        <Card title="Traffic Flow" subtitle="Source → outcome · swipe to explore">
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div style={{ width: 520, height: 280 }}>
              <ResponsiveContainer>
                <Sankey
                  data={sankeyData}
                  nodePadding={24}
                  nodeWidth={12}
                  margin={{ top: 12, right: 88, bottom: 12, left: 70 }}
                  node={((nodeProps: any) => <SankeyNode {...nodeProps} isDark={isDark} colors={C} />) as any}
                  link={{ stroke: C.violet, strokeOpacity: 0.18 } as any}
                >
                  <SankeyTooltip content={<ChartTooltip isDark={isDark} />} />
                </Sankey>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

      </div>
    </motion.div>
  );
}
