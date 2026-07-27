'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import AnimatedIcon from '@/components/AnimatedIcon/AnimatedIcon';
import GlassButton from './GlassButton';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

const GOALS = [
  { id: 1, title: 'Zero Lost Time Incidents', progress: 85, color: '#10b981' },
  { id: 2, title: 'Safety Training Completion', progress: 62, color: '#3b82f6' },
  { id: 3, title: 'Equipment Inspections', progress: 94, color: 'var(--primary)' },
];

export default function SafeGoals({ isDark }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-[18px] p-6 flex flex-col h-[400px] transition-colors"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Q3 Safety Goals</h3>
          <p className="text-xs" style={{ color: sec }}>Progress against quarterly targets</p>
        </div>
        <GlassButton
          style={{
            padding: 0,
            width: '32px',
            height: '32px',
            borderRadius: '8px',
          }}
        >
          +
        </GlassButton>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {GOALS.map((goal) => (
          <div key={goal.id}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold" style={{ color: pri }}>{goal.title}</span>
              <span className="text-xs font-bold" style={{ color: goal.color }}>{goal.progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={inView ? { width: `${goal.progress}%` } : {}}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: goal.color }}
              />
            </div>
          </div>
        ))}

        <div className="mt-4 p-4 rounded-xl border flex items-center gap-3" style={{ borderColor: borderSubtle(isDark), background: surfaceItem(isDark) }}>
          <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center text-white flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div>
            <p className="text-xs font-bold" style={{ color: pri }}>Building Compliance</p>
            <p className="text-[10px] mt-0.5" style={{ color: sec }}>All floors meet safety standards</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
