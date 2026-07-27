'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MdCheck, MdStar } from 'react-icons/md';
import {
  PLANS,
  formatMb,
  formatToman,
  type PlanCode,
} from '@/lib/plans-catalog';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { landingSurface, landingText } from './landing-theme';

const ORDER: PlanCode[] = ['FREE', 'PRO', 'ENTERPRISE'];

const HIGHLIGHT_KEYS: Partial<Record<PlanCode, string>> = {
  FREE: 'plans.highlightFree',
  PRO: 'plans.highlightPro',
  ENTERPRISE: 'plans.highlightEnterprise',
};

type Interval = 'monthly' | 'yearly';

/** Landing plans — prices in Toman (IRR). */
export function LandingPlans({ isDark }: { isDark: boolean }) {
  const colors = landingText(isDark);
  const { t, lang } = useLang();
  const [interval, setInterval] = useState<Interval>('monthly');
  const fa = lang === 'fa';
  const loc = fa ? 'fa' : 'en';

  return (
    <section id="plans" className="scroll-mt-28 pt-16 sm:pt-24">
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: colors.accent }}>
          {t('plans.eyebrow')}
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4" style={{ color: colors.primary }}>
          {t('plans.title')}
        </h2>
        <p className="text-base sm:text-lg max-w-2xl mx-auto px-2" style={{ color: colors.secondary }}>
          {t('plans.subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-center mb-10">
        <div
          className="inline-flex rounded-full p-1 gap-0.5"
          style={{
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          }}
          role="group"
          aria-label={t('plans.billingPeriod')}
        >
          {(
            [
              { id: 'monthly' as const, labelKey: 'common.monthly' },
              { id: 'yearly' as const, labelKey: 'common.yearly' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setInterval(opt.id)}
              className="px-4 py-2 rounded-full text-xs font-bold min-h-[40px] transition-colors relative"
              style={{
                background: interval === opt.id ? (isDark ? '#fff' : '#0a0a0a') : 'transparent',
                color: interval === opt.id ? (isDark ? '#0a0a0a' : '#fff') : colors.secondary,
              }}
            >
              {t(opt.labelKey)}
              {opt.id === 'yearly' && (
                <span
                  className="ms-1.5 text-[9px] font-black uppercase"
                  style={{ color: interval === opt.id ? '#16A34A' : '#22C55E' }}
                >
                  {t('plans.save2mo')}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {ORDER.map((code) => {
          const plan = PLANS[code];
          const featured = code === 'PRO';

          const sale = interval === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          const list = interval === 'monthly' ? plan.listPriceMonthly : plan.listPriceYearly;

          const showList = list > sale && sale > 0;
          const priceMain = sale === 0 ? t('common.free') : formatToman(sale, loc);
          const periodLabel =
            sale === 0 ? t('common.forever') : interval === 'monthly' ? t('plans.perMonth') : t('plans.perYear');
          const equivHint =
            sale > 0 && interval === 'yearly'
              ? t('plans.moBilledYearly', {
                  price: formatToman(Math.round(sale / 12), loc),
                })
              : null;

          const name = fa ? plan.nameFa : plan.nameEn;
          const tagline = fa ? plan.taglineFa : plan.taglineEn;
          const features = fa && plan.featuresFa.length ? plan.featuresFa : plan.featuresEn;

          return (
            <article
              key={code}
              className="relative flex flex-col rounded-2xl backdrop-blur-xl p-4 sm:p-6 md:p-7 transition-transform duration-200 hover:-translate-y-0.5"
              style={{
                ...landingSurface(isDark),
                border: featured
                  ? `1px solid ${isDark ? 'rgba(96,165,250,0.55)' : 'rgba(37,99,235,0.45)'}`
                  : landingSurface(isDark).border,
                boxShadow: featured
                  ? isDark
                    ? '0 20px 50px rgba(37,99,235,0.25)'
                    : '0 20px 50px rgba(37,99,235,0.12)'
                  : landingSurface(isDark).boxShadow,
              }}
            >
              {HIGHLIGHT_KEYS[code] && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full inline-flex items-center gap-1"
                  style={{
                    backgroundColor: featured ? '#2563eb' : isDark ? '#fff' : '#0a0a0a',
                    color: featured ? '#fff' : isDark ? '#0a0a0a' : '#fff',
                  }}
                >
                  {featured && <MdStar size={12} />}
                  {t(HIGHLIGHT_KEYS[code]!)}
                </span>
              )}

              <h3 className="text-xl font-bold mb-1" style={{ color: colors.primary }}>
                {name}
              </h3>
              <p className="text-sm mb-5 min-h-[40px]" style={{ color: colors.secondary }}>
                {tagline}
              </p>

              <div className="mb-5">
                <div className="flex items-end gap-2 flex-wrap">
                  {showList && (
                    <span className="text-sm line-through" style={{ color: colors.muted }}>
                      {formatToman(list, loc)}
                    </span>
                  )}
                  <span className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: colors.primary }}>
                    {priceMain}
                  </span>
                  <span className="text-sm pb-1" style={{ color: colors.muted }}>
                    {periodLabel}
                  </span>
                </div>
                {equivHint && (
                  <p className="text-xs mt-1.5" style={{ color: colors.muted }}>
                    {equivHint}
                  </p>
                )}
                {sale > 0 && interval === 'monthly' && (
                  <p className="text-xs mt-1" style={{ color: colors.muted }}>
                    {t('common.or')} {formatToman(plan.priceYearly, loc)} {t('plans.perYear')}
                  </p>
                )}
                <p className="text-xs mt-2" style={{ color: colors.muted }}>
                  {t('plans.seats', { n: plan.defaultSeats })} ·{' '}
                  {t('plans.storage', { n: formatMb(plan.includedStorageMb, loc) })}
                  {plan.giftSeats > 0 ? ` · +${plan.giftSeats}` : ''}
                  {plan.guestSeats > 0 ? ` · ${plan.guestSeats}` : ''}
                </p>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm" style={{ color: colors.secondary }}>
                    <MdCheck size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="inline-flex items-center justify-center min-h-[44px] rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: featured ? '#2563eb' : isDark ? '#fff' : '#0a0a0a',
                  color: featured ? '#fff' : isDark ? '#0a0a0a' : '#fff',
                }}
              >
                {code === 'FREE' ? t('plans.ctaFree') : t('plans.ctaPaid')}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
