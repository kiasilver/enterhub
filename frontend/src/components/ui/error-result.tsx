'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textPrimary, textSecondary, glassStyle, surfaceHover } from '@/components/SafeDashboard/theme';

export default function ErrorResult() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);

  const [retrying, setRetrying] = useState(false);
  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    setTimeout(() => setRetrying(false), 1200);
  };

  return (
    <div className="rounded-2xl p-7 text-center flex flex-col items-center" style={glassStyle(isDark)}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: '#ef44441f', color: '#ef4444' }}
      >
        <AlertTriangle size={40} />
      </motion.div>
      <h3 className="text-lg font-bold" style={{ color: pri }}>Something went wrong</h3>
      <p className="text-sm leading-relaxed mt-1.5 max-w-xs" style={{ color: sec }}>We couldn&apos;t complete your request. Check your connection and try again.</p>
      <div className="flex gap-2 mt-6 w-full">
        <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold py-2.5 rounded-lg transition-colors" style={{ background: surfaceHover(isDark), color: sec }}>
          <ArrowLeft size={14} /> Go back
        </button>
        <button onClick={retry} className="flex-1 inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold py-2.5 rounded-lg text-white transition-all active:scale-95" style={{ background: '#ef4444' }}>
          {retrying ? (
            <><span className="w-3.5 h-3.5 rounded-full animate-spin" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} /> Retrying…</>
          ) : (
            <><RefreshCw size={14} /> Try again</>
          )}
        </button>
      </div>
    </div>
  );
}
