'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MdAnalytics,
  MdBusiness,
  MdCheckCircle,
  MdTaskAlt,
  MdViewKanban,
} from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { dictionaries } from '@/i18n';
import { landingSurface, landingText } from './landing-theme';

type LearnKey = 'projects' | 'departments' | 'my-tasks' | 'analytics';
type TabMsgKey = 'projects' | 'departments' | 'myTasks' | 'analytics';

const TABS: {
  key: LearnKey;
  msgKey: TabMsgKey;
  Icon: typeof MdViewKanban;
}[] = [
  { key: 'projects', msgKey: 'projects', Icon: MdViewKanban },
  { key: 'departments', msgKey: 'departments', Icon: MdBusiness },
  { key: 'my-tasks', msgKey: 'myTasks', Icon: MdTaskAlt },
  { key: 'analytics', msgKey: 'analytics', Icon: MdAnalytics },
];

export function LandingLearn({ isDark }: { isDark: boolean }) {
  const colors = landingText(isDark);
  const { t, lang } = useLang();
  const [active, setActive] = useState<LearnKey>('projects');
  const currentMeta = TABS.find((tab) => tab.key === active) ?? TABS[0];
  const tabCopy = dictionaries[lang].learn.tabs[currentMeta.msgKey];

  return (
    <section id="learn" className="scroll-mt-28 pt-16 sm:pt-24">
      <div className="text-center mb-10 sm:mb-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: colors.accent }}>
          {t('learn.eyebrow')}
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4" style={{ color: colors.primary }}>
          {t('learn.title')}
        </h2>
        <p className="text-base sm:text-lg max-w-2xl mx-auto px-2" style={{ color: colors.secondary }}>
          {t('learn.subtitle')}
        </p>
      </div>

      <div
        className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 p-1.5 rounded-2xl max-w-3xl mx-auto"
        style={{
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        }}
        role="tablist"
        aria-label={t('learn.eyebrow')}
      >
        {TABS.map(({ key, msgKey, Icon }) => {
          const selected = key === active;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(key)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px]"
              style={{
                backgroundColor: selected ? (isDark ? '#fff' : '#0a0a0a') : 'transparent',
                color: selected ? (isDark ? '#0a0a0a' : '#fff') : colors.secondary,
              }}
            >
              <Icon size={18} />
              {t(`learn.tabs.${msgKey}.label`)}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMeta.key}
          role="tabpanel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl backdrop-blur-xl p-4 sm:p-8 md:p-10"
          style={landingSurface(isDark)}
        >
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.1)',
                    color: colors.accent,
                  }}
                >
                  <currentMeta.Icon size={26} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: colors.primary }}>
                  {tabCopy.title}
                </h3>
              </div>
              <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: colors.secondary }}>
                {tabCopy.summary}
              </p>
              <ol className="space-y-3">
                {tabCopy.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm sm:text-[15px] leading-relaxed">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        color: colors.primary,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: colors.secondary }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-xl p-5 sm:p-6"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: colors.muted }}>
                {t('learn.tips')}
              </p>
              <ul className="space-y-3">
                {tabCopy.tips.map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm leading-relaxed" style={{ color: colors.secondary }}>
                    <MdCheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    {tip}
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className="mt-6 inline-flex items-center justify-center w-full min-h-[44px] rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: isDark ? '#fff' : '#0a0a0a',
                  color: isDark ? '#0a0a0a' : '#fff',
                }}
              >
                {t('home.ctaStart')}
              </a>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
