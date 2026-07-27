'use client';

import { useState, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', body: 'ScrollSpy automatically updates the navigation to indicate which section is currently in view. As you scroll the panel, the matching link highlights itself.' },
  { id: 'install', label: 'Installation', body: 'Drop the component into any scrollable container. It observes scroll position and resolves the active section from each block’s offset, with zero configuration required.' },
  { id: 'usage', label: 'Usage', body: 'Click any item in the navigation to smoothly scroll the panel to that section. The active state stays in sync whether you scroll manually or jump via the nav.' },
  { id: 'styling', label: 'Styling', body: 'Everything inherits the dashboard’s glassmorphism — the active link gets a soft accent pill, and the panel keeps the same translucent surface used across the app.' },
  { id: 'accessibility', label: 'Accessibility', body: 'Navigation items are real buttons, focusable and keyboard-operable, so the spy works for pointer and keyboard users alike.' },
  { id: 'faq', label: 'FAQ', body: 'Works with any number of sections and adapts to their heights. Add or remove sections freely — the active detection recalculates on every scroll.' },
];

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } } };

export default function SafeScrollSpy({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [active, setActive] = useState(SECTIONS[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const onScroll = () => {
    const c = scrollRef.current;
    if (!c) return;
    const pos = c.scrollTop + 90;
    let current = SECTIONS[0].id;
    for (const s of SECTIONS) {
      const el = refs.current[s.id];
      if (el && el.offsetTop <= pos) current = s.id;
    }
    setActive(current);
  };

  const goto = (id: string) => {
    const el = refs.current[id];
    const c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 8, behavior: 'smooth' });
  };

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-7 max-w-3xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Advance UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>ScrollSpy</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>The navigation tracks the section currently in view.</p>
      </motion.div>

      <motion.section variants={item} className="max-w-3xl">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-5">
          {/* Nav */}
          <nav className="w-full lg:w-40 flex-shrink-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-x-visible lg:overflow-visible lg:sticky lg:top-0">
              {SECTIONS.map((s) => {
                const on = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => goto(s.id)}
                    className="relative flex-shrink-0 lg:flex-shrink whitespace-nowrap text-left text-[13px] font-medium px-3 py-2 rounded-lg transition-colors"
                    style={{ color: on ? pri : sec }}
                  >
                    {on && <motion.span layoutId="spy-active" className="absolute inset-0 rounded-lg" style={{ background: 'rgba(var(--primary-rgb), 0.12)', border: '1px solid rgba(var(--primary-rgb), 0.25)' }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative z-10">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="relative w-full min-w-0 lg:flex-1 overflow-y-auto no-scrollbar rounded-2xl p-4 lg:p-6"
            style={{ ...glassStyle(isDark), maxHeight: 380 }}
          >
            {SECTIONS.map((s) => (
              <section key={s.id} ref={(el) => { refs.current[s.id] = el; }} className="mb-7 last:mb-0">
                <h3 className="text-base font-bold mb-2" style={{ color: pri }}>{s.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: sec }}>{s.body}</p>
                <div className="mt-3 rounded-xl p-4 text-xs" style={{ background: surfaceHover(isDark), border: `1px solid ${border}`, color: mut }}>
                  Section “{s.label}” — scroll up and down to watch the navigation follow along.
                </div>
              </section>
            ))}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
