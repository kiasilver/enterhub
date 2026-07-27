'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import AnimatedIcon from '@/components/AnimatedIcon/AnimatedIcon';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from './theme';

interface Props {
  isDark: boolean;
}

const ACTIVITIES = [
  { id: 1, user: 'Sarah Jenkins', action: 'completed Site B Inspection', time: 'Just now', type: 'success' },
  { id: 2, user: 'System', action: 'auto-resolved false positive alarm in Zone 3', time: '45 mins ago', type: 'info' },
  { id: 3, user: 'Mark Davis', action: 'reported a hazard in Warehouse A', time: '2 hrs ago', type: 'warning' },
  { id: 4, user: 'Emma Wilson', action: 'uploaded Q3 Safety Compliance Report', time: '4 hrs ago', type: 'document' },
];

export default function SafeActivityFeed({ isDark }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const getIconConfig = (type: string) => {
    switch (type) {
      case 'success': return { src: '/checkBox.json', color: '#10b981' };
      case 'warning': return { src: '/alertCircle.json', color: '#f59e0b' };
      case 'document': return { src: '/edit.json', color: 'var(--primary)' };
      default: return { src: '/activity.json', color: '#3b82f6' };
    }
  };

  const bg = panelFill(isDark);
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-[18px] p-6 flex flex-col h-[400px] transition-colors"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Recent Activity</h3>
          <p className="text-xs" style={{ color: sec }}>Audit trails and user actions</p>
        </div>
        <button className="text-xs font-bold text-[#3b82f6]">View All →</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 relative" style={{ scrollbarWidth: 'none' }}>
        <div className="absolute top-2 bottom-4 left-[19px] w-px" style={{ background: borderSubtle(isDark) }}></div>

        <div className="space-y-6 relative z-10">
          {ACTIVITIES.map((activity, index) => {
            const { src, color } = getIconConfig(activity.type);
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.5 + (index * 0.1) }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ background: surfaceItem(isDark), borderColor: color }}>
                  <AnimatedIcon src={src} width={16} height={16} style={{ filter: isDark ? 'invert(1)' : 'none' }} />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-sm" style={{ color: sec }}>
                    <span className="font-bold" style={{ color: pri }}>{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-[10px] font-medium mt-1" style={{ color: mut }}>{activity.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
