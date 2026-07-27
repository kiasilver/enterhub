'use client';

import { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { MapPin, Navigation } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};
const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

const LOCATIONS = [
  { name: 'San Francisco', region: 'United States', query: 'San Francisco, CA' },
  { name: 'London', region: 'United Kingdom', query: 'London, UK' },
  { name: 'Tokyo', region: 'Japan', query: 'Tokyo, Japan' },
  { name: 'Dubai', region: 'United Arab Emirates', query: 'Dubai, UAE' },
  { name: 'Sydney', region: 'Australia', query: 'Sydney, Australia' },
];

export default function SafeGoogleMaps({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [active, setActive] = useState(0);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(LOCATIONS[active].query)}&output=embed`;

  return (
    <motion.div className="flex-1 min-h-0 flex flex-col px-4 py-5 sm:px-6 sm:py-7 overflow-y-auto lg:overflow-hidden no-scrollbar" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-6">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Maps / Google Maps</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Google Maps</h2>
        <p className="text-[12.5px] mt-1" style={{ color: sec }}>An embedded Google map — pick a location to recentre the view.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="lg:flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-5">
        {/* location list */}
        <div className="rounded-3xl p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar" style={glassStyle(isDark)}>
          <p className="text-[10px] font-black uppercase tracking-wider px-2 pt-1 pb-2" style={{ color: mut }}>Saved locations</p>
          {LOCATIONS.map((loc, i) => {
            const on = i === active;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => setActive(i)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors"
                style={{
                  background: on ? `${ACCENT}14` : 'transparent',
                  border: `1.5px solid ${on ? ACCENT : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!on) e.currentTarget.style.background = bg; }}
                onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: on ? ACCENT : bg, color: on ? '#fff' : mut, border: `1px solid ${on ? ACCENT : border}` }}>
                  <MapPin size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold truncate" style={{ color: on ? ACCENT : pri }}>{loc.name}</span>
                  <span className="block text-[11px] truncate" style={{ color: mut }}>{loc.region}</span>
                </span>
              </button>
            );
          })}

          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(LOCATIONS[active].query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors"
            style={{ background: 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
            onMouseEnter={e => (e.currentTarget.style.background = `${ACCENT}14`)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Navigation size={15} /> Open in Google Maps
          </a>
        </div>

        {/* map */}
        <div className="rounded-3xl overflow-hidden relative" style={{ ...glassStyle(isDark), minHeight: 420 }}>
          <iframe
            key={src}
            title={`Google Map — ${LOCATIONS[active].name}`}
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 w-full h-full"
            style={{ border: 0, filter: isDark ? 'invert(0.92) hue-rotate(180deg) brightness(0.95) contrast(0.9)' : 'none' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
