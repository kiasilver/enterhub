'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Calendar as CalendarIcon, CalendarRange, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';

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

const ACCENT = 'var(--primary)';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

/* ---------- date helpers (no module-scope Date) ---------- */
const pad = (n: number) => String(n).padStart(2, '0');
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtDate = (d: Date) => `${pad(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`;

function buildMonthGrid(view: Date): Date[] {
  const first = startOfMonth(view);
  const lead = (first.getDay() + 6) % 7; // Monday-first
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) cells.push(new Date(first.getFullYear(), first.getMonth(), 1 - lead + i));
  return cells;
}

/* ===================================================================== *
 *  Popover — portal, anchored, flips up, content-sized                  *
 * ===================================================================== */
interface PopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  children: React.ReactNode;
}

function Popover({ anchorRef, open, onClose, isDark, children }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 8;
      const flipUp = window.innerHeight - r.bottom < 360 && r.top > window.innerHeight - r.bottom;
      const anchorRight = r.left > window.innerWidth / 2;
      const isMobile = window.innerWidth < 640;
      setPos({
        position: 'fixed',
        ...(flipUp ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
        ...(isMobile
          ? { left: '50%', transform: 'translateX(-50%)' }
          : anchorRight ? { right: window.innerWidth - r.right } : { left: r.left }),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && pos && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="z-[9999] rounded-2xl p-3 max-w-[calc(100vw-1.5rem)] sm:max-w-none shadow-2xl"
          style={{
            ...pos,
            background: isDark ? 'rgba(16,16,18,0.92)' : 'rgba(255,255,255,0.95)',
            border: `1px solid ${borderSubtle(isDark)}`,
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(0,0,0,0.14)',
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ===================================================================== *
 *  Calendar                                                             *
 * ===================================================================== */
const monthSlide: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0, transition: { duration: 0.18 } }),
};

interface CalendarProps {
  isDark: boolean;
  view: Date;
  setView: (d: Date) => void;
  mode?: 'single' | 'range';
  selected?: Date | null;
  range?: { start: Date | null; end: Date | null };
  onPick: (d: Date) => void;
  today: Date | null;
}

function Calendar({ isDark, view, setView, mode = 'single', selected = null, range = { start: null, end: null }, onPick, today }: CalendarProps) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const [dir, setDir] = useState(0);
  const cells = buildMonthGrid(view);
  const monthKey = `${view.getFullYear()}-${view.getMonth()}`;
  const rail = isDark ? 'rgba(var(--primary-rgb),0.14)' : 'rgba(var(--primary-rgb),0.1)';
  const hov = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  const nav = (n: number) => { setDir(n); setView(addMonths(view, n)); };

  const NavBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: sec }}
      onMouseEnter={e => (e.currentTarget.style.background = hov)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-full" style={{ width: 290 }}>
      <div className="flex items-center justify-between mb-2 px-1">
        <NavBtn onClick={() => nav(-1)}><ChevronLeft size={17} /></NavBtn>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={monthKey}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="text-[14px] font-bold"
            style={{ color: pri }}
          >
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </motion.span>
        </AnimatePresence>
        <NavBtn onClick={() => nav(1)}><ChevronRight size={17} /></NavBtn>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(w => (
          <div key={w} className="h-7 flex items-center justify-center text-[10px] font-semibold uppercase" style={{ color: mut }}>{w}</div>
        ))}
      </div>

      <div className="relative overflow-hidden" style={{ height: 240 }}>
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={monthKey}
            custom={dir}
            variants={monthSlide}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 grid grid-cols-7"
          >
            {cells.map((day, i) => {
              const otherMonth = day.getMonth() !== view.getMonth();
              const isSel = mode === 'single' && sameDay(day, selected);
              const isStart = mode === 'range' && sameDay(day, range.start);
              const isEnd = mode === 'range' && sameDay(day, range.end);
              const inRng = mode === 'range' && range.start && range.end && day > range.start && day < range.end;
              const isToday = sameDay(day, today);
              const filled = isSel || isStart || isEnd;

              return (
                <div key={i} className="relative h-10 flex items-center justify-center">
                  {/* range rail */}
                  {inRng && <span className="absolute inset-y-1 inset-x-0" style={{ background: rail }} />}
                  {isStart && range.end && <span className="absolute inset-y-1 right-0 w-1/2" style={{ background: rail }} />}
                  {isEnd && range.start && <span className="absolute inset-y-1 left-0 w-1/2" style={{ background: rail }} />}

                  <button
                    type="button"
                    onClick={() => onPick(day)}
                    className="relative w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-medium transition-colors"
                    style={{
                      background: filled ? ACCENT : 'transparent',
                      color: filled ? '#fff' : otherMonth ? mut : sec,
                      opacity: otherMonth && !filled ? 0.45 : 1,
                      boxShadow: isToday && !filled ? `inset 0 0 0 1.5px ${ACCENT}` : 'none',
                    }}
                    onMouseEnter={e => { if (!filled) e.currentTarget.style.background = hov; }}
                    onMouseLeave={e => { if (!filled) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {day.getDate()}
                    {isToday && !filled && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: ACCENT }} />
                    )}
                  </button>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {today && (
        <div className="flex justify-center mt-1.5 pt-2" style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}>
          <button
            type="button"
            onClick={() => { setDir(0); setView(startOfMonth(today)); onPick(today); }}
            className="text-[11.5px] font-semibold px-3 py-1 rounded-lg transition-colors"
            style={{ color: ACCENT }}
            onMouseEnter={e => (e.currentTarget.style.background = rail)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Go to Today
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================================================================== *
 *  TimeWheel                                                            *
 * ===================================================================== */
type TimeVal = { h: number; m: number; period: 'AM' | 'PM' };

function TimeColumn({ items, value, render, onSelect, isDark }: { items: number[]; value: number; render: (n: number) => string; onSelect: (n: number) => void; isDark: boolean }) {
  const sec = textSecondary(isDark);
  const hov = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const selRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { selRef.current?.scrollIntoView({ block: 'center' }); }, []);
  return (
    <div className="h-44 w-14 overflow-y-auto no-scrollbar flex flex-col gap-0.5 px-0.5">
      {items.map(n => {
        const on = n === value;
        return (
          <button
            key={n}
            ref={on ? selRef : undefined}
            type="button"
            onClick={() => onSelect(n)}
            className="shrink-0 h-9 rounded-lg text-[13px] font-medium transition-colors"
            style={{ background: on ? ACCENT : 'transparent', color: on ? '#fff' : sec }}
            onMouseEnter={e => { if (!on) e.currentTarget.style.background = hov; }}
            onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
          >
            {render(n)}
          </button>
        );
      })}
    </div>
  );
}

/* ===================================================================== *
 *  Trigger field (input-like button)                                    *
 * ===================================================================== */
const TriggerField = React.forwardRef<HTMLButtonElement, {
  isDark: boolean; icon: React.ReactNode; value: string | null; placeholder: string; open: boolean; onClick: () => void; onClear?: () => void;
}>(({ isDark, icon, value, placeholder, open, onClick, onClear }, ref) => {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 sm:gap-2.5 px-4 sm:px-3.5 py-3 sm:py-2.5 rounded-2xl sm:rounded-xl outline-none transition-all duration-200 text-left"
      style={{
        background: bg,
        border: `1px solid ${open ? ACCENT : border}`,
        boxShadow: open ? `0 0 0 3px rgba(var(--primary-rgb), 0.13)` : 'none',
        color: value ? pri : mut,
      }}
    >
      <span style={{ color: open || value ? ACCENT : mut }} className="transition-colors">{icon}</span>
      <span className="text-[13px] flex-1 truncate">{value || placeholder}</span>
      {value && onClear && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onClear(); }}
          className="p-0.5 rounded-md transition-colors hover:bg-black/10"
          style={{ color: mut }}
        >
          <X size={14} />
        </span>
      )}
    </button>
  );
});
TriggerField.displayName = 'TriggerField';

/* ===================================================================== *
 *  Section wrapper                                                      *
 * ===================================================================== */
function Section({ isDark, title, hint, children }: { isDark: boolean; title: string; hint?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-5 sm:p-6 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-[17px] sm:text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? <p className="text-[13px] sm:text-[12px] mt-1 mb-6 sm:mb-5 leading-relaxed" style={{ color: mut }}>{hint}</p> : <div className="mb-6 sm:mb-5" />}
      {children}
    </motion.section>
  );
}

/* ===================================================================== *
 *  LiveClock — self-contained, ticks every second                      *
 * ===================================================================== */
function LiveClock({ isDark }: { isDark: boolean }) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = now ? now.getHours() : 0;
  const m = now ? now.getMinutes() : 0;
  const s = now ? now.getSeconds() : 0;
  const h12 = h % 12 || 12;
  const period = h < 12 ? 'AM' : 'PM';
  const secAng = s * 6;
  const minAng = m * 6 + s * 0.1;
  const hourAng = (h % 12) * 30 + m * 0.5;
  const tz = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const dateLine = now ? `${WEEKDAYS_FULL[(now.getDay() + 6) % 7]}, ${fmtDate(now)}` : '—';

  return (
    <motion.section variants={fadeUp} className="relative overflow-hidden p-5 sm:p-7 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 sm:gap-8" style={glassStyle(isDark)}>
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] sm:hidden pointer-events-none" style={{ background: ACCENT, opacity: 0.15 }} />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[80px] sm:hidden pointer-events-none" style={{ background: sec, opacity: 0.1 }} />

      {/* Analog */}
      <div className="relative shrink-0 flex items-center justify-center p-2 sm:p-0 rounded-[2rem] sm:rounded-none z-10" style={{ background: 'transparent' }}>
        <svg viewBox="0 0 100 100" className="w-[120px] h-[120px] sm:w-[132px] sm:h-[132px] drop-shadow-xl sm:drop-shadow-none">
          <circle cx={50} cy={50} r={47} fill={isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)'} stroke={borderSubtle(isDark)} strokeWidth={1.5} className="sm:fill-transparent" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1={50}
              y1={7}
              x2={50}
              y2={i % 3 === 0 ? 13 : 11}
              stroke={i % 3 === 0 ? sec : mut}
              strokeWidth={i % 3 === 0 ? 2 : 1}
              strokeLinecap="round"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <line x1={50} y1={50} x2={50} y2={30} stroke={pri} strokeWidth={3.4} strokeLinecap="round" transform={`rotate(${hourAng} 50 50)`} />
          <line x1={50} y1={50} x2={50} y2={20} stroke={sec} strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${minAng} 50 50)`} />
          <line x1={50} y1={56} x2={50} y2={15} stroke={ACCENT} strokeWidth={1.3} strokeLinecap="round" transform={`rotate(${secAng} 50 50)`} />
          <circle cx={50} cy={50} r={3} fill={ACCENT} />
        </svg>
      </div>

      {/* Digital */}
      <div className="text-center sm:text-left z-10 w-full flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 sm:mb-1" style={{ color: mut }}>Current Time</p>
        <div className="flex items-baseline justify-center sm:justify-start gap-2 sm:gap-2 font-mono leading-none">
          <span className="text-[40px] sm:text-[44px] font-bold tabular-nums tracking-tighter" style={{ color: pri, letterSpacing: '-0.02em' }}>
            {pad(h12)}:{pad(m)}
          </span>
          <span className="text-[20px] sm:text-[22px] font-bold tabular-nums pb-1" style={{ color: ACCENT }}>{pad(s)}</span>
          <span className="text-[14px] sm:text-[15px] font-bold pb-2" style={{ color: sec }}>{period}</span>
        </div>

        <div className="mt-4 sm:mt-2.5 inline-flex items-center justify-center px-4 py-1.5 sm:px-0 sm:py-0 rounded-full sm:rounded-none bg-black/5 dark:bg-white/5 sm:bg-transparent sm:dark:bg-transparent">
          <p className="text-[12.5px] sm:text-[13px] font-medium" style={{ color: sec }}>{dateLine}</p>
        </div>
        {tz && <p className="text-[10px] sm:text-[11px] mt-2 sm:mt-0.5" style={{ color: mut }}>{tz}</p>}
      </div>
    </motion.section>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
export default function SafeAdvanced({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);

  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);

  // single date
  const [date, setDate] = useState<Date | null>(null);
  const [dateView, setDateView] = useState<Date | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const dateRef = useRef<HTMLButtonElement>(null);

  // range
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [rangeView, setRangeView] = useState<Date | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLButtonElement>(null);

  // time
  const [time, setTime] = useState<TimeVal | null>(null);
  const [timeOpen, setTimeOpen] = useState(false);
  const timeRef = useRef<HTMLButtonElement>(null);

  // inline
  const [inlineDate, setInlineDate] = useState<Date | null>(null);
  const [inlineView, setInlineView] = useState<Date | null>(null);

  useEffect(() => {
    const d = new Date();
    const som = startOfMonth(d);
    setToday(d);
    setDateView(som);
    setRangeView(som);
    setInlineView(som);
    setMounted(true);
  }, []);

  const pickRange = (d: Date) =>
    setRange(r => {
      if (!r.start || (r.start && r.end)) return { start: d, end: null };
      if (d < r.start) return { start: d, end: null };
      return { start: r.start, end: d };
    });

  const rangeLabel = range.start
    ? range.end
      ? `${fmtDate(range.start)}  →  ${fmtDate(range.end)}`
      : `${fmtDate(range.start)}  →  …`
    : null;

  const timeLabel = time ? `${time.h}:${pad(time.m)} ${time.period}` : null;
  const draftTime: TimeVal = time ?? { h: 9, m: 0, period: 'AM' };
  const setTimePart = (p: Partial<TimeVal>) => setTime({ ...draftTime, ...p });

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 pt-6 sm:pt-7 pb-48 sm:pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-8 sm:mb-7 max-w-4xl flex flex-col items-center sm:items-start text-center sm:text-left">
        <div className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full mb-3 sm:mb-1 border border-transparent sm:border-none" style={{ background: window.innerWidth < 640 ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)') : 'transparent', borderColor: window.innerWidth < 640 ? borderSubtle(isDark) : 'transparent' }}>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest sm:tracking-normal sm:font-medium" style={{ color: window.innerWidth < 640 ? sec : mut }}>Forms / Date and Time</p>
        </div>
        <h2 className="text-[32px] sm:text-2xl font-black sm:font-bold tracking-tight" style={{ color: pri, letterSpacing: '-0.02em' }}>Date and Time</h2>
        <p className="text-[13px] mt-2.5 sm:hidden px-4 opacity-80 leading-relaxed" style={{ color: sec }}>Interactive components for selecting and displaying dates, times, and ranges.</p>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Live clock --- */}
        <LiveClock isDark={isDark} />

        {/* --- Pickers row --- */}
        <Section isDark={isDark} title="Date & Time Pickers" hint="Fully custom pickers with animated month transitions — rendered in a portal so they never clip.">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">

            {/* Single date */}
            <div>
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: pri }}>Date Picker</label>
              <TriggerField
                ref={dateRef}
                isDark={isDark}
                icon={<CalendarIcon size={16} />}
                value={date ? fmtDate(date) : null}
                placeholder="Select a date"
                open={dateOpen}
                onClick={() => setDateOpen(o => !o)}
                onClear={() => setDate(null)}
              />
              <Popover anchorRef={dateRef} open={dateOpen && mounted} onClose={() => setDateOpen(false)} isDark={isDark}>
                {dateView && (
                  <Calendar
                    isDark={isDark}
                    view={dateView}
                    setView={setDateView}
                    selected={date}
                    today={today}
                    onPick={d => { setDate(d); setDateOpen(false); }}
                  />
                )}
              </Popover>
            </div>

            {/* Range */}
            <div>
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: pri }}>Date Range</label>
              <TriggerField
                ref={rangeRef}
                isDark={isDark}
                icon={<CalendarRange size={16} />}
                value={rangeLabel}
                placeholder="Start  →  End"
                open={rangeOpen}
                onClick={() => setRangeOpen(o => !o)}
                onClear={() => setRange({ start: null, end: null })}
              />
              <Popover anchorRef={rangeRef} open={rangeOpen && mounted} onClose={() => setRangeOpen(false)} isDark={isDark}>
                {rangeView && (
                  <Calendar
                    isDark={isDark}
                    view={rangeView}
                    setView={setRangeView}
                    mode="range"
                    range={range}
                    today={today}
                    onPick={pickRange}
                  />
                )}
              </Popover>
            </div>

            {/* Time */}
            <div>
              <label className="text-[12px] font-semibold block mb-1.5" style={{ color: pri }}>Time Picker</label>
              <TriggerField
                ref={timeRef}
                isDark={isDark}
                icon={<Clock size={16} />}
                value={timeLabel}
                placeholder="Select a time"
                open={timeOpen}
                onClick={() => setTimeOpen(o => !o)}
                onClear={() => setTime(null)}
              />
              <Popover anchorRef={timeRef} open={timeOpen} onClose={() => setTimeOpen(false)} isDark={isDark}>
                <div className="flex items-stretch gap-1">
                  <TimeColumn isDark={isDark} items={Array.from({ length: 12 }, (_, i) => i + 1)} value={draftTime.h} render={n => pad(n)} onSelect={h => setTimePart({ h })} />
                  <span className="self-center text-[15px] font-bold" style={{ color: mut }}>:</span>
                  <TimeColumn isDark={isDark} items={Array.from({ length: 60 }, (_, i) => i)} value={draftTime.m} render={n => pad(n)} onSelect={m => setTimePart({ m })} />
                  <div className="flex flex-col gap-1 justify-center pl-1">
                    {(['AM', 'PM'] as const).map(p => {
                      const on = draftTime.period === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTimePart({ period: p })}
                          className="px-3 py-2 rounded-lg text-[12px] font-bold transition-colors"
                          style={{ background: on ? ACCENT : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), color: on ? '#fff' : sec }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Popover>
            </div>

          </div>

          {/* live summary */}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {[
              { k: 'Date', v: date ? fmtDate(date) : '—' },
              { k: 'Range', v: rangeLabel ?? '—' },
              { k: 'Time', v: timeLabel ?? '—' },
            ].map(chip => (
              <span key={chip.k} className="text-[11.5px] px-3 py-1.5 rounded-xl font-medium" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${borderSubtle(isDark)}`, color: sec }}>
                <span style={{ color: mut }}>{chip.k}: </span>
                <span style={{ color: chip.v === '—' ? mut : ACCENT, fontWeight: 600 }}>{chip.v}</span>
              </span>
            ))}
          </div>
        </Section>

        {/* --- Inline calendar --- */}
        <Section isDark={isDark} title="Inline Calendar" hint="An always-open calendar — pick a day and it highlights instantly with a spring transition.">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-center">
            <div className="rounded-3xl p-4 sm:p-5 shrink-0 shadow-sm w-full sm:w-auto flex items-center justify-center mx-auto lg:mx-0" style={{ background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)', border: `1px solid ${borderSubtle(isDark)}`, maxWidth: 350 }}>
              {mounted && inlineView ? (
                <Calendar
                  isDark={isDark}
                  view={inlineView}
                  setView={setInlineView}
                  selected={inlineDate}
                  today={today}
                  onPick={setInlineDate}
                />
              ) : (
                <div style={{ width: 290, height: 320 }} className="max-w-full flex items-center justify-center text-[12px]" >
                  <span style={{ color: mut }}>Loading…</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center lg:text-left mt-2 lg:mt-0">
              <p className="text-[12.5px] mb-2 font-semibold uppercase tracking-widest" style={{ color: mut }}>Selected day</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={inlineDate ? fmtDate(inlineDate) : 'none'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ color: inlineDate ? pri : mut, letterSpacing: '-0.01em' }}
                >
                  {inlineDate
                    ? `${WEEKDAYS_FULL[(inlineDate.getDay() + 6) % 7]}, ${fmtDate(inlineDate)}`
                    : 'No date selected'}
                </motion.p>
              </AnimatePresence>
              <p className="text-[13px] mt-4 leading-relaxed max-w-md mx-auto lg:mx-0" style={{ color: sec }}>
                Click any day in the calendar. Navigate months with the chevrons — each month slides in the direction you travel. “Go to Today” jumps back and selects the current date.
              </p>
            </div>
          </div>
        </Section>

      </div>
    </motion.div>
  );
}

const WEEKDAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
