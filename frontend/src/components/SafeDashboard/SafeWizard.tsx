'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { User, Briefcase, MapPin, CreditCard, ShieldCheck, Check, PartyPopper, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

const GRAD = 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)';
const ERR = '#f43f5e';

const slide: Variants = {
  enter: (dir: number) => ({ x: dir >= 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir: number) => ({ x: dir >= 0 ? -48 : 48, opacity: 0, transition: { duration: 0.2 } }),
};
const fieldsWrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };
const fieldRise: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } };

/* ===================================================================== *
 *  Form atoms                                                           *
 * ===================================================================== */
function WInput({ isDark, label, value, onChange, error, type = 'text', placeholder, hintLabel, onFocus, onBlur, inputMode }: { isDark: boolean; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; placeholder?: string; hintLabel?: string; onFocus?: () => void; onBlur?: () => void; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  return (
    <div>
      <label className="text-[12px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: pri }}>
        {label}
        {hintLabel && <span style={{ color: mut, fontWeight: 400 }}>{hintLabel}</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={e => onChange(e.target.value)}
        className="w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200"
        style={{
          background: bg,
          border: `1px solid ${error ? ERR : border}`,
          boxShadow: error ? `0 0 0 3px ${ERR}1f` : 'none',
          color: pri,
        }}
      />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[11px] mt-1.5 font-medium overflow-hidden" style={{ color: ERR }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function WChips({ isDark, label, options, value, onChange, error }: { isDark: boolean; label: string; options: string[]; value: string; onChange: (v: string) => void; error?: string }) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  return (
    <div>
      <label className="text-[12px] font-semibold block mb-2" style={{ color: pri }}>{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const on = value === o;
          return (
            <motion.button
              key={o}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(o)}
              className="px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-colors duration-200"
              style={{
                background: on ? (isDark ? 'rgba(var(--primary-rgb), 0.16)' : 'rgba(var(--primary-rgb), 0.1)') : bg,
                border: `1.5px solid ${on ? primaryColor : error ? `${ERR}80` : border}`,
                color: on ? (isDark ? '#a5b4fc' : 'var(--primary)') : sec,
              }}
            >
              {o}
            </motion.button>
          );
        })}
      </div>
      {error && <p className="text-[11px] mt-1.5 font-medium" style={{ color: ERR }}>{error}</p>}
    </div>
  );
}

const Field = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={fieldRise} className={className}>{children}</motion.div>
);

/* ===================================================================== *
 *  Bank card helpers + live visual                                      *
 * ===================================================================== */
const onlyDigits = (v: string) => v.replace(/\D/g, '');
const maskCard = (v: string) => onlyDigits(v).slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ');
const maskExpiry = (v: string) => {
  const d = onlyDigits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const detectBrand = (v: string) => {
  const d = onlyDigits(v);
  if (/^4/.test(d)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'AMEX';
  if (/^6(011|5)/.test(d)) return 'Discover';
  return '';
};

function BankCard({ number, name, expiry, cvv, brand, flipped }: { number: string; name: string; expiry: string; cvv: string; brand: string; flipped: boolean }) {
  const digits = onlyDigits(number);
  const shown = Array.from({ length: 16 })
    .map((_, i) => digits[i] ?? '•')
    .join('')
    .replace(/(.{4})/g, '$1 ')
    .trim();

  return (
    <div style={{ perspective: 1200, width: '100%', maxWidth: 340 }}>
      <motion.div
        className="relative"
        style={{ transformStyle: 'preserve-3d', aspectRatio: '1.586', width: '100%' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, var(--primary-hover) 0%, var(--primary) 48%, var(--primary) 100%)',
            boxShadow: '0 18px 44px rgba(var(--primary-rgb), 0.45)',
            color: '#fff',
          }}
        >
          <div className="absolute -right-10 -top-12 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div className="absolute -right-2 top-10 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="relative flex items-start justify-between">
            <div className="w-11 h-8 rounded-md" style={{ background: 'linear-gradient(135deg, #f5d77a, #d4a843)' }} />
            <span className="text-[15px] font-bold italic tracking-wide" style={{ minHeight: 18 }}>{brand}</span>
          </div>
          <div className="relative text-[19px] font-mono tracking-[0.12em] tabular-nums" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
            {shown}
          </div>
          <div className="relative flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] uppercase tracking-widest opacity-70">Card Holder</p>
              <p className="text-[12.5px] font-semibold uppercase truncate">{name || 'Your Name'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-widest opacity-70">Expires</p>
              <p className="text-[12.5px] font-semibold font-mono">{expiry || 'MM/YY'}</p>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #3730a3 0%, #5b54d6 100%)',
            boxShadow: '0 18px 44px rgba(var(--primary-rgb), 0.45)',
            color: '#fff',
          }}
        >
          <div className="w-full h-9 mt-5" style={{ background: 'rgba(0,0,0,0.55)' }} />
          <div className="px-5 mt-4">
            <p className="text-[8px] uppercase tracking-widest opacity-70 mb-1 text-right">CVV</p>
            <div className="h-8 rounded-md flex items-center justify-end px-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
              <span className="font-mono text-[13px] font-bold tracking-widest" style={{ color: '#1a1a1a' }}>{cvv || '•••'}</span>
            </div>
          </div>
          <span className="mt-auto px-5 pb-4 text-right text-[14px] font-bold italic" style={{ minHeight: 18 }}>{brand}</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ===================================================================== *
 *  Step header (icon chip + title + description)                        *
 * ===================================================================== */
function StepHeader({ isDark, Icon, title, desc }: { isDark: boolean; Icon: React.ComponentType<{ size?: number }>; title: string; desc: string }) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  return (
    <motion.div variants={fieldRise} className="flex items-center gap-3.5 mb-6">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: GRAD, color: '#fff', boxShadow: `0 8px 22px ${primaryColor}50` }}>
        <Icon size={20} />
      </div>
      <div>
        <h4 className="text-[16px] font-bold leading-tight" style={{ color: pri }}>{title}</h4>
        <p className="text-[12.5px] mt-0.5" style={{ color: sec }}>{desc}</p>
      </div>
    </motion.div>
  );
}

/* ===================================================================== *
 *  Horizontal Stepper                                                   *
 * ===================================================================== */
interface StepDef { key: string; label: string; sub: string; Icon: React.ComponentType<{ size?: number }>; title: string; desc: string; }

function Stepper({ isDark, steps, current, done }: { isDark: boolean; steps: StepDef[]; current: number; done: boolean }) {
  const { primaryColor } = useTheme();
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const track = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';
  const progress = done ? 1 : current / (steps.length - 1);

  return (
    <>
      {/* --- Desktop Stepper --- */}
      <div className="hidden sm:block">
        <div className="relative px-2">
          <div className="absolute left-8 right-8" style={{ top: 21, height: 3, background: track, borderRadius: 3 }} />
          <motion.div
            className="absolute left-8"
            style={{ top: 21, height: 3, background: GRAD, right: 32, borderRadius: 3, transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ type: 'spring', stiffness: 150, damping: 24 }}
          />
          <div className="relative flex justify-between">
            {steps.map((s, i) => {
              const completed = done || i < current;
              const activeStep = !done && i === current;
              const lit = completed || activeStep;
              return (
                <div key={s.key} className="flex flex-col items-center gap-2" style={{ width: 84 }}>
                  <motion.div
                    animate={{ scale: activeStep ? 1.12 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="w-11 h-11 rounded-full flex items-center justify-center relative"
                    style={{
                      background: lit ? GRAD : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      border: lit ? 'none' : `2px solid ${track}`,
                      color: lit ? '#fff' : mut,
                      boxShadow: activeStep ? `0 0 0 6px ${primaryColor}22, 0 8px 20px ${primaryColor}40` : completed ? `0 6px 16px ${primaryColor}30` : 'none',
                    }}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {completed ? (
                        <motion.span key="c" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                          <Check size={19} strokeWidth={3} />
                        </motion.span>
                      ) : (
                        <motion.span key="i" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          <s.Icon size={18} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <div className="text-center leading-tight">
                    <p className="text-[12px] font-bold" style={{ color: lit ? sec : mut }}>{s.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: mut }}>{s.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- Mobile Stepper --- */}
      <div className="sm:hidden flex flex-col gap-4">
        <div className="flex items-center justify-between p-3.5 rounded-2xl" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${borderSubtle(isDark)}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: GRAD, boxShadow: `0 4px 12px ${primaryColor}40` }}>
              {done ? <Check size={18} strokeWidth={3} /> : React.createElement(steps[current]?.Icon || Check, { size: 18 })}
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: mut }}>Step {done ? steps.length : current + 1} of {steps.length}</p>
              <p className="text-[13.5px] font-bold" style={{ color: sec }}>{done ? 'Completed' : steps[current].label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pr-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current && !done ? 16 : 6,
                  background: (done || i <= current) ? primaryColor : track,
                  opacity: (done || i < current) ? 0.4 : 1
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ===================================================================== *
 *  Button                                                               *
 * ===================================================================== */
function WizBtn({ isDark, children, onClick, disabled, variant = 'solid', className = '' }: { isDark: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: 'solid' | 'ghost'; className?: string }) {
  const { primaryColor } = useTheme();
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);
  const solid = variant === 'solid';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : solid ? { scale: 1.02, boxShadow: `0 12px 30px ${primaryColor}66` } : { borderColor: primaryColor }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${className}`}
      style={
        solid
          ? { background: GRAD, color: '#fff', opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: `0 8px 20px ${primaryColor}40` }
          : { background: 'transparent', color: sec, border: `1px solid ${border}`, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }
      }
    >
      {children}
    </motion.button>
  );
}

/* ===================================================================== *
 *  Section wrapper                                                      *
 * ===================================================================== */
function Section({ isDark, title, hint, children }: { isDark: boolean; title: string; hint?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-6 sm:p-7 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? <p className="text-[12px] mt-1 mb-7" style={{ color: mut }}>{hint}</p> : <div className="mb-7" />}
      {children}
    </motion.section>
  );
}

/* ===================================================================== *
 *  Vertical Wizard (compact variant)                                    *
 * ===================================================================== */
const V_STEPS = ['Plan', 'Billing', 'Confirm'];
const PLANS = ['Starter — $0', 'Pro — $29', 'Enterprise — Custom'];
const CYCLES = ['Monthly', 'Yearly (-20%)'];

function VerticalWizard({ isDark }: { isDark: boolean }) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const track = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(0);
  const [done, setDone] = useState(false);
  const [plan, setPlan] = useState(PLANS[1]);
  const [cycle, setCycle] = useState(CYCLES[0]);

  const go = (n: number) => { setDir(n); setStep(s => Math.min(V_STEPS.length - 1, Math.max(0, s + n))); };

  return (
    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
      {/* --- Desktop Vertical Steps --- */}
      <div className="hidden sm:block relative shrink-0" style={{ width: 150 }}>
        <div className="absolute left-[18px] top-4 bottom-4" style={{ width: 2, background: track }} />
        <motion.div
          className="absolute left-[18px] top-4"
          style={{ width: 2, background: GRAD, transformOrigin: 'top' }}
          initial={false}
          animate={{ height: `${(done ? V_STEPS.length - 1 : step) / (V_STEPS.length - 1) * 100}%` }}
          transition={{ type: 'spring', stiffness: 150, damping: 24 }}
        />
        {V_STEPS.map((label, i) => {
          const completed = done || i < step;
          const activeStep = !done && i === step;
          const lit = completed || activeStep;
          return (
            <div key={label} className="relative flex items-center gap-3 mb-8 last:mb-0">
              <motion.div
                animate={{ scale: activeStep ? 1.1 : 1 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold z-10"
                style={{
                  background: lit ? GRAD : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  border: lit ? 'none' : `2px solid ${track}`,
                  color: lit ? '#fff' : mut,
                  boxShadow: activeStep ? `0 0 0 5px ${primaryColor}22` : 'none',
                }}
              >
                {completed ? <Check size={16} strokeWidth={3} /> : i + 1}
              </motion.div>
              <span className="text-[12.5px] font-semibold" style={{ color: lit ? sec : mut }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* --- Mobile Horizontal Steps --- */}
      <div className="sm:hidden flex items-center justify-between relative px-4 mb-2">
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2" style={{ height: 2, background: track }} />
        <motion.div
          className="absolute left-8 top-1/2 -translate-y-1/2"
          style={{ height: 2, background: GRAD, transformOrigin: 'left' }}
          initial={false}
          animate={{ width: `${(done ? V_STEPS.length - 1 : step) / (V_STEPS.length - 1) * 100}%` }}
          transition={{ type: 'spring', stiffness: 150, damping: 24 }}
        />
        {V_STEPS.map((label, i) => {
          const completed = done || i < step;
          const activeStep = !done && i === step;
          const lit = completed || activeStep;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ scale: activeStep ? 1.15 : 1 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: lit ? GRAD : isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  border: lit ? 'none' : `2px solid ${track}`,
                  color: lit ? '#fff' : mut,
                  boxShadow: activeStep ? `0 0 0 4px ${primaryColor}22` : 'none',
                }}
              >
                {completed ? <Check size={14} strokeWidth={3} /> : i + 1}
              </motion.div>
              <span className="absolute top-full mt-2 text-[10px] font-bold" style={{ color: lit ? sec : mut, opacity: activeStep ? 1 : 0.6 }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex-1 min-h-[180px] flex flex-col mt-6 sm:mt-0">
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            {done ? (
              <motion.div key="done" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ background: GRAD, color: '#fff', boxShadow: `0 10px 24px ${primaryColor}50` }}>
                  <Check size={26} strokeWidth={3} />
                </motion.div>
                <p className="text-[15px] font-bold" style={{ color: pri }}>Subscription confirmed</p>
                <p className="text-[12.5px] mt-1" style={{ color: sec }}>{plan} · {cycle}</p>
              </motion.div>
            ) : (
              <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit">
                {step === 0 && <WChips isDark={isDark} label="Choose a plan" options={PLANS} value={plan} onChange={setPlan} />}
                {step === 1 && <WChips isDark={isDark} label="Billing cycle" options={CYCLES} value={cycle} onChange={setCycle} />}
                {step === 2 && (
                  <div className="rounded-2xl p-4" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${borderSubtle(isDark)}` }}>
                    <p className="text-[12px] font-semibold mb-3" style={{ color: pri }}>Review</p>
                    <div className="flex justify-between text-[12.5px] mb-1.5"><span style={{ color: mut }}>Plan</span><span style={{ color: sec, fontWeight: 600 }}>{plan}</span></div>
                    <div className="flex justify-between text-[12.5px]"><span style={{ color: mut }}>Cycle</span><span style={{ color: sec, fontWeight: 600 }}>{cycle}</span></div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!done ? (
          <div className="flex justify-between mt-6">
            <WizBtn isDark={isDark} variant="ghost" disabled={step === 0} onClick={() => go(-1)}><ArrowLeft size={15} /> Back</WizBtn>
            {step < V_STEPS.length - 1 ? (
              <WizBtn isDark={isDark} onClick={() => go(1)}>Next <ArrowRight size={15} /></WizBtn>
            ) : (
              <WizBtn isDark={isDark} onClick={() => setDone(true)}>Confirm <Check size={15} /></WizBtn>
            )}
          </div>
        ) : (
          <div className="flex justify-end mt-6">
            <WizBtn isDark={isDark} variant="ghost" onClick={() => { setDone(false); setStep(0); setDir(-1); }}>Start over</WizBtn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
const STEPS: StepDef[] = [
  { key: 'account', label: 'Account', sub: 'Login details', Icon: User, title: 'Create your account', desc: 'Start with your name and how to reach you.' },
  { key: 'profile', label: 'Profile', sub: 'About you', Icon: Briefcase, title: 'Tell us about your work', desc: 'A few details to personalise your workspace.' },
  { key: 'address', label: 'Address', sub: 'Location', Icon: MapPin, title: 'Where are you based?', desc: 'Used for billing and localisation.' },
  { key: 'payment', label: 'Payment', sub: 'Card details', Icon: CreditCard, title: 'Add a payment method', desc: 'Your card is shown live as you type — it never leaves this demo.' },
  { key: 'review', label: 'Review', sub: 'Confirm', Icon: ShieldCheck, title: 'Review & confirm', desc: 'Double-check everything before we finish.' },
];
const ROLES = ['Founder', 'Engineer', 'Designer', 'Other'];
const COUNTRIES = ['United States', 'United Kingdom', 'Germany', 'Other'];

interface FormData {
  name: string; email: string; password: string;
  company: string; role: string; bio: string;
  country: string; city: string; zip: string;
  cardNumber: string; cardName: string; cardExpiry: string; cardCvv: string;
}
const EMPTY: FormData = { name: '', email: '', password: '', company: '', role: '', bio: '', country: '', city: '', zip: '', cardNumber: '', cardName: '', cardExpiry: '', cardCvv: '' };

export default function SafeWizard({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [cardFlip, setCardFlip] = useState(false);

  const set = (k: keyof FormData, v: string) => {
    setData(d => ({ ...d, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = (s: number): Partial<Record<keyof FormData, string>> => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 0) {
      if (!data.name.trim()) e.name = 'Please enter your name';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = 'Enter a valid email';
      if (data.password.length < 6) e.password = 'At least 6 characters';
    } else if (s === 1) {
      if (!data.company.trim()) e.company = 'Company is required';
      if (!data.role) e.role = 'Pick a role';
    } else if (s === 2) {
      if (!data.country) e.country = 'Select a country';
      if (!data.city.trim()) e.city = 'City is required';
      if (!/^\d{4,6}$/.test(data.zip)) e.zip = 'Enter a valid ZIP';
    } else if (s === 3) {
      if (onlyDigits(data.cardNumber).length < 15) e.cardNumber = 'Enter a valid card number';
      if (!data.cardName.trim()) e.cardName = 'Name on card is required';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.cardExpiry)) e.cardExpiry = 'Use MM/YY';
      if (!/^\d{3,4}$/.test(data.cardCvv)) e.cardCvv = '3–4 digits';
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step === STEPS.length - 1) { setDone(true); return; }
    setDir(1);
    setStep(s => s + 1);
  };
  const back = () => { setDir(-1); setStep(s => Math.max(0, s - 1)); };
  const jumpTo = (s: number) => { setDir(s < step ? -1 : 1); setStep(s); setErrors({}); };
  const reset = () => { setDone(false); setStep(0); setDir(-1); setData(EMPTY); setErrors({}); };

  const meta = STEPS[step];
  const percent = done ? 100 : Math.round((step / STEPS.length) * 100);

  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-4 text-[12.5px] py-1">
      <span style={{ color: mut }}>{label}</span>
      <span className="text-right font-medium" style={{ color: value ? sec : mut }}>{value || '—'}</span>
    </div>
  );

  const ReviewCard = ({ title, toStep, children }: { title: string; toStep: number; children: React.ReactNode }) => (
    <Field>
      <div className="rounded-2xl p-4 h-full" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: pri }}>{title}</p>
          <button type="button" onClick={() => jumpTo(toStep)} className="text-[11.5px] font-semibold transition-opacity hover:opacity-70" style={{ color: primaryColor }}>Edit</button>
        </div>
        {children}
      </div>
    </Field>
  );

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 py-5 sm:py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Wizard</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Wizard</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Main horizontal wizard --- */}
        <Section isDark={isDark} title="Account Setup" hint="A multi-step form with per-step validation, animated transitions and a review screen.">
          <div className="mb-7">
            <Stepper isDark={isDark} steps={STEPS} current={step} done={done} />
          </div>

          {/* progress bar */}
          <div className="hidden sm:flex items-center gap-3 mb-7">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
              <motion.div className="h-full rounded-full" style={{ background: GRAD }} initial={false} animate={{ width: `${done ? 100 : percent}%` }} transition={{ type: 'spring', stiffness: 150, damping: 24 }} />
            </div>
            <span className="text-[11px] font-bold tabular-nums" style={{ color: sec }}>{done ? 100 : percent}%</span>
          </div>

          <div className="relative overflow-hidden" style={{ minHeight: 290 }}>
            <AnimatePresence mode="wait" custom={dir} initial={false}>
              {done ? (
                <motion.div key="success" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -16 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 15 }}
                    className="w-[72px] h-[72px] rounded-3xl mx-auto flex items-center justify-center mb-5"
                    style={{ background: GRAD, color: '#fff', boxShadow: `0 16px 40px ${primaryColor}66` }}
                  >
                    <PartyPopper size={34} />
                  </motion.div>
                  <motion.h4 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="text-xl font-bold" style={{ color: pri }}>
                    You&apos;re all set, {data.name.split(' ')[0] || 'there'}!
                  </motion.h4>
                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[13px] mt-2 max-w-sm mx-auto" style={{ color: sec }}>
                    Your account has been created. We sent a confirmation to <span style={{ color: pri, fontWeight: 600 }}>{data.email}</span>.
                  </motion.p>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-7 flex justify-center">
                    <WizBtn isDark={isDark} variant="ghost" onClick={reset}>Create another</WizBtn>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div key={step} custom={dir} variants={slide} initial="enter" animate="center" exit="exit">
                  <motion.div variants={fieldsWrap} initial="hidden" animate="show">
                    <StepHeader isDark={isDark} Icon={meta.Icon} title={meta.title} desc={meta.desc} />

                    {step === 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <Field><WInput isDark={isDark} label="Full name" value={data.name} onChange={v => set('name', v)} error={errors.name} placeholder="Jane Cooper" /></Field>
                        <Field><WInput isDark={isDark} label="Email" type="email" value={data.email} onChange={v => set('email', v)} error={errors.email} placeholder="jane@company.com" /></Field>
                        <Field className="md:col-span-2"><WInput isDark={isDark} label="Password" type="password" value={data.password} onChange={v => set('password', v)} error={errors.password} placeholder="••••••••" /></Field>
                      </div>
                    )}
                    {step === 1 && (
                      <div className="grid grid-cols-1 gap-5">
                        <Field><WInput isDark={isDark} label="Company" value={data.company} onChange={v => set('company', v)} error={errors.company} placeholder="Acme Inc." /></Field>
                        <Field><WChips isDark={isDark} label="Your role" options={ROLES} value={data.role} onChange={v => set('role', v)} error={errors.role} /></Field>
                        <Field>
                          <label className="text-[12px] font-semibold block mb-1.5" style={{ color: pri }}>Short bio <span style={{ color: mut, fontWeight: 400 }}>(optional)</span></label>
                          <textarea
                            rows={3}
                            value={data.bio}
                            onChange={e => set('bio', e.target.value)}
                            placeholder="Tell us a little about yourself…"
                            className="w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none resize-none transition-all duration-200"
                            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${border}`, color: pri }}
                          />
                        </Field>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="grid grid-cols-1 gap-5">
                        <Field><WChips isDark={isDark} label="Country" options={COUNTRIES} value={data.country} onChange={v => set('country', v)} error={errors.country} /></Field>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <Field><WInput isDark={isDark} label="City" value={data.city} onChange={v => set('city', v)} error={errors.city} placeholder="San Francisco" /></Field>
                          <Field><WInput isDark={isDark} label="ZIP / Postal code" value={data.zip} onChange={v => set('zip', v)} error={errors.zip} placeholder="94103" /></Field>
                        </div>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-6 items-start">
                        <Field className="flex justify-center md:justify-start md:pt-1">
                          <BankCard
                            number={data.cardNumber}
                            name={data.cardName}
                            expiry={data.cardExpiry}
                            cvv={data.cardCvv}
                            brand={detectBrand(data.cardNumber)}
                            flipped={cardFlip}
                          />
                        </Field>
                        <div className="grid grid-cols-1 gap-4">
                          <Field><WInput isDark={isDark} label="Card number" value={data.cardNumber} onChange={v => set('cardNumber', maskCard(v))} error={errors.cardNumber} placeholder="4242 4242 4242 4242" inputMode="numeric" /></Field>
                          <Field><WInput isDark={isDark} label="Name on card" value={data.cardName} onChange={v => set('cardName', v)} error={errors.cardName} placeholder="JANE COOPER" /></Field>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field><WInput isDark={isDark} label="Expiry" value={data.cardExpiry} onChange={v => set('cardExpiry', maskExpiry(v))} error={errors.cardExpiry} placeholder="MM/YY" inputMode="numeric" /></Field>
                            <Field>
                              <WInput
                                isDark={isDark}
                                label="CVV"
                                value={data.cardCvv}
                                onChange={v => set('cardCvv', onlyDigits(v).slice(0, 4))}
                                error={errors.cardCvv}
                                placeholder="123"
                                inputMode="numeric"
                                onFocus={() => setCardFlip(true)}
                                onBlur={() => setCardFlip(false)}
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    )}
                    {step === 4 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ReviewCard title="Account" toStep={0}>
                          <SummaryRow label="Name" value={data.name} />
                          <SummaryRow label="Email" value={data.email} />
                          <SummaryRow label="Password" value={data.password ? '••••••••' : ''} />
                        </ReviewCard>
                        <ReviewCard title="Profile" toStep={1}>
                          <SummaryRow label="Company" value={data.company} />
                          <SummaryRow label="Role" value={data.role} />
                          <SummaryRow label="Bio" value={data.bio} />
                        </ReviewCard>
                        <ReviewCard title="Address" toStep={2}>
                          <SummaryRow label="Country" value={data.country} />
                          <SummaryRow label="City" value={data.city} />
                          <SummaryRow label="ZIP" value={data.zip} />
                        </ReviewCard>
                        <ReviewCard title="Payment" toStep={3}>
                          <SummaryRow label="Card" value={data.cardNumber ? `•••• ${onlyDigits(data.cardNumber).slice(-4)}` : ''} />
                          <SummaryRow label="Name" value={data.cardName} />
                          <SummaryRow label="Expiry" value={data.cardExpiry} />
                        </ReviewCard>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!done && (
            <div className="grid grid-cols-2 sm:flex sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-8 pt-5" style={{ borderTop: `1px solid ${border}` }}>
              <div className="col-span-1 sm:order-1 flex">
                <WizBtn isDark={isDark} variant="ghost" disabled={step === 0} onClick={back} className="w-full justify-center sm:w-auto"><ArrowLeft size={15} /> Back</WizBtn>
              </div>
              <span className="hidden sm:block sm:order-2 text-center text-[11.5px] font-medium" style={{ color: mut }}>Step {step + 1} of {STEPS.length}</span>
              <div className="col-span-1 sm:order-3 flex">
                <WizBtn isDark={isDark} onClick={next} className="w-full justify-center sm:w-auto">
                  {step < STEPS.length - 1 ? (
                    <span className="flex items-center gap-1.5">Continue <ArrowRight size={15} /></span>
                  ) : (
                    <span className="flex items-center gap-1.5">Submit <Check size={15} /></span>
                  )}
                </WizBtn>
              </div>
            </div>
          )}
        </Section>

        {/* --- Vertical wizard --- */}
        <Section isDark={isDark} title="Vertical Wizard" hint="The same flow with a vertical stepper — handy for narrow or sidebar layouts.">
          <VerticalWizard isDark={isDark} />
        </Section>

      </div>
    </motion.div>
  );
}
