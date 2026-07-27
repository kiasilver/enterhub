'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  Search, Check, Copy, ArrowLeft,
  House, User, Users, Settings, Bell, Mail, Heart, Star, Bookmark, Calendar, Clock, Camera,
  Image, Video, Music, Headphones, Phone, MapPin, Globe, Cloud, Sun, Moon, Zap, Flame, Droplet,
  Leaf, Shield, Lock, KeyRound, CreditCard, Wallet, ShoppingCart, Gift, Tag, Trophy, Rocket,
  Plane, Car, Bike, Coffee, Pizza, Activity, ChartPie, TrendingUp, Database, Server, Cpu, Wifi,
  Battery, Folder, File, Download, Upload, Trash2, Pencil, Plus, ThumbsUp, MessageCircle, Send,
  Share2, Link, Eye, Bug, Code, Terminal, GitBranch, Palette, Brush, Scissors, Layers, Compass,
  Target, Flag, Smile, Sparkles,
} from 'lucide-react';
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
const gridWrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.012 } } };
const cellRise: Variants = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 360, damping: 26 } } };
const pageSlide: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22, when: 'beforeChildren', staggerChildren: 0.05 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.18 } },
};
const detailSlide: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22 } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18 } },
};

type Cmp = React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;

const ICONS: { name: string; C: Cmp }[] = [
  { name: 'House', C: House }, { name: 'User', C: User }, { name: 'Users', C: Users }, { name: 'Settings', C: Settings },
  { name: 'Bell', C: Bell }, { name: 'Mail', C: Mail }, { name: 'Heart', C: Heart }, { name: 'Star', C: Star },
  { name: 'Bookmark', C: Bookmark }, { name: 'Calendar', C: Calendar }, { name: 'Clock', C: Clock }, { name: 'Camera', C: Camera },
  { name: 'Image', C: Image }, { name: 'Video', C: Video }, { name: 'Music', C: Music }, { name: 'Headphones', C: Headphones },
  { name: 'Phone', C: Phone }, { name: 'MapPin', C: MapPin }, { name: 'Globe', C: Globe }, { name: 'Cloud', C: Cloud },
  { name: 'Sun', C: Sun }, { name: 'Moon', C: Moon }, { name: 'Zap', C: Zap }, { name: 'Flame', C: Flame },
  { name: 'Droplet', C: Droplet }, { name: 'Leaf', C: Leaf }, { name: 'Shield', C: Shield }, { name: 'Lock', C: Lock },
  { name: 'KeyRound', C: KeyRound }, { name: 'CreditCard', C: CreditCard }, { name: 'Wallet', C: Wallet }, { name: 'ShoppingCart', C: ShoppingCart },
  { name: 'Gift', C: Gift }, { name: 'Tag', C: Tag }, { name: 'Trophy', C: Trophy }, { name: 'Rocket', C: Rocket },
  { name: 'Plane', C: Plane }, { name: 'Car', C: Car }, { name: 'Bike', C: Bike }, { name: 'Coffee', C: Coffee },
  { name: 'Pizza', C: Pizza }, { name: 'Activity', C: Activity }, { name: 'ChartPie', C: ChartPie }, { name: 'TrendingUp', C: TrendingUp },
  { name: 'Database', C: Database }, { name: 'Server', C: Server }, { name: 'Cpu', C: Cpu }, { name: 'Wifi', C: Wifi },
  { name: 'Battery', C: Battery }, { name: 'Folder', C: Folder }, { name: 'File', C: File }, { name: 'Download', C: Download },
  { name: 'Upload', C: Upload }, { name: 'Trash2', C: Trash2 }, { name: 'Pencil', C: Pencil }, { name: 'Plus', C: Plus },
  { name: 'ThumbsUp', C: ThumbsUp }, { name: 'MessageCircle', C: MessageCircle }, { name: 'Send', C: Send }, { name: 'Share2', C: Share2 },
  { name: 'Link', C: Link }, { name: 'Eye', C: Eye }, { name: 'Bug', C: Bug }, { name: 'Code', C: Code },
  { name: 'Terminal', C: Terminal }, { name: 'GitBranch', C: GitBranch }, { name: 'Palette', C: Palette }, { name: 'Brush', C: Brush },
  { name: 'Scissors', C: Scissors }, { name: 'Layers', C: Layers }, { name: 'Compass', C: Compass }, { name: 'Target', C: Target },
  { name: 'Flag', C: Flag }, { name: 'Smile', C: Smile }, { name: 'Sparkles', C: Sparkles },
];

/* ---------- colour maths (HSV ↔ HEX) ---------- */
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let x = hex.replace('#', '');
  if (x.length === 3) x = x.split('').map(c => c + c).join('');
  if (x.length !== 6) return { h: 0, s: 0, v: 0 };
  const r = parseInt(x.slice(0, 2), 16) / 255, g = parseInt(x.slice(2, 4), 16) / 255, b = parseInt(x.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

const PRESETS = ['var(--primary)', 'var(--primary)', '#A855F7', '#EC4899', '#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#FFFFFF', '#0A0A0A'];

/* ---------- pretty colour picker ---------- */
function ColorPicker({ isDark, value, onChange }: { isDark: boolean; value: string; onChange: (v: string) => void }) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const { h, s, v } = hexToHsv(value);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | 'sv' | 'hue'>(null);
  const [hexText, setHexText] = useState(value);
  useEffect(() => setHexText(value), [value]);

  const applySV = (cx: number, cy: number) => {
    const r = svRef.current?.getBoundingClientRect(); if (!r) return;
    onChange(hsvToHex(h, clamp01((cx - r.left) / r.width), clamp01(1 - (cy - r.top) / r.height)));
  };
  const applyHue = (cx: number) => {
    const r = hueRef.current?.getBoundingClientRect(); if (!r) return;
    onChange(hsvToHex(clamp01((cx - r.left) / r.width) * 360, s || 1, v || 1));
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => { if (drag === 'sv') applySV(e.clientX, e.clientY); else applyHue(e.clientX); };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, h, s, v]);

  const hueColor = hsvToHex(h, 1, 1);

  return (
    <div>
      {/* saturation / value */}
      <div
        ref={svRef}
        onPointerDown={e => { setDrag('sv'); applySV(e.clientX, e.clientY); }}
        className="relative rounded-xl cursor-crosshair select-none touch-none"
        style={{ height: 130, background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, ${hueColor})` }}
      >
        <span className="absolute w-3.5 h-3.5 rounded-full border-2 border-white pointer-events-none" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 0 0 1px rgba(0,0,0,0.45)' }} />
      </div>

      {/* hue */}
      <div
        ref={hueRef}
        onPointerDown={e => { setDrag('hue'); applyHue(e.clientX); }}
        className="relative h-3 rounded-full mt-3.5 cursor-pointer select-none touch-none"
        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
      >
        <span className="absolute top-1/2 w-4 h-4 rounded-full bg-white pointer-events-none" style={{ left: `${(h / 360) * 100}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 1px 4px rgba(0,0,0,0.45)' }} />
      </div>

      {/* hex + swatch */}
      <div className="flex items-center gap-2 mt-3.5">
        <span className="w-8 h-8 rounded-lg shrink-0" style={{ background: value, boxShadow: `0 0 0 1px ${border}` }} />
        <div className="flex-1 flex items-center px-2.5 rounded-lg" style={{ background: bg, border: `1px solid ${border}` }}>
          <span className="text-[12px] font-mono" style={{ color: mut }}>#</span>
          <input
            value={hexText.replace('#', '')}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
              setHexText(raw);
              if (raw.length === 6 || raw.length === 3) onChange(`#${raw}`.toUpperCase());
            }}
            className="flex-1 bg-transparent outline-none py-2 text-[12.5px] font-mono uppercase"
            style={{ color: sec }}
            spellCheck={false}
          />
        </div>
      </div>

      {/* presets */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {PRESETS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)} title={c}
            className="w-6 h-6 rounded-md transition-transform hover:scale-110"
            style={{ background: c, boxShadow: `0 0 0 1px ${border}`, outline: value.toUpperCase() === c ? `2px solid ${ACCENT}` : 'none', outlineOffset: 2 }} />
        ))}
      </div>
    </div>
  );
}

/* ---------- pretty mini slider ---------- */
function MiniSlider({ isDark, min, max, step, value, onChange }: { isDark: boolean; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const trackBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';
  const pct = ((value - min) / (max - min)) * 100;

  const setFrom = (cx: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    const ratio = clamp01((cx - r.left) / r.width);
    const stepped = Math.round((min + ratio * (max - min)) / step) * step;
    onChange(Math.min(max, Math.max(min, Math.round(stepped * 1e6) / 1e6)));
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setFrom(e.clientX);
    const up = () => setDrag(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, min, max, step]);

  const onKey = (e: React.KeyboardEvent) => {
    let n = value;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = value - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = value + step;
    else return;
    e.preventDefault();
    onChange(Math.min(max, Math.max(min, Math.round(n * 1e6) / 1e6)));
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={e => { setDrag(true); setFrom(e.clientX); }}
      className="relative w-full cursor-pointer select-none touch-none"
      style={{ height: 18, display: 'flex', alignItems: 'center' }}
    >
      <div className="w-full rounded-full" style={{ height: 6, background: trackBg }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(to right, ${ACCENT}, var(--primary))` }} />
      </div>
      <motion.div
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={onKey}
        animate={{ scale: drag ? 1.18 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute rounded-full outline-none"
        style={{
          width: 16, height: 16, top: '50%', left: `${pct}%`, x: '-50%', y: '-50%',
          background: '#fff', border: `2px solid ${ACCENT}`,
          boxShadow: drag ? `0 0 0 6px ${ACCENT}22` : '0 2px 6px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

export default function SafeIconFix({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ name: string; C: Cmp } | null>(null);

  // per-icon controls (live on the detail page)
  const [size, setSize] = useState(48);
  const [stroke, setStroke] = useState(1.75);
  const [useThemeColor, setUseThemeColor] = useState(true);
  const [color, setColor] = useState(ACCENT);
  const [copied, setCopied] = useState(false);

  const iconColor = useThemeColor ? pri : color;

  const filtered = useMemo(
    () => ICONS.filter(i => i.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  const open = (icon: { name: string; C: Cmp }) => { setSelected(icon); setCopied(false); };

  const copyCode = () => {
    if (!selected) return;
    const parts = [`size={${size}}`, `strokeWidth={${stroke}}`];
    if (!useThemeColor) parts.push(`color="${color}"`);
    const snippet = `<${selected.name} ${parts.join(' ')} />`;
    try { navigator.clipboard?.writeText(snippet); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <AnimatePresence mode="wait" initial={false}>
        {!selected ? (
          /* ---------------- GALLERY ---------------- */
          <motion.div key="gallery" variants={pageSlide} initial="hidden" animate="show" exit="exit">
            <motion.div variants={fadeUp} className="mb-6 max-w-5xl">
              <p className="text-xs font-medium mb-1" style={{ color: mut }}>Icons / Remix Icons / Icon Fix</p>
              <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Icon Fix</h2>
              <p className="text-[12.5px] mt-1" style={{ color: sec }}>A static icon set — click any icon to customise its size, colour and stroke.</p>
            </motion.div>

            <div className="max-w-5xl">
              <motion.div variants={fadeUp} className="relative mb-5 max-w-xs">
                <span className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Search size={16} /></span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search icons…"
                  className="w-full text-[13px] py-2.5 rounded-xl outline-none transition-all duration-200"
                  style={{ background: bg, border: `1px solid ${border}`, color: pri, paddingLeft: 38 }}
                  onFocus={e => { e.currentTarget.style.borderColor = `${ACCENT}99`; }}
                  onBlur={e => { e.currentTarget.style.borderColor = border; }}
                />
              </motion.div>

              <motion.p variants={fadeUp} className="text-[11.5px] mb-3" style={{ color: mut }}>
                {filtered.length} icon{filtered.length !== 1 ? 's' : ''}{query ? ` matching “${query}”` : ''}
              </motion.p>

              {filtered.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed" style={{ borderColor: border }}>
                  <p className="text-sm" style={{ color: mut }}>No icons match your search.</p>
                </div>
              ) : (
                <motion.div variants={gridWrap} initial="hidden" animate="show"
                  className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2.5">
                  {filtered.map(({ name, C }) => (
                    <motion.button
                      key={name}
                      variants={cellRise}
                      type="button"
                      onClick={() => open({ name, C })}
                      whileHover={{ y: -3 }}
                      className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 outline-none transition-colors duration-150"
                      style={{ background: bg, border: `1px solid ${border}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = `${ACCENT}55`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border; }}
                      title={name}
                    >
                      <span style={{ color: pri }}><C size={24} strokeWidth={1.75} /></span>
                      <span className="text-[9.5px] font-medium truncate max-w-full px-1" style={{ color: mut }}>{name}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ---------------- DETAIL ---------------- */
          <motion.div key="detail" variants={detailSlide} initial="hidden" animate="show" exit="exit" className="max-w-5xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold mb-5 transition-colors"
              style={{ color: sec }}
              onMouseEnter={e => (e.currentTarget.style.color = pri)}
              onMouseLeave={e => (e.currentTarget.style.color = sec)}
            >
              <ArrowLeft size={15} /> All icons
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* preview */}
              <div className="rounded-3xl p-8 flex flex-col items-center justify-center" style={glassStyle(isDark)}>
                <div className="flex-1 flex items-center justify-center py-6" style={{ minHeight: 200 }}>
                  <motion.span
                    key={selected.name}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    style={{ color: iconColor, display: 'inline-flex' }}
                  >
                    <selected.C size={size} strokeWidth={stroke} />
                  </motion.span>
                </div>
                <p className="text-[15px] font-bold mt-2" style={{ color: pri }}>{selected.name}</p>
                <p className="text-[11.5px] font-mono mt-0.5" style={{ color: mut }}>{size}px · stroke {stroke}</p>
              </div>

              {/* controls */}
              <div className="rounded-3xl p-6 flex flex-col gap-6" style={glassStyle(isDark)}>
                {/* size */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[12px] font-semibold" style={{ color: pri }}>Size</label>
                    <span className="text-[12px] font-mono font-semibold" style={{ color: sec }}>{size}px</span>
                  </div>
                  <MiniSlider isDark={isDark} min={16} max={96} step={1} value={size} onChange={setSize} />
                </div>

                {/* stroke */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[12px] font-semibold" style={{ color: pri }}>Stroke</label>
                    <span className="text-[12px] font-mono font-semibold" style={{ color: sec }}>{stroke}</span>
                  </div>
                  <MiniSlider isDark={isDark} min={0.5} max={3} step={0.25} value={stroke} onChange={setStroke} />
                </div>

                {/* colour */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[12px] font-semibold" style={{ color: pri }}>Colour</label>
                    <button
                      type="button"
                      onClick={() => setUseThemeColor(t => !t)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{ background: 'transparent', color: useThemeColor ? ACCENT : sec, border: `1.5px solid ${useThemeColor ? ACCENT : border}` }}
                    >
                      Theme
                    </button>
                  </div>
                  <div style={{ opacity: useThemeColor ? 0.55 : 1, pointerEvents: useThemeColor ? 'none' : 'auto', transition: 'opacity .2s' }}>
                    <ColorPicker isDark={isDark} value={color} onChange={c => { setUseThemeColor(false); setColor(c); }} />
                  </div>
                </div>

                {/* copy */}
                <motion.button
                  type="button"
                  onClick={copyCode}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold mt-1 transition-colors"
                  style={{ background: 'transparent', color: copied ? '#10b981' : ACCENT, border: `1.5px solid ${copied ? '#10b981' : ACCENT}` }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy JSX'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
