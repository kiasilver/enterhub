'use client';

import {
  textPrimary,
  textSecondary,
  textMuted,
  surfaceItem,
  borderSubtle,
} from '@/components/SafeDashboard/theme';

export function KpiCard({
  title,
  value,
  hint,
  isDark,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
  isDark: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: surfaceItem(isDark),
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      <p className="text-xs uppercase tracking-widest" style={{ color: textMuted(isDark) }}>
        {title}
      </p>
      <p className="text-2xl font-bold mt-1 tabular-nums" style={{ color: textPrimary(isDark) }}>
        {value}
      </p>
      {hint ? (
        <p className="text-xs mt-1.5" style={{ color: textSecondary(isDark) }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
