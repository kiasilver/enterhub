'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Search, Check, Copy, ArrowLeft, ArrowUp } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import { MATERIAL_ICON_NAMES } from './materialIconsData';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const PAGE = 240;

type Variant = { id: string; label: string; cls: string };
const VARIANTS: Variant[] = [
  { id: 'filled', label: 'Filled', cls: 'material-icons' },
  { id: 'outlined', label: 'Outlined', cls: 'material-icons-outlined' },
  { id: 'round', label: 'Round', cls: 'material-icons-round' },
  { id: 'sharp', label: 'Sharp', cls: 'material-icons-sharp' },
  { id: 'two-tone', label: 'Two Tone', cls: 'material-icons-two-tone' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};
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

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const PRESETS = ['var(--primary)', 'var(--primary)', '#A855F7', '#EC4899', '#F43F5E', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#FFFFFF', '#0A0A0A'];

/* ---------- mini slider ---------- */
function MiniSlider({ isDark, min, max, step, value, onChange, accent }: { isDark: boolean; min: number; max: number; step: number; value: number; onChange: (v: number) => void; accent: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const trackBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';
  const pct = ((value - min) / (max - min)) * 100;

  const setFrom = (cx: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    const ratio = clamp((cx - r.left) / r.width, 0, 1);
    const stepped = Math.round((min + ratio * (max - min)) / step) * step;
    onChange(clamp(Math.round(stepped * 1e6) / 1e6, min, max));
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
    onChange(clamp(Math.round(n * 1e6) / 1e6, min, max));
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={e => { setDrag(true); setFrom(e.clientX); }}
      className="relative w-full cursor-pointer select-none touch-none"
      style={{ height: 18, display: 'flex', alignItems: 'center' }}
    >
      <div className="w-full rounded-full" style={{ height: 6, background: trackBg }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(to right, ${accent}, var(--primary))` }} />
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
          background: '#fff', border: `2px solid ${accent}`,
          boxShadow: drag ? `0 0 0 6px ${accent}22` : '0 2px 6px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

/* ---------- compact colour control ---------- */
function ColorControl({ isDark, value, onChange, accent }: { isDark: boolean; value: string; onChange: (v: string) => void; accent: string }) {
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const [hexText, setHexText] = useState(value);
  useEffect(() => setHexText(value), [value]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
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
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)} title={c}
            className="w-6 h-6 rounded-md transition-transform hover:scale-110"
            style={{ background: c, boxShadow: `0 0 0 1px ${border}`, outline: value.toUpperCase() === c ? `2px solid ${accent}` : 'none', outlineOffset: 2 }} />
        ))}
      </div>
    </div>
  );
}

export default function SafeMaterial({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [variant, setVariant] = useState<Variant>(VARIANTS[1]); // Outlined by default
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<string | null>(null);

  // detail controls
  const [size, setSize] = useState(48);
  const [useThemeColor, setUseThemeColor] = useState(true);
  const [color, setColor] = useState(ACCENT);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  const iconColor = useThemeColor ? pri : color;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '_');
    return q ? MATERIAL_ICON_NAMES.filter(n => n.includes(q)) : MATERIAL_ICON_NAMES;
  }, [query]);

  // reset pagination when the result set changes
  useEffect(() => { setVisible(PAGE); }, [query, variant]);

  // entering/leaving the detail view: return to top and hide the scroll-to-top button
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); setShowTop(false); }, [selected]);

  const shown = filtered.slice(0, visible);

  const open = (name: string) => { setSelected(name); setCopied(false); };

  const copyCode = () => {
    if (!selected) return;
    const styleAttr = useThemeColor ? '' : ` style="color: ${color}"`;
    const snippet = `<span class="${variant.cls}"${styleAttr}>${selected}</span>`;
    try { navigator.clipboard?.writeText(snippet); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollRef}
        onScroll={e => setShowTop(e.currentTarget.scrollTop > 300)}
        className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      >
      <AnimatePresence mode="wait" initial={false}>
        {!selected ? (
          /* ---------------- GALLERY ---------------- */
          <motion.div key="gallery" variants={pageSlide} initial="hidden" animate="show" exit="exit">
            <motion.div variants={fadeUp} className="mb-6 max-w-5xl">
              <p className="text-xs font-medium mb-1" style={{ color: mut }}>Icons / Material Design</p>
              <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Material Design</h2>
              <p className="text-[12.5px] mt-1" style={{ color: sec }}>2,000+ Material icons across five styles — click any icon to customise its size and colour.</p>
            </motion.div>

            <div className="max-w-5xl">
              {/* variant switch + search */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-5">
                <div className="inline-flex flex-wrap p-1 rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
                  {VARIANTS.map(v => {
                    const active = v.id === variant.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVariant(v)}
                        className="relative px-3.5 py-1.5 text-[12.5px] font-semibold rounded-lg transition-colors"
                        style={{ color: active ? ACCENT : sec, zIndex: 1 }}
                      >
                        {active && (
                          <motion.span
                            layoutId="mat-variant-pill"
                            className="absolute inset-0 rounded-lg"
                            style={{ background: 'transparent', border: `1.5px solid ${ACCENT}`, zIndex: -1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          />
                        )}
                        {v.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative flex-1 min-w-[180px] max-w-xs">
                  <span className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Search size={16} /></span>
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search icons…"
                    className="w-full text-[13px] py-2.5 rounded-xl outline-none transition-all duration-200 focus:border-primary/60"
                    style={{ background: bg, border: `1px solid ${border}`, color: pri, paddingLeft: 38 }}
                  />
                </div>
              </motion.div>

              <motion.p variants={fadeUp} className="text-[11.5px] mb-3" style={{ color: mut }}>
                {filtered.length} icon{filtered.length !== 1 ? 's' : ''}{query ? ` matching “${query}”` : ''}
              </motion.p>

              {filtered.length === 0 ? (
                <div className="p-12 text-center rounded-2xl border border-dashed" style={{ borderColor: border }}>
                  <p className="text-sm" style={{ color: mut }}>No icons match your search.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2.5">
                    {shown.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => open(name)}
                        className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 outline-none transition-all duration-150 hover:-translate-y-[3px]"
                        style={{ background: bg, border: `1px solid ${border}` }}
                        onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = `${ACCENT}55`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.borderColor = border; }}
                        title={name}
                      >
                        <span className={variant.cls} style={{ fontSize: 24, color: pri }}>{name}</span>
                        <span className="text-[9.5px] font-medium truncate max-w-full px-1" style={{ color: mut }}>{name}</span>
                      </button>
                    ))}
                  </div>

                  {visible < filtered.length && (
                    <div className="flex justify-center mt-6">
                      <button
                        type="button"
                        onClick={() => setVisible(v => v + PAGE)}
                        className="px-5 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors"
                        style={{ background: 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${ACCENT}14`)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Load more ({filtered.length - visible} left)
                      </button>
                    </div>
                  )}
                </>
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
                    key={`${selected}-${variant.id}`}
                    className={variant.cls}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    style={{ fontSize: size, color: iconColor, lineHeight: 1 }}
                  >
                    {selected}
                  </motion.span>
                </div>
                <p className="text-[15px] font-bold mt-2" style={{ color: pri }}>{selected}</p>
                <p className="text-[11.5px] font-mono mt-0.5" style={{ color: mut }}>{variant.label} · {size}px</p>
              </div>

              {/* controls */}
              <div className="rounded-3xl p-6 flex flex-col gap-6" style={glassStyle(isDark)}>
                {/* size */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-[12px] font-semibold" style={{ color: pri }}>Size</label>
                    <span className="text-[12px] font-mono font-semibold" style={{ color: sec }}>{size}px</span>
                  </div>
                  <MiniSlider isDark={isDark} min={16} max={96} step={1} value={size} onChange={setSize} accent={ACCENT} />
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
                    <ColorControl isDark={isDark} value={color} onChange={c => { setUseThemeColor(false); setColor(c); }} accent={ACCENT} />
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
                  {copied ? 'Copied!' : 'Copy HTML'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            aria-label="Scroll to top"
            className="absolute bottom-6 right-6 z-30 flex items-center justify-center w-11 h-11 rounded-full"
            style={{
              background: isDark ? 'rgba(20,20,20,0.7)' : 'rgba(255,255,255,0.8)',
              border: `1.5px solid ${ACCENT}`,
              color: ACCENT,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)',
            }}
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
