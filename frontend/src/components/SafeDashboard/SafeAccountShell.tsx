'use client';

import React from 'react';
import { motion, type Variants } from 'motion/react';
import { textPrimary, textSecondary, textMuted, borderSubtle, glassStyle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

export const accountContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
export const accountFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

/**
 * Harmonious multi-color palette for decorative icon tiles INSIDE the account
 * pages (the user wants varied — not uniform-accent — icons there). Buttons,
 * the tab underline, progress bars, etc. stay single-accent (primaryColor).
 * The first entry uses the live primary colour so it follows theme changes.
 * Build a tile via: { background: `${c}1a`, color: c, border: `1px solid ${c}40` }
 */
const ICON_COLORS_TAIL = ['var(--primary)', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#f43f5e'];
export function getIconColors(primary: string): string[] {
  return [primary, ...ICON_COLORS_TAIL];
}
/** @deprecated Use getIconColors(primaryColor) for theme-aware colours */
export const ICON_COLORS = ['var(--primary)', ...ICON_COLORS_TAIL];

export function iconTile(color: string): React.CSSProperties {
  return { background: `${color}1a`, color, border: `1px solid ${color}40` };
}

const TABS = [
  { id: 'account-profile', label: 'Profile' },
  { id: 'account-settings', label: 'Settings' },
  { id: 'account-billing', label: 'Billing' },
  { id: 'account-help', label: 'Help' },
];

interface Props {
  isDark: boolean;
  active: 'account-profile' | 'account-settings' | 'account-billing' | 'account-help';
  setActivePage: (id: string) => void;
  children: React.ReactNode;
}

/**
 * Shared premium shell for the Account area (Profile / Settings / Billing / Help):
 * an identity banner with a subtle single-accent mesh + an animated tab bar that
 * ties the four pages together. Pages pass their content sections as children —
 * each section should be a <motion.div variants={accountFadeUp}> (no initial/animate;
 * it inherits the staggered entrance from this shell's container).
 */
export default function SafeAccountShell({ isDark, active, setActivePage, children }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-6 py-7 pb-12">
      <motion.div className="max-w-5xl space-y-5" variants={accountContainer} initial="hidden" animate="show">

        {/* Premium identity banner */}
        <motion.div variants={accountFadeUp} className="relative rounded-3xl overflow-hidden" style={glassStyle(isDark)}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(75% 130% at 0% 0%, ${ACCENT}30, transparent 55%), radial-gradient(65% 120% at 100% 0%, ${ACCENT}1c, transparent 50%)`,
            }}
          />
          <div className="relative px-6 pt-6 pb-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `1px solid ${border}`, boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)' }}>
              <img src="/profile.png" alt="Ali Mohammadi" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2.5">
                <h2 className="text-xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Ali Mohammadi</h2>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                  style={{ background: `${ACCENT}1a`, color: ACCENT, border: `1px solid ${ACCENT}40` }}
                >
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: '#10b981', opacity: 0.4 }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#10b981' }} />
                </span>
                <p className="text-[13px] font-medium" style={{ color: sec }}>Safety Manager · Enterhub</p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="relative flex items-center gap-0.5 px-3 overflow-x-auto no-scrollbar" style={{ borderTop: `1px solid ${border}` }}>
            {TABS.map(t => {
              const on = t.id === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActivePage(t.id)}
                  className="relative px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-colors"
                  style={{ color: on ? pri : mut }}
                  onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.color = sec; }}
                  onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.color = mut; }}
                >
                  {t.label}
                  {on && (
                    <motion.span
                      layoutId="account-tab-underline"
                      className="absolute left-3 right-3 bottom-0 h-[2px] rounded-full"
                      style={{ background: ACCENT }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {children}
      </motion.div>
    </div>
  );
}
