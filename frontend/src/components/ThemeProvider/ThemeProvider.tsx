'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  hexToRgba,
  hexToRgbChannels,
  lighten,
  darken,
  getContrastYIQ,
  getDarkPalette,
  DEFAULT_DARK_PALETTE_ID,
  DEFAULT_PRIMARY,
  THEME_COLORS,
  type DarkPaletteId,
} from '@/components/SafeDashboard/theme';

type Theme = 'dark' | 'light';
type BgStyle = 'plasma' | 'solid' | 'mesh' | 'dots' | 'grid' | 'aurora';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const PALETTE_IDS: DarkPaletteId[] = [
  'enterhub',
  'midnight',
  'charcoal',
  'graphite',
  'oled',
  'navy',
  'zinc',
];
/** Bump when shipping a new brand default so previous auto-defaults migrate once. */
const THEME_PRESET_VERSION = 'enterhub-flat-chrome-v3';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
  /** Live accent colour (hex). Drives the --primary CSS variables and any
   *  canvas/chart that can't read a CSS variable directly. */
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  bgStyle: BgStyle;
  setBgStyle: (style: BgStyle) => void;
  /** Cool-black background stack for dark mode */
  darkPaletteId: DarkPaletteId;
  setDarkPaletteId: (id: DarkPaletteId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggle: () => {},
  setTheme: () => {},
  primaryColor: DEFAULT_PRIMARY,
  setPrimaryColor: () => {},
  bgStyle: 'solid',
  setBgStyle: () => {},
  darkPaletteId: DEFAULT_DARK_PALETTE_ID,
  setDarkPaletteId: () => {},
});

function applyDarkPaletteVars(paletteId: DarkPaletteId) {
  const p = getDarkPalette(paletteId);
  const root = document.documentElement;
  root.style.setProperty('--background', p.bg);
  root.style.setProperty('--surface', p.surface);
  root.style.setProperty('--elevated', p.elevated);
  root.style.setProperty('--chip', p.chip);
  root.style.setProperty('--card', p.elevated);
  root.style.setProperty('--card-bg', p.elevated);
  root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.08)');
  root.style.setProperty('--border', 'rgba(255, 255, 255, 0.1)');
  root.style.setProperty('--input', 'rgba(255, 255, 255, 0.12)');
  root.dataset.darkPalette = p.id;
}

function clearDarkPaletteInlineVars() {
  const root = document.documentElement;
  for (const key of [
    '--background',
    '--surface',
    '--elevated',
    '--chip',
    '--card',
    '--card-bg',
    '--card-border',
    '--border',
    '--input',
  ]) {
    root.style.removeProperty(key);
  }
  delete root.dataset.darkPalette;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY);
  const [bgStyle, setBgStyle] = useState<BgStyle>('solid');
  const [darkPaletteId, setDarkPaletteId] = useState<DarkPaletteId>(DEFAULT_DARK_PALETTE_ID);

  // Hydrate persisted prefs on the client only (avoids SSR hydration mismatch).
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    }

    // One-time migrate to the Enterhub brand default (slate + blue from product UI).
    const preset = localStorage.getItem('safe-theme-preset');
    if (preset !== THEME_PRESET_VERSION) {
      const prevPal = localStorage.getItem('safe-dark-palette');
      const prevPrimary = localStorage.getItem('safe-primary-color');
      const wasAutoDefault =
        !prevPal ||
        prevPal === 'midnight' ||
        prevPal === 'ENTERHUB' ||
        prevPal === 'Enterhub' ||
        prevPal === 'enterhub';
      const wasAutoPrimary =
        !prevPrimary ||
        prevPrimary === '#3b82f6' ||
        prevPrimary === '#2563EB' ||
        prevPrimary === '#2563eb' ||
        prevPrimary === '#6366f1' ||
        prevPrimary === '#4f46e5' ||
        prevPrimary === '#818cf8';

      if (wasAutoDefault) {
        localStorage.setItem('safe-dark-palette', DEFAULT_DARK_PALETTE_ID);
        setDarkPaletteId(DEFAULT_DARK_PALETTE_ID);
      }
      if (wasAutoPrimary) {
        localStorage.setItem('safe-primary-color', DEFAULT_PRIMARY);
        setPrimaryColor(DEFAULT_PRIMARY);
      }
      localStorage.setItem('safe-theme-preset', THEME_PRESET_VERSION);
    }

    let c = localStorage.getItem('safe-primary-color');
    // Migrate old indigo/pink defaults → brand blue
    if (c === '#6366f1' || c === '#4f46e5' || c === '#818cf8') {
      c = DEFAULT_PRIMARY;
      localStorage.setItem('safe-primary-color', DEFAULT_PRIMARY);
    }
    if (c && HEX_RE.test(c)) setPrimaryColor(c);

    const bg = localStorage.getItem('safe-bg-style') as BgStyle | null;
    if (bg && ['plasma', 'solid', 'mesh', 'dots', 'grid', 'aurora'].includes(bg)) {
      // Prefer solid white/black canvas for readability (plasma/dots hide text)
      if (bg === 'plasma' || bg === 'dots' || bg === 'grid') {
        setBgStyle('solid');
        localStorage.setItem('safe-bg-style', 'solid');
      } else {
        setBgStyle(bg);
      }
    } else {
      setBgStyle('solid');
      localStorage.setItem('safe-bg-style', 'solid');
    }

    const pal = localStorage.getItem('safe-dark-palette');
    if (pal && PALETTE_IDS.includes(pal as DarkPaletteId)) {
      setDarkPaletteId(pal as DarkPaletteId);
    } else {
      setDarkPaletteId(DEFAULT_DARK_PALETTE_ID);
      localStorage.setItem('safe-dark-palette', DEFAULT_DARK_PALETTE_ID);
    }
  }, []);

  // Theme class drives every var(--*) token (see globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      applyDarkPaletteVars(darkPaletteId);
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      clearDarkPaletteInlineVars();
    }
    localStorage.setItem('theme', theme);
  }, [theme, darkPaletteId]);

  // Push the accent onto the document as CSS variables so every var(--primary) /
  // rgba(var(--primary-rgb), a) / var(--ring) consumer across the app recolours.
  // Hover shade is mode-aware: lighter on dark, darker on light.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-rgb', hexToRgbChannels(primaryColor));
    root.style.setProperty('--primary-fg', getContrastYIQ(primaryColor));
    root.style.setProperty('--primary-hover', theme === 'dark' ? lighten(primaryColor, 0.2) : darken(primaryColor, 0.15));
    root.style.setProperty('--primary-transparent', hexToRgba(primaryColor, 0.15));
    root.style.setProperty('--ring', primaryColor);

    // 12-colour brand system → CSS tokens for charts, tags, avatars
    THEME_COLORS.forEach((c, i) => {
      root.style.setProperty(`--accent-${c.id}`, c.hex);
      root.style.setProperty(`--accent-${c.id}-soft`, c.soft);
      root.style.setProperty(`--chart-${i + 1}`, c.hex);
    });
  }, [primaryColor, theme]);

  useEffect(() => {
    try { localStorage.setItem('safe-primary-color', primaryColor); } catch { /* ignore */ }
  }, [primaryColor]);

  useEffect(() => {
    try { localStorage.setItem('safe-dark-palette', darkPaletteId); } catch { /* ignore */ }
  }, [darkPaletteId]);

  const toggle = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    localStorage.setItem('safe-bg-style', bgStyle);
    document.documentElement.setAttribute('data-bg-style', bgStyle);
  }, [bgStyle]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggle,
        setTheme,
        primaryColor,
        setPrimaryColor,
        bgStyle,
        setBgStyle,
        darkPaletteId,
        setDarkPaletteId,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
