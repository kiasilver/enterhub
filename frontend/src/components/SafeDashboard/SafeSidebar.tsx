'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { glassStyle, textPrimary, textSecondary, textMuted, surfaceHover, surfaceItem, borderSubtle, chromeBg } from './theme';
import { User, Settings, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { enterhubLogoSrc } from '@/components/brand/EnterhubBrand';
import Image from 'next/image';

// Sentinel for the brand/primary badge colour; resolved to the live primary hex at render
// time (badge styles concatenate a hex-alpha suffix, which only works on a real hex value).
const PRIMARY_BADGE = '__PRIMARY__';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface NavChild {
  id: string;
  label: string;
  badge?: { text: string; color: string };
  children?: NavChild[];
}
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
  badge?: { text: string; color: string };
  isSection?: false;
}
interface NavSection {
  isSection: true;
  label: string;
}
export type NavEntry = NavItem | NavSection;

// ─── Icon helpers ───────────────────────────────────────────────────────────
const Icon = ({ d, size = 17 }: { d: string | string[]; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ─── Nav structure (mirrors Velzon) ────────────────────────────────────────
export const NAV: NavEntry[] = [
  { isSection: true, label: 'MENU' },
  {
    id: 'dashboards', label: 'Dashboards', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
    children: [
      { id: 'dashboard', label: 'Project Overview', badge: { text: 'Main', color: PRIMARY_BADGE } },
      { id: 'dash-analytics', label: 'Analytics' },
      { id: 'dash-crm', label: 'CRM' },
      { id: 'dash-ecommerce', label: 'Ecommerce' },
      { id: 'dash-crypto', label: 'Crypto' },
      { id: 'dash-projects', label: 'Projects' },
      { id: 'dash-nft', label: 'NFT' },
      { id: 'dash-job', label: 'Job' },
      { id: 'dash-blog', label: 'Blog', badge: { text: 'New', color: '#10b981' } },
    ],
  },
  {
    id: 'apps', label: 'Apps', icon: <Icon d={['M4 6h16M4 12h16M4 18h16']} />,
    children: [
      { id: 'app-calendar', label: 'Calendar' },
      { id: 'app-email', label: 'Email' },
      { id: 'app-chat', label: 'Chat' },
      { id: 'app-gallery', label: 'Gallery' },
      {
        id: 'crm',
        label: 'CRM',
        children: [
          { id: 'crm-contacts', label: 'Contacts' },
          { id: 'crm-companies', label: 'Companies' },
          { id: 'crm-deals', label: 'Deals' },
          { id: 'crm-leads', label: 'Leads' },
        ],
      },
      {
        id: 'projects',
        label: 'Projects',
        children: [
          { id: 'projects-list', label: 'List' },
          { id: 'projects-overview', label: 'Overview' },
          { id: 'projects-create', label: 'Create Project' },
        ],
      },
      {
        id: 'ecommerce',
        label: 'Ecommerce',
        children: [
          { id: 'ecommerce-products', label: 'Products' },
          { id: 'ecommerce-product-details', label: 'Product Details' },
          { id: 'ecommerce-create-product', label: 'Create Product' },
          { id: 'ecommerce-orders', label: 'Orders' },
          { id: 'ecommerce-order-details', label: 'Order Details' },
          { id: 'ecommerce-customers', label: 'Customers' },
          { id: 'ecommerce-cart', label: 'Shopping Cart' },
          { id: 'ecommerce-checkout', label: 'Checkout' },
          { id: 'ecommerce-sellers', label: 'Sellers' },
          { id: 'ecommerce-seller-details', label: 'Seller Details' },
        ],
      },
      { id: 'app-tasks', label: 'Tasks' },
      { id: 'app-invoices', label: 'Invoices' },
      { id: 'app-support', label: 'Support Tickets' },
    ],
  },
  {
    id: 'layouts', label: 'Layouts', icon: <Icon d="M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7m0-18H5a2 2 0 00-2 2v14a2 2 0 002 2h7m0-18v18" />,
    badge: { text: 'Hot', color: '#ef4444' },
  },
  { isSection: true, label: 'PAGES' },
  {
    id: 'authentication', label: 'Authentication', icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    children: [
      { id: 'auth-signin', label: 'Sign In' },
      { id: 'auth-signup', label: 'Sign Up' },
      { id: 'auth-reset', label: 'Password Reset' },
      { id: 'auth-create', label: 'Password Create' },
      { id: 'auth-lock', label: 'Lock Screen' },
      { id: 'auth-logout', label: 'Logout' },
      { id: 'auth-success', label: 'Success Message' },
      { id: 'auth-2step', label: 'Two Step Verify' },
      { id: 'auth-errors', label: 'Error Pages' },
    ],
  },
  {
    id: 'pages', label: 'Pages', icon: <Icon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
    children: [
      { id: 'page-profile', label: 'Profile' },
      { id: 'page-settings', label: 'Settings' },
      { id: 'page-team', label: 'Team' },
      { id: 'page-timeline', label: 'Timeline' },
      { id: 'page-faqs', label: 'FAQs' },
      { id: 'page-pricing', label: 'Pricing' },
      { id: 'page-maintenance', label: 'Maintenance' },
      { id: 'page-comingsoon', label: 'Coming Soon' },
      { id: 'page-blogs', label: 'Blogs' },
    ],
  },
  { isSection: true, label: 'COMPONENTS' },
  {
    id: 'base-ui', label: 'Base UI', icon: <Icon d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />,
    children: [
      { id: 'ui-alerts', label: 'Alerts' },
      { id: 'ui-badges', label: 'Badges' },
      { id: 'ui-buttons', label: 'Buttons' },
      { id: 'ui-cards', label: 'Cards' },
      { id: 'ui-carousel', label: 'Carousel' },
      { id: 'ui-tables', label: 'Tables' },
    ],
  },
  {
    id: 'advance-ui', label: 'Advance UI', icon: <Icon d={['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5']} />,
    children: [
      { id: 'adv-sweetalerts', label: 'Sweet Alerts' },
      { id: 'adv-nestable', label: 'Nestable List' },
      { id: 'adv-tour', label: 'Tour' },
      { id: 'adv-swiper', label: 'Swiper Slider' },
      { id: 'adv-ratings', label: 'Ratings' },
      { id: 'adv-scrollspy', label: 'ScrollSpy' },
    ],
  },
  {
    id: 'forms', label: 'Forms', icon: <Icon d={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8']} />,
    children: [
      { id: 'forms-basic-elements', label: 'Basic Elements' },
      { id: 'forms-select', label: 'Form Select' },
      { id: 'forms-checkboxes-radios', label: 'Checkboxes & Radios' },
      { id: 'forms-input-masks', label: 'Input Masks' },
      { id: 'forms-advanced', label: 'Date and Time' },
      { id: 'forms-range-slider', label: 'Range Slider' },
      { id: 'forms-wizard', label: 'Wizard' },
      { id: 'forms-layouts', label: 'Form Layouts' },
      { id: 'forms-file-uploads', label: 'File Uploads' },
    ],
  },
  {
    id: 'charts', label: 'Charts', icon: <Icon d="M18 20V10M12 20V4M6 20v-6" />,
    children: [
      { id: 'chart-apex', label: 'Apex Charts' },
      { id: 'chart-echarts', label: 'ECharts' },
      { id: 'chart-chartjs', label: 'Chartjs' },
      { id: 'chart-recharts', label: 'Recharts' },
    ],
  },
  {
    id: 'icons', label: 'Icons', icon: <Icon d="M5 3l14 9-14 9V3z" />,
    children: [
      {
        id: 'icon-remix', label: 'Remix Icons',
        children: [
          { id: 'icon-remix-fix', label: 'Icon Fix' },
          { id: 'icon-remix-animation', label: 'Icon Animation' },
        ],
      },
      { id: 'icon-boxicons', label: 'Boxicons' },
      { id: 'icon-material', label: 'Material Design' },
    ],
  },
  {
    id: 'maps', label: 'Maps', icon: <Icon d={['M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z', 'M8 2v16M16 6v16']} />,
    children: [
      { id: 'map-google', label: 'Google Maps' },
      { id: 'map-vector', label: 'Vector Maps' },
      { id: 'map-leaflet', label: 'Leaflet Maps' },
    ],
  },
];

// ─── Profile Pill with Dropdown ─────────────────────────────────────────────
function ProfilePill({
  isDark,
  setActivePage,
  side = 'left',
  menuItems: menuItemsProp,
  displayName = 'Ali Mohammadi',
  subtitle,
}: {
  isDark: boolean;
  setActivePage: (id: string) => void;
  side?: 'left' | 'right';
  menuItems?: { id: string; label: string }[];
  displayName?: string;
  subtitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const rtl = side === 'right';
  const { t } = useLang();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconMap: Record<string, typeof User> = {
    'account-profile': User,
    'account-settings': Settings,
    'account-billing': CreditCard,
    'account-help': HelpCircle,
  };

  const menuItems = menuItemsProp
    ? menuItemsProp.map((m) => ({
        Icon: iconMap[m.id] || User,
        label: m.label,
        page: m.id,
      }))
    : [
        { Icon: User, label: t('workspace.profile'), page: 'account-profile' },
        { Icon: Settings, label: t('workspace.settings'), page: 'account-settings' },
        { Icon: CreditCard, label: t('settings.billing'), page: 'account-billing' },
        { Icon: HelpCircle, label: t('workspace.help'), page: 'account-help' },
      ];

  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="px-3 pt-4 pb-2 flex-shrink-0 relative" ref={ref}>
      {/* ── Trigger pill ── */}
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl w-full cursor-pointer transition-all duration-200 text-start`}
        style={{
          background: open ? surfaceHover(isDark) : surfaceItem(isDark),
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark); }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = surfaceItem(isDark); }}
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[11px] font-bold"
          style={{
            border: `2px solid ${borderSubtle(isDark)}`,
            background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            color: textPrimary(isDark),
          }}
        >
          {initials || '?'}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0 text-start">
          <p className="text-xs font-semibold truncate" style={{ color: textPrimary(isDark) }}>{displayName}</p>
          {subtitle ? (
            <p className="text-xs truncate" style={{ color: textSecondary(isDark) }}>{subtitle}</p>
          ) : null}
        </div>

        {/* Animated chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex-shrink-0"
          style={{ color: textMuted(isDark) }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.span>
      </button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute start-3 end-3 z-50 rounded-2xl"
            style={{
              top: 'calc(100% + 4px)',
              background: isDark ? 'color-mix(in srgb, var(--background) 98%, transparent)' : 'rgba(255,255,255,0.97)',
              border: `1px solid ${borderSubtle(isDark)}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDark
                ? '0 16px 48px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)'
                : '0 16px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold"
                style={{
                  border: `2px solid ${borderSubtle(isDark)}`,
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  color: textPrimary(isDark),
                }}
              >
                {initials || '?'}
              </div>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>{displayName}</p>
                {subtitle ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#10b981' }}
                    />
                    <p className="text-xs truncate" style={{ color: textMuted(isDark) }}>{subtitle}</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              {menuItems.map(({ Icon, label, page }) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => { setActivePage(page); setOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer text-start`}
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
                  <Icon size={15} strokeWidth={1.8} className="shrink-0" />
                  {label}
                </button>
              ))}

              {/* Divider */}
              <div style={{ borderTop: `1px solid ${borderSubtle(isDark)}`, margin: '6px 8px' }} />

              {/* Logout */}
              <button
                onClick={() => { setActivePage('auth-logout'); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer text-start`}
                style={{ color: '#ef4444', background: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <LogOut size={15} strokeWidth={1.8} className="shrink-0" />
                {t('workspace.logout')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
interface SafeSidebarProps {
  isDark: boolean;
  activePage: string;
  setActivePage: (id: string) => void;
  isOpen: boolean;
  side?: 'left' | 'right';
  /** Override demo NAV — used by product shells (workspace / SA / guest) */
  nav?: NavEntry[];
  brandTitle?: string;
  brandSubtitle?: string;
  /** Slot under brand (e.g. WorkspaceSwitcher) */
  headerSlot?: React.ReactNode;
  profileMenuItems?: { id: string; label: string }[];
  profileDisplayName?: string;
  profileSubtitle?: string;
}

export default function SafeSidebar({
  isDark,
  activePage,
  setActivePage,
  isOpen,
  side = 'left',
  nav,
  brandTitle,
  brandSubtitle,
  headerSlot,
  profileMenuItems,
  profileDisplayName,
  profileSubtitle,
}: SafeSidebarProps) {
  const { primaryColor } = useTheme();
  const resolveBadgeColor = (c: string) => (c === PRIMARY_BADGE ? primaryColor : c);
  const entries = nav ?? NAV;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    dashboards: true,
    menu: true,
    apps: true,
    workspace: true,
  });

  // Auto-expand only the parents that contain the active page (never force-open siblings)
  useEffect(() => {
    if (activePage.startsWith('crm-')) {
      setExpanded((p) => ({ ...p, apps: true, crm: true }));
      return;
    }
    if (activePage.startsWith('projects-')) {
      setExpanded((p) => ({ ...p, apps: true, projects: true }));
      return;
    }
    if (activePage.startsWith('ecommerce-')) {
      setExpanded((p) => ({ ...p, apps: true, ecommerce: true }));
      return;
    }
    if (activePage.startsWith('app-')) {
      setExpanded((p) => ({ ...p, apps: true }));
      return;
    }
    if (activePage.startsWith('dash-')) {
      setExpanded((p) => ({ ...p, dashboards: true }));
      return;
    }
    if (
      !(
        activePage.startsWith('ws-') ||
        activePage.startsWith('sa-') ||
        activePage.startsWith('guest-') ||
        activePage.startsWith('board-')
      )
    ) {
      return;
    }

    const containsId = (children: NavChild[] | undefined, id: string): boolean =>
      !!children?.some((c) => c.id === id || containsId(c.children, id));

    const toExpand: string[] = [];
    for (const entry of entries) {
      if ('isSection' in entry && entry.isSection) continue;
      const item = entry as NavItem;
      if (!item.children?.length) continue;
      if (item.id === activePage || containsId(item.children, activePage)) {
        toExpand.push(item.id);
        for (const child of item.children) {
          if (
            child.children?.length &&
            (child.id === activePage || containsId(child.children, activePage))
          ) {
            toExpand.push(child.id);
          }
        }
      }
    }

    if (toExpand.length === 0) return;

    const topLevelIds: string[] = [];
    for (const entry of entries) {
      if ('isSection' in entry && entry.isSection) continue;
      const item = entry as NavItem;
      if (item.children?.length) topLevelIds.push(item.id);
    }

    const activeTop = toExpand.find((id) => topLevelIds.includes(id));

    setExpanded((p) => {
      const next = { ...p };
      if (activeTop) {
        for (const id of topLevelIds) {
          next[id] = id === activeTop;
        }
      }
      for (const id of toExpand) next[id] = true;
      return next;
    });
  }, [activePage, entries]);

  const glass = glassStyle(isDark);
  const rtl = side === 'right';
  const sidebarGlass: React.CSSProperties = {
    background: chromeBg(isDark),
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderLeftWidth: side === 'right' ? '1px' : 0,
    borderRightWidth: side === 'right' ? 0 : '1px',
    borderStyle: 'solid',
    borderColor: glass.borderColor,
    order: side === 'right' ? 2 : 0,
  };

  /** Accordion: opening one top-level menu closes other top-level menus */
  const toggleExpand = (id: string) => {
    setExpanded((p) => {
      const opening = !p[id];
      const next: Record<string, boolean> = { ...p, [id]: opening };
      if (!opening) return next;

      const topLevelIds = new Set<string>();
      for (const entry of entries) {
        if ('isSection' in entry && entry.isSection) continue;
        const item = entry as NavItem;
        if (item.children?.length) topLevelIds.add(item.id);
      }

      if (topLevelIds.has(id)) {
        for (const other of topLevelIds) {
          if (other !== id) next[other] = false;
        }
      }
      return next;
    });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 240 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="flex-shrink-0 h-full overflow-hidden transition-colors duration-500 flex"
      style={{ ...sidebarGlass, justifyContent: side === 'right' ? 'flex-end' : 'flex-start' }}
    >
      <div className="flex flex-col h-full w-[240px] flex-shrink-0">
        {/* Logo area */}
        <div
          className="flex items-center gap-2.5 px-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${borderSubtle(isDark)}`, height: '70px' }}
        >
          <Image
            src={enterhubLogoSrc(isDark)}
            alt=""
            width={28}
            height={28}
            className="flex-shrink-0 object-contain"
            style={{ width: 28, height: 28 }}
            aria-hidden
          />
          <div className="min-w-0 flex-1 text-start">
            <span
              className="text-base font-black tracking-tight transition-colors duration-300 block truncate"
              style={{ color: textPrimary(isDark) }}
            >
              {brandTitle || 'Enterhub'}
            </span>
            {brandSubtitle && (
              <span className="text-[10px] truncate block" style={{ color: textMuted(isDark) }}>
                {brandSubtitle}
              </span>
            )}
          </div>
        </div>

        {headerSlot}

        {/* Profile pill with dropdown */}
        <ProfilePill
          isDark={isDark}
          setActivePage={setActivePage}
          side={side}
          menuItems={profileMenuItems}
          displayName={profileDisplayName}
          subtitle={profileSubtitle}
        />

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: 'none' }}>
          {entries.map((entry, i) => {
            // Section header
            if ('isSection' in entry && entry.isSection) {
              return (
                <p
                  key={`sec-${i}`}
                  className="text-xs font-semibold uppercase tracking-widest px-2 pt-5 pb-1.5"
                  style={{ color: textMuted(isDark), letterSpacing: '0.13em' }}
                >{entry.label}</p>
              );
            }

            const item = entry as NavItem;
            const hasChildren = !!item.children?.length;
            const isExpanded = expanded[item.id];
            const childIsActive = (children?: NavChild[]): boolean =>
              !!children?.some(
                (c) => c.id === activePage || childIsActive(c.children)
              );
            const isActiveParent =
              childIsActive(item.children) || activePage === item.id;

            return (
              <div key={item.id}>
                {/* Parent row */}
                <button
                  id={`nav-${item.id}`}
                  onClick={() => {
                    if (hasChildren) toggleExpand(item.id);
                    else setActivePage(item.id);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer group text-start`}
                  style={{
                    background: isActiveParent && !hasChildren ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : 'transparent',
                    color: isActiveParent ? textPrimary(isDark) : textSecondary(isDark),
                    border: `1px solid ${isActiveParent && !hasChildren ? borderSubtle(isDark) : 'transparent'}`,
                  }}
                  onMouseEnter={e => {
                    if (!isActiveParent) {
                      (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
                      (e.currentTarget as HTMLElement).style.color = textPrimary(isDark);
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActiveParent) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = textSecondary(isDark);
                    }
                  }}
                >
                  <span className="shrink-0 inline-flex items-center justify-center overflow-visible leading-none">
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (() => {
                    const badgeColor = resolveBadgeColor(item.badge.color);
                    return (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                      style={{ background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}35`, fontSize: '9px' }}
                    >{item.badge.text}</span>
                    );
                  })()}
                  {hasChildren && (
                    <motion.span
                      animate={{ rotate: isExpanded ? (rtl ? -90 : 90) : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0 opacity-50"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points={rtl ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                      </svg>
                    </motion.span>
                  )}
                </button>

                {/* Children */}
                <AnimatePresence initial={false}>
                  {hasChildren && isExpanded && (
                    <motion.div
                      key="children"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden mt-0.5 mb-0.5 ms-4 ps-3"
                      style={{ borderInlineStart: `1px solid ${borderSubtle(isDark)}` }}
                    >
                      {item.children!.map(child => {
                        const hasSubChildren = !!child.children?.length;
                        const isSubExpanded = expanded[child.id];
                        const isSubActiveParent = child.children?.some(c => c.id === activePage) || activePage === child.id;

                        if (hasSubChildren) {
                          return (
                            <div key={child.id} className="mb-0.5">
                              {/* Sub-parent row */}
                              <button
                                id={`nav-${child.id}`}
                                onClick={() => toggleExpand(child.id)}
                                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer text-start`}
                                style={{
                                  background: 'transparent',
                                  color: isSubActiveParent ? textPrimary(isDark) : textSecondary(isDark),
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
                                  (e.currentTarget as HTMLElement).style.color = textPrimary(isDark);
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = isSubActiveParent ? textPrimary(isDark) : textSecondary(isDark);
                                }}
                              >
                                <span className="flex-shrink-0 opacity-60">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h8" />
                                  </svg>
                                </span>
                                <span className="flex-1 truncate">{child.label}</span>
                                <motion.span
                                  animate={{ rotate: isSubExpanded ? (rtl ? -90 : 90) : 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="flex-shrink-0 opacity-50"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points={rtl ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
                                  </svg>
                                </motion.span>
                              </button>

                              {/* Sub-children list */}
                              <AnimatePresence initial={false}>
                                {isSubExpanded && (
                                  <motion.div
                                    key="sub-children"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                                    className="overflow-hidden mt-0.5 mb-0.5 ms-4 ps-3"
                                    style={{ borderInlineStart: `1px solid ${borderSubtle(isDark)}` }}
                                  >
                                    {child.children!.map(subChild => {
                                      const isSubActive = activePage === subChild.id;
                                      return (
                                        <button
                                          key={subChild.id}
                                          id={`nav-${subChild.id}`}
                                          onClick={() => setActivePage(subChild.id)}
                                          className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer text-start`}
                                          style={{
                                            background: isSubActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                                            color: isSubActive ? textPrimary(isDark) : textSecondary(isDark),
                                            border: `1px solid ${isSubActive ? borderSubtle(isDark) : 'transparent'}`,
                                          }}
                                          onMouseEnter={e => {
                                            if (!isSubActive) {
                                              (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
                                              (e.currentTarget as HTMLElement).style.color = textPrimary(isDark);
                                            }
                                          }}
                                          onMouseLeave={e => {
                                            if (!isSubActive) {
                                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                                              (e.currentTarget as HTMLElement).style.color = textSecondary(isDark);
                                            }
                                          }}
                                        >
                                          <span
                                            className="w-1 h-1 rounded-full flex-shrink-0"
                                            style={{ background: isSubActive ? textPrimary(isDark) : textMuted(isDark) }}
                                          />
                                          <span className="flex-1 truncate">{subChild.label}</span>
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        }

                        const isActive = activePage === child.id;
                        return (
                          <button
                            key={child.id}
                            id={`nav-${child.id}`}
                            onClick={() => setActivePage(child.id)}
                            className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer mb-0.5 text-start`}
                            style={{
                              background: isActive ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
                              color: isActive ? textPrimary(isDark) : textSecondary(isDark),
                              border: `1px solid ${isActive ? borderSubtle(isDark) : 'transparent'}`,
                            }}
                            onMouseEnter={e => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
                                (e.currentTarget as HTMLElement).style.color = textPrimary(isDark);
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isActive) {
                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                (e.currentTarget as HTMLElement).style.color = textSecondary(isDark);
                              }
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: isActive ? textPrimary(isDark) : textMuted(isDark) }}
                            />
                            <span className="flex-1 truncate">{child.label}</span>
                            {child.badge && (() => {
                              const badgeColor = resolveBadgeColor(child.badge.color);
                              return (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded font-bold"
                                style={{ background: `${badgeColor}20`, color: badgeColor, fontSize: '9px' }}
                              >{child.badge.text}</span>
                              );
                            })()}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>
      </div>
    </motion.aside>
  );
}
