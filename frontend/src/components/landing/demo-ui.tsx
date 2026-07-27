'use client';

import {
  textPrimary,
  textMuted,
  textSecondary,
  borderSubtle,
  surfaceItem,
  hexToRgba,
  DEFAULT_PRIMARY,
} from '@/components/SafeDashboard/theme';
import { personByInitials, type DemoPerson } from './showcase-seed';

/** Platform-matched surfaces for landing demos (Enterhub slate). */
export function demoTone(isDark: boolean) {
  return {
    primary: textPrimary(isDark),
    secondary: textSecondary(isDark),
    muted: textMuted(isDark),
    border: borderSubtle(isDark),
    card: surfaceItem(isDark),
    elevated: isDark ? '#1E293B' : '#ffffff',
    canvas: isDark ? '#0F172A' : '#F1F5F9',
    soft: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
    accent: DEFAULT_PRIMARY,
    accentSoft: isDark ? '#60A5FA' : DEFAULT_PRIMARY,
    chip: isDark ? '#334155' : '#E2E8F0',
  };
}

export function DemoAvatar({
  person,
  initials,
  color,
  size = 28,
  online,
}: {
  person?: DemoPerson | null;
  initials?: string;
  color?: string;
  size?: number;
  online?: boolean;
}) {
  const resolved = person || (initials ? personByInitials(initials) : undefined);
  const label = resolved?.initials || initials || '?';
  const bg = resolved?.color || color || '#64748B';
  const src = resolved?.avatar;

  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size, border: `1.5px solid ${hexToRgba(bg, 0.35)}` }}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          className="inline-flex items-center justify-center rounded-full font-bold text-white"
          style={{ width: size, height: size, background: bg, fontSize: Math.max(8, size * 0.36) }}
        >
          {label}
        </span>
      )}
      {online && (
        <span
          className="absolute rounded-full bg-emerald-500"
          style={{
            width: Math.max(7, size * 0.28),
            height: Math.max(7, size * 0.28),
            bottom: 0,
            right: 0,
            border: '2px solid #0F172A',
          }}
        />
      )}
    </span>
  );
}

export const SHOWCASE_SCROLL =
  'eh-showcase-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-500/40 [&::-webkit-scrollbar-track]:bg-transparent';
