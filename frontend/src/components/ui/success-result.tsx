'use client';

import { motion } from 'motion/react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textPrimary, textSecondary, glassStyle, surfaceHover } from '@/components/SafeDashboard/theme';

export default function SuccessResult() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);

  return (
    <div className="rounded-2xl p-7 text-center flex flex-col items-center" style={glassStyle(isDark)}>
      <div className="relative mb-5">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: '#10b9811f', color: '#10b981' }}
        >
          <CheckCircle size={42} />
        </motion.div>
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 14 }}
          className="absolute -top-1 -right-1"
          style={{ color: '#10b981' }}
        >
          <Sparkles size={16} />
        </motion.span>
      </div>
      <h3 className="text-lg font-bold" style={{ color: pri }}>Payment successful</h3>
      <p className="text-sm leading-relaxed mt-1.5 max-w-xs" style={{ color: sec }}>Your order is confirmed and a receipt is on its way to your inbox.</p>
      <div className="flex gap-2 mt-6 w-full">
        <button className="flex-1 text-[13px] font-semibold py-2.5 rounded-lg text-white transition-all active:scale-95" style={{ background: '#10b981' }}>Continue</button>
        <button className="flex-1 text-[13px] font-semibold py-2.5 rounded-lg transition-colors" style={{ background: surfaceHover(isDark), color: sec }}>View receipt</button>
      </div>
    </div>
  );
}
