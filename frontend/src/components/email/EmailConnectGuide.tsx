'use client';

import Link from 'next/link';
import { MdClose, MdMailOutline, MdOpenInNew } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  borderSubtle,
  glassStyle,
  hexToRgba,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

function GuideBody({
  workspaceId,
  isDark,
  error,
  hideSettingsLink,
}: {
  workspaceId: string;
  isDark: boolean;
  error?: string | null;
  hideSettingsLink?: boolean;
}) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const settingsHref = `/workspace/${workspaceId}/settings/email`;

  return (
    <>
      <div className="flex items-start gap-3">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: hexToRgba(primaryColor, 0.16), color: primaryColor }}
        >
          <MdMailOutline size={24} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>
            {t('emailPage.notConnected')}
          </h2>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: textSecondary(isDark) }}>
            {error || t('emailPage.notConnectedHint')}
          </p>
        </div>
      </div>
      <ol className="space-y-2.5 text-sm" style={{ color: textSecondary(isDark) }}>
        {[
          t('emailPage.connectStep1'),
          t('emailPage.connectStep2'),
          t('emailPage.connectStep3'),
          t('emailPage.connectStep4'),
        ].map((step, i) => (
          <li key={step} className="flex gap-3">
            <span
              className="shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
              style={{
                background: hexToRgba(primaryColor, 0.14),
                color: primaryColor,
              }}
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        {!hideSettingsLink && (
          <Link
            href={settingsHref}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-semibold text-white"
            style={{ background: primaryColor }}
          >
            {t('emailPage.connectNow')}
          </Link>
        )}
        <Link
          href="/guide?topic=email"
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-sm font-semibold"
          style={{
            border: `1px solid ${borderSubtle(isDark)}`,
            color: textPrimary(isDark),
          }}
        >
          <MdOpenInNew size={16} />
          {t('emailPage.seeGuide')}
        </Link>
      </div>
      <p className="text-[12px]" style={{ color: textMuted(isDark) }}>
        {t('emailPage.internalStillWorks')}
      </p>
    </>
  );
}

export function EmailConnectGuide({
  workspaceId,
  isDark,
  error,
  hideSettingsLink,
  asModal,
  onClose,
}: {
  workspaceId: string;
  isDark: boolean;
  error?: string | null;
  hideSettingsLink?: boolean;
  asModal?: boolean;
  onClose?: () => void;
}) {
  const { t } = useLang();

  if (!asModal) {
    return (
      <div
        className="rounded-2xl p-5 sm:p-6 space-y-4"
        style={{
          background: surfaceItem(isDark),
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
      >
        <GuideBody
          workspaceId={workspaceId}
          isDark={isDark}
          error={error}
          hideSettingsLink={hideSettingsLink}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0"
        style={{ background: isDark ? 'rgba(2,6,16,0.62)' : 'rgba(15,23,42,0.38)' }}
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[min(88vh,640px)] overflow-y-auto"
        style={glassStyle(isDark)}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 end-3 p-2 rounded-xl"
            style={{ color: textMuted(isDark) }}
            aria-label={t('common.close')}
          >
            <MdClose size={20} />
          </button>
        )}
        <GuideBody
          workspaceId={workspaceId}
          isDark={isDark}
          error={error}
          hideSettingsLink={hideSettingsLink}
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] rounded-xl text-sm font-semibold"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
            }}
          >
            {t('emailPage.connectLater')}
          </button>
        )}
      </div>
    </div>
  );
}
