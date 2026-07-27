'use client';

import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  textPrimary,
  textMuted,
  borderSubtle,
} from '@/components/SafeDashboard/theme';

/** Parent card frame — transparent in dark; children keep their own fills */
export function WidgetFrame({
  title,
  children,
  isDark,
  loading,
  error,
  action,
  elevated: _elevated = false,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  isDark: boolean;
  loading?: boolean;
  error?: string | null;
  action?: React.ReactNode;
  /** @deprecated Parent frames stay flat; kept for call-site compat */
  elevated?: boolean;
  className?: string;
}) {
  void _elevated;
  const { t } = useLang();
  const border = borderSubtle(isDark);

  return (
    <section
      className={`rounded-[18px] p-5 space-y-4 ${className}`}
      style={{ background: 'transparent', border: `1px solid ${border}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
          {title}
        </h3>
        {action}
      </div>
      {loading && (
        <p className="text-sm" style={{ color: textMuted(isDark) }}>
          {t('common.loading')}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && children}
    </section>
  );
}
