'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  glassStyle,
  hexToRgba,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

type Usage = {
  labels: { plan: string; storageLabel: string };
  seats: { used: number; limit: number; gift: number; totalCapacity: number };
  storage: {
    usedMb: number;
    limitMb: number;
    remainingMb: number;
    percentUsed: number;
    isFull: boolean;
    extraMb: number;
  };
  subscription: {
    forever: boolean;
    daysRemaining: number | null;
    planExpiresAt: string | null;
  };
  isOwner: boolean;
};

export function WorkspaceUsageStrip({ workspaceId }: { workspaceId: string }) {
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [data, setData] = useState<Usage | null>(null);
  const glass = glassStyle(isDark);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/usage`);
      const json = await res.json();
      if (res.ok) setData(json.data);
    })();
  }, [workspaceId]);

  if (!data) return null;

  const daysLabel = data.subscription.forever
    ? t('usageStrip.foreverFree')
    : data.subscription.daysRemaining != null
      ? t('usageStrip.daysLeft', { n: data.subscription.daysRemaining })
      : '—';

  const barColor =
    data.storage.percentUsed >= 90
      ? '#ef4444'
      : data.storage.percentUsed >= 70
        ? '#f59e0b'
        : '#22c55e';

  const cards = [
    {
      label: t('usageStrip.plan'),
      value: data.labels.plan,
      sub: daysLabel,
      color: '#3b82f6',
    },
    {
      label: t('usageStrip.seats'),
      value: `${data.seats.used}/${data.seats.totalCapacity}`,
      sub:
        data.seats.gift > 0
          ? t('usageStrip.giftSeats', { n: data.seats.gift })
          : t('usageStrip.activeMembers'),
      color: '#8b5cf6',
    },
    {
      label: t('usageStrip.cloudStorage'),
      value: data.labels.storageLabel,
      sub:
        data.storage.extraMb > 0
          ? t('usageStrip.storageAddon', {
              n: Math.round(data.storage.extraMb / 1024),
            })
          : t('usageStrip.storageFreeMb', { n: data.storage.remainingMb }),
      color: '#06b6d4',
    },
  ];

  return (
    <section
      className="w-full rounded-[22px] p-5 sm:p-6 relative overflow-hidden"
      style={{
        ...glass,
        border: `1px solid ${
          data.storage.isFull ? 'rgba(239,68,68,0.45)' : glass.borderColor
        }`,
        boxShadow: isDark ? '0 10px 36px rgba(0,0,0,0.35)' : '0 10px 28px rgba(15,23,42,0.06)',
      }}
    >
      <div
        className="pointer-events-none absolute -top-20 right-0 w-64 h-64 rounded-full opacity-35"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(primaryColor, 0.5)} 0%, transparent 70%)`,
          filter: 'blur(32px)',
        }}
      />

      <div className="relative flex flex-col lg:flex-row lg:items-center gap-5 justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 min-w-0">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl px-4 py-3"
              style={{
                background: hexToRgba(c.color, isDark ? 0.14 : 0.1),
                border: `1px solid ${hexToRgba(c.color, 0.28)}`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c.color }}>
                {c.label}
              </p>
              <p className="text-sm sm:text-base font-bold mt-1 truncate" style={{ color: textPrimary(isDark) }}>
                {c.value}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: textSecondary(isDark) }}>
                {c.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/workspace/${workspaceId}/settings/media`}
            className="text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-transform hover:scale-[1.02]"
            style={{
              background: hexToRgba('#ec4899', isDark ? 0.2 : 0.12),
              color: '#ec4899',
              border: `1px solid ${hexToRgba('#ec4899', 0.35)}`,
            }}
          >
            {t('usageStrip.photoGallery')}
          </Link>
          {(data.isOwner || data.storage.isFull) && (
            <Link
              href={`/workspace/${workspaceId}/settings/billing`}
              className="text-xs font-semibold px-3.5 py-2.5 rounded-xl text-white transition-transform hover:scale-[1.02]"
              style={{
                background: data.storage.isFull
                  ? 'linear-gradient(135deg,#ef4444,#f97316)'
                  : `linear-gradient(135deg, ${primaryColor}, #8b5cf6)`,
              }}
            >
              {data.storage.isFull
                ? t('usageStrip.buyMoreCloud')
                : t('usageStrip.managePlan')}
            </Link>
          )}
        </div>
      </div>

      <div className="relative mt-4">
        <div className="flex justify-between text-[10px] mb-1.5" style={{ color: textMuted(isDark) }}>
          <span>{t('usageStrip.storageUsed')}</span>
          <span>{data.storage.percentUsed}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: hexToRgba(barColor, 0.15) }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, data.storage.percentUsed)}%`,
              background: `linear-gradient(90deg, ${barColor}, ${hexToRgba(barColor, 0.7)})`,
            }}
          />
        </div>
        {data.storage.isFull && (
          <p className="text-xs mt-2 font-medium" style={{ color: '#ef4444' }}>
            {t('usageStrip.cloudFullHint')}
          </p>
        )}
      </div>
    </section>
  );
}
