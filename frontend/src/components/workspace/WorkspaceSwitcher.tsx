'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceLogo } from '@/components/workspace/WorkspaceLogo';
import {
  borderSubtle,
  surfaceHover,
  textMuted,
  textPrimary,
  textSecondary,
  panelFill,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizeRoleName, planLabelForLocale } from '@/lib/role-i18n';

type WsRow = {
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    logoUrlDark?: string | null;
    logoColor?: string | null;
    planTier?: string;
  };
  role: { name: string };
  title?: string | null;
};

export function WorkspaceSwitcher({
  currentId,
  isDark,
  variant = 'header',
}: {
  currentId: string;
  isDark: boolean;
  /** header = compact topbar control; sidebar = full-width (legacy) */
  variant?: 'header' | 'sidebar';
}) {
  const router = useRouter();
  const { primaryColor } = useTheme();
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WsRow[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/workspaces');
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.data || []);
    })();
  }, [currentId]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const current = items.find((i) => i.workspace.id === currentId)?.workspace;
  const name = current?.name || t('workspaceSwitcher.defaultName');
  const planLabel = current?.planTier ? planLabelForLocale(current.planTier, lang) : null;
  const isHeader = variant === 'header';

  return (
    <div
      ref={rootRef}
      className={`relative ${isHeader ? 'flex-shrink-0' : 'px-3 pb-2'}`}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-2 rounded-xl text-start transition-colors ${
          isHeader ? 'px-2 py-1.5 max-w-[280px] sm:max-w-[320px]' : 'w-full gap-2.5 px-2.5 py-2'
        }`}
        style={{
          border: `1px solid ${borderSubtle(isDark)}`,
          background: open ? surfaceHover(isDark) : isHeader ? 'transparent' : 'transparent',
        }}
        aria-label={t('workspaceSwitcher.switchWorkspace')}
      >
        <WorkspaceLogo
          name={name}
          logoUrl={current?.logoUrl}
          logoUrlDark={current?.logoUrlDark}
          logoColor={current?.logoColor}
          isDark={isDark}
          size={isHeader ? 28 : 32}
        />
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-1.5 min-w-0 ${isHeader ? '' : ''}`}>
            <p
              className={`font-semibold truncate ${isHeader ? 'text-xs sm:text-[13px]' : 'text-xs'}`}
              style={{ color: textPrimary(isDark) }}
            >
              {name}
            </p>
            {planLabel && (
              <span
                className="shrink-0 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.04em',
                  background: `${primaryColor}22`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}40`,
                }}
              >
                {planLabel}
              </span>
            )}
          </div>
          {!isHeader && (
            <p className="text-[10px] truncate" style={{ color: textMuted(isDark) }}>
              {t('workspaceSwitcher.switchWorkspace')}
            </p>
          )}
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className="flex-shrink-0"
          style={{ color: textMuted(isDark) }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 rounded-2xl overflow-hidden max-h-72 overflow-y-auto ${
            isHeader ? 'start-0 w-72 max-w-[calc(100vw-1.5rem)]' : 'start-3 end-3'
          }`}
          style={{
            background: panelFill(isDark),
            border: `1px solid ${borderSubtle(isDark)}`,
            boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 12px 40px rgba(0,0,0,0.12)',
          }}
        >
          {items.map((row) => {
            const w = row.workspace;
            const active = w.id === currentId;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (!active) router.push(`/workspace/${w.id}`);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-start"
                style={{
                  background: active ? surfaceHover(isDark) : 'transparent',
                  color: textSecondary(isDark),
                }}
              >
                <WorkspaceLogo
                  name={w.name}
                  logoUrl={w.logoUrl}
                  logoUrlDark={w.logoUrlDark}
                  logoColor={w.logoColor}
                  isDark={isDark}
                  size={28}
                  rounded="rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {w.name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: textMuted(isDark) }}>
                    {row.title || localizeRoleName(row.role.name, t)}
                    {w.planTier ? ` · ${planLabelForLocale(w.planTier, lang)}` : ''}
                  </p>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push(`/workspace/${currentId}/settings`);
            }}
            className="w-full px-3 py-2.5 text-xs font-semibold text-start"
            style={{
              borderTop: `1px solid ${borderSubtle(isDark)}`,
              color: textPrimary(isDark),
            }}
          >
            {t('workspaceSwitcher.workspaceSettings')}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/onboarding/company');
            }}
            className="w-full px-3 py-2.5 text-xs font-semibold text-start"
            style={{
              borderTop: `1px solid ${borderSubtle(isDark)}`,
              color: textPrimary(isDark),
            }}
          >
            {t('workspaceSwitcher.createCompany')}
          </button>
        </div>
      )}
    </div>
  );
}
