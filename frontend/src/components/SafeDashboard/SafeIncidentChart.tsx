'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { textPrimary, textSecondary, textMuted, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

const DATA = [
  { name: 'Jan', value: 45 }, { name: 'Feb', value: 52 },
  { name: 'Mar', value: 38 }, { name: 'Apr', value: 65 },
  { name: 'May', value: 48 }, { name: 'Jun', value: 35 },
  { name: 'Jul', value: 28 }, { name: 'Aug', value: 42 },
];

export default function SafeIncidentChart({ isDark }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const accentColor = '#3b82f6';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-6 flex flex-col h-[320px]"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Incident Frequency</h3>
          <p className="text-xs" style={{ color: sec }}>Reported safety incidents over the last 8 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5" style={{ color: pri }}>
            <span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></span> Total Incidents
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: sec }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: sec }} />
            <Tooltip
              cursor={{ stroke: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}
              contentStyle={{ background: isDark ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)', border: `1px solid ${isDark ? '#333' : '#eee'}`, borderRadius: '12px' }}
              itemStyle={{ color: pri, fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" activeDot={{ r: 6, fill: accentColor, stroke: isDark ? 'var(--background)' : '#ffffff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
