'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { Search } from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};
const gridWrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.015 } } };
const cellRise: Variants = { hidden: { opacity: 0, y: 12, scale: 0.92 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 26 } } };

const ACCENT = 'var(--primary)';

/* every Lottie icon in /public/icon, grouped into categories */
const CATEGORIES: { name: string; tag: string; files: string[] }[] = [
  { name: 'Alerts', tag: 'ALERT', files: ['alertCircle.json', 'alertOctagon.json', 'alertTriangle.json', 'error.json'] },
  { name: 'Notifications', tag: 'NOTIFICATION', files: ['notification.json', 'notificationV2.json', 'notification-V3.json', 'notification-V4.json'] },
  {
    name: 'Navigation', tag: 'NAVIGATION',
    files: ['menu.json', 'menuV2.json', 'menuV3.json', 'menuV4.json', 'arrowDown.json', 'arrowUp.json', 'arrowDownCircle.json', 'arrowUpCircle.json', 'arrowLeftCircle.json', 'arrowRightCircle.json', 'chevron-left.json', 'chevron-right.json', 'scrollDown.json', 'home.json'],
  },
  {
    name: 'Action', tag: 'ACTION',
    files: ['settings.json', 'settingsV2.json', 'lock.json', 'maximizeMinimize.json', 'maximizeMinimizeV2.json', 'plusToX.json', 'searchToX.json', 'download.json', 'refresh.json', 'copy.json', 'share.json', 'filter.json', 'trash.json', 'trashV2.json', 'archive.json', 'zoom-in.json', 'zoom-out.json', 'visibility.json', 'visibilityV2.json', 'visibility-V3.json'],
  },
  {
    name: 'Content', tag: 'CONTENT',
    files: ['bookmark.json', 'calendar.json', 'edit.json', 'folder.json', 'heart.json', 'star.json', 'thumbUp.json', 'help.json', 'info.json', 'Explore.json', 'mail.json', 'activity.json'],
  },
  { name: 'Form', tag: 'FORM', files: ['checkBox.json', 'checkmark.json', 'radioButton.json', 'toggle.json', 'userPlus.json', 'userMinus.json', 'userX.json'] },
  { name: 'Media', tag: 'MEDIA', files: ['video.json', 'videoV2.json', 'volume.json', 'microphone.json', 'microphoneV2.json', 'playPause.json', 'playPauseCircle.json', 'airplay.json', 'skipBack.json'] },
  { name: 'Loading', tag: 'LOADING', files: ['loading.json', 'loadingV2.json', 'loadingV3.json', 'loadingV4.json'] },
  { name: 'Social media', tag: 'SOCIAL', files: ['behance.json', 'codepen.json', 'dribbble.json', 'facebook.json', 'github.json', 'instagram.json', 'linkedin.json', 'twitter.json', 'youtube.json', 'youtube-2.json', 'pocket.json'] },
  { name: 'Other', tag: 'OTHER', files: ['infinity.json'] },
];

/* icons that play continuously (LOOP); everything else is play-once on click (CLICK ME) */
const LOOP = new Set([
  'loading.json', 'loadingV2.json', 'loadingV3.json', 'loadingV4.json',
  'infinity.json', 'scrollDown.json', 'activity.json',
  'alertCircle.json', 'alertOctagon.json', 'alertTriangle.json', 'error.json',
]);

function prettify(file: string) {
  return file
    .replace(/\.json$/, '')
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/* in-module cache so re-renders / re-mounts don't re-fetch */
const cache = new Map<string, unknown>();

/* In dark mode, invert only the GREYSCALE colours (so black line-art turns white)
   while leaving saturated accents (e.g. the red notification dot) untouched. */
function recolorStop(arr: number[], isDark: boolean): number[] {
  if (!isDark) return arr;
  const [r, g, b] = arr;
  const a = arr.length > 3 ? arr[3] : 1;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (sat < 0.12) return [1 - r, 1 - g, 1 - b, a];
  return arr;
}
function walkColors(node: any, isDark: boolean) {
  if (Array.isArray(node)) { for (const n of node) walkColors(n, isDark); return; }
  if (node && typeof node === 'object') {
    if (node.c && Array.isArray(node.c.k) && typeof node.c.k[0] === 'number') node.c.k = recolorStop(node.c.k, isDark);
    for (const key in node) walkColors(node[key], isDark);
  }
}
function buildThemed(raw: any, isDark: boolean): any {
  if (!raw || !isDark) return raw;
  const clone = JSON.parse(JSON.stringify(raw));
  walkColors(clone, isDark);
  return clone;
}

function IconCard({ file, label, loop, isDark }: { file: string; label: string; loop: boolean; isDark: boolean }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const tagBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const ref = useRef<LottieRefCurrentProps>(null);
  const dirRef = useRef<1 | -1>(1); // each click flips play direction (forward → reverse → …)
  const [data, setData] = useState<unknown>(() => cache.get(file) ?? null);

  useEffect(() => {
    if (data) return;
    let alive = true;
    fetch(`/icon/${file}`)
      .then(r => r.json())
      .then(d => { cache.set(file, d); if (alive) setData(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [file, data]);

  const themed = useMemo(() => buildThemed(data, isDark), [data, isDark]);

  const onReady = () => {
    const inst = ref.current;
    if (!inst) return;
    if (!loop) {
      inst.goToAndStop(0, true); // rest on the ORIGINAL icon (frame 0)
      dirRef.current = 1;
    }
  };

  return (
    <motion.div
      variants={cellRise}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.96 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `rgba(var(--primary-rgb), 0.4)`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
      onClick={() => {
        const inst = ref.current;
        if (!inst) return;
        if (loop) { inst.stop(); inst.play(); return; }
        inst.setDirection(dirRef.current);
        inst.play();
        dirRef.current = dirRef.current === 1 ? -1 : 1;
      }}
      className="rounded-2xl flex flex-col items-center justify-between gap-2 p-3 cursor-pointer"
      style={{ ...glassStyle(isDark), minHeight: 116 }}
      title={`${loop ? 'Loops automatically' : 'Click to play (click again to reverse)'} · ${label}`}
    >
      <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: loop ? `rgba(var(--primary-rgb), 0.12)` : tagBg, color: loop ? (isDark ? 'var(--primary-hover)' : 'var(--primary)') : mut, letterSpacing: '0.07em' }}>
        {loop ? 'LOOP' : 'CLICK ME'}
      </span>
      <div className="flex items-center justify-center" style={{ width: 42, height: 42 }}>
        {themed ? (
          <Lottie lottieRef={ref} animationData={themed} loop={loop} autoplay={loop} onDOMLoaded={onReady} style={{ width: '100%', height: '100%' }} />
        ) : (
          <span className="w-5 h-5 rounded-full animate-pulse" style={{ background: mut, opacity: 0.4 }} />
        )}
      </div>
      <span className="text-[10px] font-medium truncate max-w-full px-1 text-center" style={{ color: pri }}>{label}</span>
    </motion.div>
  );
}

export default function SafeIconAnimation({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const sections = useMemo(
    () =>
      CATEGORIES.map(cat => ({
        name: cat.name,
        tag: cat.tag,
        items: cat.files.map(f => ({ file: f, label: prettify(f), loop: LOOP.has(f) })).filter(it => it.label.toLowerCase().includes(q)),
      })).filter(s => s.items.length > 0),
    [q],
  );
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6 max-w-5xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Icons / Remix Icons / Icon Animation</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Icon Animation</h2>
        <p className="text-[12.5px] mt-1" style={{ color: sec }}>
          Animated Lottie icons grouped by category — <span style={{ color: pri, fontWeight: 600 }}>click</span> any icon to play it (click again to reverse).
        </p>
      </motion.div>

      <div className="max-w-5xl">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="relative mb-6 max-w-xs">
          <span className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Search size={16} /></span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search animations…"
            className="w-full text-[13px] py-2.5 rounded-xl outline-none transition-all duration-200 focus:border-primary/60"
            style={{ background: bg, border: `1px solid ${border}`, color: pri, paddingLeft: 38 }}
          />
        </motion.div>

        {total === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed" style={{ borderColor: border }}>
            <p className="text-sm" style={{ color: mut }}>No animations match your search.</p>
          </div>
        ) : (
          sections.map(s => (
            <motion.section key={s.name} variants={fadeUp} className="mb-9 last:mb-0">
              <div className="flex items-baseline gap-2.5 mb-3.5">
                <h3 className="text-[16px] font-bold" style={{ color: pri }}>{s.name}</h3>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: bg, border: `1px solid ${border}`, color: mut }}>{s.items.length}</span>
              </div>
              <motion.div
                variants={gridWrap}
                initial="hidden"
                animate="show"
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
              >
                {s.items.map(it => <IconCard key={it.file} file={it.file} label={it.label} loop={it.loop} isDark={isDark} />)}
              </motion.div>
            </motion.section>
          ))
        )}
      </div>
    </motion.div>
  );
}
