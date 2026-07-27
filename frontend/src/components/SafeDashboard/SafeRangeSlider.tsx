'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, type Variants } from 'motion/react';
import { DollarSign, Percent, Thermometer, Ruler, Volume2 } from 'lucide-react';
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

function clampStep(v: number, min: number, max: number, step: number): number {
  const stepped = Math.round((v - min) / step) * step + min;
  const fixed = Math.round(stepped * 1e6) / 1e6;
  return Math.min(max, Math.max(min, fixed));
}
const pctOf = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100;

interface Mark {
  value: number;
  label?: string;
}

/* ===================================================================== *
 *  Slider — single handle (supports vertical)                          *
 * ===================================================================== */
interface SliderProps {
  isDark: boolean;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  gradient?: [string, string];
  disabled?: boolean;
  tooltip?: 'always' | 'active' | 'none';
  marks?: Mark[];
  format?: (v: number) => string;
  thickness?: number;
  vertical?: boolean;
  length?: number; // px, vertical only
}

function Slider({
  isDark,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  color: colorProp,
  gradient,
  disabled = false,
  tooltip = 'active',
  marks,
  format = v => String(v),
  thickness = 6,
  vertical = false,
  length = 180,
}: SliderProps) {
  const { primaryColor } = useTheme();
  const color = colorProp ?? primaryColor;
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const mut = textMuted(isDark);
  const trackBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';
  const pct = pctOf(value, min, max);
  const fill = gradient ? `linear-gradient(${vertical ? 'to top' : 'to right'}, ${gradient[0]}, ${gradient[1]})` : color;

  const setFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      let ratio = vertical ? 1 - (clientY - r.top) / r.height : (clientX - r.left) / r.width;
      ratio = Math.min(1, Math.max(0, ratio));
      onChange(clampStep(min + ratio * (max - min), min, max, step));
    },
    [vertical, min, max, step, onChange],
  );

  const onDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setActive(true);
    setFromPointer(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!active) return;
    const move = (e: PointerEvent) => setFromPointer(e.clientX, e.clientY);
    const up = () => setActive(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [active, setFromPointer]);

  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const big = (max - min) / 10;
    let next = value;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = value - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = value + step;
    else if (e.key === 'PageDown') next = value - big;
    else if (e.key === 'PageUp') next = value + big;
    else if (e.key === 'Home') next = min;
    else if (e.key === 'End') next = max;
    else return;
    e.preventDefault();
    onChange(clampStep(next, min, max, step));
  };

  const showTip = tooltip === 'always' || (tooltip === 'active' && active);

  // NOTE: use motion x/y (not CSS transform) so they compose with the `scale`
  // animation instead of being overwritten by it.
  const handlePosStyle = vertical
    ? { bottom: `${pct}%`, left: '50%', x: '-50%', y: '50%' }
    : { left: `${pct}%`, top: '50%', x: '-50%', y: '-50%' };

  const fillStyle: React.CSSProperties = vertical
    ? { background: fill, width: '100%', height: `${pct}%`, bottom: 0, left: 0, position: 'absolute', borderRadius: thickness }
    : { background: fill, height: '100%', width: `${pct}%`, left: 0, top: 0, position: 'absolute', borderRadius: thickness };

  return (
    <div
      className="relative select-none"
      style={{
        opacity: disabled ? 0.5 : 1,
        ...(vertical
          ? { width: 40, height: length, display: 'flex', justifyContent: 'center' }
          : { paddingTop: showTip ? 4 : 0 }),
      }}
    >
      <div
        ref={trackRef}
        onPointerDown={onDown}
        className="relative cursor-pointer"
        style={
          vertical
            ? { width: thickness, height: '100%', background: trackBg, borderRadius: thickness, cursor: disabled ? 'not-allowed' : 'pointer' }
            : { width: '100%', height: thickness, background: trackBg, borderRadius: thickness, cursor: disabled ? 'not-allowed' : 'pointer' }
        }
      >
        <div style={fillStyle} />

        {/* marks */}
        {marks?.map(mk => {
          const p = pctOf(mk.value, min, max);
          return (
            <div key={mk.value} className="absolute" style={vertical ? { bottom: `${p}%`, left: '50%' } : { left: `${p}%`, top: '50%' }}>
              <span
                className="absolute rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: mk.value <= value ? '#fff' : mut,
                  transform: 'translate(-50%, -50%)',
                }}
              />
              {mk.label && !vertical && (
                <span className="absolute text-[10px] font-medium whitespace-nowrap" style={{ top: 10, left: 0, transform: 'translateX(-50%)', color: mut }}>
                  {mk.label}
                </span>
              )}
            </div>
          );
        })}

        {/* handle */}
        <motion.div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={onKey}
          onPointerDown={onDown}
          animate={{ scale: active ? 1.18 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute rounded-full outline-none"
          style={{
            width: thickness + 8,
            height: thickness + 8,
            background: '#fff',
            border: `2px solid ${color}`,
            boxShadow: active ? `0 0 0 6px ${color}22` : '0 2px 6px rgba(0,0,0,0.2)',
            cursor: disabled ? 'not-allowed' : 'grab',
            ...handlePosStyle,
          }}
        >
          {showTip && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute text-[11px] font-bold px-2 py-0.5 rounded-md font-mono whitespace-nowrap"
              style={
                vertical
                  ? { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)', background: color, color: '#fff' }
                  : { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: color, color: '#fff' }
              }
            >
              {format(value)}
            </motion.span>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ===================================================================== *
 *  DualSlider — two handles (range)                                     *
 * ===================================================================== */
interface DualProps {
  isDark: boolean;
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  color?: string;
  format?: (v: number) => string;
  tooltip?: 'always' | 'active' | 'none';
}

function DualSlider({ isDark, min = 0, max = 100, step = 1, value, onChange, color: colorProp, format = v => String(v), tooltip = 'active' }: DualProps) {
  const { primaryColor } = useTheme();
  const color = colorProp ?? primaryColor;
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<0 | 1 | null>(null);
  const trackBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)';
  const [a, b] = value;
  const pa = pctOf(a, min, max);
  const pb = pctOf(b, min, max);

  const valueAt = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return min;
      const r = el.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      return clampStep(min + ratio * (max - min), min, max, step);
    },
    [min, max, step],
  );

  const moveHandle = useCallback(
    (which: 0 | 1, v: number) => {
      if (which === 0) onChange([Math.min(v, b), b]);
      else onChange([a, Math.max(v, a)]);
    },
    [a, b, onChange],
  );

  const onTrackDown = (e: React.PointerEvent) => {
    const v = valueAt(e.clientX);
    const which: 0 | 1 = Math.abs(v - a) <= Math.abs(v - b) ? 0 : 1;
    setActive(which);
    moveHandle(which, v);
  };

  useEffect(() => {
    if (active === null) return;
    const move = (e: PointerEvent) => moveHandle(active, valueAt(e.clientX));
    const up = () => setActive(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [active, moveHandle, valueAt]);

  const Handle = ({ which, p, v }: { which: 0 | 1; p: number; v: number }) => (
    <motion.div
      role="slider"
      aria-valuenow={v}
      tabIndex={0}
      onPointerDown={e => { e.stopPropagation(); setActive(which); }}
      onKeyDown={e => {
        let nv = v;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nv = v - step;
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nv = v + step;
        else return;
        e.preventDefault();
        moveHandle(which, clampStep(nv, min, max, step));
      }}
      animate={{ scale: active === which ? 1.18 : 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute rounded-full outline-none top-1/2"
      style={{
        width: 16,
        height: 16,
        background: '#fff',
        border: `2px solid ${color}`,
        boxShadow: active === which ? `0 0 0 6px ${color}22` : '0 2px 6px rgba(0,0,0,0.2)',
        left: `${p}%`,
        x: '-50%',
        y: '-50%',
        cursor: 'grab',
        zIndex: active === which ? 2 : 1,
      }}
    >
      {(tooltip === 'always' || (tooltip === 'active' && active === which)) && (
        <span
          className="absolute text-[11px] font-bold px-2 py-0.5 rounded-md font-mono whitespace-nowrap"
          style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: color, color: '#fff' }}
        >
          {format(v)}
        </span>
      )}
    </motion.div>
  );

  return (
    <div className="relative select-none pt-1">
      <div ref={trackRef} onPointerDown={onTrackDown} className="relative cursor-pointer" style={{ width: '100%', height: 6, background: trackBg, borderRadius: 6 }}>
        <div className="absolute top-0 h-full" style={{ background: color, left: `${pa}%`, width: `${pb - pa}%`, borderRadius: 6 }} />
        <Handle which={0} p={pa} v={a} />
        <Handle which={1} p={pb} v={b} />
      </div>
    </div>
  );
}

/* ===================================================================== *
 *  Section + Row helpers                                                *
 * ===================================================================== */
function Section({ isDark, title, hint, children }: { isDark: boolean; title: string; hint?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-4 sm:p-6 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? <p className="text-[12px] mt-1 mb-6" style={{ color: mut }}>{hint}</p> : <div className="mb-6" />}
      {children}
    </motion.section>
  );
}

function Field({ isDark, label, value, children }: { isDark: boolean; label: string; value?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <label className="text-[12px] font-semibold" style={{ color: pri }}>{label}</label>
        {value !== undefined && <span className="text-[12px] font-mono font-semibold" style={{ color: sec }}>{value}</span>}
      </div>
      {children}
    </div>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
export default function SafeRangeSlider({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  // Basics
  const [basic, setBasic] = useState(40);
  const [tip, setTip] = useState(65);
  const [minmax, setMinmax] = useState(30);
  const [disabledV] = useState(50);

  // Steps & marks
  const [stepped, setStepped] = useState(60);
  const [graded, setGraded] = useState(2);

  // Colours & sizes
  const [c1, setC1] = useState(35);
  const [c2, setC2] = useState(55);
  const [c3, setC3] = useState(75);
  const [thin, setThin] = useState(45);
  const [thick, setThick] = useState(70);
  const [grad, setGrad] = useState(60);

  // Formatted
  const [price, setPrice] = useState(1200);
  const [pctV, setPctV] = useState(42);
  const [temp, setTemp] = useState(21);
  const [px, setPx] = useState(16);

  // Ranges
  const [range1, setRange1] = useState<[number, number]>([25, 75]);
  const [priceRange, setPriceRange] = useState<[number, number]>([200, 800]);
  const [rangeC, setRangeC] = useState<[number, number]>([30, 60]);

  // Vertical equalizer
  const [eq, setEq] = useState([60, 80, 45, 70, 30]);
  const [vol, setVol] = useState(65);

  // Synced input
  const [synced, setSynced] = useState(50);

  const GRADES = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const colInput = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Range Slider</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Range Slider</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Basics --- */}
        <Section isDark={isDark} title="Basics" hint="Drag the handle, click anywhere on the track, or focus it and use the arrow / Home / End keys.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <Field isDark={isDark} label="Default" value={String(basic)}>
              <Slider isDark={isDark} value={basic} onChange={setBasic} />
            </Field>
            <Field isDark={isDark} label="Always-on tooltip">
              <Slider isDark={isDark} value={tip} onChange={setTip} tooltip="always" />
            </Field>
            <Field isDark={isDark} label="With min / max labels" value={`${minmax} / 100`}>
              <Slider isDark={isDark} value={minmax} onChange={setMinmax} />
              <div className="flex justify-between mt-2 text-[11px] font-mono" style={{ color: mut }}>
                <span>0</span><span>100</span>
              </div>
            </Field>
            <Field isDark={isDark} label="Disabled" value={String(disabledV)}>
              <Slider isDark={isDark} value={disabledV} onChange={() => {}} disabled />
            </Field>
          </div>
        </Section>

        {/* --- Steps & Marks --- */}
        <Section isDark={isDark} title="Steps & Marks" hint="Snap to discrete steps, with optional pips and labels along the track.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
            <Field isDark={isDark} label="Step = 10" value={String(stepped)}>
              <Slider
                isDark={isDark}
                value={stepped}
                onChange={setStepped}
                step={10}
                tooltip="active"
                marks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => ({ value: v, label: v % 50 === 0 ? String(v) : undefined }))}
              />
            </Field>
            <Field isDark={isDark} label="Graded scale" value={GRADES[graded]}>
              <Slider
                isDark={isDark}
                min={0}
                max={4}
                step={1}
                value={graded}
                onChange={setGraded}
                color="#10b981"
                tooltip="none"
                format={v => GRADES[v]}
                marks={GRADES.map((g, i) => ({ value: i, label: g }))}
              />
            </Field>
          </div>
        </Section>

        {/* --- Colours, Sizes & Gradient --- */}
        <Section isDark={isDark} title="Colours, Sizes & Gradient" hint="Any accent colour, track thickness, or a gradient fill.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <Field isDark={isDark} label="Indigo" value={String(c1)}>
              <Slider isDark={isDark} value={c1} onChange={setC1} color={primaryColor} />
            </Field>
            <Field isDark={isDark} label="Emerald" value={String(c2)}>
              <Slider isDark={isDark} value={c2} onChange={setC2} color="#10b981" />
            </Field>
            <Field isDark={isDark} label="Rose" value={String(c3)}>
              <Slider isDark={isDark} value={c3} onChange={setC3} color="#f43f5e" />
            </Field>
            <Field isDark={isDark} label="Gradient fill" value={String(grad)}>
              <Slider isDark={isDark} value={grad} onChange={setGrad} gradient={[primaryColor, '#ec4899']} tooltip="active" />
            </Field>
            <Field isDark={isDark} label="Thin track" value={String(thin)}>
              <Slider isDark={isDark} value={thin} onChange={setThin} thickness={3} />
            </Field>
            <Field isDark={isDark} label="Thick track" value={String(thick)}>
              <Slider isDark={isDark} value={thick} onChange={setThick} thickness={12} />
            </Field>
          </div>
        </Section>

        {/* --- Formatted values --- */}
        <Section isDark={isDark} title="Formatted Values" hint="Render units, currency, signs and negative ranges through a format function.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {[
              { Icon: DollarSign, color: primaryColor, label: 'Budget', val: `$${price.toLocaleString()}`, slider: <Slider isDark={isDark} min={0} max={5000} step={50} value={price} onChange={setPrice} tooltip="active" format={v => `$${v.toLocaleString()}`} /> },
              { Icon: Percent, color: primaryColor, label: 'Opacity', val: `${pctV}%`, slider: <Slider isDark={isDark} value={pctV} onChange={setPctV} tooltip="active" format={v => `${v}%`} /> },
              { Icon: Thermometer, color: '#f43f5e', label: 'Temperature', val: `${temp}°C`, slider: <Slider isDark={isDark} min={-20} max={40} value={temp} onChange={setTemp} color="#f43f5e" tooltip="active" format={v => `${v}°C`} /> },
              { Icon: Ruler, color: primaryColor, label: 'Font size', val: `${px}px`, slider: <Slider isDark={isDark} min={10} max={48} value={px} onChange={setPx} tooltip="active" format={v => `${v}px`} /> },
            ].map(row => (
              <div key={row.label}>
                <div className="flex items-center gap-2 mb-3.5">
                  <row.Icon size={15} style={{ color: row.color }} />
                  <span className="text-[12px] font-semibold" style={{ color: pri }}>{row.label}</span>
                  <span className="ml-auto text-[12px] font-mono font-semibold" style={{ color: sec }}>{row.val}</span>
                </div>
                {row.slider}
              </div>
            ))}
          </div>
        </Section>

        {/* --- Range (dual handle) --- */}
        <Section isDark={isDark} title="Range — Dual Handle" hint="Two handles define a span; drag either, or click the track to move the nearest one.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <Field isDark={isDark} label="Basic range" value={`${range1[0]} – ${range1[1]}`}>
              <DualSlider isDark={isDark} value={range1} onChange={setRange1} tooltip="active" />
            </Field>
            <Field isDark={isDark} label="Coloured range" value={`${rangeC[0]} – ${rangeC[1]}`}>
              <DualSlider isDark={isDark} value={rangeC} onChange={setRangeC} color="#10b981" tooltip="active" />
            </Field>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3.5">
                <label className="text-[12px] font-semibold" style={{ color: pri }}>Price filter</label>
                <span className="text-[12px] font-mono font-semibold" style={{ color: sec }}>${priceRange[0]} – ${priceRange[1]}</span>
              </div>
              <DualSlider isDark={isDark} min={0} max={1000} step={10} value={priceRange} onChange={setPriceRange} tooltip="active" format={v => `$${v}`} />
              <div className="flex items-center gap-3 mt-5">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{ background: colInput, border: `1px solid ${border}` }}>
                  <span className="text-[12px]" style={{ color: mut }}>Min</span>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([Math.min(Number(e.target.value) || 0, priceRange[1]), priceRange[1]])}
                    className="w-full bg-transparent outline-none text-[13px] font-mono text-right"
                    style={{ color: pri }}
                  />
                </div>
                <span style={{ color: mut }}>—</span>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1" style={{ background: colInput, border: `1px solid ${border}` }}>
                  <span className="text-[12px]" style={{ color: mut }}>Max</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value) || 0, priceRange[0])])}
                    className="w-full bg-transparent outline-none text-[13px] font-mono text-right"
                    style={{ color: pri }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* --- Vertical --- */}
        <Section isDark={isDark} title="Vertical" hint="The same slider rotated — here as a 5-band equaliser and a volume control.">
          <div className="flex flex-wrap items-end gap-6 sm:gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Volume2 size={15} style={{ color: primaryColor }} />
                <span className="text-[12px] font-semibold" style={{ color: pri }}>Equaliser</span>
              </div>
              <div className="flex items-end gap-3 sm:gap-5">
                {eq.map((v, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <Slider
                      isDark={isDark}
                      vertical
                      length={150}
                      value={v}
                      onChange={nv => setEq(prev => prev.map((x, idx) => (idx === i ? nv : x)))}
                      color={[primaryColor, 'var(--primary)', '#ec4899', '#f43f5e', '#f59e0b'][i]}
                      tooltip="active"
                    />
                    <span className="text-[10px] font-mono" style={{ color: mut }}>{[60, 250, '1k', '4k', '12k'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[12px] font-semibold mb-2" style={{ color: pri }}>Volume</span>
              <Slider isDark={isDark} vertical length={150} value={vol} onChange={setVol} gradient={['#10b981', primaryColor]} tooltip="always" thickness={8} />
            </div>
          </div>
        </Section>

        {/* --- Synced input --- */}
        <Section isDark={isDark} title="Synced with Input" hint="Slider and number field stay in two-way sync.">
          <div className="flex items-center gap-5 max-w-md">
            <div className="flex-1">
              <Slider isDark={isDark} value={synced} onChange={setSynced} tooltip="active" />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={synced}
              onChange={e => setSynced(clampStep(Number(e.target.value) || 0, 0, 100, 1))}
              className="w-20 px-3 py-2 rounded-xl outline-none text-[13px] font-mono text-center focus:ring-2 ring-primary/20"
              style={{ background: colInput, border: `1px solid ${border}`, color: pri }}
            />
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
