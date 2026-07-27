'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import SafeSidebar from './SafeSidebar';
import SafeHorizontalNav from './SafeHorizontalNav';
import SafeTwoColumnNav from './SafeTwoColumnNav';
import SafeTopbar from './SafeTopbar';
import SafeStatsRow from './SafeStatsRow';
import SafeIncidentChart from './SafeIncidentChart';
import SafeAlertFeed from './SafeAlertFeed';
import SafeGoals from './SafeGoals';
import SafeActivityFeed from './SafeActivityFeed';
import SafeTeam from './SafeTeam';
import SafeAnalytics from './SafeAnalytics';
import SafeCrm from './SafeCrm';
import SafeEcommerce from './SafeEcommerce';
import SafeCrypto from './SafeCrypto';
import SafeProjects from './SafeProjects';
import SafeNft from './SafeNft';
import SafeJob from './SafeJob';
import SafeBlog from './SafeBlog';
import SafeCalendar from './SafeCalendar';
import SafeEmail from './SafeEmail';
import SafeChat from './SafeChat';
import SafeTasks from './SafeTasks';
import SafeInvoices from './SafeInvoices';
import SafeSupport from './SafeSupport';
import SafeAuth from './SafeAuth';
import SafeGallery from './SafeGallery';
import SafePricing from './SafePricing';
import SafeProfile from './SafeProfile';
import SafeSettings from './SafeSettings';
import SafeTeamPage from './SafeTeamPage';
import SafeTimeline from './SafeTimeline';
import SafeFAQs from './SafeFAQs';
import SafeMaintenance from './SafeMaintenance';
import SafeComingSoon from './SafeComingSoon';
import SafeBlogsPage from './SafeBlogsPage';
import SafeAlerts from './SafeAlerts';
import SafeBadges from './SafeBadges';
import SafeButtons from './SafeButtons';
import SafeCards from './SafeCards';
import SafeCarousel from './SafeCarousel';

import SafeTables from './SafeTables';
import SafeSweetAlerts from './SafeSweetAlerts';
import SafeNestable from './SafeNestable';
import SafeTour from './SafeTour';
import SafeSwiper from './SafeSwiper';
import SafeRatings from './SafeRatings';
import SafeScrollSpy from './SafeScrollSpy';

import SafeBasicElements from './SafeBasicElements';
import SafeFormSelect from './SafeFormSelect';
import SafeCheckboxesRadios from './SafeCheckboxesRadios';
import SafeInputMasks from './SafeInputMasks';
import SafeAdvanced from './SafeAdvanced';
import SafeApexCharts from './SafeApexCharts';
import SafeECharts from './SafeECharts';
import SafeChartjs from './SafeChartjs';
import SafeRecharts from './SafeRecharts';
import SafeIconFix from './SafeIconFix';
import SafeIconAnimation from './SafeIconAnimation';
import SafeBoxicons from './SafeBoxicons';
import SafeMaterial from './SafeMaterial';
import SafeGoogleMaps from './SafeGoogleMaps';
import SafeVectorMaps from './SafeVectorMaps';
import SafeLeafletMaps from './SafeLeafletMaps';
import SafeAccountProfile from './SafeAccountProfile';
import SafeAccountSettings from './SafeAccountSettings';
import SafeAccountBilling from './SafeAccountBilling';
import SafeAccountHelp from './SafeAccountHelp';
import SafeRangeSlider from './SafeRangeSlider';
import SafeWizard from './SafeWizard';
import SafeFormLayouts from './SafeFormLayouts';
import SafeFileUploads from './SafeFileUploads';

import GlassButton from './GlassButton';
import SafeCustomizer from './SafeCustomizer';

export default function SafeDashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [previousPage, setPreviousPage] = useState('dashboard');

  // Layout presets (controlled from the customizer, persisted to localStorage)
  const [layoutType, setLayoutType] = useState<'vertical' | 'horizontal' | 'twocolumn' | 'semibox'>('vertical');
  const [sidebarSide, setSidebarSide] = useState<'left' | 'right'>('left');
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Track the last non-auth page we visited
  useEffect(() => {
    if (!activePage.startsWith('auth-')) {
      setPreviousPage(activePage);
    }
  }, [activePage]);

  // Hydrate layout prefs on the client only (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const l = localStorage.getItem('safe-layout-type');
      const s = localStorage.getItem('safe-layout-sidebar-side');
      if (l === 'vertical' || l === 'horizontal' || l === 'twocolumn' || l === 'semibox') setLayoutType(l);
      if (s === 'left' || s === 'right') setSidebarSide(s);
    } catch { /* localStorage unavailable — keep defaults */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('safe-layout-type', layoutType); } catch { /* ignore */ }
  }, [layoutType]);
  useEffect(() => {
    try { localStorage.setItem('safe-layout-sidebar-side', sidebarSide); } catch { /* ignore */ }
  }, [sidebarSide]);

  // Track mobile breakpoint and auto-open/close sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when navigating on mobile
  const handleSetActivePage = (id: string) => {
    if (id === 'layouts') {
      setCustomizerOpen(true);
      if (isMobile) setSidebarOpen(false);
      return;
    }
    setActivePage(id);
    if (isMobile) setSidebarOpen(false);
  };

  const isFullScreenPage = activePage.startsWith('auth-') || activePage === 'page-maintenance' || activePage === 'page-comingsoon';
  const isHorizontal = layoutType === 'horizontal';
  const isTwoCol = layoutType === 'twocolumn';
  const isSemiBox = layoutType === 'semibox';

  return (
    <div className="h-full overflow-hidden transition-colors duration-500">
      <div
        className={`flex h-full overflow-hidden min-w-0 w-full${
          isSemiBox ? ' max-w-[1500px] mx-auto' : ''
        }`}
      >
        {!isFullScreenPage && !isHorizontal && (
          isTwoCol ? (
            <SafeTwoColumnNav isDark={isDark} activePage={activePage} setActivePage={handleSetActivePage} />
          ) : (
            <>
              {/* Mobile sidebar backdrop */}
              {isMobile && sidebarOpen && (
                <div
                  className="fixed inset-0 z-30"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              {/* Sidebar: fixed overlay on mobile, normal flow on desktop */}
              <div
                className="transition-transform duration-300 ease-in-out"
                style={{
                  position: isMobile ? 'fixed' : 'relative',
                  zIndex: isMobile ? 40 : 'auto',
                  height: '100%',
                  top: 0,
                  left: sidebarSide === 'right' ? 'auto' : 0,
                  right: sidebarSide === 'right' ? 0 : 'auto',
                  transform: isMobile
                    ? sidebarOpen ? 'translateX(0)' : sidebarSide === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
                    : 'none',
                  order: sidebarSide === 'right' ? 2 : 0,
                }}
              >
                <SafeSidebar
                  isDark={isDark}
                  activePage={activePage}
                  setActivePage={handleSetActivePage}
                  isOpen={sidebarOpen}
                  side={sidebarSide}
                />
              </div>
            </>
          )
        )}

        <div className="flex-1 flex flex-col min-h-0" style={{ order: 1, overflow: 'hidden' }}>
          {!isFullScreenPage && <SafeTopbar isDark={isDark} onMenuToggle={() => setSidebarOpen(p => !p)} sidebarSide={(isHorizontal || isTwoCol) ? 'left' : sidebarSide} setActivePage={handleSetActivePage} />}
          {!isFullScreenPage && isHorizontal && (
            <div className="w-full flex-shrink-0" style={{ overflowX: 'clip', overflowY: 'visible' }}>
              <SafeHorizontalNav isDark={isDark} activePage={activePage} setActivePage={handleSetActivePage} />
            </div>
          )}

        {activePage === 'dashboard' ? (
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-3 xs:px-4 sm:px-6 3xl:px-8 4xl:px-10 py-4 sm:py-5 space-y-4 sm:space-y-6" style={{ scrollbarWidth: 'none' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-0">
              <div>
                <p className="text-xs font-medium mb-1 text-[var(--muted)] transition-colors duration-300">
                  Workspaces / Project Overview
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] transition-colors duration-300">
                  Project Overview
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.25)] flex items-center gap-1.5 select-none transition-colors duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span> All Systems Normal
                </span>
                <GlassButton style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px' }}>
                  Report Incident
                </GlassButton>
              </div>
            </div>

            <SafeStatsRow isDark={isDark} />

            {/* Row 2: Chart & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <SafeIncidentChart isDark={isDark} />
              </div>
              <div className="lg:col-span-1">
                <SafeAlertFeed isDark={isDark} />
              </div>
            </div>

            {/* Row 3: Feeds & Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <SafeActivityFeed isDark={isDark} />
              <SafeGoals isDark={isDark} />
              <SafeTeam isDark={isDark} />
            </div>
          </div>
        ) : activePage === 'dash-analytics' ? (
          <SafeAnalytics isDark={isDark} />
        ) : (activePage === 'dash-crm' || activePage.startsWith('crm-')) ? (
          <SafeCrm isDark={isDark} activePage={activePage} />
        ) : (activePage === 'dash-ecommerce' || activePage.startsWith('ecommerce-')) ? (
          <SafeEcommerce isDark={isDark} activePage={activePage} />
        ) : activePage === 'dash-crypto' ? (
          <SafeCrypto isDark={isDark} />
        ) : (activePage === 'dash-projects' || activePage.startsWith('projects-')) ? (
          <SafeProjects isDark={isDark} activePage={activePage} />
        ) : activePage === 'dash-nft' ? (
          <SafeNft isDark={isDark} />
        ) : activePage === 'dash-job' ? (
          <SafeJob isDark={isDark} />
        ) : activePage === 'dash-blog' ? (
          <SafeBlog isDark={isDark} />
        ) : activePage === 'app-calendar' ? (
          <SafeCalendar isDark={isDark} />
        ) : activePage === 'app-email' ? (
          <SafeEmail isDark={isDark} />
        ) : activePage === 'app-chat' ? (
          <SafeChat isDark={isDark} />
        ) : activePage === 'app-tasks' ? (
          <SafeTasks isDark={isDark} />
        ) : activePage === 'app-invoices' ? (
          <SafeInvoices isDark={isDark} />
        ) : activePage === 'app-support' ? (
          <SafeSupport isDark={isDark} />
        ) : activePage === 'app-gallery' ? (
          <SafeGallery isDark={isDark} />
        ) : activePage === 'page-pricing' ? (
          <SafePricing isDark={isDark} />
        ) : activePage === 'page-profile' ? (
          <SafeProfile isDark={isDark} />
        ) : activePage === 'page-settings' ? (
          <SafeSettings isDark={isDark} />
        ) : activePage === 'page-team' ? (
          <SafeTeamPage isDark={isDark} />
        ) : activePage === 'page-timeline' ? (
          <SafeTimeline isDark={isDark} />
        ) : activePage === 'page-faqs' ? (
          <SafeFAQs isDark={isDark} />
        ) : activePage === 'page-maintenance' ? (
          <SafeMaintenance isDark={isDark} onGoHome={() => setActivePage('dashboard')} />
        ) : activePage === 'page-comingsoon' ? (
          <SafeComingSoon isDark={isDark} onGoBack={() => setActivePage('dashboard')} />
        ) : activePage === 'page-blogs' ? (
          <SafeBlogsPage isDark={isDark} />
        ) : activePage === 'ui-alerts' ? (
          <SafeAlerts isDark={isDark} />
        ) : activePage === 'ui-badges' ? (
          <SafeBadges isDark={isDark} />
        ) : activePage === 'ui-buttons' ? (
          <SafeButtons isDark={isDark} />
        ) : activePage === 'ui-cards' ? (
          <SafeCards isDark={isDark} />
        ) : activePage === 'ui-carousel' ? (
          <SafeCarousel isDark={isDark} />
        ) : activePage === 'ui-tables' ? (
          <SafeTables isDark={isDark} />
        ) : activePage === 'adv-sweetalerts' ? (
          <SafeSweetAlerts isDark={isDark} />
        ) : activePage === 'adv-nestable' ? (
          <SafeNestable isDark={isDark} />
        ) : activePage === 'adv-tour' ? (
          <SafeTour isDark={isDark} />
        ) : activePage === 'adv-swiper' ? (
          <SafeSwiper isDark={isDark} />
        ) : activePage === 'adv-ratings' ? (
          <SafeRatings isDark={isDark} />
        ) : activePage === 'adv-scrollspy' ? (
          <SafeScrollSpy isDark={isDark} />
        ) : activePage === 'forms-basic-elements' ? (
          <SafeBasicElements isDark={isDark} />
        ) : activePage === 'forms-select' ? (
          <SafeFormSelect isDark={isDark} />
        ) : activePage === 'forms-checkboxes-radios' ? (
          <SafeCheckboxesRadios isDark={isDark} />
        ) : activePage === 'forms-input-masks' ? (
          <SafeInputMasks isDark={isDark} />
        ) : activePage === 'forms-advanced' ? (
          <SafeAdvanced isDark={isDark} />
        ) : activePage === 'forms-range-slider' ? (
          <SafeRangeSlider isDark={isDark} />
        ) : activePage === 'forms-wizard' ? (
          <SafeWizard isDark={isDark} />
        ) : activePage === 'forms-layouts' ? (
          <SafeFormLayouts isDark={isDark} />
        ) : activePage === 'forms-file-uploads' ? (
          <SafeFileUploads isDark={isDark} />
        ) : activePage === 'chart-apex' ? (
          <SafeApexCharts isDark={isDark} />
        ) : activePage === 'chart-echarts' ? (
          <SafeECharts isDark={isDark} />
        ) : activePage === 'chart-chartjs' ? (
          <SafeChartjs isDark={isDark} />
        ) : activePage === 'chart-recharts' ? (
          <SafeRecharts isDark={isDark} />
        ) : activePage === 'icon-remix-fix' ? (
          <SafeIconFix isDark={isDark} />
        ) : activePage === 'icon-remix-animation' ? (
          <SafeIconAnimation isDark={isDark} />
        ) : activePage === 'icon-boxicons' ? (
          <SafeBoxicons isDark={isDark} />
        ) : activePage === 'icon-material' ? (
          <SafeMaterial isDark={isDark} />
        ) : activePage === 'map-google' ? (
          <SafeGoogleMaps isDark={isDark} />
        ) : activePage === 'map-vector' ? (
          <SafeVectorMaps isDark={isDark} />
        ) : activePage === 'map-leaflet' ? (
          <SafeLeafletMaps isDark={isDark} />
        ) : activePage === 'account-profile' ? (
          <SafeAccountProfile isDark={isDark} setActivePage={setActivePage} />
        ) : activePage === 'account-settings' ? (
          <SafeAccountSettings isDark={isDark} setActivePage={setActivePage} />
        ) : activePage === 'account-billing' ? (
          <SafeAccountBilling isDark={isDark} setActivePage={setActivePage} />
        ) : activePage === 'account-help' ? (
          <SafeAccountHelp isDark={isDark} setActivePage={setActivePage} />
        ) : activePage.startsWith('auth-') ? (
          <SafeAuth isDark={isDark} mode={activePage} setActivePage={setActivePage} previousPage={previousPage} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--muted)]">
            Work in progress: {activePage}
          </div>
        )}
        </div>
      </div>

      {!isFullScreenPage && (
        <SafeCustomizer
          isDark={isDark}
          layoutType={layoutType}
          setLayoutType={setLayoutType}
          sidebarSide={sidebarSide}
          setSidebarSide={setSidebarSide}
          open={customizerOpen}
          setOpen={setCustomizerOpen}
        />
      )}
    </div>
  );
}
