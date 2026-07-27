'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { NAV, type NavItem, type NavChild, type NavEntry } from './SafeSidebar';
import { glassDropdown, textPrimary, textSecondary, textMuted, surfaceHover, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
  activePage: string;
  setActivePage: (id: string) => void;
  /** Product shells pass workspace nav; demo uses default NAV */
  nav?: NavEntry[];
}

/** True if `activePage` is this node or any descendant. */
function descendantHasActive(children: NavChild[] | undefined, activePage: string): boolean {
  if (!children) return false;
  return children.some(c => c.id === activePage || descendantHasActive(c.children, activePage));
}

/** A child row (and its grandchildren) inside a horizontal dropdown. */
function HMenuChild({ child, isDark, activePage, go }: { child: NavChild; isDark: boolean; activePage: string; go: (id: string) => void }) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const hasSub = !!child.children?.length;

  if (hasSub) {
    return (
      <div className="mt-1.5 first:mt-0">
        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>{child.label}</p>
        {child.children!.map(g => <HMenuChild key={g.id} child={g} isDark={isDark} activePage={activePage} go={go} />)}
      </div>
    );
  }

  const active = activePage === child.id;
  return (
    <button
      onClick={() => go(child.id)}
      className="flex items-center w-full px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors duration-150"
      style={{ background: active ? surfaceHover(isDark) : 'transparent', color: active ? pri : sec }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {child.label}
    </button>
  );
}

/** Horizontal top-menu layout — top-level items in a bar; dropdowns portal to <body>. */
export default function SafeHorizontalNav({ isDark, activePage, setActivePage, nav }: Props) {
  // The open dropdown plus the viewport coords to anchor it at (fixed-positioned).
  const [open, setOpen] = useState<{ id: string; left: number; top: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Convert vertical wheel scroll → horizontal scroll on desktop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // already horizontal scroll
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const items = (nav ?? NAV).filter((e): e is NavItem => !('isSection' in e && e.isSection));

  useEffect(() => setMounted(true), []);

  // Close when clicking outside the bar and the (portaled) dropdown.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (barRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // The dropdown is fixed-positioned, so its anchor goes stale on scroll/resize — close it.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(null);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => { window.removeEventListener('resize', close); window.removeEventListener('scroll', close, true); };
  }, [open]);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);

  const go = (id: string) => { setActivePage(id); setOpen(null); };

  const onItemClick = (e: ReactMouseEvent<HTMLButtonElement>, item: NavItem) => {
    if (!item.children?.length) { go(item.id); return; }
    if (open?.id === item.id) { setOpen(null); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 230));
    setOpen({ id: item.id, left, top: r.bottom + 4 });
  };

  const openItem = open ? items.find(i => i.id === open.id) : undefined;

  return (
    <div
      ref={barRef}
      className="w-full flex-shrink-0 relative z-20"
      style={{
        width: '100%',
        maxWidth: '100vw',
        background: isDark ? 'var(--background)' : 'rgba(255,255,255,0.6)',
        borderBottom: `1px solid ${border}`,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
    >
      <div
        ref={scrollRef}
        className="w-full flex items-center gap-1 px-4 overflow-x-auto no-scrollbar"
        style={{
          height: 48,
          width: '100%',
          maxWidth: '100vw',
          whiteSpace: 'nowrap',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {items.map(item => {
          const hasChildren = !!item.children?.length;
          const active = activePage === item.id || descendantHasActive(item.children, activePage);
          const isOpen = open?.id === item.id;
          return (
            <button
              key={item.id}
              onClick={e => onItemClick(e, item)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors duration-150 flex-shrink-0"
              style={{ background: active || isOpen ? surfaceHover(isDark) : 'transparent', color: active ? pri : sec }}
              onMouseEnter={e => { if (!active && !isOpen) (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
              onMouseLeave={e => { if (!active && !isOpen) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span className="inline-flex flex-shrink-0 opacity-80">{item.icon}</span>
              <span>{item.label}</span>
              {hasChildren && (
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="opacity-50 inline-flex">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {mounted && open && openItem && createPortal(
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="p-1.5 rounded-xl max-h-[70vh] overflow-y-auto no-scrollbar"
          style={{ position: 'fixed', left: open.left, top: open.top, minWidth: 214, zIndex: 9999, ...glassDropdown(isDark) }}
        >
          {openItem.children!.map(child => (
            <HMenuChild key={child.id} child={child} isDark={isDark} activePage={activePage} go={go} />
          ))}
        </motion.div>,
        document.body,
      )}
    </div>
  );
}
