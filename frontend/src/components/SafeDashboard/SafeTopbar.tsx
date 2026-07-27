'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import { glassTopbar, glassDropdown, textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, searchFieldBg } from './theme';
import AnimatedIcon from '@/components/AnimatedIcon/AnimatedIcon';
import { NAV, type NavItem, type NavChild, type NavEntry } from './SafeSidebar';

interface SafeTopbarProps {
  isDark: boolean;
  onMenuToggle: () => void;
  sidebarSide?: 'left' | 'right';
  setActivePage?: (id: string) => void;
}

// ─── Dropdown wrapper ────────────────────────────────────────────────────────
function Dropdown({ trigger, children, align = 'right', width = 320 }: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(p => !p)} className="cursor-pointer">{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 mt-2"
            style={{
              [align === 'right' ? 'right' : 'left']: 0,
              width: `min(${width}px, 90vw)`,
              ...glassDropdown(isDark),
            }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Icon button ─────────────────────────────────────────────────────────────
function IconBtn({ children, badge, label, isDark }: { children: React.ReactNode; badge?: string | number; label: string; isDark: boolean }) {
  return (
    <button
      aria-label={label}
      className="relative p-2 rounded-xl transition-all duration-150 cursor-pointer flex-shrink-0"
      style={{ color: textSecondary(isDark), background: 'transparent' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
        (e.currentTarget as HTMLElement).style.color = textPrimary(isDark);
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = textSecondary(isDark);
      }}
    >
      {children}
      {badge !== undefined && (
        <span
          className="absolute top-1 right-1 min-w-[15px] h-[15px] rounded-full text-white flex items-center justify-center font-bold px-0.5"
          style={{ background: '#ef4444', fontSize: '8px' }}
        >{badge}</span>
      )}
    </button>
  );
}

// ─── Notification data ───────────────────────────────────────────────────────
const NOTIFS = [
  { id: 'n1', title: 'Fire suppression offline', sub: '30 min ago', color: '#ef4444', icon: '/bell.svg' },
  { id: 'n2', title: 'PPE compliance report ready', sub: '2 hr ago', color: '#f59e0b', icon: '/check-circle.svg' },
  { id: 'n3', title: 'New safety drill scheduled', sub: '4 hr ago', color: '#10b981', icon: '/check-square.svg' },
];

// ─── Cart data ───────────────────────────────────────────────────────────────
const CART_ITEMS = [
  { id: 'c1', name: 'Safety Helmet (x5)', price: '$75' },
  { id: 'c2', name: 'Fire Extinguisher (x2)', price: '$120' },
];

// ─── Search index builder ─────────────────────────────────────────────────────
interface SearchEntry { id: string; label: string; breadcrumb: string; }

function buildSearchIndex(): SearchEntry[] {
  const results: SearchEntry[] = [];
  function walkChildren(items: NavChild[], parents: string[]) {
    for (const child of items) {
      if (child.children?.length) {
        walkChildren(child.children, [...parents, child.label]);
      } else {
        results.push({ id: child.id, label: child.label, breadcrumb: parents.join(' / ') });
      }
    }
  }
  for (const entry of NAV) {
    if ('isSection' in entry && entry.isSection) continue;
    const item = entry as NavItem;
    if (item.children?.length) {
      walkChildren(item.children, [item.label]);
    } else {
      results.push({ id: item.id, label: item.label, breadcrumb: '' });
    }
  }
  return results;
}

const SEARCH_INDEX = buildSearchIndex();

// ─── Smart Search Bar ────────────────────────────────────────────────────────
function SearchBar({ isDark, onNavigate }: { isDark: boolean; onNavigate: (id: string) => void }) {
  const [val, setVal] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [active, setActive] = useState(-1);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!val.trim()) { setResults([]); setActive(-1); return; }
    const q = val.toLowerCase();
    setResults(SEARCH_INDEX.filter(e => e.label.toLowerCase().includes(q) || e.breadcrumb.toLowerCase().includes(q)).slice(0, 8));
    setActive(-1);
  }, [val]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false); setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (id: string) => { onNavigate(id); setVal(''); setResults([]); setFocused(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setVal(''); setResults([]); inputRef.current?.blur(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && active >= 0 && results[active]) go(results[active].id);
  };

  const highlight = (text: string) => {
    if (!val.trim()) return text;
    const idx = text.toLowerCase().indexOf(val.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark style={{ background: 'rgba(99,102,241,0.3)', borderRadius: 2, color: 'inherit', padding: '0 1px' }}>{text.slice(idx, idx + val.length)}</mark>{text.slice(idx + val.length)}</>;
  };

  const showDrop = focused && results.length > 0;

  return (
    <div ref={wrapRef} className="relative hidden sm:block">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200"
        style={{
          background: searchFieldBg(isDark),
          border: `1px solid ${focused ? 'rgba(var(--primary-rgb),0.5)' : borderSubtle(isDark)}`,
          minWidth: focused ? 260 : 180,
          maxWidth: 300,
          boxShadow: focused ? '0 0 0 3px rgba(var(--primary-rgb),0.12)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.45, flexShrink: 0, color: textSecondary(isDark) }}>
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search pages..."
          value={val}
          onChange={e => setVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKey}
          className="bg-transparent outline-none border-none text-sm w-full min-w-0"
          style={{ color: textPrimary(isDark) }}
        />
        {val && (
          <button onClick={() => { setVal(''); setResults([]); inputRef.current?.focus(); }} style={{ color: textMuted(isDark), flexShrink: 0 }}>
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

      </div>

      <AnimatePresence>
        {showDrop && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 py-2 overflow-hidden"
            style={{ width: 'max(100%, 280px)', ...glassDropdown(isDark) }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider px-3 pb-1.5" style={{ color: textMuted(isDark) }}>Results</p>
            {results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => go(r.id)}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors duration-100"
                style={{ background: active === i ? surfaceHover(isDark) : 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active === i ? surfaceHover(isDark) : 'transparent'; }}
              >
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: textMuted(isDark), flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: textPrimary(isDark) }}>{highlight(r.label)}</p>
                  {r.breadcrumb && <p className="text-[11px] truncate" style={{ color: textMuted(isDark) }}>{r.breadcrumb}</p>}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SafeTopbar({ isDark, onMenuToggle, sidebarSide = 'left', setActivePage }: SafeTopbarProps) {
  const topbarStyle = glassTopbar(isDark);
  const sidebarOnRight = sidebarSide === 'right';
  const handleNavigate = (id: string) => { if (setActivePage) setActivePage(id); };

  // Sidebar-collapse control. In right-sidebar mode it relocates to the inner
  // (right) end of the bar so it sits next to the sidebar it toggles.
  const hamburger = (
    <button
      onClick={onMenuToggle}
      aria-label="Toggle sidebar"
      className="p-2 rounded-xl transition-all duration-150 cursor-pointer flex-shrink-0"
      style={{ color: textSecondary(isDark) }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
        (e.currentTarget as HTMLElement).style.color = textPrimary(isDark);
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = textSecondary(isDark);
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 z-40 gap-2 sm:gap-4 transition-colors duration-500"
      style={{ ...topbarStyle, height: '70px' }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {!sidebarOnRight && hamburger}
        <SearchBar isDark={isDark} onNavigate={handleNavigate} />
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-0.5 sm:gap-1">

        {/* Language — hidden on mobile */}
        <div className="hidden sm:block">
          <Dropdown width={200} trigger={
            <IconBtn label="Language" isDark={isDark}>
              <img src="/globe.svg" alt="" width={17} height={17} style={{ filter: isDark ? 'invert(0.6)' : 'invert(0.35)' }} />
            </IconBtn>
          }>
            <div className="p-2">
              <p className="text-xs font-semibold px-2 pb-2" style={{ color: textMuted(isDark) }}>LANGUAGES</p>
              {[
                { src: 'https://flagcdn.com/w40/us.png', label: 'English' },
              ].map(({ src, label }) => (
                <button
                  key={label}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center gap-2.5"
                  style={{ color: textSecondary(isDark) }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); (e.currentTarget as HTMLElement).style.color = textPrimary(isDark); }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = textSecondary(isDark); }}
                >
                  <img
                    src={src}
                    alt={label}
                    width={20}
                    height={20}
                    style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, width: 20, height: 20 }}
                  />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </Dropdown>
        </div>


        {/* Cart */}
        <Dropdown width={300} trigger={
          <IconBtn label="Cart" badge={5} isDark={isDark}>
            <AnimatedIcon src="/download.json" width={20} height={20} hoverTrigger={true} style={{ filter: isDark ? 'invert(0.6)' : 'invert(0.35)' }} />
          </IconBtn>
        }>
          <div>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
              <span className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>My Cart</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b' }}>2 items</span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {CART_ITEMS.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-2 rounded-lg" style={{ background: surfaceItem(isDark) }}>
                  <div className="flex items-center gap-2">
                    <AnimatedIcon src="/folder.json" width={16} height={16} hoverTrigger={true} style={{ filter: isDark ? 'invert(0.5)' : 'invert(0.3)' }} />
                    <span className="text-xs" style={{ color: textSecondary(isDark) }}>{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: textPrimary(isDark) }}>{item.price}</span>
                </div>
              ))}
            </div>
            <div className="px-4 pb-3 flex justify-between text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
              <span>Total</span><span>$195</span>
            </div>
            <div className="px-3 pb-3">
              <button className="w-full py-2 rounded-xl text-xs font-semibold transition-all duration-150" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', color: textPrimary(isDark) }}>
                Checkout
              </button>
            </div>
          </div>
        </Dropdown>



        {/* Theme + language */}
        <div className="px-1 flex items-center gap-1">
          <LanguageSwitcher size="sm" />
          <ThemeToggle />
        </div>

        {/* Notifications */}
        <Dropdown width={320} trigger={
          <IconBtn label="Notifications" badge={3} isDark={isDark}>
            <AnimatedIcon src="/notificationV2.json" width={20} height={20} hoverTrigger={true} style={{ filter: isDark ? 'invert(0.6)' : 'invert(0.35)' }} />
          </IconBtn>
        }>
          <div>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
              <span className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>Notifications</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>3 new</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {NOTIFS.map(n => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${n.color}14`, border: `1px solid ${n.color}22` }}>
                    <img src={n.icon} alt="" width={13} height={13} style={{ filter: isDark ? 'invert(0.7)' : 'invert(0.3)' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: textPrimary(isDark) }}>{n.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: textMuted(isDark) }}>{n.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-3">
              <button className="w-full py-2 rounded-xl text-xs font-semibold" style={{ background: surfaceItem(isDark), color: textSecondary(isDark) }}>
                View All Notifications
              </button>
            </div>
          </div>
        </Dropdown>

        {/* In right-sidebar mode the collapse control lives here, next to the sidebar */}
        {sidebarOnRight && <div className="pl-1">{hamburger}</div>}

      </div>
    </header>
  );
}
