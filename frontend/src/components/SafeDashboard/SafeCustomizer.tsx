'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, Check, Palette, Pipette, RotateCcw } from 'lucide-react';
import GlassColorPicker from './GlassColorPicker';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  DARK_PALETTES,
  DEFAULT_DARK_PALETTE_ID,
  DEFAULT_PRIMARY,
  THEME_COLORS,
  THEME_COLOR_HEXES,
  getDarkPalette,
  hexToRgba,
} from './theme';

const COLOR_PRESETS = THEME_COLOR_HEXES;

type SidebarSide = 'left' | 'right';
type LayoutType = 'vertical' | 'horizontal' | 'twocolumn' | 'semibox';

interface SafeCustomizerProps {
  isDark: boolean;
  layoutType: LayoutType;
  setLayoutType: (l: LayoutType) => void;
  sidebarSide: SidebarSide;
  setSidebarSide: (s: SidebarSide) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}

/** Tiny schematic mock of the dashboard — rendered inside each preset preview card. */
function MiniLayout({
  isDark,
  variant,
  side = 'left',
  accent,
  paletteBg,
  paletteSurface,
}: {
  isDark: boolean;
  variant: LayoutType;
  side?: SidebarSide;
  accent: string;
  paletteBg?: string;
  paletteSurface?: string;
}) {
  const frame = isDark ? (paletteBg ?? '#0F172A') : '#e9e9ee';
  const panel = isDark ? (paletteBg ?? '#0F172A') : '#ffffff';
  const sidebarBg = isDark
    ? `color-mix(in srgb, ${paletteBg ?? '#0F172A'} 93%, #000)`
    : '#d4d4dc';
  const line = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.18)';
  const soft = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)';

  const topbar = (
    <div
      className="flex items-center justify-end gap-1 px-1.5 flex-shrink-0"
      style={{ height: 10, background: panel, borderBottom: `1px solid ${soft}` }}
    >
      <span className="rounded-full" style={{ width: 3, height: 3, background: line }} />
      <span className="rounded-full" style={{ width: 3, height: 3, background: line }} />
    </div>
  );

  const widgets = (
    <div className="flex-1 flex flex-col gap-1.5" style={{ padding: 6 }}>
      <div className="flex gap-1.5" style={{ flex: 1 }}>
        <span className="rounded-[2px] flex-1" style={{ background: panel, border: `1px solid ${soft}` }} />
        <span className="rounded-[2px] flex-1" style={{ background: panel, border: `1px solid ${soft}` }} />
        <span className="rounded-[2px] flex-1" style={{ background: panel, border: `1px solid ${soft}` }} />
      </div>
      <div className="rounded-[2px]" style={{ flex: 1.6, background: panel, border: `1px solid ${soft}` }} />
    </div>
  );

  // Horizontal — top menu strip, no sidebar
  if (variant === 'horizontal') {
    return (
      <div className="flex flex-col w-full h-full overflow-hidden" style={{ background: frame }}>
        {topbar}
        <div
          className="flex items-center gap-1.5 px-2 flex-shrink-0"
          style={{ height: 12, background: panel, borderBottom: `1px solid ${soft}` }}
        >
          <span className="rounded-[2px]" style={{ width: 7, height: 7, background: accent }} />
          <span className="rounded-full" style={{ width: 16, height: 2.5, background: line }} />
          <span className="rounded-full" style={{ width: 16, height: 2.5, background: soft }} />
          <span className="rounded-full" style={{ width: 16, height: 2.5, background: soft }} />
        </div>
        {widgets}
      </div>
    );
  }

  // Two Column — slim icon rail + submenu column
  if (variant === 'twocolumn') {
    return (
      <div className="flex w-full h-full overflow-hidden" style={{ background: frame }}>
        <div className="flex flex-col items-center gap-1 pt-1.5" style={{ width: '12%', background: isDark ? frame : '#dcdce2' }}>
          <span className="rounded-[2px]" style={{ width: 7, height: 7, background: accent }} />
          <span className="rounded" style={{ width: 6, height: 6, background: line }} />
          <span className="rounded" style={{ width: 6, height: 6, background: soft }} />
          <span className="rounded" style={{ width: 6, height: 6, background: soft }} />
        </div>
        <div className="flex flex-col items-center gap-[3px] pt-2" style={{ width: '20%', background: sidebarBg }}>
          <span className="rounded-full" style={{ width: '64%', height: 2.5, background: line }} />
          <span className="rounded-full" style={{ width: '64%', height: 2.5, background: soft }} />
          <span className="rounded-full" style={{ width: '64%', height: 2.5, background: soft }} />
          <span className="rounded-full" style={{ width: '64%', height: 2.5, background: soft }} />
        </div>
        <div className="flex-1 flex flex-col">
          {topbar}
          {widgets}
        </div>
      </div>
    );
  }

  // Vertical — sidebar (left/right) + content. Semi Box wraps this inset in a frame.
  const inner = (
    <div className="flex w-full h-full overflow-hidden" style={{ background: frame }}>
      <div
        className="flex flex-col items-center gap-[3px] pt-1.5"
        style={{ width: '22%', background: sidebarBg, order: side === 'right' ? 2 : 0 }}
      >
        <span className="rounded-[2px]" style={{ width: 8, height: 8, background: accent }} />
        <span className="rounded-full mt-1" style={{ width: '58%', height: 2.5, background: line }} />
        <span className="rounded-full" style={{ width: '58%', height: 2.5, background: soft }} />
        <span className="rounded-full" style={{ width: '58%', height: 2.5, background: soft }} />
      </div>
      <div className="flex-1 flex flex-col" style={{ order: 1 }}>
        {topbar}
        {widgets}
      </div>
    </div>
  );

  if (variant === 'semibox') {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: isDark ? frame : '#d7d7de', padding: '5px 9%' }}>
        <div className="w-full h-full rounded-[3px] overflow-hidden" style={{ border: `1px solid ${soft}` }}>{inner}</div>
      </div>
    );
  }

  return inner;
}

/** Selectable preview card — a layout mock with a label and an accent check when active. */
function PreviewCard({
  isDark,
  active,
  onClick,
  label,
  accent,
  children,
}: {
  isDark: boolean;
  active: boolean;
  onClick: () => void;
  label: string;
  accent: string;
  children: ReactNode;
}) {
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="block w-full">
      <div
        className="relative rounded-xl overflow-hidden transition-colors duration-200"
        style={{ border: active ? `1.5px solid ${accent}` : `1px solid ${border}`, aspectRatio: '16 / 10' }}
      >
        {children}
        {active && (
          <span
            className="absolute top-1.5 end-1.5 rounded-full flex items-center justify-center"
            style={{ width: 16, height: 16, background: accent, color: '#fff' }}
          >
            <Check size={11} strokeWidth={3} />
          </span>
        )}
      </div>
      <p className="mt-2 text-center text-[12px] font-semibold transition-colors" style={{ color: active ? accent : sec }}>
        {label}
      </p>
    </button>
  );
}

/**
 * Floating workspace customizer. A handle pinned to the center-right edge opens a
 * panel that takes ~2/5 of the screen while dimming the main app behind it.
 * Hosts the Layout presets today; colour palette, primary colour, and the
 * plasma-background toggle will follow.
 */
export default function SafeCustomizer({ isDark, layoutType, setLayoutType, sidebarSide, setSidebarSide, open, setOpen }: SafeCustomizerProps) {
  const { t, dir } = useLang();
  const {
    setTheme,
    primaryColor,
    setPrimaryColor,
    bgStyle,
    setBgStyle,
    darkPaletteId,
    setDarkPaletteId,
  } = useTheme();
  // Dock left for RTL (Persian) or when the sidebar already occupies the right edge.
  const sidebarOnRight = sidebarSide === 'right' && (layoutType === 'vertical' || layoutType === 'semibox');
  const dockLeft = dir === 'rtl' || sidebarOnRight;

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const accent = primaryColor;
  const activePalette = getDarkPalette(darkPaletteId);
  const isPresetActive = COLOR_PRESETS.some(c => c.toLowerCase() === primaryColor.toLowerCase());
  const miniProps = {
    paletteBg: activePalette.bg,
    paletteSurface: activePalette.bg,
  };
  const bgTypes = ['plasma', 'aurora', 'mesh', 'grid', 'dots', 'solid'] as const;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  return (
    <>
      {/* Edge handle — left in RTL / when sidebar is right */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('customizer.open')}
        aria-hidden={open}
        tabIndex={open ? -1 : 0}
        initial={false}
        animate={{ opacity: open ? 0 : 1, x: open ? (dockLeft ? -24 : 24) : 0 }}
        transition={{ duration: 0.2 }}
        whileHover={{ x: dockLeft ? 3 : -3 }}
        className={`fixed top-1/2 z-40 flex flex-col items-center justify-center gap-1 ${dockLeft ? 'left-0' : 'right-0'}`}
        style={{
          marginTop: -28,
          width: 40,
          height: 56,
          borderTopLeftRadius: dockLeft ? 0 : 16,
          borderBottomLeftRadius: dockLeft ? 0 : 16,
          borderTopRightRadius: dockLeft ? 16 : 0,
          borderBottomRightRadius: dockLeft ? 16 : 0,
          background: isDark ? 'var(--surface)' : 'rgba(255,255,255,1)',
          borderTop: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
          ...(dockLeft ? { borderRight: `1px solid ${border}` } : { borderLeft: `1px solid ${border}` }),
          color: pri,
          boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.12)',
          pointerEvents: open ? 'none' : 'auto',
          willChange: 'transform, opacity',
        }}
      >
        <SlidersHorizontal size={17} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — dims the main app */}
            <motion.div
              key="customizer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.65)', willChange: 'opacity' }}
            />

            {/* Floating panel — docks to the same side as the handle */}
            <motion.aside
              key="customizer-panel"
              initial={{ x: dockLeft ? '-110%' : '110%' }}
              animate={{ x: 0 }}
              exit={{ x: dockLeft ? '-110%' : '110%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 36 }}
              className={`fixed top-4 bottom-4 z-50 flex flex-col overflow-hidden ${dockLeft ? 'left-4' : 'right-4'}`}
              style={{
                width: '40%',
                minWidth: 340,
                maxWidth: '92vw',
                background: isDark ? 'var(--background)' : '#ffffff',
                borderRadius: 24,
                border: `1px solid ${border}`,
                boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.6)' : '0 30px 80px rgba(0,0,0,0.18)',
                willChange: 'transform'
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5" style={{ borderBottom: `1px solid ${border}` }}>
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: pri, border: `1px solid ${border}` }}
                  >
                    <SlidersHorizontal size={18} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold" style={{ color: pri }}>{t('customizer.title')}</h3>
                    <p className="text-[12px]" style={{ color: mut }}>{t('customizer.subtitle')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      setPrimaryColor(DEFAULT_PRIMARY);
                      setBgStyle('solid');
                      setDarkPaletteId(DEFAULT_DARK_PALETTE_ID);
                      setLayoutType('vertical');
                      setSidebarSide(dir === 'rtl' ? 'right' : 'left');
                    }}
                    title={t('customizer.resetTitle')}
                    className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-semibold transition-colors flex-shrink-0"
                    style={{ color: sec, border: `1px solid ${border}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <RotateCcw size={14} /> {t('customizer.reset')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('customizer.close')}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                    style={{ color: sec, border: `1px solid ${border}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-6">
                {/* ── Theme ── */}
                <section>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: mut }}>
                    <Palette size={12} /> {t('customizer.theme')}
                  </h4>
                  <p className="text-[12px] mb-4" style={{ color: mut }}>{t('customizer.themeHint')}</p>

                  {/* Colour mode */}
                  <p className="text-[12.5px] font-semibold mb-3" style={{ color: sec }}>{t('customizer.colourMode')}</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <PreviewCard isDark={isDark} accent={accent} active={!isDark} onClick={() => setTheme('light')} label={t('customizer.light')}>
                      <MiniLayout isDark={false} variant={layoutType} side={sidebarSide} accent={accent} />
                    </PreviewCard>
                    <PreviewCard isDark={isDark} accent={accent} active={isDark} onClick={() => setTheme('dark')} label={t('customizer.dark')}>
                      <MiniLayout isDark variant={layoutType} side={sidebarSide} accent={accent} {...miniProps} />
                    </PreviewCard>
                  </div>

                  {/* Dark background palettes */}
                  <p className="text-[12.5px] font-semibold mb-1" style={{ color: sec }}>{t('customizer.darkBackground')}</p>
                  <p className="text-[11px] mb-3" style={{ color: mut }}>
                    {t('customizer.darkBackgroundHint')}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {DARK_PALETTES.map((p) => {
                      const isActive = darkPaletteId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setTheme('dark');
                            setDarkPaletteId(p.id);
                          }}
                          aria-pressed={isActive}
                          className="text-start rounded-2xl p-2.5 transition-all active:scale-[0.98]"
                          style={{
                            background: isActive ? hexToRgba(accent, 0.12) : 'rgba(255,255,255,0.03)',
                            border: isActive ? `1.5px solid ${accent}` : `1px solid ${border}`,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="flex rounded-lg overflow-hidden shrink-0"
                              style={{ width: 44, height: 28, border: `1px solid ${border}` }}
                              aria-hidden
                            >
                              <span style={{ flex: 1.1, background: p.bg }} />
                              <span style={{ flex: 0.9, background: p.surface }} />
                              <span style={{ flex: 0.85, background: p.elevated }} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[12px] font-semibold truncate" style={{ color: pri }}>
                                {t(`customizer.palette.${p.id}`)}
                              </span>
                              <span className="block text-[10px] truncate" style={{ color: mut }}>
                                {t(`customizer.paletteHint.${p.id}`)}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Primary colour — 12 brand accents */}
                  <p className="text-[12.5px] font-semibold mb-3" style={{ color: sec }}>
                    {t('customizer.accentColours')}
                  </p>
                  <p className="text-[11px] mb-3" style={{ color: mut }}>
                    {t('customizer.accentColoursHint')}
                  </p>
                  <div className="grid grid-cols-6 gap-2.5 mb-1">
                    {THEME_COLORS.map(({ hex: c, id, soft }) => {
                      const isActive = primaryColor.toLowerCase() === c.toLowerCase();
                      const colorLabel = t(`customizer.color.${id}`);
                      return (
                        <button
                          key={c}
                          type="button"
                          title={colorLabel}
                          onClick={() => setPrimaryColor(c)}
                          aria-label={t('customizer.accent', { label: colorLabel })}
                          aria-pressed={isActive}
                          className="relative rounded-xl flex flex-col items-center justify-center gap-1.5 py-2 transition-transform hover:scale-[1.04] active:scale-95"
                          style={{
                            background: isDark ? hexToRgba(c, 0.12) : hexToRgba(c, 0.08),
                            border: isActive
                              ? `1.5px solid ${c}`
                              : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                            boxShadow: isActive ? `0 0 0 3px ${hexToRgba(c, 0.28)}` : 'none',
                          }}
                        >
                          <span
                            className="rounded-full flex items-center justify-center"
                            style={{
                              width: 22,
                              height: 22,
                              background: `linear-gradient(145deg, ${soft}, ${c})`,
                              boxShadow: `inset 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'}`,
                            }}
                          >
                            {isActive && <Check size={12} strokeWidth={3} color="#ffffff" />}
                          </span>
                          <span
                            className="text-[9px] font-semibold truncate max-w-full px-0.5"
                            style={{ color: isActive ? c : mut }}
                          >
                            {colorLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-3 mb-1">
                    <GlassColorPicker
                      isDark={isDark}
                      value={primaryColor}
                      onChange={setPrimaryColor}
                      isPresetActive={isPresetActive}
                    />
                    <span className="text-[11px]" style={{ color: mut }}>
                      {t('customizer.custom')}
                    </span>
                  </div>

                  {/* Background style */}
                  <div className="mt-6">
                    <p className="text-[12.5px] font-semibold mb-3" style={{ color: sec }}>{t('customizer.backgroundStyle')}</p>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {bgTypes.map((type) => {
                        const active = bgStyle === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setBgStyle(type as any)}
                            className="py-1.5 rounded-[10px] text-[11.5px] font-semibold transition-all active:scale-95"
                            style={{
                              background: active ? hexToRgba(accent, isDark ? 0.15 : 0.1) : 'transparent',
                              color: active ? accent : sec,
                              border: active ? `1.5px solid ${accent}` : `1px solid ${border}`
                            }}
                          >
                            {t(`customizer.bg.${type}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Divider */}
                <div className="my-6" style={{ borderTop: `1px solid ${border}` }} />

                {/* ── Layout ── */}
                <section>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: mut }}>{t('customizer.layout')}</h4>
                  <p className="text-[12px] mb-4" style={{ color: mut }}>{t('customizer.layoutHint')}</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <PreviewCard isDark={isDark} accent={accent} active={layoutType === 'vertical'} onClick={() => setLayoutType('vertical')} label={t('customizer.vertical')}>
                      <MiniLayout isDark={isDark} variant="vertical" side={sidebarSide} accent={accent} {...miniProps} />
                    </PreviewCard>
                    <PreviewCard isDark={isDark} accent={accent} active={layoutType === 'horizontal'} onClick={() => setLayoutType('horizontal')} label={t('customizer.horizontal')}>
                      <MiniLayout isDark={isDark} variant="horizontal" accent={accent} {...miniProps} />
                    </PreviewCard>
                    <PreviewCard isDark={isDark} accent={accent} active={layoutType === 'twocolumn'} onClick={() => setLayoutType('twocolumn')} label={t('customizer.twoColumn')}>
                      <MiniLayout isDark={isDark} variant="twocolumn" accent={accent} {...miniProps} />
                    </PreviewCard>
                    <PreviewCard isDark={isDark} accent={accent} active={layoutType === 'semibox'} onClick={() => setLayoutType('semibox')} label={t('customizer.semiBox')}>
                      <MiniLayout isDark={isDark} variant="semibox" side={sidebarSide} accent={accent} {...miniProps} />
                    </PreviewCard>
                  </div>

                  {(layoutType === 'vertical' || layoutType === 'semibox') && (
                    <div>
                      <p className="text-[12.5px] font-semibold mb-3" style={{ color: sec }}>{t('customizer.sidebarPosition')}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <PreviewCard isDark={isDark} accent={accent} active={sidebarSide === 'left'} onClick={() => setSidebarSide('left')} label={t('customizer.left')}>
                          <MiniLayout isDark={isDark} variant={layoutType} side="left" accent={accent} {...miniProps} />
                        </PreviewCard>
                        <PreviewCard isDark={isDark} accent={accent} active={sidebarSide === 'right'} onClick={() => setSidebarSide('right')} label={t('customizer.right')}>
                          <MiniLayout isDark={isDark} variant={layoutType} side="right" accent={accent} {...miniProps} />
                        </PreviewCard>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
