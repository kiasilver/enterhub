'use client';

import { motion } from 'motion/react';
import { Inbox, Plus } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from '@/components/SafeDashboard/theme';

export default function EmptyResult() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);

  return (
    <div className="rounded-2xl p-7 text-center flex flex-col items-center" style={glassStyle(isDark)}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ border: `2px dashed ${borderSubtle(isDark)}`, color: mut }}
      >
        <Inbox size={36} />
      </motion.div>
      <h3 className="text-lg font-bold" style={{ color: pri }}>No results found</h3>
      <p className="text-sm leading-relaxed mt-1.5 max-w-xs" style={{ color: sec }}>There&apos;s nothing here yet. Create your first item to get started.</p>
      <button className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold px-5 py-2.5 rounded-lg text-white transition-all active:scale-95 mt-6" style={{ background: 'var(--primary)' }}>
        <Plus size={14} /> Add item
      </button>
    </div>
  );
}
