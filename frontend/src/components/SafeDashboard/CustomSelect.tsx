'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { textPrimary, textSecondary, borderSubtle, panelFill } from './theme';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: any) => void;
  options: Option[];
  isDark: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  isDark,
  className = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  // position the portal panel relative to the trigger; flip up if needed
  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const estimated = Math.min(240, options.length * 36 + 8);
      const flipUp = window.innerHeight - r.bottom < estimated + gap && r.top > window.innerHeight - r.bottom;
      setPos({
        position: 'fixed',
        left: r.left,
        width: r.width,
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
  }, [isOpen, options.length]);

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

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const border = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-xl text-xs outline-none border flex items-center justify-between cursor-pointer transition-all duration-200 select-none text-left"
        style={{
          background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          borderColor: isOpen ? 'var(--primary)' : border,
          boxShadow: isOpen ? `0 0 0 3px ${isDark ? 'rgba(var(--primary-rgb),0.18)' : 'rgba(var(--primary-rgb),0.12)'}` : 'none',
          color: pri,
        }}
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && pos && (
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="z-[9999] rounded-xl p-1 max-h-60 overflow-y-auto no-scrollbar"
                style={{
                  ...pos,
                  background: panelFill(isDark),
                  border: `1px solid ${borderSubtle(isDark)}`,
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.12)',
                }}
              >
                {options.map(opt => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none block"
                      style={{
                        background: isSelected ? (isDark ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--primary-rgb), 0.08)') : 'transparent',
                        color: isSelected ? (isDark ? 'var(--primary-hover)' : 'var(--primary)') : sec,
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
