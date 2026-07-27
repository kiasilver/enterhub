'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Pipette, Check } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, borderSubtle, panelFill } from './theme';

interface GlassColorPickerProps {
  isDark: boolean;
  value: string;
  onChange: (color: string) => void;
  isPresetActive: boolean;
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 99, g: 102, b: 241 }; // Default Indigo
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

export default function GlassColorPicker({ isDark, value, onChange, isPresetActive }: GlassColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);

  const EXTENDED_PRESETS = [
    '#ffffff', // White
    '#94a3b8', // Slate
    '#00f0ff', // Neon Cyan
    '#00bfff', // Deep Sky
    '#b026ff', // Neon Purple
    '#ff003c', // Neon Red
    '#ff4d00', // Bright Orange
    '#ffd700', // Gold
    '#a3ff00', // Lime
    '#00ff88', // Mint
    '#ff69b4', // Hot Pink
    '#ff7f50', // Coral
  ];

  useEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 8;
      const estimatedHeight = 160;
      const flipUp = window.innerHeight - r.bottom < estimatedHeight + gap && r.top > window.innerHeight - r.bottom;
      
      const panelWidth = 200;
      let left = r.left - panelWidth / 2 + 15;
      if (left + panelWidth > window.innerWidth - 20) left = window.innerWidth - panelWidth - 20;
      if (left < 20) left = 20;
      
      setPos({
        position: 'fixed',
        left,
        width: panelWidth,
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

  const handleSelect = (c: string) => {
    onChange(c);
    setIsOpen(false);
  };

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const panelBg = panelFill(isDark);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
        title="Custom colours"
        style={{
          width: 30,
          height: 30,
          color: isPresetActive ? sec : '#ffffff',
          background: isPresetActive ? 'transparent' : value,
          border: `1px dashed ${isPresetActive ? border : 'transparent'}`,
          boxShadow: !isPresetActive ? `0 0 0 2px ${isDark ? 'var(--background)' : '#ffffff'}, 0 0 0 4px ${value}` : 'none',
        }}
      >
        <Pipette size={14} />
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
              zIndex: 99999,
              background: panelBg,
              border: `1px solid ${border}`,
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.45)' : '0 12px 36px rgba(0,0,0,0.12)',
            }}
            className="p-4 rounded-2xl"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: mut }}>More Colors</p>
            <div className="grid grid-cols-4 gap-3 place-items-center">
              {EXTENDED_PRESETS.map(c => {
                const isActive = value.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      background: c,
                      boxShadow: isActive ? `0 0 0 2px ${panelBg}, 0 0 0 3px ${c}` : 'none',
                      border: c === '#ffffff' ? '1px solid rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    {isActive && <Check size={14} strokeWidth={3} color={c === '#ffffff' ? '#000' : '#ffffff'} />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
