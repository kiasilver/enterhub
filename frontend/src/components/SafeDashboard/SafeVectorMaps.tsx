'use client';

import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { MapPin } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import 'jsvectormap/dist/jsvectormap.css';

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

const MARKERS: { name: string; region: string; coords: [number, number] }[] = [
  { name: 'New York', region: 'United States', coords: [40.71, -74.0] },
  { name: 'London', region: 'United Kingdom', coords: [51.5, -0.12] },
  { name: 'Tokyo', region: 'Japan', coords: [35.68, 139.69] },
  { name: 'Dubai', region: 'UAE', coords: [25.2, 55.27] },
  { name: 'São Paulo', region: 'Brazil', coords: [-23.55, -46.63] },
  { name: 'Sydney', region: 'Australia', coords: [-33.86, 151.2] },
];

export default function SafeVectorMaps({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    let map: { destroy: () => void; updateSize: () => void } | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    (async () => {
      const { default: jsVectorMap } = await import('jsvectormap');
      // The map-data file registers itself on a global `jsVectorMap`, so expose it first.
      (window as unknown as { jsVectorMap: unknown }).jsVectorMap = jsVectorMap;
      await import('jsvectormap/dist/maps/world.js');
      if (cancelled || !elRef.current) return;

      // eslint-disable-next-line new-cap
      map = new jsVectorMap({
        selector: elRef.current,
        map: 'world',
        backgroundColor: 'transparent',
        zoomButtons: true,
        zoomOnScroll: false,
        regionStyle: {
          initial: { fill: isDark ? '#26262e' : '#dfe1ea', stroke: isDark ? '#0c0c10' : '#ffffff', strokeWidth: 0.5 },
          hover: { fill: ACCENT, fillOpacity: 0.85 },
        },
        markers: MARKERS.map(m => ({ name: m.name, coords: m.coords })),
        markerStyle: {
          initial: { fill: ACCENT, stroke: '#ffffff', strokeWidth: 1.5, r: 5 },
          hover: { fill: ACCENT, fillOpacity: 0.85, r: 7 },
        },
        markerLabelStyle: {
          initial: { fontFamily: 'inherit', fontSize: 11, fill: pri },
        },
        labels: { markers: { render: (marker: { name: string }) => marker.name } },
      }) as unknown as { destroy: () => void; updateSize: () => void };

      // keep the SVG sized to its (flex) container
      ro = new ResizeObserver(() => map?.updateSize());
      ro.observe(el);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
      try { map?.destroy(); } catch { /* ignore */ }
      if (el) el.innerHTML = '';
    };
  }, [isDark, pri, ACCENT]);

  return (
    <motion.div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden lg:overflow-visible no-scrollbar px-4 py-5 sm:px-6 sm:py-7" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-6">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Maps / Vector Maps</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Vector Maps</h2>
        <p className="text-[12.5px] mt-1" style={{ color: sec }}>A lightweight interactive SVG world map with location markers.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-5 lg:flex-1 lg:min-h-0 lg:grid-cols-[1fr_260px]">
        {/* map */}
        <div className="rounded-3xl p-3 relative overflow-hidden" style={{ ...glassStyle(isDark), minHeight: 420 }}>
          <div ref={elRef} className="w-full h-full" style={{ minHeight: 400 }} />
        </div>

        {/* legend */}
        <div className="rounded-3xl p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar" style={glassStyle(isDark)}>
          <p className="text-[10px] font-black uppercase tracking-wider px-2 pt-1 pb-2" style={{ color: mut }}>Active markers</p>
          {MARKERS.map(m => (
            <div key={m.name} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: bg, border: `1px solid ${border}` }}>
              <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                <MapPin size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold truncate" style={{ color: pri }}>{m.name}</span>
                <span className="block text-[11px] truncate" style={{ color: mut }}>{m.region}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
