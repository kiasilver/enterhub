'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Rocket, Send, ArrowLeft } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
  onGoBack?: () => void;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

export default function SafeComingSoon({ isDark, onGoBack }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [email, setEmail] = useState('');
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const renderUnit = (value: number, label: string) => (
    <motion.div variants={item} className="flex flex-col items-center gap-2">
      <motion.div
        className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden"
        style={glassStyle(isDark)}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="text-2xl font-bold"
            style={{ color: pri }}
          >
            {value.toString().padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: mut }}>{label}</span>
    </motion.div>
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">

      {onGoBack && (
        <button
          onClick={onGoBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: sec }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-xl w-full text-center"
      >
        <motion.div variants={item} className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6" style={{ background: `${ACCENT}1a`, color: ACCENT }}>
          <Rocket size={26} />
        </motion.div>

        <motion.h1 variants={item} className="text-3xl md:text-4xl font-bold mb-3" style={{ color: pri, letterSpacing: '-0.02em' }}>
          Coming soon
        </motion.h1>

        <motion.p variants={item} className="text-sm mb-10 max-w-md mx-auto leading-relaxed" style={{ color: sec }}>
          We&apos;re building something new. Subscribe to be notified the moment it goes live.
        </motion.p>

        {/* Countdown */}
        <motion.div variants={item} className="flex items-end justify-center gap-3 md:gap-4 mb-10">
          {renderUnit(timeLeft.days, 'Days')}
          {renderUnit(timeLeft.hours, 'Hours')}
          {renderUnit(timeLeft.minutes, 'Minutes')}
          {renderUnit(timeLeft.seconds, 'Seconds')}
        </motion.div>

        {/* Subscription form */}
        <motion.form variants={item} onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: surfaceHover(isDark), border: `1px solid ${border}`, color: pri }}
          />
          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex-shrink-0"
            style={{ background: ACCENT }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}
          >
            Notify me <Send size={14} />
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
