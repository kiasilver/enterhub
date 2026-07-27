/**
 * Theme-aware surface utilities.
 * Dark mode reads CSS variables (--background / --surface / --elevated)
 * set by ThemeProvider from a selectable cool-black palette so sidebar,
 * topbar, canvas, and cards stay in one family.
 */

/** Fallback — canvas and chrome share one color */
export const DARK_BG = '#0F172A';
export const DARK_SURFACE = '#0F172A';
export const DARK_ELEVATED = '#1E293B';
export const DARK_CHIP = '#334155';

export type DarkPaletteId =
  | 'enterhub'
  | 'midnight'
  | 'charcoal'
  | 'graphite'
  | 'oled'
  | 'navy'
  | 'zinc';

export type DarkPalette = {
  id: DarkPaletteId;
  label: string;
  /** Short hint shown in the customizer */
  hint: string;
  /** App canvas */
  bg: string;
  /** Sidebar / topbar chrome */
  surface: string;
  /** Cards / elevated panels */
  elevated: string;
  /** Nested chips / inputs */
  chip: string;
};

/** Curated cool blacks — no warm mud, no random navy clashes */
export const DARK_PALETTES: DarkPalette[] = [
  {
    id: 'enterhub',
    label: 'Enterhub',
    hint: 'Default brand dark',
    bg: '#0F172A',
    surface: '#0F172A',
    elevated: '#1E293B',
    chip: '#334155',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    hint: 'Cool ink blue-black',
    bg: '#0B1220',
    surface: '#0B1220',
    elevated: '#151C2C',
    chip: '#2A3347',
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    hint: 'Soft gray slate',
    bg: '#111827',
    surface: '#111827',
    elevated: '#1F2937',
    chip: '#374151',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    hint: 'Neutral soft black',
    bg: '#12141A',
    surface: '#12141A',
    elevated: '#1A1D27',
    chip: '#323646',
  },
  {
    id: 'oled',
    label: 'OLED',
    hint: 'True deep black',
    bg: '#050506',
    surface: '#050506',
    elevated: '#121214',
    chip: '#2A2A2E',
  },
  {
    id: 'navy',
    label: 'Deep Navy',
    hint: 'Quiet blue night',
    bg: '#0A1020',
    surface: '#0A1020',
    elevated: '#131B2E',
    chip: '#2A3550',
  },
  {
    id: 'zinc',
    label: 'Zinc',
    hint: 'Modern cool zinc',
    bg: '#09090B',
    surface: '#09090B',
    elevated: '#18181B',
    chip: '#3F3F46',
  },
];

export const DEFAULT_DARK_PALETTE_ID: DarkPaletteId = 'enterhub';
export const DEFAULT_PRIMARY = '#2563EB';

/**
 * Brand accent system — 12 curated colours tuned for cool-slate dark UI
 * (#0F172A / #131B2B) and clean light mode. Use for primary picker, charts,
 * avatars, tags, and status accents so the product stays one visual family.
 */
export type ThemeColorId =
  | 'blue'
  | 'sky'
  | 'cyan'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'pink'
  | 'violet'
  | 'indigo'
  | 'slate';

export type ThemeColor = {
  id: ThemeColorId;
  label: string;
  /** Solid swatch / charts / icons */
  hex: string;
  /** Slightly softer companion for dark canvases */
  soft: string;
};

export const THEME_COLORS: readonly ThemeColor[] = [
  { id: 'blue', label: 'Blue', hex: '#2563EB', soft: '#60A5FA' },
  { id: 'sky', label: 'Sky', hex: '#0EA5E9', soft: '#38BDF8' },
  { id: 'cyan', label: 'Cyan', hex: '#06B6D4', soft: '#22D3EE' },
  { id: 'teal', label: 'Teal', hex: '#14B8A6', soft: '#2DD4BF' },
  { id: 'emerald', label: 'Emerald', hex: '#22C55E', soft: '#4ADE80' },
  { id: 'amber', label: 'Amber', hex: '#F59E0B', soft: '#FBBF24' },
  { id: 'orange', label: 'Orange', hex: '#F97316', soft: '#FB923C' },
  { id: 'rose', label: 'Rose', hex: '#EF4444', soft: '#F87171' },
  { id: 'pink', label: 'Pink', hex: '#EC4899', soft: '#F472B6' },
  { id: 'violet', label: 'Violet', hex: '#8B5CF6', soft: '#A78BFA' },
  { id: 'indigo', label: 'Indigo', hex: '#6366F1', soft: '#818CF8' },
  { id: 'slate', label: 'Slate', hex: '#64748B', soft: '#94A3B8' },
] as const;

/** Hex list only — charts, rotating rows, cover colours */
export const THEME_COLOR_HEXES: readonly string[] = THEME_COLORS.map((c) => c.hex);

export function getThemeColor(id: ThemeColorId | string): ThemeColor {
  return THEME_COLORS.find((c) => c.id === id) ?? THEME_COLORS[0]!;
}

export function themeColorHex(id: ThemeColorId): string {
  return getThemeColor(id).hex;
}

/** Mode-aware accent: soft jewel on dark, solid brand on light */
export function themeAccent(id: ThemeColorId, isDark: boolean): string {
  const c = getThemeColor(id);
  return isDark ? c.soft : c.hex;
}

export function themeColorAt(index: number): string {
  const i = ((index % THEME_COLOR_HEXES.length) + THEME_COLOR_HEXES.length) % THEME_COLOR_HEXES.length;
  return THEME_COLOR_HEXES[i]!;
}

/** Semantic aliases kept in the same 12-colour family */
export const THEME_SEMANTIC = {
  primary: 'blue' as ThemeColorId,
  info: 'sky' as ThemeColorId,
  success: 'emerald' as ThemeColorId,
  warning: 'amber' as ThemeColorId,
  danger: 'rose' as ThemeColorId,
  channel: 'violet' as ThemeColorId,
  dm: 'cyan' as ThemeColorId,
  letter: 'amber' as ThemeColorId,
  saved: 'pink' as ThemeColorId,
  team: 'blue' as ThemeColorId,
} as const;

export function getDarkPalette(id: string | null | undefined): DarkPalette {
  const normalized =
    id === 'ENTERHUB' || id === 'Enterhub' ? 'enterhub' : id;
  return DARK_PALETTES.find((p) => p.id === normalized) ?? DARK_PALETTES[0]!;
}

export function glassStyle(isDark: boolean): React.CSSProperties {
  return isDark
    ? {
        background: 'var(--background)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: '16px',
      }
    : {
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: '16px',
      };
}

export function textPrimary(isDark: boolean) {
  return isDark ? '#F9FAFB' : '#111827';
}

export function textSecondary(isDark: boolean) {
  return isDark ? '#9CA3AF' : '#4B5563';
}

export function textMuted(isDark: boolean) {
  return isDark ? '#6B7280' : '#9CA3AF';
}

export function surfaceHover(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
}

/** Nested item / chip fill — solid slate so lists stay readable on flat parents */
export function surfaceItem(isDark: boolean) {
  return isDark ? '#131B2B' : 'rgba(0,0,0,0.04)';
}

/**
 * Table row fill — flat on the canvas (no solid zebra blocks).
 * Alternate rows get a whisper of contrast; hover should use surfaceHover.
 */
export function tableRowBg(isDark: boolean, index: number) {
  if (index % 2 === 0) return 'transparent';
  return isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)';
}

/** Hairline under table rows / headers */
export function tableRowBorder(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
}

/** Recharts tooltip — dark theme fill + white text */
export function chartTooltipStyle(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? surfaceItem(isDark) : '#ffffff',
    border: `1px solid ${borderSubtle(isDark)}`,
    borderRadius: 12,
    color: isDark ? '#F9FAFB' : '#111827',
    fontSize: 12,
    boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.55)' : '0 8px 24px rgba(15,23,42,0.12)',
  };
}

export function chartTooltipLabelStyle(isDark: boolean): React.CSSProperties {
  return { color: isDark ? '#F9FAFB' : '#111827', fontWeight: 600 };
}

export function chartTooltipItemStyle(isDark: boolean): React.CSSProperties {
  return { color: isDark ? '#F9FAFB' : '#374151' };
}

/** Flat panel — matches page canvas (default for most chrome / widgets) */
export function flatPanel(isDark: boolean) {
  return isDark ? 'transparent' : 'transparent';
}

export function panelFill(isDark: boolean) {
  /** Elevated surface for important content blocks only */
  return isDark ? 'var(--elevated)' : 'rgba(255,255,255,0.94)';
}

export function elevatedFill(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
}

export function bubbleFill(isDark: boolean, mine: boolean) {
  if (mine) {
    return isDark
      ? 'color-mix(in srgb, var(--primary) 32%, var(--surface))'
      : 'color-mix(in srgb, var(--primary) 14%, white)';
  }
  return panelFill(isDark);
}

export function borderSubtle(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
}

export function canvasBg(isDark: boolean) {
  return isDark ? 'var(--background)' : '#ffffff';
}

export function chromeBg(isDark: boolean) {
  /** Sidebar slightly darker than page canvas */
  return isDark
    ? 'color-mix(in srgb, var(--background) 88%, #000)'
    : '#e8e8ec';
}

export function glassTopbar(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'var(--background)' : 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderBottom: `1px solid ${borderSubtle(isDark)}`,
  };
}

export function glassSidebar(isDark: boolean): React.CSSProperties {
  return {
    background: chromeBg(isDark),
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    borderRight: `1px solid ${borderSubtle(isDark)}`,
  };
}

/** Search / filter fields — no fill in dark mode */
export function searchFieldBg(isDark: boolean) {
  return isDark ? 'transparent' : 'rgba(0,0,0,0.03)';
}

/** Selected / active row fill — neutral, no accent wash in dark */
export function selectedFill(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
}

function parseHex(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(c: number) {
  return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexToRgbChannels(hex: string): string {
  const [r, g, b] = parseHex(hex);
  return `${r}, ${g}, ${b}`;
}

export function getContrastYIQ(hex: string): string {
  const [r, g, b] = parseHex(hex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
}

export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const mix = (c: number) => c + (255 - c) * amount;
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function darken(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const mix = (c: number) => c * (1 - amount);
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export function glassDropdown(isDark: boolean): React.CSSProperties {
  return {
    background: isDark ? 'var(--elevated)' : 'rgba(255,255,255,0.96)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${borderSubtle(isDark)}`,
    borderRadius: '16px',
    boxShadow: isDark
      ? '0 20px 60px rgba(0,0,0,0.45)'
      : '0 20px 60px rgba(0,0,0,0.12)',
  };
}

/** Soft status tint that stays in the cool-black family (no muddy fills). */
export function statusTint(isDark: boolean, accentHex: string, strength = 0.08): string {
  if (!isDark) return hexToRgba(accentHex, 0.08);
  return hexToRgba(accentHex, strength);
}
