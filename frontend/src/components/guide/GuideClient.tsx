'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MdAdminPanelSettings,
  MdArrowBack,
  MdBadge,
  MdCheckCircle,
  MdGroups,
  MdPerson,
  MdSupervisorAccount,
  MdVisibility,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import { landingSurface, landingText } from '@/components/landing/landing-theme';
import {
  GUIDE_ROLE_ORDER,
  GUIDE_TOPIC_ORDER,
  getGuideCopy,
  type GuideRoleId,
  type GuideTopicId,
} from '@/i18n/guide-content';

const ROLE_ICON: Record<GuideRoleId, typeof MdPerson> = {
  founder: MdAdminPanelSettings,
  manager: MdBadge,
  supervisor: MdSupervisorAccount,
  member: MdPerson,
  guest: MdVisibility,
};

function isRole(v: string | null): v is GuideRoleId {
  return !!v && (GUIDE_ROLE_ORDER as string[]).includes(v);
}
function isTopic(v: string | null): v is GuideTopicId {
  return !!v && (GUIDE_TOPIC_ORDER as string[]).includes(v);
}

export function GuideClient() {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';
  const colors = landingText(isDark);
  const router = useRouter();
  const params = useSearchParams();
  const copy = getGuideCopy(lang);

  const role = isRole(params.get('role')) ? params.get('role') : null;
  const topicParam = isTopic(params.get('topic')) ? params.get('topic') : null;

  const topicList = useMemo(() => {
    if (role) return copy.roles[role].topics;
    return GUIDE_TOPIC_ORDER;
  }, [copy, role]);

  const topic = topicParam && topicList.includes(topicParam) ? topicParam : topicList[0];
  const article = copy.topics[topic];
  const roleMeta = role ? copy.roles[role] : null;

  function go(next: { role?: GuideRoleId | null; topic?: GuideTopicId | null }) {
    const q = new URLSearchParams();
    const r = next.role === undefined ? role : next.role;
    const tp = next.topic === undefined ? topic : next.topic;
    if (r) q.set('role', r);
    if (tp) q.set('topic', tp);
    router.replace(q.toString() ? `/guide?${q}` : '/guide', { scroll: false });
  }

  return (
    <main
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: isDark ? 'var(--background)' : '#ffffff' }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>
      <Navbar />

      <div className="relative z-10 flex-1 pt-28 sm:pt-32 pb-16 px-3 xs:px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-3" style={{ color: colors.accent }}>
              {t('guidePage.eyebrow')}
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3" style={{ color: colors.primary }}>
              {t('guidePage.title')}
            </h1>
            <p className="text-base sm:text-lg" style={{ color: colors.secondary }}>
              {t('guidePage.subtitle')}
            </p>
          </header>

          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold" style={{ color: colors.primary }}>
                {t('guidePage.pickRole')}
              </h2>
              {role && (
                <button
                  type="button"
                  onClick={() => go({ role: null })}
                  className="inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: colors.accent }}
                >
                  <MdGroups size={18} />
                  {t('guidePage.allTopics')}
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GUIDE_ROLE_ORDER.map((id) => {
                const r = copy.roles[id];
                const Icon = ROLE_ICON[id];
                const on = role === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => go({ role: id, topic: r.topics[0] })}
                    className="text-start rounded-2xl p-4 transition-shadow"
                    style={{
                      ...landingSurface(isDark),
                      boxShadow: on ? `0 0 0 2px ${colors.accent}` : landingSurface(isDark).boxShadow,
                    }}
                  >
                    <span
                      className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-3"
                      style={{
                        background: isDark ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.1)',
                        color: colors.accent,
                      }}
                    >
                      <Icon size={22} />
                    </span>
                    <p className="font-bold" style={{ color: colors.primary }}>
                      {r.title}
                    </p>
                    <p className="text-sm mt-1" style={{ color: colors.secondary }}>
                      {r.subtitle}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {r.bullets.map((b) => (
                        <li key={b} className="text-[13px]" style={{ color: colors.muted }}>
                          · {b}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid lg:grid-cols-[16rem_1fr] gap-4 items-start">
            <aside className="rounded-2xl p-3 lg:sticky lg:top-28" style={landingSurface(isDark)}>
              <p className="text-[11px] font-bold px-2 mb-2" style={{ color: colors.muted }}>
                {roleMeta ? roleMeta.title : t('guidePage.allTopics')}
              </p>
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1">
                {topicList.map((id) => {
                  const on = id === topic;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => go({ topic: id })}
                      className="shrink-0 text-start px-3 py-2 rounded-xl text-sm font-semibold"
                      style={{
                        background: on
                          ? isDark
                            ? '#fff'
                            : '#0a0a0a'
                          : 'transparent',
                        color: on ? (isDark ? '#0a0a0a' : '#fff') : colors.secondary,
                      }}
                    >
                      {copy.topics[id].title}
                    </button>
                  );
                })}
              </nav>
            </aside>

            <article className="rounded-2xl p-5 sm:p-8" style={landingSurface(isDark)}>
              {role && (
                <button
                  type="button"
                  onClick={() => go({ role: null })}
                  className="inline-flex items-center gap-1 text-xs font-semibold mb-4"
                  style={{ color: colors.accent }}
                >
                  <MdArrowBack size={16} className={lang === 'fa' ? 'rotate-180' : ''} />
                  {t('guidePage.allTopics')}
                </button>
              )}
              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.primary }}>
                {article.title}
              </h2>
              <p className="text-sm sm:text-base mb-6" style={{ color: colors.secondary }}>
                {article.summary}
              </p>
              <ol className="space-y-3 mb-8">
                {article.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm sm:text-[15px] leading-relaxed">
                    <span
                      className="shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        color: colors.primary,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ color: colors.secondary }}>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs font-bold mb-3" style={{ color: colors.muted }}>
                {t('learn.tips')}
              </p>
              <ul className="space-y-2.5 mb-8">
                {article.tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm" style={{ color: colors.secondary }}>
                    <MdCheckCircle size={18} className="shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    {tip}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-semibold"
                  style={{
                    background: isDark ? '#fff' : '#0a0a0a',
                    color: isDark ? '#0a0a0a' : '#fff',
                  }}
                >
                  {t('home.ctaStart')}
                </Link>
                <Link
                  href="/#learn"
                  className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-semibold"
                  style={{
                    border: isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(0,0,0,0.1)',
                    color: colors.primary,
                  }}
                >
                  {t('learn.eyebrow')}
                </Link>
              </div>
            </article>
          </section>

          <section className="rounded-2xl p-5 sm:p-7" style={landingSurface(isDark)}>
            <h2 className="text-lg font-bold mb-2" style={{ color: colors.primary }}>
              {t('guidePage.stuckTitle')}
            </h2>
            <p className="text-sm mb-4" style={{ color: colors.secondary }}>
              {t('guidePage.stuckBody')}
            </p>
            <Link
              href="/contact"
              className="inline-flex text-sm font-semibold"
              style={{ color: colors.accent }}
            >
              {t('nav.contact')} →
            </Link>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
