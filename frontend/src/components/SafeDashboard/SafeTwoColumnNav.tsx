'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NAV, type NavItem, type NavChild, type NavEntry } from './SafeSidebar';
import { textPrimary, textSecondary, textMuted, surfaceHover, borderSubtle, chromeBg } from './theme';

interface Props {
  isDark: boolean;
  activePage: string;
  setActivePage: (id: string) => void;
  nav?: NavEntry[];
}

/** True if `activePage` is this node or any descendant. */
function descendantHasActive(children: NavChild[] | undefined, activePage: string): boolean {
  if (!children) return false;
  return children.some(c => c.id === activePage || descendantHasActive(c.children, activePage));
}

/** A child row (with collapsible grandchildren) in the submenu column. */
function TCChild({ child, isDark, activePage, setActivePage }: { child: NavChild; isDark: boolean; activePage: string; setActivePage: (id: string) => void }) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);
  const hasSub = !!child.children?.length;
  const [open, setOpen] = useState<boolean>(() => activePage === child.id || descendantHasActive(child.children, activePage));

  if (hasSub) {
    return (
      <div className="mb-0.5">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center w-full px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors duration-150"
          style={{ color: sec }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = pri; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = sec; }}
        >
          <span className="flex-1 truncate">{child.label}</span>
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }} className="opacity-50 inline-flex">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </motion.span>
        </button>
        {open && (
          <div className="ml-3 pl-3 mt-0.5" style={{ borderLeft: `1px solid ${border}` }}>
            {child.children!.map(g => <TCChild key={g.id} child={g} isDark={isDark} activePage={activePage} setActivePage={setActivePage} />)}
          </div>
        )}
      </div>
    );
  }

  const active = activePage === child.id;
  return (
    <button
      onClick={() => setActivePage(child.id)}
      className="flex items-center w-full px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors duration-150 mb-0.5"
      style={{ background: active ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent', color: active ? pri : sec }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); (e.currentTarget as HTMLElement).style.color = pri; } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = sec; } }}
    >
      <span className="truncate">{child.label}</span>
    </button>
  );
}

/** Two-column layout — a slim icon rail picks a category; the panel lists its pages. */
export default function SafeTwoColumnNav({ isDark, activePage, setActivePage, nav }: Props) {
  const items = (nav ?? NAV).filter((e): e is NavItem => !('isSection' in e && e.isSection));

  const resolveCat = () => items.find(it => it.id === activePage || descendantHasActive(it.children, activePage))?.id ?? items[0]?.id;
  const [cat, setCat] = useState<string | undefined>(resolveCat);

  // Follow the active page into its owning category.
  useEffect(() => { setCat(resolveCat()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activePage]);

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const railBg = isDark ? chromeBg(isDark) : '#e3e3e8';
  const panelBg = isDark ? chromeBg(isDark) : '#eef0f3';

  const activeItem = items.find(it => it.id === cat);

  return (
    <div className="flex-shrink-0 h-full flex" style={{ order: 0 }}>
      {/* Icon rail */}
      <div
        className="flex flex-col items-center h-full py-3 gap-1 overflow-y-auto no-scrollbar"
        style={{ width: 68, background: railBg, borderRight: `1px solid ${border}` }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm mb-2 flex-shrink-0"
          style={{ background: isDark ? 'linear-gradient(135deg,#fff,#aaa)' : 'linear-gradient(135deg,#0a0a0a,#555)', color: isDark ? '#000' : '#fff' }}
        >S</div>
        {items.map(it => {
          const isActive = it.id === cat;
          const hasChildren = !!it.children?.length;
          return (
            <button
              key={it.id}
              title={it.label}
              onClick={() => { setCat(it.id); if (!hasChildren) setActivePage(it.id); }}
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-150"
              style={{
                background: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
                color: isActive ? pri : sec,
                border: `1px solid ${isActive ? border : 'transparent'}`,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {it.icon}
            </button>
          );
        })}
      </div>

      {/* Submenu panel */}
      <div className="h-full flex flex-col" style={{ width: 226, background: panelBg, borderRight: `1px solid ${border}` }}>
        <div className="px-5 flex items-center flex-shrink-0" style={{ height: 70, borderBottom: `1px solid ${border}` }}>
          <span className="text-base font-black tracking-tight truncate" style={{ color: pri }}>{activeItem?.label ?? ''}</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {activeItem?.children?.length ? (
            activeItem.children.map(child => (
              <TCChild key={child.id} child={child} isDark={isDark} activePage={activePage} setActivePage={setActivePage} />
            ))
          ) : (
            <p className="px-3 py-2 text-[13px]" style={{ color: mut }}>No sub-pages</p>
          )}
        </nav>
      </div>
    </div>
  );
}
