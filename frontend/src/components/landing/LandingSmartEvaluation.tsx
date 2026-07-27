'use client';

import { MdAutoGraph, MdFactCheck, MdInsights, MdWorkspacePremium } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { landingSurface, landingText } from './landing-theme';

const POINTS = [
  { Icon: MdFactCheck, titleKey: 'smartEval.p1Title', bodyKey: 'smartEval.p1Body' },
  { Icon: MdAutoGraph, titleKey: 'smartEval.p2Title', bodyKey: 'smartEval.p2Body' },
  { Icon: MdInsights, titleKey: 'smartEval.p3Title', bodyKey: 'smartEval.p3Body' },
] as const;

export function LandingSmartEvaluation({ isDark }: { isDark: boolean }) {
  const colors = landingText(isDark);
  const { t } = useLang();

  return (
    <section id="smart-evaluation" className="scroll-mt-28 pt-16 sm:pt-24">
      <div
        className="rounded-3xl px-5 py-8 sm:px-10 sm:py-12"
        style={{
          ...landingSurface(isDark),
          background: isDark
            ? 'linear-gradient(145deg, rgba(37,99,235,0.18) 0%, rgba(15,23,42,0.92) 42%, rgba(124,58,237,0.12) 100%)'
            : 'linear-gradient(145deg, #eff6ff 0%, #ffffff 45%, #f5f3ff 100%)',
        }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
            style={{
              background: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(245,158,11,0.12)',
              color: '#F59E0B',
              border: isDark ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <MdWorkspacePremium size={14} />
            {t('smartEval.badge')}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold max-w-3xl mb-3" style={{ color: colors.primary }}>
          {t('smartEval.title')}
        </h2>
        <p className="text-base sm:text-lg max-w-2xl mb-8" style={{ color: colors.secondary }}>
          {t('smartEval.body')}
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          {POINTS.map(({ Icon, titleKey, bodyKey }) => (
            <div
              key={titleKey}
              className="rounded-2xl p-5"
              style={{
                background: isDark ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.85)',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.1)',
                  color: colors.accent,
                }}
              >
                <Icon size={22} />
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: colors.primary }}>
                {t(titleKey)}
              </h3>
              <p className="text-[13px] leading-relaxed" style={{ color: colors.secondary }}>
                {t(bodyKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
