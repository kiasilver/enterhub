'use client';

import { useLang } from '@/components/LanguageProvider/LanguageProvider';

/** Iran flag (left) / UK flag (right) — compact bilingual control */
export function LanguageSwitcher({
  className = '',
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md';
}) {
  const { lang, setLang, t } = useLang();
  const pad = size === 'sm' ? 'p-1' : 'p-1.5';
  const flag = size === 'sm' ? 18 : 22;

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full ${pad} ${className}`}
      style={{
        border: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
        background: 'color-mix(in srgb, currentColor 6%, transparent)',
      }}
      role="group"
      aria-label={t('common.language')}
    >
      <button
        type="button"
        onClick={() => setLang('fa')}
        title={t('common.switchToFa')}
        aria-label={t('common.switchToFa')}
        aria-pressed={lang === 'fa'}
        className="rounded-full overflow-hidden transition-all duration-200 min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
        style={{
          outline: lang === 'fa' ? '2px solid #2563EB' : '2px solid transparent',
          outlineOffset: 1,
          opacity: lang === 'fa' ? 1 : 0.55,
        }}
      >
        <IranFlag width={flag} height={Math.round(flag * 0.72)} />
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        title={t('common.switchToEn')}
        aria-label={t('common.switchToEn')}
        aria-pressed={lang === 'en'}
        className="rounded-full overflow-hidden transition-all duration-200 min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
        style={{
          outline: lang === 'en' ? '2px solid #2563EB' : '2px solid transparent',
          outlineOffset: 1,
          opacity: lang === 'en' ? 1 : 0.55,
        }}
      >
        <UkFlag width={flag} height={Math.round(flag * 0.72)} />
      </button>
    </div>
  );
}

function IranFlag({ width, height }: { width: number; height: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 3 2" aria-hidden className="rounded-[2px]">
      {/* Green · White · Red (top → bottom) */}
      <rect width="3" height="0.667" y="0" fill="#239f40" />
      <rect width="3" height="0.667" y="0.667" fill="#ffffff" />
      <rect width="3" height="0.666" y="1.334" fill="#da0000" />
      <circle cx="1.5" cy="1" r="0.16" fill="#da0000" />
    </svg>
  );
}

function UkFlag({ width, height }: { width: number; height: number }) {
  const clipId = `uk-s-${width}-${height}`;
  return (
    <svg width={width} height={height} viewBox="0 0 60 30" aria-hidden className="rounded-[2px]">
      <clipPath id={clipId}>
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}
