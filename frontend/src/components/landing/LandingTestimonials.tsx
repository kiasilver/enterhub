'use client';

import { MdFormatQuote } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { landingSurface, landingText } from './landing-theme';

const STORIES = [
  {
    quoteKey: 'testimonials.s1Quote',
    roleKey: 'testimonials.s1Role',
    name: 'Sara Mohammadi',
    company: 'NovaBuild',
  },
  {
    quoteKey: 'testimonials.s2Quote',
    roleKey: 'testimonials.s2Role',
    name: 'Arman Rezaei',
    company: 'Orbit Labs',
  },
  {
    quoteKey: 'testimonials.s3Quote',
    roleKey: 'testimonials.s3Role',
    name: 'Leila Karimi',
    company: 'Caspian Soft',
  },
] as const;

export function LandingTestimonials({ isDark }: { isDark: boolean }) {
  const colors = landingText(isDark);
  const { t } = useLang();

  return (
    <section id="stories" className="scroll-mt-28 pt-16 sm:pt-24">
      <div className="text-center mb-10 sm:mb-14">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: colors.accent }}>
          {t('testimonials.eyebrow')}
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4" style={{ color: colors.primary }}>
          {t('testimonials.title')}
        </h2>
        <p className="text-base sm:text-lg max-w-2xl mx-auto px-2" style={{ color: colors.secondary }}>
          {t('testimonials.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
        {STORIES.map((s) => (
          <blockquote
            key={s.name}
            className="rounded-2xl backdrop-blur-xl p-6 sm:p-7 flex flex-col"
            style={landingSurface(isDark)}
          >
            <MdFormatQuote size={28} style={{ color: colors.accent }} className="mb-3 opacity-80" />
            <p className="text-sm sm:text-[15px] leading-relaxed flex-1 mb-6" style={{ color: colors.secondary }}>
              “{t(s.quoteKey)}”
            </p>
            <footer>
              <p className="text-sm font-bold" style={{ color: colors.primary }}>
                {s.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
                {t(s.roleKey)} · {s.company}
              </p>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
