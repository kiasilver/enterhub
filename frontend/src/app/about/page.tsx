'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export default function AboutPage() {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  return (
    <main
      className="relative min-h-screen overflow-x-hidden transition-colors duration-500 flex flex-col"
      style={{ backgroundColor: isDark ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>

      <Navbar />

      <div className="relative z-10 flex flex-col flex-1 pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 3xl:px-8 w-full">
          <div className="text-center mb-10 sm:mb-16">
            <h1
              className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6"
              style={{ color: isDark ? 'white' : 'black' }}
            >
              {t('marketing.aboutTitle')}
            </h1>
            <p
              className="text-base sm:text-lg max-w-2xl mx-auto px-2"
              style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}
            >
              {t('marketing.aboutSubtitle')}
            </p>
          </div>

          <div
            className="p-5 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px] backdrop-blur-xl transition-colors duration-300 space-y-6 sm:space-y-8"
            style={{
              backgroundColor: isDark ? 'var(--surface)' : 'rgba(255,255,255,0.7)',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
              boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.05)',
            }}
          >
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: isDark ? 'white' : 'black' }}>
                {t('marketing.visionTitle')}
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              >
                {t('marketing.visionBody')}
              </p>
            </div>

            <div
              className="h-px w-full"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            />

            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: isDark ? 'white' : 'black' }}>
                {t('marketing.journeyTitle')}
              </h2>
              <p
                className="text-base leading-relaxed"
                style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
              >
                {t('marketing.journeyBody')}
              </p>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 sm:pt-6">
              {[
                { number: '100+', label: t('marketing.statClients') },
                { number: '5M+', label: t('marketing.statHours') },
                { number: '99.9%', label: t('marketing.statUptime') },
                { number: '24/7', label: t('marketing.statSupport') },
              ].map((stat, i) => (
                <div key={i} className="text-center min-w-0 px-1">
                  <div
                    className="text-2xl sm:text-3xl font-black mb-1"
                    style={{ color: isDark ? 'white' : 'black' }}
                  >
                    {stat.number}
                  </div>
                  <div
                    className="text-xs sm:text-sm font-semibold uppercase tracking-wide sm:tracking-wider"
                    style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
