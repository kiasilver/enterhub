'use client';

import { glassStyle, hexToRgba, textPrimary } from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

/** Glass surface for workspace settings panels (matches SafeDashboard chrome). */
export function SettingsGlassCard({
  children,
  className = '',
  accent,
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Optional left accent bar color */
  accent?: string;
  padding?: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const glass = glassStyle(isDark);

  return (
    <section
      className={`relative overflow-hidden ${padding ? 'p-5 sm:p-6' : ''} ${className}`}
      style={{
        ...glass,
        borderRadius: 20,
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.35)'
          : '0 8px 28px rgba(15,23,42,0.06)',
      }}
    >
      {accent && (
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ background: `linear-gradient(180deg, ${accent}, ${hexToRgba(accent, 0.35)})` }}
        />
      )}
      {children}
    </section>
  );
}

export function SettingsSectionTitle({
  title,
  subtitle,
  badge,
  badgeColor = '#3b82f6',
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: textPrimary(isDark) }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1 max-w-2xl" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {badge && (
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{
            background: hexToRgba(badgeColor, 0.15),
            color: badgeColor,
            border: `1px solid ${hexToRgba(badgeColor, 0.3)}`,
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
