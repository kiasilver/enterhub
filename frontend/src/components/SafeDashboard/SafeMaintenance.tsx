'use client';

import { motion, type Variants } from 'motion/react';
import { Settings, Home, Clock, ArrowLeft } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import GlassButton from './GlassButton';

interface Props {
  isDark: boolean;
  onGoHome?: () => void;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

export default function SafeMaintenance({ isDark, onGoHome }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  return (
    <div className="w-full h-full flex items-center justify-center p-6 relative">

      {onGoHome && (
        <button
          onClick={onGoHome}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70 z-20"
          style={{ color: sec }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-md w-full rounded-2xl p-10 text-center"
        style={glassStyle(isDark)}
      >
        {/* Icon tile */}
        <motion.div variants={item}>
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-flex' }}
            >
              <Settings size={26} strokeWidth={1.75} />
            </motion.span>
          </motion.div>
        </motion.div>

        <motion.h1 variants={item} className="text-2xl font-bold mb-3" style={{ color: pri, letterSpacing: '-0.01em' }}>
          Under maintenance
        </motion.h1>

        <motion.p variants={item} className="text-sm leading-relaxed mb-7" style={{ color: sec }}>
          We&apos;re performing scheduled maintenance to improve your Enterhub experience. We&apos;ll be back online shortly — thank you for your patience.
        </motion.p>

        {/* Estimated completion */}
        <motion.div
          variants={item}
          className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl mb-7"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}` }}
        >
          <Clock size={15} style={{ color: mut }} />
          <span className="text-xs" style={{ color: mut }}>Estimated completion</span>
          <span className="text-xs font-semibold" style={{ color: pri }}>~2h 15m</span>
        </motion.div>

        {onGoHome && (
          <motion.div variants={item}>
            <GlassButton onClick={onGoHome} className="w-full" style={{ padding: '10px 0', borderRadius: '10px' }}>
              <Home size={15} /> Return to dashboard
            </GlassButton>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
