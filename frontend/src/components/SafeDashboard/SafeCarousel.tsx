'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, Plus, Check } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
}

interface Slide {
  from: string;
  to: string;
  img?: string;
  title?: string;
  sub?: string;
}

const SLIDES: Slide[] = [
  { from: 'var(--primary)', to: 'var(--primary)', img: '/img/4.jpg', title: 'Real-time monitoring', sub: 'See every incident the moment it happens.' },
  { from: '#0ea5e9', to: '#10b981', img: '/img/9.jpg', title: 'Predictive risk scoring', sub: 'Stop accidents before they ever occur.' },
  { from: '#f59e0b', to: '#ef4444', img: '/img/8.jpg', title: 'Effortless compliance', sub: 'Stay audit-ready all year round.' },
];

const DARK_SLIDES: Slide[] = [
  { from: '#1e1b4b', to: '#312e81', title: 'Night operations', sub: 'Round-the-clock safety coverage.' },
  { from: '#064e3b', to: '#065f46', title: 'Secure by design', sub: 'Encrypted, audited, and compliant.' },
  { from: '#7f1d1d', to: '#991b1b', title: 'Incident response', sub: 'Act fast when every second matters.' },
];

const PRODUCTS = [
  { title: 'Safety Helmet', cat: 'PPE Headwear', price: '$45', rating: '4.8', img: '/img/2.jpg', desc: 'ANSI-certified hard hat with an adjustable suspension and a vented shell for all-day comfort on site.' },
  { title: 'Gas Monitor', cat: 'Detection', price: '$120', rating: '4.9', img: '/img/9.jpg', desc: 'Four-gas detector with real-time alerts and a 24-hour battery, built for confined-space work.' },
  { title: 'Fire Extinguisher', cat: 'Suppression', price: '$80', rating: '4.7', img: '/img/4.jpg', desc: 'Multi-purpose ABC extinguisher rated for electrical, liquid, and solid fires.' },
  { title: 'Safety Harness', cat: 'Fall Protection', price: '$95', rating: '5.0', img: '/img/8.jpg', desc: 'Full-body harness with five adjustment points and tool-free quick-connect buckles.' },
  { title: 'First Aid Kit', cat: 'Medical', price: '$35', rating: '4.6', img: '/img/5.jpg', desc: '200-piece OSHA-compliant kit in a wall-mountable, dust-proof carry case.' },
  { title: 'Warning Signage', cat: 'Signage', price: '$18', rating: '4.5', img: '/img/3.jpg', desc: 'Reflective, weatherproof hazard signs that stay visible day and night.' },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};
const slideVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

// ── Reusable carousel ──
function Carousel({ slides, isDark, controls = false, indicators = false, captions = false, autoplay, dark = false, swipe = true, intervalLabel = false, height = 260 }: {
  slides: Slide[];
  isDark: boolean;
  controls?: boolean;
  indicators?: boolean;
  captions?: boolean;
  autoplay?: number | number[];
  dark?: boolean;
  swipe?: boolean;
  intervalLabel?: boolean;
  height?: number;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [hovered, setHovered] = useState(false);
  const n = slides.length;

  const step = (d: number) => { setDir(d); setIndex((i) => (i + d + n) % n); };
  const go = (i: number) => { setDir(i > index ? 1 : -1); setIndex(i); };

  const delay = Array.isArray(autoplay) ? (autoplay[index] ?? 3000) : autoplay;
  useEffect(() => {
    if (!autoplay || hovered) return;
    const id = setTimeout(() => { setDir(1); setIndex((i) => (i + 1) % n); }, delay);
    return () => clearTimeout(id);
  }, [autoplay, hovered, index, delay, n]);

  const s = slides[index];
  const ctrl: React.CSSProperties = {
    background: dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.32)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#fff',
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{ height, border: `1px solid ${borderSubtle(isDark)}`, background: dark ? '#0b0b12' : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
          drag={swipe ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80 || info.velocity.x < -400) step(1);
            else if (info.offset.x > 80 || info.velocity.x > 400) step(-1);
          }}
          className={`absolute inset-0 ${swipe ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
        >
          {s.img && <img src={s.img} alt={s.title || ''} draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: 0.9 }} />}
          {captions && (s.title || s.sub) && (
            <div className="absolute inset-x-0 bottom-0 p-6 pb-12" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }}>
              {s.title && <h4 className="text-lg font-bold" style={{ color: '#fff' }}>{s.title}</h4>}
              {s.sub && <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{s.sub}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {intervalLabel && (
        <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={ctrl}>{(delay ?? 0) / 1000}s</span>
      )}

      {controls && (
        <>
          <button onClick={() => step(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90" style={ctrl}><ChevronLeft size={18} /></button>
          <button onClick={() => step(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90" style={ctrl}><ChevronRight size={18} /></button>
        </>
      )}

      {indicators && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === index ? 22 : 6, background: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-8">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-3.5" style={{ color: textMuted(isDark) }}>{desc}</p>
      {children}
    </motion.section>
  );
}

export default function SafeCarousel({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  // Featured-product carousel state
  const [pIndex, setPIndex] = useState(0);
  const [pDir, setPDir] = useState(0);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (addedTimer.current) clearTimeout(addedTimer.current); }, []);

  const pStep = (d: number) => { setPDir(d); setPIndex((i) => (i + d + PRODUCTS.length) % PRODUCTS.length); };
  const pGo = (i: number) => { setPDir(i > pIndex ? 1 : -1); setPIndex(i); };
  const addToCart = () => {
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  const p = PRODUCTS[pIndex];
  const navBtn: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${border}`,
    color: pri,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  };

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 py-5 sm:py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="mb-7 max-w-3xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Base UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Carousel</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Drag, swipe, autoplay, captions, and indicators — all animated.</p>
      </motion.div>

      <div className="max-w-3xl">

        {/* Card carousel — featured product spotlight */}
        <Section title="Card carousel" desc="A featured-product spotlight. Drag, use the arrows, or tap the dots." isDark={isDark}>
          <div className="relative rounded-2xl overflow-hidden h-[460px] sm:h-[280px]" style={{ ...glassStyle(isDark) }}>
            <AnimatePresence initial={false} custom={pDir}>
              <motion.div
                key={pIndex}
                custom={pDir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80 || info.velocity.x < -400) pStep(1);
                  else if (info.offset.x > 80 || info.velocity.x > 400) pStep(-1);
                }}
                className="absolute inset-0 flex flex-col sm:flex-row cursor-grab active:cursor-grabbing select-none"
              >
                <div className="w-full sm:w-1/2 h-40 sm:h-full bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url('${p.img}')` }} />
                <div className="flex-1 min-h-0 p-5 sm:p-6 flex flex-col justify-start sm:justify-center overflow-y-auto no-scrollbar">
                  <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full mb-3" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>{p.cat}</span>
                  <h3 className="text-xl font-bold" style={{ color: pri }}>{p.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: mut }}>
                      <Star size={13} style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {p.rating}
                    </span>
                    <span className="text-lg font-black" style={{ color: pri }}>{p.price}</span>
                  </div>
                  <p className="text-xs leading-relaxed mt-3 max-w-sm" style={{ color: sec }}>{p.desc}</p>
                  <button onClick={addToCart} className="self-start mt-5 inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-lg text-white transition-all active:scale-95" style={{ background: added ? '#10b981' : 'var(--primary)' }}>
                    {added ? <><Check size={15} /> Added</> : <><Plus size={15} /> Add to cart</>}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <button onClick={() => pStep(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full hidden sm:flex items-center justify-center transition-transform active:scale-90" style={navBtn}><ChevronLeft size={18} /></button>
            <button onClick={() => pStep(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full hidden sm:flex items-center justify-center transition-transform active:scale-90" style={navBtn}><ChevronRight size={18} /></button>
          </div>

          {/* dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {PRODUCTS.map((_, i) => (
              <button key={i} onClick={() => pGo(i)} aria-label={`Product ${i + 1}`} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === pIndex ? 22 : 6, background: i === pIndex ? 'var(--primary)' : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)') }} />
            ))}
          </div>
        </Section>

        {/* With controls */}
        <Section title="With controls" desc="Previous / next arrows. Drag to swipe too." isDark={isDark}>
          <Carousel slides={SLIDES} isDark={isDark} controls />
        </Section>

        {/* With indicators */}
        <Section title="With indicators" desc="Slide indicators you can click to jump." isDark={isDark}>
          <Carousel slides={SLIDES} isDark={isDark} controls indicators />
        </Section>

        {/* With captions */}
        <Section title="With captions" desc="Title and subtitle laid over each slide." isDark={isDark}>
          <Carousel slides={SLIDES} isDark={isDark} controls captions />
        </Section>

        {/* Individual interval */}
        <Section title="Individual carousel-item interval" desc="Autoplays with a different duration per slide (2s · 5s · 3s). Hover to pause." isDark={isDark}>
          <Carousel slides={SLIDES} isDark={isDark} controls indicators captions autoplay={[2000, 5000, 3000]} intervalLabel />
        </Section>

        {/* Dark variant */}
        <Section title="Dark variant" desc="A dark-styled carousel with light controls and captions." isDark={isDark}>
          <Carousel slides={DARK_SLIDES} isDark={isDark} controls indicators captions dark />
        </Section>

        {/* Disable touch swiping */}
        <Section title="Disable touch swiping" desc="Dragging is turned off — navigate only with the controls." isDark={isDark}>
          <Carousel slides={SLIDES} isDark={isDark} controls indicators captions swipe={false} />
        </Section>

      </div>
    </motion.div>
  );
}
