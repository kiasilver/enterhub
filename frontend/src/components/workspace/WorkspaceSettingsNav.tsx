'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  glassStyle,
  hexToRgba,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

type Caps = {
  canUpdate: boolean;
  canMembers: boolean;
  canRoles: boolean;
  canSecurity: boolean;
  canBilling: boolean;
  canAudit: boolean;
  canTransfer: boolean;
  canLabels?: boolean;
  canManage: boolean;
};

type TabDef = {
  id: string;
  labelKey: string;
  hintKey: string;
  color: string;
  href: (base: string) => string;
  show: (c: Caps) => boolean;
};

const TAB_META: TabDef[] = [
  {
    id: 'general',
    labelKey: 'settings.general',
    hintKey: 'settingsNav.brand',
    color: '#3b82f6',
    href: (b) => `${b}/settings`,
    show: (c) => c.canUpdate,
  },
  {
    id: 'members',
    labelKey: 'settings.members',
    hintKey: 'settingsNav.invite',
    color: '#22c55e',
    href: (b) => `${b}/settings/members`,
    show: (c) => c.canMembers,
  },
  {
    id: 'roles',
    labelKey: 'settings.roles',
    hintKey: 'settingsNav.roles',
    color: '#8b5cf6',
    href: (b) => `${b}/settings/roles`,
    show: (c) => c.canRoles,
  },
  {
    id: 'labels',
    labelKey: 'settings.labels',
    hintKey: 'settingsNav.labels',
    color: '#f97316',
    href: (b) => `${b}/settings/labels`,
    show: (c) => Boolean(c.canLabels) || c.canRoles || c.canUpdate,
  },
  {
    id: 'media',
    labelKey: 'settings.gallery',
    hintKey: 'settingsNav.gallery',
    color: '#ec4899',
    href: (b) => `${b}/settings/media`,
    show: () => true,
  },
  {
    id: 'security',
    labelKey: 'settings.security',
    hintKey: 'settingsNav.security',
    color: '#f59e0b',
    href: (b) => `${b}/settings/security`,
    show: (c) => c.canSecurity,
  },
  {
    id: 'ownership',
    labelKey: 'settings.ownership',
    hintKey: 'settingsNav.ownership',
    color: '#ef4444',
    href: (b) => `${b}/settings/ownership`,
    show: (c) => c.canTransfer,
  },
  {
    id: 'billing',
    labelKey: 'settings.billing',
    hintKey: 'settingsNav.billing',
    color: '#06b6d4',
    href: (b) => `${b}/settings/billing`,
    show: (c) => c.canBilling,
  },
  {
    id: 'email',
    labelKey: 'settings.email',
    hintKey: 'settingsNav.email',
    color: '#6366f1',
    href: (b) => `${b}/settings/email`,
    show: () => true,
  },
  {
    id: 'integrations',
    labelKey: 'settings.integrations',
    hintKey: 'settingsNav.integrations',
    color: '#22c55e',
    href: (b) => `${b}/settings/integrations`,
    show: () => true,
  },
  {
    id: 'audit',
    labelKey: 'settings.audit',
    hintKey: 'settingsNav.audit',
    color: '#94a3b8',
    href: (b) => `${b}/settings/audit`,
    show: (c) => c.canAudit,
  },
];

export function WorkspaceSettingsNav({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [caps, setCaps] = useState<Caps | null>(null);
  const base = `/workspace/${workspaceId}`;
  const glass = glassStyle(isDark);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/settings`);
      const json = await res.json();
      if (res.ok) setCaps(json.data.capabilities);
    })();
  }, [workspaceId]);

  const tabs = useMemo(
    () => (caps ? TAB_META.filter((tab) => tab.show(caps)) : TAB_META),
    [caps],
  );

  function active(id: string) {
    if (id === 'general') {
      return pathname === `${base}/settings` || pathname === `${base}/settings/`;
    }
    return pathname.includes(`/settings/${id}`);
  }

  return (
    <header
      className="w-full rounded-[22px] p-5 sm:p-6 relative overflow-hidden"
      style={{
        ...glass,
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.4)' : '0 12px 36px rgba(15,23,42,0.08)',
      }}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-40"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(primaryColor, 0.55)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-10 w-56 h-56 rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.45) 0%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />

      <div className="relative">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.16em] mb-2"
          style={{ color: primaryColor }}
        >
          {t('settings.workspaceSettings')}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: textPrimary(isDark) }}>
          {t('workspace.settings')}
        </h1>
        <p className="text-sm mt-1.5 max-w-xl" style={{ color: textSecondary(isDark) }}>
          Branding, team, gallery, security, and flexible cloud billing — all in one place.
        </p>

        <nav
          className="mt-5 flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {tabs.map((tab) => {
            const isActive = active(tab.id);
            return (
              <Link
                key={tab.id}
                href={tab.href(base)}
                className="group flex-shrink-0 min-w-[108px] px-3.5 py-2.5 rounded-2xl transition-all duration-200"
                style={{
                  background: isActive
                    ? hexToRgba(tab.color, isDark ? 0.22 : 0.14)
                    : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(255,255,255,0.65)',
                  border: `1px solid ${isActive ? hexToRgba(tab.color, 0.55) : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: isActive ? `0 0 0 3px ${hexToRgba(tab.color, 0.12)}` : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: tab.color, boxShadow: `0 0 8px ${hexToRgba(tab.color, 0.7)}` }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: isActive ? textPrimary(isDark) : textSecondary(isDark) }}
                  >
                    {t(tab.labelKey)}
                  </span>
                </div>
                <p className="text-[10px] pl-4" style={{ color: textMuted(isDark) }}>
                  {t(tab.hintKey)}
                </p>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
