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
  XAxis, YAxis, CartesianGrid, Tooltip, Brush,
  ReferenceLine, ReferenceArea,
} from 'recharts';
import { textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useIsMobile } from './useIsMobile';
import SafeRechartsMobile from './SafeRechartsMobile';

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
const days = Array.from({ length: 30 }, (_, i) => ({
  name: `${i + 1}`,
  views: Math.round(160 + 70 * Math.sin(i / 3.2) + ((i * 17) % 50) + i * 1.5),
}));
const avgViews = Math.round(days.reduce((s, d) => s + d.views, 0) / days.length);

const treeData = [
  { name: 'Hosting', size: 4200 },
  { name: 'Storage', size: 3100 },
  { name: 'Compute', size: 2600 },
  { name: 'Network', size: 1800 },
  { name: 'Database', size: 1500 },
  { name: 'CDN', size: 900 },
  { name: 'Other', size: 620 },
];

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
          <span style={{ marginLeft: 18, fontWeight: 700, color: textPrimary(isDark) }}>{p.value}{suffix}</span>
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
      {width > 60 && height > 28 && (
        <text x={x + 11} y={y + 21} fontSize={12} fontWeight={700} fill="#fff">{name}</text>
      )}
      {width > 60 && height > 46 && (
        <text x={x + 11} y={y + 37} fontSize={11} fill="rgba(255,255,255,0.85)">{value}</text>
      )}
    </g>
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

/* custom Sankey node that also draws a themed label (default node has no text) */
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

function SafeRechartsDesktop({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisTick = { fontSize: 11, fill: textSecondary(isDark) };
  const tip = <ChartTooltip isDark={isDark} />;
  const brushBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

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

  // Nested donut (recharts SunburstChart renders blank at these sizes — see
  // memory recharts-sunburst-blank). Inner ring = device, outer ring = OS.
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

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 py-5 sm:py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-5xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Charts / Recharts</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Recharts</h2>
      </motion.div>

      <div className="max-w-5xl grid gap-5">

        {/* Hero: area with interactive brush + reference line */}
        <Card isDark={isDark} title="Page Views" subtitle="Drag the brush below to zoom into a date range">
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={days} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="rcViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.indigo} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={6} interval={3} />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                <Tooltip content={tip} cursor={{ stroke: C.indigo, strokeOpacity: 0.3 }} />
                <ReferenceLine y={avgViews} stroke={C.pink} strokeDasharray="5 4" label={{ value: `avg ${avgViews}`, position: 'right', fill: C.pink, fontSize: 10, fontWeight: 700 }} />
                <Area type="monotone" dataKey="views" name="Views" stroke={C.indigo} strokeWidth={2.5} fill="url(#rcViews)" activeDot={{ r: 5, strokeWidth: 0 }} />
                <Brush dataKey="name" height={26} stroke={C.indigo} fill={brushBg} travellerWidth={8} startIndex={6} endIndex={22} tickFormatter={() => ''} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Treemap + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card isDark={isDark} title="Infrastructure Cost" subtitle="Spend by service (treemap)">
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <Treemap data={treeData} dataKey="size" nameKey="name" isAnimationActive content={<TreemapCell isDark={isDark} palette={PALETTE} />}>
                  <Tooltip content={<ChartTooltip isDark={isDark} />} />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card isDark={isDark} title="Conversion Funnel" subtitle="Visitors → paying customers">
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <FunnelChart margin={{ top: 6, right: 90, left: 8, bottom: 6 }}>
                  <Tooltip content={tip} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive stroke="none">
                    {funnelData.map(d => <Cell key={d.name} fill={d.fill} />)}
                    <LabelList position="right" dataKey="name" fill={textSecondary(isDark)} stroke="none" fontSize={12} fontWeight={600} />
                    <LabelList position="center" dataKey="value" fill="#fff" stroke="none" fontSize={11.5} fontWeight={700} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Nested donut + Threshold line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card
            isDark={isDark}
            title="Device & OS"
            subtitle="Share by device & operating system"
            legend={[{ label: 'Desktop', color: C.indigo }, { label: 'Mobile', color: C.cyan }]}
          >
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip content={<ChartTooltip isDark={isDark} suffix="%" />} />
                  <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={2} stroke="none">
                    {deviceData.map(d => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Pie data={osData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={86} outerRadius={114} paddingAngle={1.5} stroke="none">
                    {osData.map(d => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
              {osData.map(o => (
                <span key={o.name} className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: mut }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: o.fill }} /> {o.name} {o.value}%
                </span>
              ))}
            </div>
          </Card>

          <Card isDark={isDark} title="Response Time" subtitle="With SLA threshold & safe band">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={thresholdData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} />
                  <Tooltip content={<ChartTooltip isDark={isDark} suffix=" ms" />} cursor={{ stroke: grid }} />
                  <ReferenceArea y1={0} y2={300} fill={C.cyan} fillOpacity={0.08} />
                  <ReferenceLine y={300} stroke={C.pink} strokeDasharray="5 4" label={{ value: 'SLA 300ms', position: 'insideTopRight', fill: C.pink, fontSize: 10, fontWeight: 700 }} />
                  <Line type="monotone" dataKey="latency" name="Latency" stroke={C.indigo} strokeWidth={2.5} dot={{ r: 3, fill: C.indigo, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Sankey */}
        <Card isDark={isDark} title="Traffic Flow" subtitle="How visitors move from source to outcome">
          <div className="overflow-x-auto no-scrollbar">
          <div style={{ width: '100%', minWidth: 520, height: 300 }}>
            <ResponsiveContainer>
              <Sankey
                data={sankeyData}
                nodePadding={26}
                nodeWidth={12}
                margin={{ top: 12, right: 92, bottom: 12, left: 74 }}
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

export default function SafeRecharts({ isDark }: Props) {
  // Below the `md` breakpoint, swap the desktop chart grid (drag-zoom brush,
  // right-labelled funnel, wide Sankey) for the purpose-built mobile screen.
  const isMobile = useIsMobile(768);
  if (isMobile) return <SafeRechartsMobile isDark={isDark} />;
  return <SafeRechartsDesktop isDark={isDark} />;
}
