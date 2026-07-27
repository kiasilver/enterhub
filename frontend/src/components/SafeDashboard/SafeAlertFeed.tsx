'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import AnimatedIcon from '@/components/AnimatedIcon/AnimatedIcon';
import GlassButton from './GlassButton';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

const ALERTS = [
  { id: 1, type: 'critical', msg: 'Gas leak detected in Sector 4', time: '10 min ago', icon: '/alertCircle.json', color: '#ef4444' },
  { id: 2, type: 'warning', msg: 'Fire extinguisher pressure low', time: '1 hr ago', icon: '/notificationV2.json', color: '#f59e0b' },
  { id: 3, type: 'info', msg: 'Scheduled maintenance for HVAC', time: '3 hrs ago', icon: '/activity.json', color: '#3b82f6' },
  { id: 4, type: 'resolved', msg: 'Electrical short in main panel fixed', time: '5 hrs ago', icon: '/checkBox.json', color: '#10b981' },
];

export default function SafeAlertFeed({ isDark }: Props) {
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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-[18px] p-6 flex flex-col h-[320px] transition-colors"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Recent Alerts</h3>
          <p className="text-xs" style={{ color: sec }}>Real-time system notifications</p>
        </div>
        <GlassButton>
          View All
        </GlassButton>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'none' }}>
        {ALERTS.map((alert) => (
          <div key={alert.id} className="flex gap-4 p-3 rounded-xl border transition-colors" style={{ borderColor: borderSubtle(isDark), background: surfaceItem(isDark) }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${alert.color}15` }}>
              <AnimatedIcon src={alert.icon} width={20} height={20} hoverTrigger={true} style={{ filter: isDark ? 'invert(1)' : 'none' }} />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[13px] font-semibold mb-1.5 leading-snug" style={{ color: pri }}>{alert.msg}</p>
              <p className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: sec }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: alert.color }}></span>
                {alert.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
