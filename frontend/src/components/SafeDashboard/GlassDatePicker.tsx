'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, borderSubtle, hexToRgba, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface GlassDatePickerProps {
  isDark: boolean;
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function GlassDatePicker({
  isDark,
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
}: GlassDatePickerProps) {
  const { primaryColor } = useTheme();
  const accent = primaryColor || '#2563EB';
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (value) {
      setCurrentMonth(value.getMonth());
      setCurrentYear(value.getFullYear());
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen || disabled) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const estimatedHeight = 320;
      const flipUp = window.innerHeight - r.bottom < estimatedHeight + gap && r.top > window.innerHeight - r.bottom;
      const panelWidth = Math.min(280, window.innerWidth - 16);
      let left = r.left;
      if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8;
      if (left < 8) left = 8;
      setPos({
        position: 'fixed',
        left,
        width: panelWidth, // calendar width, clamped to viewport on mobile
        ...(flipUp ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, disabled]);

  useEffect(() => {
    if (!isOpen || disabled) return;
    function handleClickOutside(event: MouseEvent) {
      const t = event.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setIsOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, disabled]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    onChange(new Date(currentYear, currentMonth, day));
    setIsOpen(false);
  };

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className="w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200 flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: bg,
          border: `1px solid ${isOpen ? accent : border}`,
          boxShadow: isOpen ? `0 0 0 3px ${hexToRgba(accent, 0.18)}` : 'none',
          color: value ? pri : mut,
        }}
      >
        <span>{value ? value.toLocaleDateString() : placeholder}</span>
        <Calendar size={16} style={{ color: isOpen ? accent : undefined }} />
      </button>

      {isOpen && !disabled && pos && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              ...pos,
              zIndex: 9999,
              background: panelFill(isDark),
              border: `1px solid ${border}`,
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.12)',
            }}
            className="p-4 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10" style={{ color: sec }}>
                <ChevronLeft size={18} />
              </button>
              <div className="text-[13px] font-semibold" style={{ color: pri }}>
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg transition-colors hover:bg-black/10 dark:hover:bg-white/10" style={{ color: sec }}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: mut }}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {blanks.map((_, i) => (
                <div key={`blank-${i}`} className="h-8" />
              ))}
              {days.map(d => {
                const isSelected = value && value.getDate() === d && value.getMonth() === currentMonth && value.getFullYear() === currentYear;
                const isToday = new Date().getDate() === d && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleSelectDay(d)}
                    className="h-8 flex items-center justify-center text-[12px] font-medium rounded-lg transition-all duration-200 hover:scale-110"
                    style={{
                      background: isSelected ? accent : isToday ? hoverBg : 'transparent',
                      color: isSelected ? '#fff' : pri,
                      border: isToday && !isSelected ? `1px solid ${accent}` : '1px solid transparent',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-3 flex items-center justify-between border-t" style={{ borderColor: border }}>
              <button type="button" onClick={() => { onChange(null); setIsOpen(false); }} className="text-[11px] font-medium hover:underline" style={{ color: mut }}>
                Clear
              </button>
              <button type="button" onClick={() => { onChange(new Date()); setIsOpen(false); }} className="text-[11px] font-medium hover:underline" style={{ color: accent }}>
                Today
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
