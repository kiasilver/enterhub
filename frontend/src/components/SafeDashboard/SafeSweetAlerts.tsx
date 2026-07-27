'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  X, CheckCircle, Info, AlertTriangle, AlertCircle, Mail, Users,
  Timer, Code2, Move, Maximize, Loader2, Bell, Heart, XCircle, Sparkles,
} from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle, panelFill } from './theme';
import GlassButton from './GlassButton';
import AnimatedIcon from '@/components/AnimatedIcon/AnimatedIcon';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

/* ── animation variants ─────────────────────────────────────────── */
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

/* ── types ───────────────────────────────────────────────────────── */
type AlertKind =
  | 'basic' | 'title-text' | 'success-msg' | 'error-footer'
  | 'long-content' | 'confirm-warning' | 'confirm-cancel'
  | 'custom-image' | 'auto-close' | 'custom-html'
  | 'three-buttons' | 'positioned' | 'custom-style' | 'ajax'
  | 'email-verify' | 'notification' | 'mobile-toast' | 'join-community'
  | 'warning-msg' | 'error-msg' | 'success-final'
  | 'toast-bottom-right' | 'mobile-toast-bottom' | 'toast-error';

interface AlertState {
  kind: AlertKind;
  result?: 'confirmed' | 'denied' | 'cancelled';
}

/* ── row data ────────────────────────────────────────────────────── */
interface Row { kind: AlertKind; label: string; color: string; }

/* ── Section helper ──────────────────────────────────────────────── */
function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={fadeUp} className="mb-8">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-3" style={{ color: textMuted(isDark) }}>{desc}</p>
      {children}
    </motion.section>
  );
}

/* ── Alert table with color dots ─────────────────────────────────── */
function AlertTable({ rows, isDark, onOpen }: {
  rows: Row[]; isDark: boolean; onOpen: (k: AlertKind) => void;
}) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);

  return (
    <div className="rounded-2xl overflow-hidden" style={glassStyle(isDark)}>
      {/* header */}
      <div
        className="grid grid-cols-[1fr_auto] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: mut, borderBottom: `1px solid ${border}` }}
      >
        <span>Sweet Alert Type</span>
        <span className="w-28 text-center">Action</span>
      </div>

      {/* rows */}
      {rows.map((row, i) => (
        <div
          key={row.kind}
          className="grid grid-cols-[1fr_auto] items-center px-5 py-3.5 transition-colors duration-150"
          style={{ borderBottom: i < rows.length - 1 ? `1px solid ${border}` : 'none' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div className="flex items-center gap-3 pr-4">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.color }} />
            <span className="text-[13px]" style={{ color: sec }}>{row.label}</span>
          </div>
          <span className="w-28 flex justify-center">
            <button
              onClick={() => onOpen(row.kind)}
              className="text-[12px] font-bold px-5 py-1.5 rounded-lg transition-all duration-300 active:scale-95"
              style={{
                background: 'transparent',
                border: `1px solid ${row.color}`,
                color: row.color,
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLElement;
                btn.style.background = row.color;
                btn.style.color = '#fff';
                btn.style.boxShadow = row.color.startsWith('var') 
                  ? '0 4px 12px rgba(var(--primary-rgb), 0.3)' 
                  : `0 4px 12px ${row.color}40`;
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLElement;
                btn.style.background = 'transparent';
                btn.style.color = row.color;
                btn.style.boxShadow = 'none';
              }}
            >
              Preview
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── CSS filter to colorize black Lottie icons ───────────────────── */
function colorFilter(hex: string): string {
  // Pre-computed precise filters for common preset colours.
  const filters: Record<string, string> = {
    'var(--primary)': 'brightness(0) saturate(100%) invert(39%) sepia(95%) saturate(1956%) hue-rotate(225deg) brightness(98%) contrast(93%)',
    '#10b981': 'brightness(0) saturate(100%) invert(62%) sepia(43%) saturate(573%) hue-rotate(107deg) brightness(95%) contrast(92%)',
    '#ef4444': 'brightness(0) saturate(100%) invert(36%) sepia(72%) saturate(4148%) hue-rotate(342deg) brightness(100%) contrast(90%)',
    '#f59e0b': 'brightness(0) saturate(100%) invert(67%) sepia(64%) saturate(588%) hue-rotate(2deg) brightness(102%) contrast(96%)',
    '#0ea5e9': 'brightness(0) saturate(100%) invert(56%) sepia(69%) saturate(1600%) hue-rotate(176deg) brightness(96%) contrast(90%)',

    '#ec4899': 'brightness(0) saturate(100%) invert(42%) sepia(92%) saturate(2300%) hue-rotate(314deg) brightness(98%) contrast(95%)',
    '#3b82f6': 'brightness(0) saturate(100%) invert(42%) sepia(98%) saturate(2000%) hue-rotate(210deg) brightness(98%) contrast(93%)',
    '#06b6d4': 'brightness(0) saturate(100%) invert(56%) sepia(69%) saturate(1600%) hue-rotate(155deg) brightness(96%) contrast(90%)',
    '#f43f5e': 'brightness(0) saturate(100%) invert(36%) sepia(72%) saturate(4000%) hue-rotate(330deg) brightness(100%) contrast(90%)',
  };
  if (filters[hex.toLowerCase()]) return filters[hex.toLowerCase()];
  // Dynamic approximation for any arbitrary hex colour.
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hue = 0, sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  const inv = Math.round(100 - l * 100);
  const sep = Math.round(sat * 100);
  const satBoost = Math.round(500 + sat * 3000);
  return `brightness(0) saturate(100%) invert(${inv}%) sepia(${sep}%) saturate(${satBoost}%) hue-rotate(${Math.round(hue)}deg) brightness(100%) contrast(92%)`;
}

/* ── Animated Lottie icon in dialog ──────────────────────────────── */
function LottieIcon({ src, isDark, fallbackColor, loop = false }: {
  src: string; isDark: boolean; fallbackColor: string; FallbackIcon: React.ElementType; loop?: boolean;
}) {
  const filter = colorFilter(fallbackColor);
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.08 }}
      className="mx-auto mb-4 rounded-2xl flex items-center justify-center"
      style={{
        width: 72,
        height: 72,
        background: `${fallbackColor}12`,
        border: `1px solid ${fallbackColor}22`,
      }}
    >
      <AnimatedIcon
        src={src}
        width={40}
        height={40}
        loop={loop}
        autoplay={true}
        style={{ filter }}
      />
    </motion.div>
  );
}

/* ── Static icon fallback ────────────────────────────────────────── */
function StaticIco({ Icon, color }: { Icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.08 }}
      className="mx-auto mb-4 rounded-2xl flex items-center justify-center"
      style={{
        width: 72,
        height: 72,
        background: `${color}12`,
        border: `1px solid ${color}22`,
        color,
      }}
    >
      <Icon size={32} />
    </motion.div>
  );
}

/* ── Alert dialog ────────────────────────────────────────────────── */
function AlertDialog({ alert, isDark, onClose }: { alert: AlertState; isDark: boolean; onClose: (result?: string) => void }) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const { primaryColor } = useTheme();

  const [loading, setLoading] = useState(false);
  const [ajaxDone, setAjaxDone] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const autoCloseKinds = ['auto-close', 'notification', 'mobile-toast', 'toast-bottom-right', 'mobile-toast-bottom', 'toast-error'];
    if (autoCloseKinds.includes(alert.kind)) {
      setCountdown(alert.kind === 'auto-close' ? 3 : 4);
      timerRef.current = setInterval(() => {
        setCountdown(p => {
          if (p <= 1) { if (timerRef.current) clearInterval(timerRef.current); onClose(); return 0; }
          return p - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [alert.kind, onClose]);

  const panelBg = panelFill(isDark);
  const panelShadow = isDark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(0,0,0,0.18)';

  const btn = (c: string): React.CSSProperties => ({
    background: c, color: c === 'var(--primary)' ? 'var(--primary-fg, white)' : '#fff', padding: '9px 22px', borderRadius: '12px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
    transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '6px',
  });
  const outline: React.CSSProperties = {
    background: 'transparent', color: sec, padding: '9px 22px', borderRadius: '12px',
    fontSize: '13px', fontWeight: 600, border: `1px solid ${border}`, cursor: 'pointer', transition: 'all 0.15s',
  };
  const ghost: React.CSSProperties = {
    background: 'transparent', color: mut, padding: '9px 16px', borderRadius: '12px',
    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
  };
  const inputStyle: React.CSSProperties = {
    background: surfaceHover(isDark), border: `1px solid ${border}`, color: pri,
    width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', outline: 'none',
  };

  const isPositioned = alert.kind === 'positioned';
  const isWide = alert.kind === 'custom-style';
  const toastKinds = ['notification', 'mobile-toast', 'toast-bottom-right', 'mobile-toast-bottom', 'toast-error'];
  const isToast = toastKinds.includes(alert.kind);
  const isMobileToast = alert.kind === 'mobile-toast' || alert.kind === 'mobile-toast-bottom';

  const panelStyle: React.CSSProperties = {
    background: isWide
      ? (isDark ? 'linear-gradient(135deg, rgba(var(--primary-rgb),0.12), var(--elevated))' : 'linear-gradient(135deg, rgba(var(--primary-rgb),0.06), rgba(255,255,255,0.98))')
      : panelBg,
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${isWide ? 'rgba(var(--primary-rgb),0.25)' : border}`,
    borderRadius: isMobileToast ? '30px' : '20px',
    boxShadow: isToast ? '0 12px 40px rgba(0,0,0,0.15)' : panelShadow,
    padding: isToast ? '14px 18px' : (isWide ? '40px' : '28px'),
    maxWidth: isMobileToast ? 340 : (isToast ? 360 : (isWide ? 540 : 420)),
    width: '100%', position: 'relative' as const, pointerEvents: 'auto',
  };

  const content = () => {
    switch (alert.kind) {
      case 'basic':
        return (
          <div className="text-center">
            <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#0ea5e9" FallbackIcon={Info} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Any message here</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>This is a basic sweet alert message. You can customize the icon, title, and text.</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#0ea5e9')}>OK</button>
          </div>
        );

      case 'title-text':
        return (
          <div className="text-center">
            <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#0ea5e9" FallbackIcon={Info} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>The Internet?</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>That thing is still around? Let me check on that...</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#0ea5e9')}>OK</button>
          </div>
        );

      case 'success-msg':
        return (
          <div className="text-center">
            <LottieIcon src="/checkBox.json" isDark={isDark} fallbackColor="#10b981" FallbackIcon={CheckCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Good job!</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>You clicked the button successfully!</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#10b981')}>OK</button>
          </div>
        );

      case 'error-footer':
        return (
          <div className="text-center">
            <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#ef4444" FallbackIcon={XCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Oops...</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>Something went wrong! Please try again later.</p>
            <div className="mt-5 pt-4 text-xs" style={{ borderTop: `1px solid ${border}`, color: mut }}>
              Why do I have this issue? <a href="#" className="font-semibold" style={{ color: 'var(--primary)' }}>Learn more</a>
            </div>
            <button onClick={() => onClose()} className="mt-5 active:scale-95" style={btn('#ef4444')}>OK</button>
          </div>
        );

      case 'long-content':
        return (
          <div>
            <div className="text-center mb-4">
              <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#0ea5e9" FallbackIcon={Info} />
              <h3 className="text-lg font-bold" style={{ color: pri }}>Long Content</h3>
            </div>
            <div className="overflow-y-auto no-scrollbar text-sm leading-relaxed space-y-3" style={{ maxHeight: '40vh', color: sec }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <p key={i}>Enterhub provides enterprise-grade safety monitoring with real-time incident tracking, automated compliance checks, and predictive analytics. Our platform covers fire safety, gas detection, PPE compliance, emergency response protocols, and much more. Every feature is designed to keep your workforce safe.</p>
              ))}
            </div>
            <div className="text-center mt-5">
              <button onClick={() => onClose()} className="active:scale-95" style={btn('#0ea5e9')}>OK</button>
            </div>
          </div>
        );

      case 'confirm-warning':
        if (alert.result === 'confirmed') return (
          <div className="text-center">
            <LottieIcon src="/checkBox.json" isDark={isDark} fallbackColor="#10b981" FallbackIcon={CheckCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Deleted!</h3>
            <p className="text-sm" style={{ color: sec }}>Your file has been deleted.</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#10b981')}>OK</button>
          </div>
        );
        return (
          <div className="text-center">
            <LottieIcon src="/notification-V3.json" isDark={isDark} fallbackColor="#f59e0b" FallbackIcon={AlertTriangle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Are you sure?</h3>
            <p className="text-sm mb-6" style={{ color: sec }}>You won&apos;t be able to revert this!</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onClose('cancel')} className="active:scale-95" style={outline}>Cancel</button>
              <button onClick={() => onClose('confirmed')} className="active:scale-95" style={btn('#f59e0b')}>Yes, delete it!</button>
            </div>
          </div>
        );

      case 'confirm-cancel':
        if (alert.result === 'confirmed') return (
          <div className="text-center">
            <LottieIcon src="/checkBox.json" isDark={isDark} fallbackColor="#10b981" FallbackIcon={CheckCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Deleted!</h3>
            <p className="text-sm" style={{ color: sec }}>Your imaginary file has been deleted.</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#10b981')}>OK</button>
          </div>
        );
        if (alert.result === 'cancelled') return (
          <div className="text-center">
            <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#ef4444" FallbackIcon={XCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Cancelled</h3>
            <p className="text-sm" style={{ color: sec }}>Your imaginary file is safe :)</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('var(--primary)')}>OK</button>
          </div>
        );
        return (
          <div className="text-center">
            <LottieIcon src="/notification-V3.json" isDark={isDark} fallbackColor="#f59e0b" FallbackIcon={AlertTriangle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Are you sure?</h3>
            <p className="text-sm mb-6" style={{ color: sec }}>You won&apos;t be able to revert this!</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onClose('cancel-result')} className="active:scale-95" style={outline}>No, cancel!</button>
              <button onClick={() => onClose('confirmed')} className="active:scale-95" style={btn('#f59e0b')}>Yes, delete it!</button>
            </div>
          </div>
        );

      case 'auto-close':
        return (
          <div className="text-center">
            <LottieIcon src="/loadingV4.json" isDark={isDark} fallbackColor="#0ea5e9" FallbackIcon={Timer} loop={true} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Auto close alert!</h3>
            <p className="text-sm mb-5" style={{ color: sec }}>This will close in <b style={{ color: pri }}>{countdown}</b> second{countdown !== 1 ? 's' : ''}.</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: surfaceHover(isDark) }}>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 3, ease: 'linear' }}
                className="h-full rounded-full"
                style={{ background: 'var(--primary)' }}
              />
            </div>
          </div>
        );

      case 'custom-html':
        return (
          <div className="text-center">
            <h3 className="text-lg font-bold mb-3" style={{ color: pri }}>
              <span style={{ color: '#0ea5e9' }}>HTML</span> Content
            </h3>
            <div className="text-sm leading-relaxed mb-6" style={{ color: sec }}>
              You can use <b style={{ color: pri }}>bold text</b>,{' '}
              <a href="#" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>links</a>,{' '}
              and other <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: surfaceHover(isDark), color: '#ec4899' }}>HTML</span> elements.
            </div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onClose()} className="active:scale-95" style={outline}>Cancel</button>
              <button onClick={() => onClose()} className="active:scale-95" style={btn('#ec4899')}><Heart size={14} /> Great!</button>
            </div>
          </div>
        );

      case 'three-buttons':
        if (alert.result) return (
          <div className="text-center">
            <LottieIcon
              src={alert.result === 'confirmed' ? '/checkBox.json' : '/alertCircle.json'}
              isDark={isDark}
              fallbackColor={alert.result === 'confirmed' ? '#10b981' : alert.result === 'denied' ? '#ef4444' : '#0ea5e9'}
              FallbackIcon={alert.result === 'confirmed' ? CheckCircle : alert.result === 'denied' ? XCircle : Info}
            />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>
              {alert.result === 'confirmed' ? 'Saved!' : alert.result === 'denied' ? 'Changes not saved' : 'Cancelled'}
            </h3>
            <button onClick={() => onClose()} className="mt-5 active:scale-95" style={btn('#0ea5e9')}>OK</button>
          </div>
        );
        return (
          <div className="text-center">
            <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#0ea5e9" FallbackIcon={Info} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Do you want to save the changes?</h3>
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => onClose('cancel-3btn')} className="active:scale-95" style={ghost}>Cancel</button>
              <button onClick={() => onClose('denied')} className="active:scale-95" style={{ ...outline, color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)' }}>Don&apos;t save</button>
              <button onClick={() => onClose('confirmed')} className="active:scale-95" style={btn('#0ea5e9')}>Save</button>
            </div>
          </div>
        );

      case 'positioned':
        return (
          <div className="text-center">
            <LottieIcon src="/checkBox.json" isDark={isDark} fallbackColor="#10b981" FallbackIcon={CheckCircle} />
            <h3 className="text-sm font-bold mb-1" style={{ color: pri }}>Top-end position</h3>
            <p className="text-xs" style={{ color: sec }}>This alert is anchored to the top-right corner.</p>
            <button onClick={() => onClose()} className="mt-4 active:scale-95 text-xs" style={{ ...btn('#10b981'), padding: '7px 16px' }}>OK</button>
          </div>
        );

      case 'custom-style':
        return (
          <div className="text-center">
            <div className="mb-5">
              <AnimatedIcon src="/star.json" width={48} height={48} loop autoplay style={{ margin: '0 auto', filter: colorFilter('var(--primary)') }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: pri }}>Custom Style!</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>Extra width, padding, and gradient background matching the dashboard aesthetic.</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('var(--primary)')}>Awesome!</button>
          </div>
        );

      case 'ajax':
        if (ajaxDone) return (
          <div className="text-center">
            <LottieIcon src="/checkBox.json" isDark={isDark} fallbackColor="#10b981" FallbackIcon={CheckCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Done</h3>
            <p className="text-sm" style={{ color: sec }}>Server responded: <b style={{ color: pri }}>200 OK</b></p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#10b981')}>OK</button>
          </div>
        );
        return (
          <div className="text-center">
            <LottieIcon src="/loadingV4.json" isDark={isDark} fallbackColor="#0ea5e9" FallbackIcon={Loader2} loop={true} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Submit request</h3>
            <input type="text" placeholder="Enter something…" style={{ ...inputStyle, marginBottom: '18px' }} disabled={loading} />
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onClose()} className="active:scale-95" style={outline} disabled={loading}>Cancel</button>
              <button
                onClick={() => { setLoading(true); setTimeout(() => { setLoading(false); setAjaxDone(true); }, 2000); }}
                className="active:scale-95"
                style={btn('#0ea5e9')}
                disabled={loading}
              >
                {loading && <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={14} /></motion.span>}
                {loading ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        );

      case 'email-verify':
        return (
          <div className="text-center">
            <LottieIcon src="/mail.json" isDark={isDark} fallbackColor="#6366f1" FallbackIcon={Mail} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Verify Your Email</h3>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: sec }}>Enter the email address associated with your account and we&apos;ll send a verification link.</p>
            <input type="email" placeholder="your@email.com" style={{ ...inputStyle, marginBottom: '18px' }} />
            <button onClick={() => onClose()} className="w-full active:scale-95" style={btn('#6366f1')}><Mail size={14} /> Send Verification</button>
          </div>
        );

      case 'notification':
        return (
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#0ea5e915', border: `1px solid #0ea5e930` }}>
               <AnimatedIcon src="/notificationV2.json" width={26} height={26} autoplay loop={false} style={{ filter: colorFilter('#0ea5e9') }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold mb-0.5" style={{ color: pri }}>New Notification</h3>
              <p className="text-[11px]" style={{ color: sec }}>You have <b style={{ color: pri }}>3</b> unread messages.</p>
            </div>
            <button onClick={() => onClose()} className="p-1.5 rounded-lg ml-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: mut }}><X size={16} /></button>
          </div>
        );

      case 'mobile-toast':
        return (
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#10b98115', border: `1px solid #10b98130` }}>
               <AnimatedIcon src="/checkBox.json" width={20} height={20} autoplay loop={false} style={{ filter: colorFilter('#10b981') }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold mb-0.5" style={{ color: pri }}>Payment Successful</h3>
              <p className="text-[11px]" style={{ color: sec }}>Your subscription is now active.</p>
            </div>
          </div>
        );

      case 'toast-bottom-right':
        return (
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}>
               <AnimatedIcon src="/activity.json" width={26} height={26} autoplay loop={false} style={{ filter: colorFilter(primaryColor) }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold mb-0.5" style={{ color: pri }}>Profile Updated</h3>
              <p className="text-[11px]" style={{ color: sec }}>Your settings have been saved.</p>
            </div>
            <button onClick={() => onClose()} className="p-1.5 rounded-lg ml-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: mut }}><X size={16} /></button>
          </div>
        );

      case 'mobile-toast-bottom':
        return (
          <div className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f59e0b15', border: `1px solid #f59e0b30` }}>
               <AnimatedIcon src="/notification-V3.json" width={20} height={20} autoplay loop={false} style={{ filter: colorFilter('#f59e0b') }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold mb-0.5" style={{ color: pri }}>Connection Lost</h3>
              <p className="text-[11px]" style={{ color: sec }}>Retrying in 5 seconds...</p>
            </div>
          </div>
        );

      case 'toast-error':
        return (
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ef444415', border: `1px solid #ef444430` }}>
               <AnimatedIcon src="/alertCircle.json" width={26} height={26} autoplay loop={false} style={{ filter: colorFilter('#ef4444') }} />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold mb-0.5" style={{ color: pri }}>Upload Failed</h3>
              <p className="text-[11px]" style={{ color: sec }}>File size exceeds 5MB limit.</p>
            </div>
            <button onClick={() => onClose()} className="p-1.5 rounded-lg ml-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: mut }}><X size={16} /></button>
          </div>
        );

      case 'join-community':
        return (
          <div className="text-center">
            <LottieIcon src="/activity.json" isDark={isDark} fallbackColor="#8b5cf6" FallbackIcon={Users} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Join Our Community</h3>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: sec }}>Connect with <b style={{ color: pri }}>2,500+</b> safety professionals.</p>
            <div className="flex items-center justify-center mb-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full" style={{
                  background: `hsl(${250 + i * 25}, 55%, ${isDark ? 32 : 72}%)`,
                  border: `2px solid ${panelBg}`, marginLeft: i > 0 ? '-6px' : '0',
                  zIndex: 4 - i, position: 'relative',
                }} />
              ))}
              <span className="text-[11px] font-semibold ml-2" style={{ color: mut }}>+2.5K</span>
            </div>
            <button onClick={() => onClose()} className="w-full active:scale-95" style={btn('#8b5cf6')}>Join Now</button>
          </div>
        );

      case 'warning-msg':
        return (
          <div className="text-center">
            <LottieIcon src="/notification-V3.json" isDark={isDark} fallbackColor="#f59e0b" FallbackIcon={AlertTriangle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Warning!</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: sec }}>This action may affect your current safety configuration. Please review before proceeding.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onClose()} className="active:scale-95" style={outline}>Cancel</button>
              <button onClick={() => onClose()} className="active:scale-95" style={btn('#f59e0b')}>Proceed</button>
            </div>
          </div>
        );

      case 'error-msg':
        return (
          <div className="text-center">
            <LottieIcon src="/alertCircle.json" isDark={isDark} fallbackColor="#ef4444" FallbackIcon={XCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Error!</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>An unexpected error occurred while processing your request.</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#ef4444')}>Try Again</button>
          </div>
        );

      case 'success-final':
        return (
          <div className="text-center">
            <LottieIcon src="/checkBox.json" isDark={isDark} fallbackColor="#10b981" FallbackIcon={CheckCircle} />
            <h3 className="text-lg font-bold mb-2" style={{ color: pri }}>Success!</h3>
            <p className="text-sm leading-relaxed" style={{ color: sec }}>Everything is working perfectly. Your changes have been saved.</p>
            <button onClick={() => onClose()} className="mt-6 active:scale-95" style={btn('#10b981')}>Great!</button>
          </div>
        );

      default: return null;
    }
  };

  let containerClass = 'items-center justify-center';
  let initY = 8;
  
  if (isPositioned) { containerClass = 'items-start justify-end pt-6 pr-6'; initY = -12; }
  
  if (alert.kind === 'notification') { containerClass = 'items-start justify-end pt-6 pr-6 pointer-events-none'; initY = -24; }
  if (alert.kind === 'toast-bottom-right') { containerClass = 'items-end justify-end pb-6 pr-6 pointer-events-none'; initY = 24; }
  if (alert.kind === 'mobile-toast') { containerClass = 'items-start justify-center pt-6 pointer-events-none'; initY = -24; }
  if (alert.kind === 'mobile-toast-bottom') { containerClass = 'items-end justify-center pb-8 pointer-events-none'; initY = 24; }
  if (alert.kind === 'toast-error') { containerClass = 'items-start justify-start pt-6 pl-6 pointer-events-none'; initY = -24; }

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex p-4 ${containerClass}`}
      style={isToast ? { pointerEvents: 'none' } : { background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
      onClick={() => onClose()}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: initY }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: initY }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        style={panelStyle}
      >
        {!['auto-close', 'positioned', 'notification', 'toast-bottom-right', 'mobile-toast', 'mobile-toast-bottom', 'toast-error'].includes(alert.kind) && (
          <button
            onClick={() => onClose()}
            className="absolute top-3 right-3 p-1.5 rounded-lg"
            style={{ color: mut, background: 'transparent', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mut; }}
          ><X size={15} /></button>
        )}
        {content()}
      </motion.div>
    </motion.div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function SafeSweetAlerts({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const { primaryColor } = useTheme();

  const TYPE_ROWS: Row[] = [
    { kind: 'basic', label: 'A Basic Message', color: '#0ea5e9' },
    { kind: 'title-text', label: 'A Title with a Text Under', color: '#0ea5e9' },
    { kind: 'success-msg', label: 'A success message!', color: '#10b981' },
    { kind: 'error-footer', label: 'A modal with a title, an error icon, a text, and a footer', color: '#ef4444' },
    { kind: 'long-content', label: 'A modal window with a long content inside', color: '#0ea5e9' },
    { kind: 'confirm-warning', label: 'A warning message, with a function attached to the "Confirm"-button...', color: '#f59e0b' },
    { kind: 'confirm-cancel', label: 'By passing a parameter, you can execute something else for "Cancel".', color: '#f59e0b' },
    { kind: 'auto-close', label: 'A message with auto close timer', color: '#0ea5e9' },
    { kind: 'custom-html', label: 'Custom HTML description and buttons', color: '#ec4899' },
    { kind: 'three-buttons', label: 'A dialog with three buttons', color: '#0ea5e9' },
    { kind: 'positioned', label: 'A custom positioned dialog', color: '#f59e0b' },
    { kind: 'custom-style', label: 'A message with custom width, padding and background', color: '#6366f1' },
    { kind: 'ajax', label: 'Ajax request example', color: '#0ea5e9' },
  ];

  const EXAMPLE_ROWS: Row[] = [
    { kind: 'email-verify', label: 'Email Verification', color: '#6366f1' },
    { kind: 'join-community', label: 'Join Our Community', color: '#8b5cf6' },
    { kind: 'warning-msg', label: 'Warning Message', color: '#f59e0b' },
    { kind: 'error-msg', label: 'Error Message', color: '#ef4444' },
    { kind: 'success-final', label: 'Success Message', color: '#10b981' },
  ];

  const TOAST_ROWS: Row[] = [
    { kind: 'notification', label: 'Top-Right Toast (Web)', color: '#0ea5e9' },
    { kind: 'toast-bottom-right', label: 'Bottom-Right Toast (Web)', color: '#0ea5e9' },
    { kind: 'mobile-toast', label: 'Top-Center Pill (Mobile Push)', color: '#10b981' },
    { kind: 'mobile-toast-bottom', label: 'Bottom-Center Pill (Mobile Snackbar)', color: '#f59e0b' },
    { kind: 'toast-error', label: 'Top-Left Toast (Error)', color: '#ef4444' },
  ];

  const [alert, setAlert] = useState<AlertState | null>(null);
  const open = useCallback((kind: AlertKind) => setAlert({ kind }), []);

  const handleClose = useCallback((result?: string) => {
    if (!alert) { setAlert(null); return; }
    if (alert.kind === 'confirm-warning' && result === 'confirmed' && !alert.result) { setAlert({ ...alert, result: 'confirmed' }); return; }
    if (alert.kind === 'confirm-cancel' && !alert.result) {
      if (result === 'confirmed') { setAlert({ ...alert, result: 'confirmed' }); return; }
      if (result === 'cancel-result') { setAlert({ ...alert, result: 'cancelled' }); return; }
    }
    if (alert.kind === 'three-buttons' && !alert.result) {
      if (result === 'confirmed') { setAlert({ ...alert, result: 'confirmed' }); return; }
      if (result === 'denied') { setAlert({ ...alert, result: 'denied' }); return; }
      if (result === 'cancel-3btn') { setAlert({ ...alert, result: 'cancelled' }); return; }
    }
    setAlert(null);
  }, [alert]);

  useEffect(() => {
    if (!alert) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setAlert(null); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [alert]);

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Advance UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Sweet Alerts</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Beautiful replacement for JavaScript&apos;s popup boxes. Click any row to preview.</p>
      </motion.div>

      <div className="max-w-4xl">
        <Section title="Sweet Alert Types" desc="Core alert types — messages, confirms, timers, and AJAX simulation." isDark={isDark}>
          <AlertTable rows={TYPE_ROWS} isDark={isDark} onOpen={open} />
        </Section>

        <Section title="Sweet Alert Examples" desc="Real-world patterns — verification, and status messages." isDark={isDark}>
          <AlertTable rows={EXAMPLE_ROWS} isDark={isDark} onOpen={open} />
        </Section>

        <Section title="Toast Notifications" desc="Non-blocking, auto-closing alerts that slide in from the edges." isDark={isDark}>
          <AlertTable rows={TOAST_ROWS} isDark={isDark} onOpen={open} />
        </Section>
      </div>

      <AnimatePresence>
        {alert && <AlertDialog alert={alert} isDark={isDark} onClose={handleClose} />}
      </AnimatePresence>
    </motion.div>
  );
}
