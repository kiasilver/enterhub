'use client';

import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'motion/react';
import { MapPin } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import 'leaflet/dist/leaflet.css';

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

const PLACES: { name: string; region: string; coords: [number, number] }[] = [
  { name: 'New York', region: 'United States', coords: [40.7128, -74.006] },
  { name: 'London', region: 'United Kingdom', coords: [51.5072, -0.1276] },
  { name: 'Tokyo', region: 'Japan', coords: [35.6762, 139.6503] },
  { name: 'Dubai', region: 'UAE', coords: [25.2048, 55.2708] },
  { name: 'São Paulo', region: 'Brazil', coords: [-23.5505, -46.6333] },
  { name: 'Sydney', region: 'Australia', coords: [-33.8688, 151.2093] },
];

export default function SafeLeafletMaps({ isDark }: Props) {
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

    // leaflet touches `window` at import time, so load it lazily on the client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;
    let ro: ResizeObserver | null = null;
    let sizeTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = await import('leaflet');
      const L = mod.default ?? mod;
      if (cancelled || !elRef.current) return;

      map = L.map(elRef.current, { center: [25, 10], zoom: 2, scrollWheelZoom: true, worldCopyJump: true });

      const tiles = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      L.tileLayer(tiles, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      PLACES.forEach(p => {
        L.circleMarker(p.coords, {
          radius: 7,
          color: '#ffffff',
          weight: 2,
          fillColor: ACCENT,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindPopup(`<strong>${p.name}</strong><br/>${p.region}`);
      });

      // ensure correct sizing once the flex layout has settled
      sizeTimer = setTimeout(() => { if (!cancelled) map?.invalidateSize(); }, 60);
      ro = new ResizeObserver(() => map?.invalidateSize());
      ro.observe(el);
    })();

    return () => {
      cancelled = true;
      if (sizeTimer) clearTimeout(sizeTimer);
      ro?.disconnect();
      try { map?.remove(); } catch { /* ignore */ }
      map = null;
    };
  }, [isDark, primaryColor]);

  return (
    <motion.div className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-visible no-scrollbar px-4 sm:px-6 py-5 sm:py-7" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-6">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Maps / Leaflet Maps</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Leaflet Maps</h2>
        <p className="text-[12.5px] mt-1" style={{ color: sec }}>An interactive Leaflet map with themed tiles — drag, zoom and click a marker.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 lg:flex-1 lg:min-h-0">
        {/* map */}
        <div className="rounded-3xl overflow-hidden relative" style={{ ...glassStyle(isDark), minHeight: 420 }}>
          <div ref={elRef} className="absolute inset-0 w-full h-full" style={{ background: 'transparent', zIndex: 0 }} />
        </div>

        {/* legend */}
        <div className="rounded-3xl p-4 flex flex-col gap-2 overflow-y-auto no-scrollbar" style={glassStyle(isDark)}>
          <p className="text-[10px] font-black uppercase tracking-wider px-2 pt-1 pb-2" style={{ color: mut }}>Markers</p>
          {PLACES.map(p => (
            <div key={p.name} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: bg, border: `1px solid ${border}` }}>
              <span className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0" style={{ background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                <MapPin size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold truncate" style={{ color: pri }}>{p.name}</span>
                <span className="block text-[11px] truncate" style={{ color: mut }}>{p.region}</span>
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
