'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MdAccessTime, MdClose } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { textPrimary,
  textMuted,
  borderSubtle,
  hexToRgba, panelFill } from '@/components/SafeDashboard/theme';

const HOUR_OPTS = Array.from({ length: 25 }, (_, i) => i); // 0–24 h
const MINUTE_OPTS = [0, 15, 30, 45];

const PRESET_HOURS = [0.5, 1, 1.5, 2, 4, 8] as const;
const PRESET_KEYS = [
  'boardTask.durationPreset30',
  'boardTask.durationPreset1h',
  'boardTask.durationPreset15h',
  'boardTask.durationPreset2h',
  'boardTask.durationPreset4h',
  'boardTask.durationPreset8h',
] as const;

export function parseDurationHours(raw: string | number | null | undefined): number | null {
  if (raw === '' || raw == null) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

type DurationTranslate = (key: string, params?: Record<string, string | number>) => string;

export function formatDurationLabel(
  hours: number | null,
  t?: DurationTranslate,
): string {
  if (hours == null || hours <= 0) return '';
  const h = Math.floor(hours + 1e-9);
  const m = Math.round((hours - h) * 60);
  if (t) {
    if (h === 0) return t('boardTask.durationMin', { n: m });
    if (m === 0) {
      return h === 1
        ? t('boardTask.durationHourOne')
        : t('boardTask.durationHours', { n: h });
    }
    return t('boardTask.durationHoursMin', { h, m });
  }
  if (h === 0) return `${m} min`;
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`;
  return `${h} h ${m} min`;
}

function toParts(hours: number | null): { h: number; m: number } {
  if (hours == null || hours <= 0) return { h: 0, m: 30 };
  const totalMin = Math.round(hours * 60);
  let h = Math.floor(totalMin / 60);
  let m = totalMin % 60;
  // snap to nearest allowed minute
  const snapped = MINUTE_OPTS.reduce((best, opt) =>
    Math.abs(opt - m) < Math.abs(best - m) ? opt : best,
  );
  if (snapped === 60) {
    h += 1;
    m = 0;
  } else {
    m = snapped;
  }
  if (h > 24) h = 24;
  return { h, m };
}

function fromParts(h: number, m: number): number {
  return Math.round((h + m / 60) * 100) / 100;
}

type Props = {
  /** Decimal hours as string (e.g. "0.5", "2") — empty = unset */
  value: string;
  onChange: (hoursDecimal: string) => void;
  /** Also called when picker closes after a change (for save-on-blur flows) */
  onCommit?: (hoursDecimal: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isDark?: boolean;
};

/**
 * Estimated-effort picker — glass wheels like Dashboard Time Picker,
 * but for duration (hours + minutes) so 0.5 clearly means 30 min.
 */
export function AppDurationPicker({
  value,
  onChange,
  onCommit,
  placeholder,
  disabled = false,
  className = '',
  isDark: isDarkProp,
}: Props) {
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const isDark = isDarkProp ?? theme === 'dark';
  const accent = primaryColor || '#2563EB';

  const parsed = parseDurationHours(value);
  const [open, setOpen] = useState(false);
  const [draftH, setDraftH] = useState(0);
  const [draftM, setDraftM] = useState(30);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!open) return;
    const p = toParts(parsed);
    setDraftH(p.h);
    setDraftM(p.m);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || disabled) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const estimatedHeight = 320;
      const flipUp =
        window.innerHeight - r.bottom < estimatedHeight + gap &&
        r.top > window.innerHeight - r.bottom;
      const panelWidth = Math.min(280, window.innerWidth - 16);
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
      commitAndClose(draftH, draftM);
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
  }, [open, disabled, draftH, draftM]); // eslint-disable-line react-hooks/exhaustive-deps

  function apply(h: number, m: number) {
    const hours = fromParts(h, m);
    if (hours <= 0) {
      onChange('');
      return '';
    }
    const s = String(hours);
    onChange(s);
    return s;
  }

  function commitAndClose(h: number, m: number) {
    const s = apply(h, m);
    onCommit?.(s);
    setOpen(false);
  }

  const label = formatDurationLabel(parsed, t);
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const live = formatDurationLabel(fromParts(draftH, draftM), t);
  const durationPlaceholder = placeholder || t('boardTask.estimatedPlaceholder');

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
        <MdAccessTime size={16} style={{ color: open ? accent : mut }} className="shrink-0" />
        <span className="flex-1 text-start truncate">
          {label || durationPlaceholder}
        </span>
        {label && !disabled && (
          <span
            role="button"
            tabIndex={0}
            className="p-0.5 rounded shrink-0"
            style={{ color: mut }}
            aria-label={t('common.clearDuration')}
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              onCommit?.('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onChange('');
                onCommit?.('');
              }
            }}
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
              className="p-3 rounded-2xl text-start"
            >
              <p className="text-[11px] font-medium mb-2 px-1" style={{ color: mut }}>
                {t('boardTask.estimatedEffort')}
              </p>
              <p
                className="text-sm font-bold mb-3 px-1 tabular-nums"
                style={{ color: accent }}
              >
                {live || '—'}
                {fromParts(draftH, draftM) > 0 && (
                  <span className="font-normal ms-2" style={{ color: mut }}>
                    ({fromParts(draftH, draftM)} {t('boardTask.hours')})
                  </span>
                )}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {PRESET_HOURS.map((hours, i) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => {
                      const parts = toParts(hours);
                      setDraftH(parts.h);
                      setDraftM(parts.m);
                      commitAndClose(parts.h, parts.m);
                    }}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{
                      background: hexToRgba(accent, isDark ? 0.2 : 0.1),
                      color: accent,
                      border: `1px solid ${hexToRgba(accent, 0.3)}`,
                    }}
                  >
                    {t(PRESET_KEYS[i])}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 h-[200px]">
                <div
                  className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1 pe-1 border-e"
                  style={{ borderColor: border }}
                >
                  <p
                    className="text-[10px] font-bold uppercase sticky top-0 py-1"
                    style={{
                      color: mut,
                      background: panelFill(isDark),
                    }}
                  >
                    {t('boardTask.hours')}
                  </p>
                  {HOUR_OPTS.map((hour) => (
                    <button
                      key={`h-${hour}`}
                      type="button"
                      onClick={() => {
                        setDraftH(hour);
                        apply(hour, draftM);
                      }}
                      className="py-2 text-[13px] font-medium rounded-lg transition-colors"
                      style={{
                        background: draftH === hour ? accent : 'transparent',
                        color: draftH === hour ? '#fff' : pri,
                      }}
                      onMouseEnter={(e) => {
                        if (draftH !== hour) e.currentTarget.style.background = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if (draftH !== hour) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {hour}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1">
                  <p
                    className="text-[10px] font-bold uppercase sticky top-0 py-1"
                    style={{
                      color: mut,
                      background: panelFill(isDark),
                    }}
                  >
                    {t('boardTask.minutes')}
                  </p>
                  {MINUTE_OPTS.map((minute) => (
                    <button
                      key={`m-${minute}`}
                      type="button"
                      onClick={() => {
                        setDraftM(minute);
                        apply(draftH, minute);
                      }}
                      className="py-2 text-[13px] font-medium rounded-lg transition-colors"
                      style={{
                        background: draftM === minute ? accent : 'transparent',
                        color: draftM === minute ? '#fff' : pri,
                      }}
                      onMouseEnter={(e) => {
                        if (draftM !== minute) e.currentTarget.style.background = hoverBg;
                      }}
                      onMouseLeave={(e) => {
                        if (draftM !== minute) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {String(minute).padStart(2, '0')}
                      <span className="ms-1 text-[10px] opacity-70">{t('boardTask.minShort')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="mt-3 w-full py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: accent }}
                onClick={() => commitAndClose(draftH, draftM)}
              >
                {t('boardTask.doneDuration', { label: live || t('boardTask.setDuration') })}
              </button>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
