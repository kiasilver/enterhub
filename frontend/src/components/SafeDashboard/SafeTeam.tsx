'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from './theme';
import GlassButton from './GlassButton';

interface Props {
  isDark: boolean;
}

const TEAM = [
  { id: 1, name: 'Ali Mohammad', role: 'Safety Manager', status: 'online', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 2, name: 'Sarah Jenkins', role: 'Inspector', status: 'busy', avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: 3, name: 'Mark Davis', role: 'Field Officer', status: 'offline', avatar: 'https://i.pravatar.cc/150?img=44' },
];

export default function SafeTeam({ isDark }: Props) {
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
      transition={{ duration: 0.5, delay: 0.5 }}
      className="rounded-[18px] p-6 flex flex-col h-[400px] transition-colors"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold mb-1" style={{ color: pri }}>Active Team</h3>
          <p className="text-xs" style={{ color: sec }}>Safety personnel on duty</p>
        </div>
        <button className="p-1.5 rounded border transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: border, color: sec }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none' }}>
        {TEAM.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.6 + (i * 0.1) }}
            className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:-translate-y-0.5"
            style={{ borderColor: borderSubtle(isDark), background: surfaceItem(isDark) }}
          >
            <div className="relative">
              <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border-2" style={{ borderColor: isDark ? '#333' : '#e5e7eb' }} />
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: isDark ? 'var(--surface)' : '#ffffff',
                  background: member.status === 'online' ? '#10b981' : member.status === 'busy' ? '#f59e0b' : '#6b7280'
                }}
              ></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: pri }}>{member.name}</p>
              <p className="text-[10px] font-medium truncate" style={{ color: sec }}>{member.role}</p>
            </div>
            <button className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: border, color: pri }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
            </button>
          </motion.div>
        ))}
      </div>

      <GlassButton className="mt-4 w-full" style={{ padding: '10px 20px', borderRadius: '12px' }}>
        Add Team Member
      </GlassButton>
    </motion.div>
  );
}
