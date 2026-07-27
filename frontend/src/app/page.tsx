'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import VariableProximity from '@/components/VariableProximity/VariableProximity';
import { enterhubLogoSrc } from '@/components/brand/EnterhubBrand';
import { LandingProductShowcase } from '@/components/landing/LandingProductShowcase';
import { LandingLearn } from '@/components/landing/LandingLearn';
import { LandingPlans } from '@/components/landing/LandingPlans';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingFreeBanner } from '@/components/landing/LandingFreeBanner';
import { LandingSmartEvaluation } from '@/components/landing/LandingSmartEvaluation';
import { landingText } from '@/components/landing/landing-theme';

export default function Home() {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';
  const colors = landingText(isDark);
  const containerRef = useRef<HTMLElement | null>(null);

  return (
    <main
      className="relative min-h-screen overflow-x-hidden transition-colors duration-500"
      style={{ backgroundColor: isDark ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>

      <Navbar />

      <div className="relative z-10 flex flex-col">
        <section
          ref={containerRef}
          className="flex flex-col items-center justify-center min-h-[100svh] px-3 xs:px-4 sm:px-6 3xl:px-8 text-center pt-20 sm:pt-24 pb-16"
        >
          <div className="mb-7 sm:mb-9">
            <Image
              src={enterhubLogoSrc(isDark)}
              alt="Enterhub"
              width={112}
              height={112}
              priority
              className="mx-auto object-contain drop-shadow-lg"
              style={{ width: 96, height: 96 }}
            />
          </div>

          <p
            className="text-[10px] xs:text-xs sm:text-sm font-semibold tracking-wide mb-5 uppercase px-1"
            style={{ color: colors.muted, letterSpacing: lang === 'fa' ? '0.04em' : undefined }}
          >
            {t('home.eyebrow')}
          </p>

          <h1
            className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight max-w-4xl mb-5 transition-colors duration-300 select-none"
            style={{ color: colors.primary }}
          >
            {lang === 'fa' ? (
              <span style={{ lineHeight: 1.35 }}>{t('home.headline')}</span>
            ) : (
              <VariableProximity
                label={t('home.headline')}
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 900, 'opsz' 40"
                containerRef={containerRef}
                radius={150}
                falloff="gaussian"
                style={{ lineHeight: 1.15 }}
              />
            )}
          </h1>

          <p className="max-w-2xl text-base sm:text-lg mb-8 sm:mb-10 px-2" style={{ color: colors.secondary }}>
            {t('home.sub')}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none">
            <Link
              href="/signup"
              id="cta-get-started"
              className="w-full sm:w-auto font-semibold px-7 py-3 rounded-full active:scale-95 transition-all duration-200 text-sm shadow-lg shadow-black/10 text-center min-h-[44px] inline-flex items-center justify-center"
              style={{
                backgroundColor: isDark ? 'white' : '#0a0a0a',
                color: isDark ? 'black' : 'white',
              }}
            >
              {t('home.ctaStart')}
            </Link>
            <Link
              href="#learn"
              id="cta-learn-more"
              className="w-full sm:w-auto font-semibold px-7 py-3 rounded-full active:scale-95 transition-all duration-200 text-sm backdrop-blur-sm text-center min-h-[44px] inline-flex items-center justify-center"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.15)',
                color: colors.primary,
              }}
            >
              {t('home.ctaLearn')}
            </Link>
          </div>
        </section>

        <div className="max-w-6xl 4xl:max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 4xl:px-12 pb-10 sm:pb-16 w-full">
          <section className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: colors.muted }}>
              {t('home.trusted')}
            </p>
            <div
              className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-50"
              style={{ color: colors.primary }}
            >
              {['NovaBuild', 'Orbit Labs', 'Caspian Soft', 'Apex Systems', 'Quantum'].map((name) => (
                <div key={name} className="text-lg sm:text-xl font-black tracking-tight">
                  {name}
                </div>
              ))}
            </div>
          </section>

          <LandingProductShowcase isDark={isDark} />
          <LandingSmartEvaluation isDark={isDark} />
          <LandingLearn isDark={isDark} />
          <LandingPlans isDark={isDark} />
          <LandingTestimonials isDark={isDark} />
          <LandingFreeBanner isDark={isDark} />
        </div>

        <Footer />
      </div>
    </main>
  );
}
