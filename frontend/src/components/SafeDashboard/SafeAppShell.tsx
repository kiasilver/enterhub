'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import SafeSidebar, { type NavEntry } from './SafeSidebar';
import SafeTopbar from './SafeTopbar';
import SafeCustomizer from './SafeCustomizer';
import SafeHorizontalNav from './SafeHorizontalNav';
import SafeTwoColumnNav from './SafeTwoColumnNav';
import { hexToRgba, canvasBg } from './theme';

export type LayoutType = 'vertical' | 'horizontal' | 'twocolumn' | 'semibox';
export type SidebarSide = 'left' | 'right';

export type SafeAppShellProps = {
  nav: NavEntry[];
  activeId: string;
  /** Map nav item id → href. Called when a leaf nav item is selected. */
  routes: Record<string, string>;
  brandTitle?: string;
  brandSubtitle?: string;
  /** Extra strip under topbar (e.g. impersonation banner) */
  banner?: React.ReactNode;
  /** Slot under sidebar brand (workspace switcher) */
  sidebarHeader?: React.ReactNode;
  /** Replace default SafeTopbar — receives menu toggle for mobile */
  topbar?: (ctx: {
    isDark: boolean;
    onMenuToggle: () => void;
    sidebarSide: SidebarSide;
  }) => React.ReactNode;
  /** Full-bleed content (chat/calendar) — no padding, fills remaining height */
  fullBleed?: boolean;
  /** Sidebar profile-pill menu (defaults to demo Account tabs) */
  profileMenuItems?: { id: string; label: string }[];
  profileDisplayName?: string;
  profileSubtitle?: string;
  children: React.ReactNode;
};

export default function SafeAppShell({
  nav,
  activeId,
  routes,
  brandTitle,
  brandSubtitle,
  banner,
  sidebarHeader,
  topbar,
  fullBleed = false,
  profileMenuItems,
  profileDisplayName,
  profileSubtitle,
  children,
}: SafeAppShellProps) {
  const { theme, bgStyle, primaryColor } = useTheme();
  const { lang, dir } = useLang();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [layoutType, setLayoutType] = useState<LayoutType>('vertical');
  const [sidebarSide, setSidebarSide] = useState<SidebarSide>('left');
  const [customizerOpen, setCustomizerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    try {
      const l = localStorage.getItem('safe-layout-type');
      const s = localStorage.getItem('safe-layout-sidebar-side');
      if (l === 'vertical' || l === 'horizontal' || l === 'twocolumn' || l === 'semibox') {
        setLayoutType(l);
      }
      if (s === 'left' || s === 'right') setSidebarSide(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('safe-layout-type', layoutType);
    } catch {
      /* ignore */
    }
  }, [layoutType]);

  useEffect(() => {
    try {
      localStorage.setItem('safe-layout-sidebar-side', sidebarSide);
    } catch {
      /* ignore */
    }
  }, [sidebarSide]);

  const handleNavigate = (id: string) => {
    if (isMobile) setSidebarOpen(false);

    if (id === 'auth-logout') {
      void signOut({ callbackUrl: '/signin' });
      return;
    }

    const href = routes[id];
    if (href) {
      router.push(href);
    }
  };

  const isHorizontal = layoutType === 'horizontal';
  const isTwoCol = layoutType === 'twocolumn';
  const isSemiBox = layoutType === 'semibox';
  const showVerticalSidebar = !isHorizontal && !isTwoCol;
  const effectiveSide =
    isHorizontal || isTwoCol ? 'left' : sidebarSide;

  return (
    <main
      className="relative min-h-screen overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: canvasBg(isDark) }}
    >
      {bgStyle === 'plasma' && (
        <div className="absolute inset-0 z-0">
          <PlasmaWrapper fullscreen />
        </div>
      )}
      {bgStyle === 'mesh' && (
        <div
          className="absolute inset-0 z-0 opacity-50 transition-all duration-700"
          style={{
            background: `radial-gradient(circle at 20% 30%, ${hexToRgba(primaryColor, 0.6)} 0%, transparent 50%), radial-gradient(circle at 80% 70%, ${hexToRgba(primaryColor, 0.4)} 0%, transparent 50%)`,
            filter: 'blur(80px)',
          }}
        />
      )}
      {bgStyle === 'dots' && (
        <div
          className="absolute inset-0 z-0 transition-opacity duration-700"
          style={{
            opacity: isDark ? 0.15 : 0.25,
            backgroundImage: `radial-gradient(${primaryColor} 2px, transparent 2px)`,
            backgroundSize: '32px 32px',
          }}
        />
      )}
      {bgStyle === 'grid' && (
        <div
          className="absolute inset-0 z-0 transition-opacity duration-700"
          style={{
            opacity: isDark ? 0.1 : 0.2,
            backgroundImage: `linear-gradient(${hexToRgba(primaryColor, 0.5)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(primaryColor, 0.5)} 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            backgroundPosition: 'center center',
          }}
        />
      )}
      {bgStyle === 'aurora' && (
        <div
          className="absolute inset-0 z-0 opacity-50 transition-all duration-700"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.3)} 0%, transparent 40%), linear-gradient(225deg, ${hexToRgba(primaryColor, 0.4)} 0%, transparent 50%), linear-gradient(315deg, ${hexToRgba(primaryColor, 0.2)} 0%, transparent 40%)`,
            filter: 'blur(100px)',
          }}
        />
      )}

      {bgStyle !== 'solid' && (
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)',
          }}
        />
      )}

      <div
        className="eh-app-shell relative z-10 h-screen overflow-hidden transition-colors duration-500"
        dir={dir}
        lang={lang === 'fa' ? 'fa' : 'en'}
        style={{
          fontFamily:
            lang === 'fa'
              ? 'var(--font-persian)'
              : "var(--font-inter, 'Inter', 'Segoe UI', sans-serif)",
        }}
      >
        <div
          className={`flex h-full overflow-hidden min-w-0 w-full${
            isSemiBox ? ' max-w-[1500px] mx-auto' : ''
          }`}
        >
          {/* Two-column icon rail + panel */}
          {!isMobile && isTwoCol && (
            <SafeTwoColumnNav
              isDark={isDark}
              activePage={activeId}
              setActivePage={handleNavigate}
              nav={nav}
            />
          )}

          {/* Vertical / semi-box sidebar (also mobile drawer for all layouts) */}
          {(showVerticalSidebar || isMobile) && (
            <>
              {isMobile && sidebarOpen && (
                <div
                  className="fixed inset-0 z-30"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              <div
                className="transition-transform duration-300 ease-in-out"
                style={{
                  position: isMobile ? 'fixed' : 'relative',
                  zIndex: isMobile ? 40 : 'auto',
                  height: '100%',
                  top: 0,
                  left: effectiveSide === 'right' ? 'auto' : 0,
                  right: effectiveSide === 'right' ? 0 : 'auto',
                  transform: isMobile
                    ? sidebarOpen
                      ? 'translateX(0)'
                      : effectiveSide === 'right'
                        ? 'translateX(100%)'
                        : 'translateX(-100%)'
                    : 'none',
                  order: effectiveSide === 'right' ? 2 : 0,
                  display: !isMobile && isTwoCol ? 'none' : undefined,
                }}
              >
                <SafeSidebar
                  isDark={isDark}
                  activePage={activeId}
                  setActivePage={handleNavigate}
                  isOpen={sidebarOpen}
                  side={effectiveSide}
                  nav={nav}
                  brandTitle={brandTitle}
                  brandSubtitle={brandSubtitle}
                  headerSlot={sidebarHeader}
                  profileMenuItems={profileMenuItems}
                  profileDisplayName={profileDisplayName}
                  profileSubtitle={profileSubtitle}
                />
              </div>
            </>
          )}

          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden" style={{ order: 1 }}>
            {topbar ? (
              topbar({
                isDark,
                onMenuToggle: () => setSidebarOpen((p) => !p),
                sidebarSide: effectiveSide,
              })
            ) : (
              <SafeTopbar
                isDark={isDark}
                onMenuToggle={() => setSidebarOpen((p) => !p)}
                sidebarSide={effectiveSide}
                setActivePage={handleNavigate}
              />
            )}

            {!isMobile && isHorizontal && (
              <div className="w-full flex-shrink-0" style={{ overflowX: 'clip', overflowY: 'visible' }}>
                <SafeHorizontalNav
                  isDark={isDark}
                  activePage={activeId}
                  setActivePage={handleNavigate}
                  nav={nav}
                />
              </div>
            )}

            {banner}
    {fullBleed ? (
              <div className="flex-1 min-h-0 overflow-hidden w-full flex flex-col">
                {children}
              </div>
            ) : (
              <div
                className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden thin-scrollbar px-3 xs:px-4 sm:px-6 3xl:px-8 4xl:px-10 py-4 sm:py-5 w-full"
              >
                {children}
              </div>
            )}
          </div>
        </div>
      </div>

      <SafeCustomizer
        isDark={isDark}
        layoutType={layoutType}
        setLayoutType={setLayoutType}
        sidebarSide={sidebarSide}
        setSidebarSide={setSidebarSide}
        open={customizerOpen}
        setOpen={setCustomizerOpen}
      />
    </main>
  );
}
