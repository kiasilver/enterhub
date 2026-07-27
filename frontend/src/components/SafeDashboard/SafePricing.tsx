'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Check, X } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import GlassButton from './GlassButton';

interface Props {
  isDark: boolean;
}

const PRICING_PLANS = [
  {
    name: 'Starter',
    description: 'Perfect for getting started and exploring the platform.',
    priceMonthly: 'Free',
    priceAnnually: 'Free',
    popular: false,
    features: [
      { name: 'Up to 3 users', included: true },
      { name: 'Basic dashboard metrics', included: true },
      { name: '1 workspace', included: true },
      { name: 'Community support', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Custom integrations', included: false },
    ],
    ctaText: 'Get Started',
  },
  {
    name: 'Professional',
    description: 'Best for professionals and growing teams needing more power.',
    priceMonthly: '$29',
    priceAnnually: '$24',
    popular: true,
    features: [
      { name: 'Up to 10 users', included: true },
      { name: 'Advanced dashboard metrics', included: true },
      { name: '5 workspaces', included: true },
      { name: 'Priority email support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom integrations', included: false },
    ],
    ctaText: 'Upgrade to Pro',
  },
  {
    name: 'Enterprise',
    description: 'For large teams requiring ultimate security and scale.',
    priceMonthly: '$99',
    priceAnnually: '$79',
    popular: false,
    features: [
      { name: 'Unlimited users', included: true },
      { name: 'Custom dashboard metrics', included: true },
      { name: 'Unlimited workspaces', included: true },
      { name: '24/7 dedicated support', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom integrations', included: true },
    ],
    ctaText: 'Contact Sales',
  },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};
const featureList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const featureItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
};

function parsePrice(value: string): number | null {
  const n = parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

export default function SafePricing({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const annually = billingCycle === 'annually';

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >

      {/* ── Header ── */}
      <motion.div variants={item} className="max-w-2xl mx-auto text-center mb-9">
        <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: pri, letterSpacing: '-0.01em' }}>Plans &amp; Pricing</h2>
        <p className="text-sm" style={{ color: mut }}>Choose the plan that fits your team. No hidden fees, cancel anytime.</p>

        {/* Billing toggle (segmented) */}
        <div
          className="inline-flex items-center gap-1 p-1 rounded-xl mt-6"
          style={{ background: surfaceHover(isDark), border: `1px solid ${border}` }}
        >
          {(['monthly', 'annually'] as const).map((c) => {
            const active = billingCycle === c;
            return (
              <button
                key={c}
                onClick={() => setBillingCycle(c)}
                className="relative px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors flex items-center gap-2"
                style={{
                  color: active ? pri : sec,
                }}
              >
                {active && (
                  <motion.div
                    layoutId="pricing-billing"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                      boxShadow: !isDark ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{c}</span>
                {c === 'annually' && (
                  <motion.span
                    className="relative z-10 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                    animate={annually ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    -20%
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Cards ── */}
      <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {PRICING_PLANS.map((plan) => {
          const monthlyNum = parsePrice(plan.priceMonthly);
          const annualNum = parsePrice(plan.priceAnnually);
          const savings =
            monthlyNum !== null && annualNum !== null
              ? (monthlyNum - annualNum) * 12
              : null;
          return (
          <motion.div
            key={plan.name}
            variants={item}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
            className="relative rounded-2xl p-7 flex flex-col"
            style={{ ...glassStyle(isDark), borderColor: plan.popular ? `${ACCENT}80` : border }}
          >
            {plan.popular && (
              <span
                className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: `${ACCENT}1f`, color: ACCENT }}
              >
                Popular
              </span>
            )}

            <h3 className="text-base font-semibold mb-1.5" style={{ color: pri }}>{plan.name}</h3>
            <p className="text-xs leading-relaxed mb-6 min-h-[32px]" style={{ color: sec }}>{plan.description}</p>

            <motion.div
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              key={`pulse-${billingCycle}`}
              className="mb-6"
            >
              <div className="flex items-end gap-1.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={annually ? plan.priceAnnually : plan.priceMonthly}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: pri }}
                  >
                    {annually ? plan.priceAnnually : plan.priceMonthly}
                  </motion.span>
                </AnimatePresence>
                {plan.priceMonthly !== 'Free' && (
                  <span className="text-xs mb-1.5" style={{ color: mut }}>
                    / {annually ? 'mo, billed yearly' : 'month'}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {annually && savings !== null && savings > 0 && (
                  <motion.div
                    key="savings"
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                    className="inline-flex items-center mt-2 text-[11px] font-semibold px-2 py-1 rounded-md"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                  >
                    Save ${savings.toLocaleString()} /yr
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {plan.popular ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="w-full rounded-[10px] py-2.5 text-[13px] font-semibold text-white transition-all"
                style={{ background: ACCENT }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}
              >
                {plan.ctaText}
              </motion.button>
            ) : (
              <GlassButton className="w-full" style={{ padding: '10px 0', borderRadius: '10px' }}>
                {plan.ctaText}
              </GlassButton>
            )}

            <div className="h-px my-6" style={{ background: border }} />

            <motion.div variants={featureList} className="flex flex-col gap-3.5">
              {plan.features.map((feature, i) => (
                <motion.div variants={featureItem} key={i} className="flex items-center gap-2.5">
                  {feature.included
                    ? <Check size={16} strokeWidth={2.5} style={{ color: ACCENT, flexShrink: 0 }} />
                    : <X size={16} strokeWidth={2.5} style={{ color: mut, flexShrink: 0 }} />}
                  <span
                    className="text-[13px]"
                    style={{ color: feature.included ? sec : mut, textDecoration: feature.included ? 'none' : 'line-through' }}
                  >
                    {feature.name}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          );
        })}
      </motion.div>

    </motion.div>
  );
}
