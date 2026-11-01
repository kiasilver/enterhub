'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MdCalendarMonth, MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba, panelFill } from '@/components/SafeDashboard/theme';
import { formatDateInput, parseDateInput } from '@/components/ui/AppDatePicker';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { toFaDigits } from '@/lib/app-date';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date | null, b: Date | null) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(view: Date): Date[] {
  const first = startOfMonth(view);
  const lead = (first.getDay() + 6) % 7;
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), 1 - lead + i));
  }
  return cells;
}

export type DateRangeValue = { start: string; end: string };

type Props = {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isDark?: boolean;
};

/**
 * Due-date range picker (Start → End) — same UX as Dashboard Date & Time range,
 * colored with brand primary (blue), not indigo/pink.
 */
export function AppDateRangePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  isDark: isDarkProp,
}: Props) {
  const { theme, primaryColor } = useTheme();
  const { t, lang } = useLang();
  const { formatDate } = useCalendar();
  const isDark = isDarkProp ?? theme === 'dark';
  const rangePlaceholder = placeholder || t('boardTask.dueRangePlaceholder');
  const weekdays = lang === 'fa' ? ['د', 'س', 'چ', 'پ', 'ج', 'ش', 'ی'] : WEEKDAYS;
  const accent = primaryColor || '#2563EB';

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => startOfMonth(new Date()));
  const [draft, setDraft] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const pickingRef = useRef(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  const start = parseDateInput(value.start);
  const end = parseDateInput(value.end);

  useEffect(() => {
    if (!open) return;
    pickingRef.current = false;
    setDraft({ start, end });
    setView(startOfMonth(start || end || new Date()));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || disabled) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 8;
      const flipUp =
        window.innerHeight - r.bottom < 380 && r.top > window.innerHeight - r.bottom;
      const panelWidth = Math.min(320, window.innerWidth - 16);
      let left = r.left;
      if (left + panelWidth > window.innerWidth - 8) {
        left = window.innerWidth - panelWidth - 8;
      }
      if (left < 8) left = 8;
      setPos({
        position: 'fixed',
        left,
        width: panelWidth,
        ...(flipUp
          ? { bottom: window.innerHeight - r.top + gap }
          : { top: r.bottom + gap }),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, disabled]);

  useEffect(() => {
    if (!open || disabled) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, disabled]);

  function pick(day: Date) {
    const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    pickingRef.current = true;
    setDraft((prev) => {
      if (!prev.start || (prev.start && prev.end)) {
        return { start: d, end: null };
      }
      if (d < prev.start) {
        return { start: d, end: prev.start };
      }
      return { start: prev.start, end: d };
    });
  }

  function applyRange(next: { start: Date | null; end: Date | null }) {
    onChange({
      start: formatDateInput(next.start),
      end: formatDateInput(next.end),
    });
  }

  useEffect(() => {
    if (!open || !pickingRef.current) return;
    if (draft.start && draft.end) {
      applyRange(draft);
      pickingRef.current = false;
      setOpen(false);
    }
  }, [draft.start, draft.end]); // eslint-disable-line react-hooks/exhaustive-deps

  const label =
    start && end
      ? `${formatDate(start, 'short')}  →  ${formatDate(end, 'short')}`
      : start
        ? `${formatDate(start, 'short')}  →  …`
        : null;

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const rail = hexToRgba(accent, isDark ? 0.2 : 0.14);
  const hov = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const cells = buildMonthGrid(view);
  const today = new Date();
  const rangeStart = draft.start;
  const rangeEnd = draft.end;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        className="w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: bg,
          border: `1px solid ${open ? accent : border}`,
          boxShadow: open ? `0 0 0 3px ${hexToRgba(accent, 0.18)}` : 'none',
          color: label ? pri : mut,
        }}
      >
        <MdCalendarMonth size={16} style={{ color: open ? accent : mut }} className="shrink-0" />
        <span className="flex-1 text-start truncate">{label || rangePlaceholder}</span>
        {(value.start || value.end) && !disabled && (
          <span
            role="button"
            tabIndex={0}
            className="p-0.5 rounded shrink-0"
            style={{ color: mut }}
            onClick={(e) => {
              e.stopPropagation();
              onChange({ start: '', end: '' });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onChange({ start: '', end: '' });
              }
            }}
            aria-label={t('common.clearDates')}
          >
            <MdClose size={14} />
          </span>
        )}
      </button>

      {open && !disabled && pos && typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                ...pos,
                zIndex: 9999,
                background: panelFill(isDark),
                border: `1px solid ${border}`,
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: isDark
                  ? '0 12px 36px rgba(0,0,0,0.45)'
                  : '0 12px 36px rgba(0,0,0,0.12)',
              }}
              className="p-4 rounded-2xl text-start"
            >
              <p className="text-[11px] font-medium mb-3" style={{ color: mut }}>
                {t('boardTask.pickStartThenEnd')}
              </p>

              <div className="flex items-center justify-between mb-3 px-1">
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-lg rtl:rotate-180"
                  style={{ color: sec }}
                  onClick={() => setView((v) => addMonths(v, -1))}
                >
                  <MdChevronLeft size={20} />
                </button>
                <span className="text-[14px] font-bold" style={{ color: pri }}>
                  {formatDate(view, 'monthYear')}
                </span>
                <button
                  type="button"
                  className="w-8 h-8 flex items-center justify-center rounded-lg rtl:rotate-180"
                  style={{ color: sec }}
                  onClick={() => setView((v) => addMonths(v, 1))}
                >
                  <MdChevronRight size={20} />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1" dir="ltr">
                {weekdays.map((w) => (
                  <div
                    key={w}
                    className="h-7 flex items-center justify-center text-[10px] font-semibold uppercase"
                    style={{ color: mut }}
                  >
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7" dir="ltr">
                {cells.map((day, i) => {
                  const otherMonth = day.getMonth() !== view.getMonth();
                  const isStart = sameDay(day, rangeStart);
                  const isEnd = sameDay(day, rangeEnd);
                  const inRng =
                    !!rangeStart &&
                    !!rangeEnd &&
                    day > rangeStart &&
                    day < rangeEnd;
                  const isToday = sameDay(day, today);
                  const filled = isStart || isEnd;

                  return (
                    <div key={i} className="relative h-10 flex items-center justify-center">
                      {inRng && (
                        <span
                          className="absolute inset-y-1 inset-x-0"
                          style={{ background: rail }}
                        />
                      )}
                      {isStart && rangeEnd && (
                        <span
                          className="absolute inset-y-1 right-0 w-1/2"
                          style={{ background: rail }}
                        />
                      )}
                      {isEnd && rangeStart && (
                        <span
                          className="absolute inset-y-1 left-0 w-1/2"
                          style={{ background: rail }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => pick(day)}
                        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[12.5px] font-medium"
                        style={{
                          background: filled ? accent : 'transparent',
                          color: filled ? '#fff' : otherMonth ? mut : sec,
                          opacity: otherMonth && !filled ? 0.45 : 1,
                          boxShadow:
                            isToday && !filled ? `inset 0 0 0 1.5px ${accent}` : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!filled) e.currentTarget.style.background = hov;
                        }}
                        onMouseLeave={(e) => {
                          if (!filled) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {lang === 'fa' ? toFaDigits(String(day.getDate())) : day.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div
                className="mt-3 pt-3 flex items-center justify-between"
                style={{ borderTop: `1px solid ${border}` }}
              >
                <button
                  type="button"
                  className="text-[11px] font-medium hover:underline"
                  style={{ color: mut }}
                  onClick={() => {
                    setDraft({ start: null, end: null });
                    onChange({ start: '', end: '' });
                    setOpen(false);
                  }}
                >
                  {t('common.clear')}
                </button>
                <button
                  type="button"
                  className="text-[11px] font-semibold hover:underline"
                  style={{ color: accent }}
                  onClick={() => {
                    const now = new Date();
                    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    setView(startOfMonth(d));
                    setDraft({ start: d, end: null });
                  }}
                >
                  {t('common.today')}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
