'use client';

import Link from 'next/link';
import { MdAutoAwesome } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { landingText } from './landing-theme';

export function LandingFreeBanner({ isDark }: { isDark: boolean }) {
  const colors = landingText(isDark);
  const { t } = useLang();

  return (
    <section id="free" className="scroll-mt-28 pt-16 sm:pt-24 pb-4">
      <div
        className="relative overflow-hidden rounded-3xl px-4 py-8 sm:px-10 sm:py-14 text-center"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(37,99,235,0.35) 0%, rgba(15,23,42,0.9) 45%, rgba(8,47,73,0.85) 100%)'
            : 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 50%, #e0f2fe 100%)',
          border: isDark ? '1px solid rgba(96,165,250,0.35)' : '1px solid rgba(37,99,235,0.2)',
          boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.45)' : '0 24px 60px rgba(37,99,235,0.12)',
        }}
      >
        <div
          className="mx-auto mb-5 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(37,99,235,0.12)',
            color: colors.accent,
          }}
        >
          <MdAutoAwesome size={26} />
        </div>
        <h2
          className="text-xl sm:text-2xl md:text-4xl font-black leading-snug max-w-3xl mx-auto mb-3"
          style={{ color: colors.primary }}
        >
          {t('freeBanner.title')}
        </h2>
        <p className="text-sm sm:text-base max-w-xl mx-auto mb-7" style={{ color: colors.secondary }}>
          {t('freeBanner.body')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-7 rounded-full text-sm font-semibold"
            style={{ backgroundColor: isDark ? '#fff' : '#0a0a0a', color: isDark ? '#0a0a0a' : '#fff' }}
          >
            {t('freeBanner.ctaStart')}
          </Link>
          <Link
            href="#plans"
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-7 rounded-full text-sm font-semibold backdrop-blur-sm"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
              border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.12)',
              color: colors.primary,
            }}
          >
            {t('freeBanner.ctaPlans')}
          </Link>
        </div>
      </div>
    </section>
  );
}
