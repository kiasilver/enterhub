'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Play, RotateCcw, Compass, MousePointerClick, Sparkles, CheckCircle, MapPin, Eye } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import GlassButton from './GlassButton';
import { Tour, type TourStep } from '@/components/ui/tour';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

/* ── animation variants (same pattern as Nestable/ScrollSpy) ──────────── */
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

/* ── Tour steps ─────────────────────────────────────────────────────────── */
const STEPS: TourStep[] = [
  {
    target: '#tour-hero-badge',
    title: 'Interactive Guide',
    description: 'This badge shows the current status of the tour. Click "Start Tour" to begin a guided walkthrough.',
    placement: 'bottom',
    offset: { y: 4 },
  },
  {
    target: '#tour-feature-navigate',
    title: 'Smart Navigation',
    description: 'The tour highlights each element in sequence with a spotlight effect, guiding users naturally through the interface.',
    placement: 'bottom',
    offset: { y: 4 },
  },
  {
    target: '#tour-feature-interact',
    title: 'Click & Interact',
    description: 'Users can interact with highlighted elements during the tour — it doesn\'t lock the interface.',
    placement: 'bottom',
    offset: { y: 4 },
  },
  {
    target: '#tour-feature-customize',
    title: 'Fully Customisable',
    description: 'Placement, offsets, step content, and animations are all configurable per step.',
    placement: 'top',
    offset: { y: -4 },
  },
  {
    target: '#tour-usage-card',
    title: 'Usage Example',
    description: 'This card shows the minimal code needed to integrate the Tour component into any page.',
    placement: 'top',
    offset: { y: -4 },
  },
];

export default function SafeTour({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const glass = glassStyle(isDark);

  /* ── Feature card data ──────────────────────────────────────────────────── */
  const FEATURES = [
    {
      id: 'tour-feature-navigate',
      icon: Compass,
      title: 'Smart Navigation',
      desc: 'Automatically scrolls and spotlights each target element with smooth spring animations.',
      accent: '#0ea5e9',
    },
    {
      id: 'tour-feature-interact',
      icon: MousePointerClick,
      title: 'Click & Interact',
      desc: 'Highlighted elements remain interactive — users can click, type, or hover during the tour.',
      accent: '#10b981',
    },
    {
      id: 'tour-feature-customize',
      icon: Sparkles,
      title: 'Fully Customisable',
      desc: 'Configure placement, offsets, descriptions, and callbacks independently for each step.',
      accent: '#f59e0b',
    },
  ];

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourFinished, setTourFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = () => {
    setTourFinished(false);
    setIsTourOpen(true);
  };

  const handleFinish = () => {
    setIsTourOpen(false);
    setTourFinished(true);
  };

  return (
    <motion.div
      ref={containerRef}
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-7 max-w-3xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>
          Components / Advance UI
        </p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>
          Tour
        </h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>
          A step-by-step guided walkthrough that spotlights UI elements and explains features.
        </p>
      </motion.div>

      {/* ── Hero card ──────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="max-w-3xl mb-6">
        <div className="rounded-2xl p-6 relative overflow-hidden" style={glass}>
          {/* Decorative gradient */}
          <div
            className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Icon circle */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: isDark ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.1)',
                border: `1px solid rgba(14,165,233,0.25)`,
              }}
            >
              <MapPin size={24} style={{ color: '#0ea5e9' }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2">
                <h3 className="text-lg font-bold" style={{ color: pri }}>
                  Interactive Product Tour
                </h3>
                <span
                  id="tour-hero-badge"
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider select-none"
                  style={{
                    background: tourFinished
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(14,165,233,0.12)',
                    color: tourFinished ? '#10b981' : '#0ea5e9',
                    border: `1px solid ${tourFinished ? 'rgba(16,185,129,0.3)' : 'rgba(14,165,233,0.3)'}`,
                  }}
                >
                  {tourFinished ? 'Completed' : 'Ready'}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: sec }}>
                Guide users through your interface with a spotlight overlay, smooth animations, and contextual descriptions.
                Each step targets a specific element on the page.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {tourFinished && (
                <GlassButton onClick={handleStart} style={{ padding: '8px 14px', borderRadius: '12px' }}>
                  <RotateCcw size={13} />
                  Restart
                </GlassButton>
              )}
              <GlassButton onClick={handleStart} style={{ padding: '8px 18px', borderRadius: '12px' }}>
                <Play size={13} />
                {tourFinished ? 'Run Again' : 'Start Tour'}
              </GlassButton>
            </div>
          </div>

          {/* Step progress indicator */}
          <AnimatePresence>
            {tourFinished && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative"
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{
                    background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                >
                  <CheckCircle size={15} style={{ color: '#10b981' }} />
                  <span className="text-xs font-medium" style={{ color: '#10b981' }}>
                    Tour completed — all {STEPS.length} steps visited successfully.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ── Feature cards ──────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="max-w-3xl mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: mut, letterSpacing: '0.13em' }}>
          Capabilities
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.id}
                id={f.id}
                variants={fadeUp}
                className="rounded-2xl p-4 group"
                style={glass}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: `${f.accent}18`,
                    border: `1px solid ${f.accent}30`,
                  }}
                >
                  <Icon size={17} style={{ color: f.accent }} />
                </div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: pri }}>
                  {f.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Usage / code preview card ──────────────────────────────── */}
      <motion.section variants={fadeUp} className="max-w-3xl mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: mut, letterSpacing: '0.13em' }}>
          Usage
        </p>
        <div id="tour-usage-card" className="rounded-2xl overflow-hidden" style={glass}>
          <div
            className="flex items-center gap-2.5 px-5 py-3"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            <Eye size={14} style={{ color: '#0ea5e9' }} />
            <span className="text-xs font-semibold" style={{ color: pri }}>
              Quick Integration
            </span>
          </div>

          <div className="p-5">
            <pre
              className="text-[12px] leading-relaxed rounded-xl p-4 overflow-x-auto no-scrollbar"
              style={{
                background: surfaceHover(isDark),
                border: `1px solid ${border}`,
                color: sec,
                fontFamily: "var(--font-geist-mono, 'Courier New', monospace)",
              }}
            >
{`const steps: TourStep[] = [
  {
    target: '#my-element',
    title: 'Welcome',
    description: 'This is the first step.',
    placement: 'bottom',
  },
  {
    target: '#feature-card',
    title: 'Features',
    description: 'Explore our features.',
    placement: 'right',
  },
];

<Tour
  steps={steps}
  open={isTourOpen}
  onClose={() => setIsTourOpen(false)}
  onFinish={() => setIsTourOpen(false)}
/>`}
            </pre>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Steps', value: '∞', sub: 'Unlimited' },
                { label: 'Placements', value: '4', sub: 'top / bottom / left / right' },
                { label: 'Animation', value: 'Spring', sub: 'Physics-based' },
                { label: 'Overlay', value: 'Clip', sub: 'Polygon cutout' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl px-3 py-2.5 text-center"
                  style={{
                    background: surfaceHover(isDark),
                    border: `1px solid ${border}`,
                  }}
                >
                  <p className="text-base font-bold" style={{ color: pri }}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: mut }}>{stat.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: sec }}>{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Steps overview table ───────────────────────────────────── */}
      <motion.section variants={fadeUp} className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: mut, letterSpacing: '0.13em' }}>
          Current Tour Steps
        </p>
        <div className="rounded-2xl overflow-hidden" style={glass}>
         <div className="overflow-x-auto no-scrollbar">
          {/* Table header */}
          <div
            className="grid grid-cols-12 min-w-[640px] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: mut, borderBottom: `1px solid ${border}` }}
          >
            <span className="col-span-1">#</span>
            <span className="col-span-3">Target</span>
            <span className="col-span-3">Title</span>
            <span className="col-span-3">Placement</span>
            <span className="col-span-2">Status</span>
          </div>
          {/* Table rows */}
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="grid grid-cols-12 min-w-[640px] items-center px-5 py-3 transition-colors duration-150"
              style={{
                borderBottom: i < STEPS.length - 1 ? `1px solid ${border}` : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span className="col-span-1 text-xs font-bold" style={{ color: '#0ea5e9' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                className="col-span-3 text-xs font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: sec,
                  background: surfaceHover(isDark),
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {step.target}
              </span>
              <span className="col-span-3 text-xs font-medium" style={{ color: pri }}>
                {step.title}
              </span>
              <span className="col-span-3">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                  style={{
                    background: 'rgba(14,165,233,0.1)',
                    color: '#0ea5e9',
                    border: '1px solid rgba(14,165,233,0.2)',
                  }}
                >
                  {step.placement || 'bottom'}
                </span>
              </span>
              <span className="col-span-2">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: tourFinished
                      ? 'rgba(16,185,129,0.1)'
                      : 'rgba(255,255,255,0.06)',
                    color: tourFinished ? '#10b981' : mut,
                    border: `1px solid ${tourFinished ? 'rgba(16,185,129,0.25)' : border}`,
                  }}
                >
                  {tourFinished ? 'Done' : 'Pending'}
                </span>
              </span>
            </div>
          ))}
         </div>
        </div>
      </motion.section>

      {/* ── Tour component (portal) ────────────────────────────────── */}
      <Tour
        steps={STEPS}
        open={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onFinish={handleFinish}
      />
    </motion.div>
  );
}
