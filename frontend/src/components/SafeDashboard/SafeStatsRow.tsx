'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView, animate } from 'motion/react';
import { Activity, ShieldCheck, ClipboardList, GraduationCap } from 'lucide-react';
import { textPrimary, textSecondary, surfaceItem } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

export type SafeStatItem = {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accentColor?: string;
  icon?: React.ComponentType<{ size?: number | string; strokeWidth?: number }>;
  trend?: number;
};

interface SafeStatsRowProps {
  isDark: boolean;
  /** When provided, replaces the demo safety KPIs (product dashboards). */
  stats?: SafeStatItem[];
}

function AnimatedNumber({ to }: { to: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = nodeRef.current;
    if (node) {
      const controls = animate(0, to, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate(value) {
          node.textContent = Number.isInteger(to)
            ? Math.round(value).toString()
            : value.toFixed(1).replace(/\.0$/, '');
        },
      });
      return () => controls.stop();
    }
  }, [to]);
  return <span ref={nodeRef}>{to}</span>;
}

interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  sub: string;
  accentColor: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number }>;
  trend?: number;
  index: number;
  isDark: boolean;
}

function StatCard({ label, value, unit, sub, accentColor, icon: Icon, trend, index, isDark }: StatCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numValue = parseFloat(value);
  const isNumeric = !Number.isNaN(numValue) && /^-?\d+(\.\d+)?$/.test(value.trim());

  const bg = surfaceItem(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPri = textPrimary(isDark);
  const textSec = textSecondary(isDark);
  const textMut = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-[18px] p-5 flex flex-col justify-between h-[155px] transition-colors"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: textSec }}>
          {label}
        </h3>
        <motion.div
          whileHover={{ scale: 1.12, rotate: 6 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 cursor-pointer"
          style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}22`, color: accentColor }}
        >
          <Icon size={16} strokeWidth={2.3} />
        </motion.div>
      </div>

      <div className="flex flex-col mt-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black block leading-none" style={{ color: textPri }}>
            {isNumeric ? (inView ? <AnimatedNumber to={numValue} /> : '0') : value}
          </span>
          {unit ? (
            <span className="text-xs" style={{ color: textMut }}>
              {unit}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {trend !== undefined && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
              style={{
                background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: trend >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              }}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
          {sub ? (
            <span className="text-[10px] font-medium" style={{ color: textMut }}>
              {sub}
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

const DEFAULT_ICONS = [Activity, ShieldCheck, ClipboardList, GraduationCap];

export default function SafeStatsRow({ isDark, stats }: SafeStatsRowProps) {
  const { primaryColor } = useTheme();

  const STATS: SafeStatItem[] = stats ?? [
    {
      label: 'Incident Rate',
      value: '1.2',
      unit: 'per 10k hrs',
      sub: 'Below industry avg of 2.5',
      accentColor: 'var(--accent-emerald)',
      icon: Activity,
      trend: -12,
    },
    {
      label: 'Compliance Score',
      value: '98.5',
      unit: '%',
      sub: 'Up from 96.2% last quarter',
      accentColor: 'var(--accent-sky)',
      icon: ShieldCheck,
      trend: 2.3,
    },
    {
      label: 'Active Audits',
      value: '14',
      unit: 'ongoing',
      sub: '3 requiring immediate action',
      accentColor: 'var(--accent-amber)',
      icon: ClipboardList,
    },
    {
      label: 'Safety Training',
      value: '432',
      unit: 'hours',
      sub: 'Completed this month',
      accentColor: primaryColor,
      icon: GraduationCap,
      trend: 18,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {STATS.map((stat, i) => (
        <StatCard
          key={`${stat.label}-${i}`}
          index={i}
          isDark={isDark}
          label={stat.label}
          value={String(stat.value)}
          unit={stat.unit ?? ''}
          sub={stat.sub ?? ''}
          accentColor={stat.accentColor ?? primaryColor}
          icon={stat.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length]}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}
