'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import { textPrimary, textSecondary, textMuted, borderSubtle, glassStyle, hexToRgba, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
  mode: string; // auth-signin, auth-signup, auth-reset, auth-create, auth-lock, auth-logout, auth-success, auth-2step, auth-errors
  setActivePage: (page: string) => void;
  previousPage?: string;
}

import { Lock, User } from 'lucide-react';
import { EnvelopeIcon as Mail, ShieldCheckIcon as Shield } from '@heroicons/react/24/outline';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import { Player } from '@lordicon/react';

// Lordicon JSON animation data imports
import mailIcon from '../../../public/mail.json';         // Password Reset — send reset email
import lockIcon from '../../../public/icons8-lock.json'; // Password Create & Lock Screen — security
import arrowDownIcon from '../../../public/arrowDown.json';
import checkBoxIcon from '../../../public/checkBox.json';
import alertCircleIcon from '../../../public/alertCircle.json';
import notificationIcon from '../../../public/notification-V3.json';

// Animated Lordicon Player Wrapper
const AnimatedLordicon = ({
  iconData,
  size = 48,
  color,
  speed = 1,
  loop = true,
}: {
  iconData: any;
  size?: number;
  color?: string;
  speed?: number;
  loop?: boolean;
}) => {
  const playerRef = useRef<Player>(null);

  useEffect(() => {
    playerRef.current?.playFromBeginning();
  }, [iconData]);

  return (
    <div className="flex items-center justify-center select-none pointer-events-none" style={{ width: size, height: size }}>
      <Player
        ref={playerRef}
        icon={iconData}
        size={size}
        colorize={color}
        onComplete={() => {
          if (loop) {
            playerRef.current?.playFromBeginning();
          }
        }}
      />
    </div>
  );
};

const IconLock = () => <Lock size={15} className="shrink-0 animate-pulse" />;
const IconUser = () => <User size={15} className="shrink-0" />;
const IconMail = () => <Mail width={15} height={15} className="shrink-0" />;
const IconShield = () => <Shield width={15} height={15} className="shrink-0" />;
const IconGoogle = () => <FaGoogle size={15} className="shrink-0" />;
const IconGithub = () => <FaGithub size={15} className="shrink-0" />;

// ── Error Pages ─────────────────────────────────────────────────────────────
const ERROR_TYPES = [
  {
    code: '404',
    title: 'Page Not Found',
    description: "The page you requested doesn't exist. It may have moved or the URL is incorrect.",
    accent: 'rgba(251,191,36,0.75)',
    accentSolid: '#fbbf24',
  },
  {
    code: '500',
    title: 'Internal Server Error',
    description: 'Something went wrong on our end. Our team has been notified and is working on it.',
    accent: 'rgba(248,113,113,0.75)',
    accentSolid: '#f87171',
  },
  {
    code: '503',
    title: 'Service Unavailable',
    description: 'The server is temporarily offline for maintenance. Please check back soon.',
    accent: 'rgba(167,139,250,0.75)',
    accentSolid: '#a78bfa',
  },
];

function ErrorPagesTabs({
  isDark, pri, sec, mut, borderCol, setActivePage, alertCircleIcon,
}: {
  isDark: boolean; pri: string; sec: string; mut: string; borderCol: string;
  setActivePage: (page: string) => void; alertCircleIcon: any;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const err = ERROR_TYPES[activeTab];

  return (
    <div className="w-full space-y-4">
      {/* Ultra-minimal tabs */}
      <div className="flex justify-center gap-2 mb-2">
        {ERROR_TYPES.map((e, i) => (
          <button
            key={e.code}
            onClick={() => setActiveTab(i)}
            className="px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all outline-none"
            style={{
              color: activeTab === i ? pri : mut,
              background: activeTab === i ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
            }}
          >
            {e.code}
          </button>
        ))}
      </div>

      {/* Clean card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full rounded-3xl p-8 border text-center"
          style={{
            ...glassStyle(isDark),
            background: panelFill(isDark),
            borderColor: borderCol,
            boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)',
          }}
        >
          {/* Simple Animated Icon */}
          <motion.div 
            initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.1 }}
            className="mb-5 flex justify-center"
          >
            <motion.svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={err.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <motion.circle cx="12" cy="12" r="10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} />
              <motion.line x1="12" y1="8" x2="12" y2="12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.5 }} />
              <motion.line x1="12" y1="16" x2="12.01" y2="16" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3, delay: 0.7 }} />
            </motion.svg>
          </motion.div>

          <h3 className="text-lg font-black tracking-tight mb-2" style={{ color: pri }}>{err.title}</h3>
          <p className="text-xs leading-relaxed mb-8" style={{ color: sec }}>{err.description}</p>

          <div className="flex gap-3">
            <GlassButton
              onClick={() => setActivePage('dashboard')}
              className="flex-1 py-3"
              style={{ borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}
            >
              Dashboard
            </GlassButton>
            <button
              onClick={() => setActivePage('app-support')}
              className="flex-1 py-3 rounded-xl text-[11px] font-bold transition-all hover:bg-gray-500/5"
              style={{ color: pri, border: `1px solid ${borderCol}` }}
            >
              Support
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function SafeAuth({ isDark, mode, setActivePage, previousPage }: Props) {
  const { primaryColor } = useTheme();
  const prevPage = previousPage || 'dashboard';
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Matrix canvas background ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formPasscode, setFormPasscode] = useState('');
  const [formOtp, setFormOtp] = useState(['', '', '', '']);

  // Advanced Lock Screen States
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [lockMode, setLockMode] = useState<'pin' | 'password' | 'biometric'>('pin');
  const [lockPin, setLockPin] = useState('');
  const [biometricState, setBiometricState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  // Real-time clock effect
  useEffect(() => {
    if (mode === 'auth-lock') {
      const updateTime = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        setCurrentDate(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
      };
      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Automatic PIN submission
  useEffect(() => {
    if (lockPin.length === 4) {
      const t = setTimeout(() => {
        setActivePage('auth-success');
        setLockPin('');
      }, 500);
      return () => clearTimeout(t);
    }
  }, [lockPin, setActivePage]);

  // Biometric verification logic
  const handleBiometricScan = () => {
    if (biometricState === 'scanning' || biometricState === 'success') return;
    setBiometricState('scanning');
    setTimeout(() => {
      setBiometricState('success');
      setTimeout(() => {
        setActivePage('auth-success');
        setBiometricState('idle');
      }, 800);
    }, 2000);
  };

  // Input focus tracking
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Password strength logic
  const passwordStrength = useMemo(() => {
    if (!formPassword) return { label: 'Empty', color: 'transparent', width: '0%', text: 'transparent' };
    let score = 0;
    if (formPassword.length >= 6) score++;
    if (formPassword.length >= 10) score++;
    if (/[0-9]/.test(formPassword)) score++;
    if (/[A-Z]/.test(formPassword)) score++;
    if (/[^A-Za-z0-9]/.test(formPassword)) score++;

    if (score <= 2) return { label: 'Weak', color: '#ef4444', width: '33%', text: '#ef4444' };
    if (score <= 4) return { label: 'Medium', color: '#f59e0b', width: '66%', text: '#f59e0b' };
    return { label: 'Strong', color: '#10b981', width: '100%', text: '#10b981' };
  }, [formPassword]);

  // Success redirect progress bar simulation
  const [successProgress, setSuccessProgress] = useState(0);
  useEffect(() => {
    if (mode === 'auth-success') {
      setSuccessProgress(0);
      const interval = setInterval(() => {
        setSuccessProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [mode]);

  // Trigger matrix canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width;
    let height = canvas.height;

    const resize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas.parentElement || canvas);
    resize();

    // Floating SaaS glowing orbs particles
    const orbs = [
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.25, vx: 0.3, vy: 0.4, r: 180, color: isDark ? hexToRgba(primaryColor, 0.09) : hexToRgba(primaryColor, 0.06) }, // Primary
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.6, vx: -0.3, vy: 0.3, r: 240, color: isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)' },  // Blue
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.8, vx: 0.4, vy: -0.2, r: 200, color: isDark ? 'rgba(236, 72, 153, 0.07)' : 'rgba(236, 72, 153, 0.04)' },  // Pink
    ];

    const drawOrbs = () => {
      ctx.fillStyle = isDark ? '#0B1220' : '#fafafa';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid overlay
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.02)';
      ctx.lineWidth = 1;

      for (let i = 0; i < width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 50) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Draw moving blurred orbs
      orbs.forEach(orb => {
        // Move
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Bounce & clamp to prevent getting stuck outside screen bounds
        if (orb.x - orb.r < 0) {
          orb.x = orb.r;
          orb.vx = Math.abs(orb.vx);
        } else if (orb.x + orb.r > width) {
          orb.x = width - orb.r;
          orb.vx = -Math.abs(orb.vx);
        }

        if (orb.y - orb.r < 0) {
          orb.y = orb.r;
          orb.vy = Math.abs(orb.vy);
        } else if (orb.y + orb.r > height) {
          orb.y = height - orb.r;
          orb.vy = -Math.abs(orb.vy);
        }

        // Draw radial gradient
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, isDark ? 'rgba(8,8,8,0)' : 'rgba(250,250,250,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(drawOrbs);
    };

    drawOrbs();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, [isDark, primaryColor]);

  const getFormInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    return {
      borderColor: isFocused ? primaryColor : borderCol,
      background: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.7)',
      color: pri,
      boxShadow: isFocused
        ? (isDark ? '0 0 0 3px rgba(var(--primary-rgb), 0.22), 0 4px 12px rgba(var(--primary-rgb), 0.08)' : '0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.04)')
        : 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
    };
  };

  // Submit operations
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth approval
    setActivePage('auth-success');
  };

  // OTP focus shift
  const handleOtpChange = (val: string, index: number) => {
    if (/^[0-9]?$/.test(val)) {
      const nextOtp = [...formOtp];
      nextOtp[index] = val;
      setFormOtp(nextOtp);

      if (val && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative h-full">
      {/* Dynamic Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-40" />

      {/* Floating Back to Dashboard Button */}
      {mode.startsWith('auth-') && (
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={() => setActivePage(prevPage)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: borderCol,
              color: pri,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to {prevPage === 'dashboard' ? 'Dashboard' : prevPage.replace('crm-', 'CRM ').replace('app-', '').replace('dash-', '').replace('projects-', 'Projects ').replace('ecommerce-', 'Ecommerce ').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        </div>
      )}

      {/* Centered Form Wrapper */}
      <div className="flex-1 flex flex-col items-center p-6 md:p-12 overflow-y-auto z-10 w-full h-full text-center">
        <div className="my-auto flex flex-col items-center w-full max-w-sm py-8">
          <AnimatePresence mode="wait">

            {/* SIGN IN CONSOLE */}
            {mode === 'auth-signin' && (
              <motion.div
                key="signin"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-black tracking-tight" style={{ color: pri }}>Welcome Back</h3>
                  <p className="text-xs mt-1.5" style={{ color: sec }}>Enter your details to access your secure dashboard console.</p>
                </div>

                {/* Social Login Panel */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:bg-gray-500/5 active:scale-98"
                    style={{ borderColor: borderCol, color: pri }}
                    onClick={() => setActivePage('auth-success')}
                  >
                    <IconGoogle />
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:bg-gray-500/5 active:scale-98"
                    style={{ borderColor: borderCol, color: pri }}
                    onClick={() => setActivePage('auth-success')}
                  >
                    <IconGithub />
                    GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-4 select-none">
                  <div className="flex-grow border-t" style={{ borderColor: borderCol }} />
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: mut }}>or email</span>
                  <div className="flex-grow border-t" style={{ borderColor: borderCol }} />
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'email' ? primaryColor : sec }}>Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconMail /></span>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('email')}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-black uppercase tracking-wider transition-colors" style={{ color: focusedField === 'password' ? primaryColor : sec }}>Password</label>
                      <button
                        type="button"
                        onClick={() => setActivePage('auth-reset')}
                        className="text-[10px] font-bold text-primary hover:underline transition-all"
                      >Forgot Password?</button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconLock /></span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('password')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1 select-none">
                    <input type="checkbox" id="remember-terminal" className="cursor-pointer" style={{ accentColor: primaryColor }} />
                    <label htmlFor="remember-terminal" className="text-[11px] font-bold cursor-pointer" style={{ color: sec }}>Remember this device</label>
                  </div>

                  <GlassButton type="submit" className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    Sign In
                  </GlassButton>
                </form>

                <div className="mt-6 pt-5 border-t text-center text-xs" style={{ borderColor: borderCol, color: sec }}>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setActivePage('auth-signup')}
                    className="font-bold text-primary hover:underline transition-all"
                  >Sign Up</button>
                </div>
              </motion.div>
            )}

            {/* SIGN UP CONSOLE */}
            {mode === 'auth-signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                <div className="mb-6">
                  <h3 className="text-lg font-black tracking-tight" style={{ color: pri }}>Create Account</h3>
                  <p className="text-xs mt-1.5" style={{ color: sec }}>Register a secure profile to access the platform modules.</p>
                </div>

                {/* Social Login Panel */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:bg-gray-500/5 active:scale-98"
                    style={{ borderColor: borderCol, color: pri }}
                    onClick={() => setActivePage('auth-success')}
                  >
                    <IconGoogle />
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-[11px] font-bold cursor-pointer transition-all hover:bg-gray-500/5 active:scale-98"
                    style={{ borderColor: borderCol, color: pri }}
                    onClick={() => setActivePage('auth-success')}
                  >
                    <IconGithub />
                    GitHub
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center my-4 select-none">
                  <div className="flex-grow border-t" style={{ borderColor: borderCol }} />
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: mut }}>or register</span>
                  <div className="flex-grow border-t" style={{ borderColor: borderCol }} />
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'name' ? primaryColor : sec }}>Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconUser /></span>
                      <input
                        type="text"
                        required
                        placeholder="Sara Nouri"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('name')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'email' ? primaryColor : sec }}>Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconMail /></span>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('email')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'password' ? primaryColor : sec }}>Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconLock /></span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('password')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-1 select-none">
                    <input type="checkbox" id="accept-osha" required className="cursor-pointer" style={{ accentColor: primaryColor }} />
                    <label htmlFor="accept-osha" className="text-[11px] font-bold cursor-pointer leading-normal" style={{ color: sec }}>I agree to Enterhub's terms of service and privacy policies</label>
                  </div>

                  <GlassButton type="submit" className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    Create Account
                  </GlassButton>
                </form>

                <div className="mt-6 pt-5 border-t text-center text-xs" style={{ borderColor: borderCol, color: sec }}>
                  Already registered?{' '}
                  <button
                    onClick={() => setActivePage('auth-signin')}
                    className="font-bold text-primary hover:underline transition-all"
                  >Sign In</button>
                </div>
              </motion.div>
            )}

            {/* PASSWORD RESET */}
            {mode === 'auth-reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                {/* Reset — Mail Send Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring' }}
                  className="w-16 h-16 rounded-full bg-[rgba(var(--primary-rgb),0.1)] border border-[rgba(var(--primary-rgb),0.3)] flex items-center justify-center mx-auto mb-4 overflow-hidden"
                  style={{ color: primaryColor }}
                >
                  <AnimatedLordicon iconData={mailIcon} size={38} color={primaryColor} speed={0.2} loop={false} />
                </motion.div>

                <div className="mb-6 text-center">
                  <h3 className="text-lg font-black tracking-tight" style={{ color: pri }}>Reset Password</h3>
                  <p className="text-xs mt-1.5" style={{ color: sec }}>Provide registered email to generate manual authorization emergency bypass link.</p>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'email' ? primaryColor : sec }}>Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconMail /></span>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('email')}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <GlassButton type="submit" className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      Send Verification Token
                    </GlassButton>
                  </motion.div>
                </form>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 pt-5 border-t text-center text-xs"
                  style={{ borderColor: borderCol, color: sec }}
                >
                  Remember passcode?{' '}
                  <button
                    onClick={() => setActivePage('auth-signin')}
                    className="font-bold text-primary hover:underline transition-all"
                  >Return to access console</button>
                </motion.div>
              </motion.div>
            )}

            {/* PASSWORD CREATE */}
            {mode === 'auth-create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                {/* Create Password — Lock Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring' }}
                  className="w-16 h-16 rounded-full bg-[rgba(var(--primary-rgb),0.1)] border border-[rgba(var(--primary-rgb),0.3)] flex items-center justify-center mx-auto mb-4 overflow-hidden"
                  style={{ color: primaryColor }}
                >
                  <AnimatedLordicon iconData={lockIcon} size={38} color={primaryColor} />
                </motion.div>

                <div className="mb-6 text-center">
                  <h3 className="text-lg font-black tracking-tight" style={{ color: pri }}>Create security passcode</h3>
                  <p className="text-xs mt-1.5" style={{ color: sec }}>Construct a brand new hardware authorization validation signature passcode.</p>
                </div>

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'password' ? primaryColor : sec }}>Set Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconLock /></span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('password')}
                      />
                    </div>

                    {/* Password Strength Meter */}
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                        <span style={{ color: sec }}>Strength</span>
                        <span style={{ color: passwordStrength.text }}>{passwordStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-500/10 overflow-hidden" style={{ border: `1px solid ${borderCol}` }}>
                        <motion.div
                          className="h-full rounded-full transition-colors duration-300"
                          animate={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="pt-1.5"
                  >
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors" style={{ color: focusedField === 'confirm-pass' ? primaryColor : sec }}>Confirm Password</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconLock /></span>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        onFocus={() => setFocusedField('confirm-pass')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none"
                        style={getFormInputStyle('confirm-pass')}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="pt-2"
                  >
                    <GlassButton type="submit" className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      Confirm Password
                    </GlassButton>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* LOCK SCREEN */}
            {mode === 'auth-lock' && (
              <motion.div
                key="lock"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border text-center relative overflow-hidden"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                {/* Simplified User Avatar */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 relative bg-black flex items-center justify-center shadow-lg mb-3" style={{ borderColor: borderCol }}>
                    <img src="/profile.png" alt="Ali Mohammadi" className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-base font-extrabold" style={{ color: pri }}>Ali Mohammadi</h4>
                  <p className="text-xs mt-1 flex items-center gap-1.5 justify-center" style={{ color: sec }}>
                    <AnimatedLordicon iconData={lockIcon} size={16} color={primaryColor} />
                    Session Locked
                  </p>
                </div>

                {/* Simple Password Input */}
                <form onSubmit={handleSubmitForm} className="space-y-4 text-left">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconLock /></span>
                    <input
                      type="password"
                      required
                      placeholder="Enter password to unlock"
                      value={formPasscode}
                      onChange={e => setFormPasscode(e.target.value)}
                      onFocus={() => setFocusedField('passcode')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-xs outline-none border transition-colors"
                      style={getFormInputStyle('passcode')}
                    />
                  </div>

                  <GlassButton type="submit" className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                    Unlock Session
                  </GlassButton>
                </form>

                <div className="mt-6 pt-5 border-t text-center text-xs" style={{ borderColor: borderCol, color: sec }}>
                  Not Ali?{' '}
                  <button
                    onClick={() => setActivePage('auth-signin')}
                    className="font-bold text-primary hover:underline transition-all cursor-pointer"
                  >Sign in with another account</button>
                </div>
              </motion.div>
            )}

            {/* LOGOUT SCREEN */}
            {mode === 'auth-logout' && (
              <motion.div
                key="logout"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border text-center"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                {/* Logout Exit Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', delay: 0.15 }}
                  className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-500 overflow-hidden"
                >
                  <AnimatedLordicon iconData={arrowDownIcon} size={36} color="#f59e0b" />
                </motion.div>

                <h3 className="text-lg font-black tracking-wide" style={{ color: pri }}>Securely Signed Out</h3>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: sec }}>
                  Your secure administrator terminal connection has been closed. Thank you for using Enterhub.
                </p>

                <div className="mt-6 pt-5 border-t flex flex-col gap-3" style={{ borderColor: borderCol }}>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GlassButton onClick={() => setActivePage('auth-signin')} className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px' }}>
                      Sign Back In
                    </GlassButton>
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    onClick={() => setActivePage('dashboard')}
                    className="text-xs font-bold transition-colors py-2 rounded-xl hover:bg-gray-500/5 cursor-pointer"
                    style={{ color: pri }}
                  >Go to Dashboard</motion.button>
                </div>
              </motion.div>
            )}

            {/* AUTHORIZATION SUCCESS SCREEN — PREMIUM REDESIGN */}
            {/* SUCCESS — ultra clean */}
            {mode === 'auth-success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border text-center"
                style={{
                  ...glassStyle(isDark),
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)'
                }}
              >
                <div className="flex flex-col items-center justify-center py-2">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="mb-6 flex items-center justify-center w-16 h-16 rounded-full" 
                    style={{ background: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.1)' }}
                  >
                     <motion.svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <motion.polyline 
                          points="20 6 9 17 4 12"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                        />
                     </motion.svg>
                  </motion.div>
                  
                  <h3 className="text-lg font-black tracking-tight mb-2" style={{ color: pri }}>Access Granted</h3>
                  <p className="text-xs leading-relaxed mb-8" style={{ color: sec }}>Your identity has been securely verified.</p>
                  
                  <GlassButton
                    onClick={() => setActivePage('dashboard')}
                    className="w-full py-3"
                    style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}
                  >
                    Enter Workspace
                  </GlassButton>
                </div>
              </motion.div>
            )}


            {/* TWO-STEP — refined glass card */}
            {mode === 'auth-2step' && (
              <motion.div
                key="2step"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 12 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl p-8 border"
                style={{
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.6)' : '0 30px 60px rgba(0,0,0,0.06)',
                }}
              >
                {/* Hairline violet accent at top */}
                <div
                  className="absolute top-0 left-8 right-8 h-px rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--primary-rgb),0.5), transparent)' }}
                />

                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', border: `1px solid ${borderCol}` }}
                >
                  <AnimatedLordicon iconData={notificationIcon} size={32} color={primaryColor} />
                </motion.div>

                {/* Text */}
                <div className="mb-6">
                  <h3 className="text-lg font-black tracking-tight mb-1.5" style={{ color: pri }}>2-Step Verification</h3>
                  <p className="text-xs leading-relaxed" style={{ color: sec }}>
                    Enter the 4-digit code sent to your registered device.
                  </p>
                </div>

                {/* OTP Inputs */}
                <form onSubmit={handleSubmitForm}>
                  <div className="flex justify-center gap-3 mb-6">
                    {formOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        required
                        value={digit}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        className="w-13 h-14 rounded-2xl text-center text-lg font-black outline-none transition-all duration-200"
                        style={{
                          width: '3.25rem',
                          background: digit
                            ? (isDark ? 'rgba(var(--primary-rgb),0.12)' : 'rgba(var(--primary-rgb),0.06)')
                            : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: digit ? 'rgba(var(--primary-rgb),0.5)' : borderCol,
                          color: pri,
                          boxShadow: digit ? '0 0 0 3px rgba(var(--primary-rgb),0.1)' : 'none',
                          fontFamily: 'monospace',
                        }}
                      />
                    ))}
                  </div>

                  <GlassButton type="submit" className="w-full py-3" style={{ borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                    Verify Code
                  </GlassButton>
                </form>

                <div
                  className="mt-6 pt-5 border-t flex items-center justify-between"
                  style={{ borderColor: borderCol }}
                >
                  <span className="text-[11px]" style={{ color: mut }}>Didn't receive it?</span>
                  <button
                    type="button"
                    onClick={() => alert('New code sent!')}
                    className="text-[11px] font-bold text-primary hover:underline transition-all cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>
              </motion.div>
            )}


            {/* ERROR PAGES — PREMIUM REDESIGN */}
            {mode === 'auth-errors' && (
              <motion.div
                key="errors"
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -16 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="w-full max-w-sm"
              >
                {/* Error selector tabs */}
                <ErrorPagesTabs isDark={isDark} pri={pri} sec={sec} mut={mut} borderCol={borderCol} setActivePage={setActivePage} alertCircleIcon={alertCircleIcon} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
