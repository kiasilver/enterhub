'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Clock } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, borderSubtle, panelFill } from './theme';

interface GlassTimePickerProps {
  isDark: boolean;
  value: string; // HH:MM
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i).toString().padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export default function GlassTimePicker({
  isDark,
  value,
  onChange,
  placeholder = '--:--',
  className = '',
}: GlassTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [h, m] = value ? value.split(':') : ['', ''];
  const isPM = value ? parseInt(h, 10) >= 12 : false;
  
  const displayHour = value ? (parseInt(h, 10) % 12 || 12).toString().padStart(2, '0') : '';
  const displayMinute = value ? m : '';
  const displayPeriod = value ? (isPM ? 'PM' : 'AM') : '';

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const estimatedHeight = 240;
      const flipUp = window.innerHeight - r.bottom < estimatedHeight + gap && r.top > window.innerHeight - r.bottom;
      const panelWidth = Math.min(240, window.innerWidth - 16);
      let left = r.left;
      if (left + panelWidth > window.innerWidth - 8) left = window.innerWidth - panelWidth - 8;
      if (left < 8) left = 8;
      setPos({
        position: 'fixed',
        left,
        width: panelWidth, // clamped to viewport on mobile
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  const handleUpdate = (newH: string, newM: string, newP: string) => {
    if (!newH) newH = '12';
    if (!newM) newM = '00';
    if (!newP) newP = 'AM';
    
    let hours24 = parseInt(newH, 10);
    if (newP === 'PM' && hours24 < 12) hours24 += 12;
    if (newP === 'AM' && hours24 === 12) hours24 = 0;
    
    onChange(`${hours24.toString().padStart(2, '0')}:${newM}`);
  };

  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200 flex items-center justify-between cursor-pointer"
        style={{
          background: bg,
          border: `1px solid ${isOpen ? 'var(--primary)' : border}`,
          boxShadow: isOpen ? `0 0 0 3px ${isDark ? 'rgba(var(--primary-rgb),0.18)' : 'rgba(var(--primary-rgb),0.12)'}` : 'none',
          color: value ? pri : mut,
        }}
      >
        <span>{value ? `${displayHour}:${displayMinute} ${displayPeriod}` : placeholder}</span>
        <Clock size={16} />
      </button>

      {isOpen && pos && typeof window !== 'undefined' && createPortal(
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
            className="p-3 rounded-2xl flex gap-2 h-[220px]"
          >
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1 pr-1 border-r" style={{ borderColor: border }}>
              {HOURS.map(hour => (
                <button
                  key={`h-${hour}`}
                  type="button"
                  onClick={() => handleUpdate(hour, displayMinute, displayPeriod)}
                  className="py-2 text-[13px] font-medium rounded-lg transition-colors"
                  style={{
                    background: displayHour === hour ? 'var(--primary)' : 'transparent',
                    color: displayHour === hour ? '#fff' : pri,
                  }}
                  onMouseEnter={e => { if (displayHour !== hour) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (displayHour !== hour) e.currentTarget.style.background = 'transparent'; }}
                >
                  {hour}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1 pr-1 border-r" style={{ borderColor: border }}>
              {MINUTES.map(minute => (
                <button
                  key={`m-${minute}`}
                  type="button"
                  onClick={() => handleUpdate(displayHour, minute, displayPeriod)}
                  className="py-2 text-[13px] font-medium rounded-lg transition-colors"
                  style={{
                    background: displayMinute === minute ? 'var(--primary)' : 'transparent',
                    color: displayMinute === minute ? '#fff' : pri,
                  }}
                  onMouseEnter={e => { if (displayMinute !== minute) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (displayMinute !== minute) e.currentTarget.style.background = 'transparent'; }}
                >
                  {minute}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col gap-1">
              {['AM', 'PM'].map(period => (
                <button
                  key={period}
                  type="button"
                  onClick={() => handleUpdate(displayHour, displayMinute, period)}
                  className="py-2 text-[13px] font-medium rounded-lg transition-colors"
                  style={{
                    background: displayPeriod === period ? 'var(--primary)' : 'transparent',
                    color: displayPeriod === period ? '#fff' : pri,
                  }}
                  onMouseEnter={e => { if (displayPeriod !== period) e.currentTarget.style.background = hoverBg; }}
                  onMouseLeave={e => { if (displayPeriod !== period) e.currentTarget.style.background = 'transparent'; }}
                >
                  {period}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
