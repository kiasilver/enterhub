'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { textPrimary, textMuted, glassStyle, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
}

const IMAGES = ['/img/4.jpg', '/img/9.jpg', '/img/8.jpg', '/img/2.jpg', '/img/5.jpg', '/img/10.jpg'];

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } } };
const slideVariants: Variants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-8">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-3.5" style={{ color: textMuted(isDark) }}>{desc}</p>
      {children}
    </motion.section>
  );
}

export default function SafeSwiper({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [auto, setAuto] = useState(0);
  const [aDir, setADir] = useState(0);
  const [hover, setHover] = useState(false);
  const n = IMAGES.length;

  const go = (i: number) => { setDir(i > index ? 1 : -1); setIndex(i); };
  const step = (d: number) => { setDir(d); setIndex((i) => (i + d + n) % n); };

  // second (autoplay) swiper
  useEffect(() => {
    if (hover) return;
    const id = setTimeout(() => { setADir(1); setAuto((i) => (i + 1) % n); }, 3000);
    return () => clearTimeout(id);
  }, [auto, hover, n]);

  const ctrl: React.CSSProperties = { background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', color: '#fff' };

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-7 max-w-3xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Advance UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Swiper Slider</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Touch-friendly image sliders with thumbnails and autoplay.</p>
      </motion.div>

      <div className="max-w-3xl">
        {/* Thumbnails swiper */}
        <Section title="Thumbnails gallery" desc="Drag the main image or pick a thumbnail below." isDark={isDark}>
          <div className="relative rounded-2xl overflow-hidden select-none" style={{ height: 300, border: `1px solid ${border}` }}>
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={index}
                custom={dir}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
                drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
                onDragEnd={(_, info) => { if (info.offset.x < -80 || info.velocity.x < -400) step(1); else if (info.offset.x > 80 || info.velocity.x > 400) step(-1); }}
                className="absolute inset-0 bg-cover bg-center cursor-grab active:cursor-grabbing"
                style={{ backgroundImage: `url('${IMAGES[index]}')` }}
              />
            </AnimatePresence>
            <button onClick={() => step(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90" style={ctrl}><ChevronLeft size={18} /></button>
            <button onClick={() => step(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90" style={ctrl}><ChevronRight size={18} /></button>
            <span className="absolute top-3 right-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-full" style={ctrl}>{index + 1} / {n}</span>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
            {IMAGES.map((src, i) => (
              <button key={i} onClick={() => go(i)} className="h-14 w-20 rounded-lg bg-cover bg-center flex-shrink-0 transition-all duration-200 overflow-hidden" style={{ backgroundImage: `url('${src}')`, border: i === index ? '2px solid var(--primary)' : '2px solid transparent', opacity: i === index ? 1 : 0.55 }} />
            ))}
          </div>
        </Section>

        {/* Autoplay swiper */}
        <Section title="Autoplay" desc="Advances on its own every 3s; hover to pause." isDark={isDark}>
          <div className="relative rounded-2xl overflow-hidden select-none" style={{ ...glassStyle(isDark), height: 240 }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <AnimatePresence initial={false} custom={aDir}>
              <motion.div
                key={auto}
                custom={aDir}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${IMAGES[auto]}')` }}
              />
            </AnimatePresence>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
              {IMAGES.map((_, i) => (
                <button key={i} onClick={() => { setADir(i > auto ? 1 : -1); setAuto(i); }} aria-label={`Slide ${i + 1}`} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === auto ? 22 : 6, background: i === auto ? '#fff' : 'rgba(255,255,255,0.5)' }} />
              ))}
            </div>
          </div>
        </Section>
      </div>
    </motion.div>
  );
}
