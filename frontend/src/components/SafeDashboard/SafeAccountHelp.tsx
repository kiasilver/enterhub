'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, BookOpen, CreditCard, Shield, FileText, ChevronDown, Send, Mail, MessageCircle, Clock } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import SafeAccountShell, { accountFadeUp, iconTile, getIconColors } from './SafeAccountShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import Link from 'next/link';

interface Props { isDark: boolean; setActivePage: (id: string) => void; }

interface Category {
  title: string;
  desc: string;
  count: string;
  Icon: typeof BookOpen;
}

const CATEGORIES: Category[] = [
  { title: 'Getting Started', desc: 'Set up your workspace, invite your team, and learn the basics.', count: '12 articles', Icon: BookOpen },
  { title: 'Account & Billing', desc: 'Manage your PRO plan, invoices, and payment methods.', count: '9 articles', Icon: CreditCard },
  { title: 'Security', desc: 'Two-factor auth, sessions, data encryption, and access control.', count: '7 articles', Icon: Shield },
  { title: 'Reports', desc: 'Generate, schedule, and export safety and incident reports.', count: '11 articles', Icon: FileText },
];

interface Faq { q: string; a: string; }

const FAQS: Faq[] = [
  {
    q: 'How do I generate an incident report on the Enterhub dashboard?',
    a: 'Open the Reports section, choose a date range and the sites you want to include, then click Generate. Finished reports can be exported as PDF or CSV and shared directly with your team.',
  },
  {
    q: 'How do I add or remove team members in my workspace?',
    a: 'Go to Settings, then Team, and use Invite Member to send an activation link by email. Assign each person a role such as Inspector, Manager, or Viewer. You can revoke access at any time while preserving their historical records.',
  },
  {
    q: 'How do I enable two-factor authentication on my account?',
    a: 'From Settings, open the Security tab and turn on Two-Factor Authentication. You can use an authenticator app or SMS. As a Safety Manager you can also require 2FA for everyone in the Enterhub workspace.',
  },
  {
    q: 'What is included in the PRO plan?',
    a: 'PRO includes unlimited incident reports, advanced analytics, scheduled exports, priority support, and up to 50 team seats. You can review usage and upgrade or downgrade anytime from Account and Billing.',
  },
  {
    q: 'How do I update my profile and contact details?',
    a: 'Open Account, then Profile, to edit your name, role, phone, and location. Changes save instantly and are reflected across your dashboard and any reports you author.',
  },
];

export default function SafeAccountHelp({ isDark, setActivePage }: Props) {
  const { t } = useLang();
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const ICON_COLORS = getIconColors(primaryColor);
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [hoverCard, setHoverCard] = useState<number | null>(null);

  const q = query.trim().toLowerCase();
  const filteredFaqs = q
    ? FAQS.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    : FAQS;

  return (
    <SafeAccountShell isDark={isDark} active="account-help" setActivePage={setActivePage}>

      <motion.div variants={accountFadeUp}>
        <Link
          href="/guide"
          className="block rounded-3xl p-5 mb-2"
          style={{ ...glassStyle(isDark), borderColor: `${ACCENT}66` }}
        >
          <p className="text-[11px] font-black uppercase tracking-wider mb-1" style={{ color: mut }}>
            {t('guidePage.eyebrow')}
          </p>
          <h2 className="text-[17px] font-bold" style={{ color: pri }}>
            {t('guidePage.title')}
          </h2>
          <p className="text-[13px] mt-1" style={{ color: sec }}>
            {t('guidePage.subtitle')}
          </p>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div variants={accountFadeUp}>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: mut }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className="w-full rounded-3xl pl-12 pr-4 py-3.5 text-[13px] outline-none transition-shadow"
            style={{ ...glassStyle(isDark), color: pri }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 1.5px ${ACCENT}66`; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </motion.div>

      {/* Quick help categories */}
      <motion.div variants={accountFadeUp}>
        <p className="text-[11px] font-black uppercase tracking-wider mb-3" style={{ color: mut }}>Browse by topic</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.title}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onMouseEnter={() => setHoverCard(i)}
              onMouseLeave={() => setHoverCard(null)}
              className="rounded-3xl p-5 cursor-pointer"
              style={{ ...glassStyle(isDark), borderColor: hoverCard === i ? `${ACCENT}66` : border }}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={iconTile(ICON_COLORS[i % ICON_COLORS.length])}>
                  <cat.Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold mb-1" style={{ color: pri }}>{cat.title}</h3>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: sec }}>{cat.desc}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider mt-2.5" style={{ color: mut }}>{cat.count}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ accordion */}
      <motion.div variants={accountFadeUp} className="rounded-3xl p-6" style={glassStyle(isDark)}>
        <h3 className="text-[15px] font-semibold mb-4" style={{ color: pri }}>Frequently asked questions</h3>

        <div className="space-y-2.5">
          {filteredFaqs.length === 0 && (
            <p className="text-[12.5px] py-6 text-center" style={{ color: mut }}>
              No articles match &ldquo;{query.trim()}&rdquo;.
            </p>
          )}

          {filteredFaqs.map((faq) => {
            const idx = FAQS.indexOf(faq);
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl overflow-hidden"
                style={{ background: bg, border: `1px solid ${isOpen ? `${ACCENT}40` : border}` }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left"
                >
                  <span className="text-[13px] font-semibold" style={{ color: isOpen ? pri : sec }}>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="flex-shrink-0"
                    style={{ color: isOpen ? ACCENT : mut }}
                  >
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ height: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="px-4 pb-4 pt-0.5 text-[12.5px] leading-relaxed" style={{ color: sec }}>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Contact support */}
      <motion.div variants={accountFadeUp} className="rounded-3xl p-6" style={glassStyle(isDark)}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={iconTile(ICON_COLORS[0])}>
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: pri }}>Still need help?</h3>
              <p className="text-[12.5px] leading-relaxed" style={{ color: sec }}>
                Our team is here for you, Ali. Start a chat or email us at{' '}
                <span style={{ color: ACCENT }}>support@enterhub.io</span> and we&apos;ll get back to you shortly.
              </p>
              <div className="flex items-center gap-1.5 mt-2.5">
                <Clock size={12} style={{ color: mut }} />
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: mut }}>Avg. response time · under 2 hours</span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 gap-2.5">
            <OutlineButton label="Send a message" Icon={Send} />
            <OutlineButton label="Email us" Icon={Mail} href="mailto:support@enterhub.io" />
          </div>
        </div>
      </motion.div>

    </SafeAccountShell>
  );
}

function OutlineButton({ label, Icon, href }: { label: string; Icon: typeof Mail; href?: string }) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const [hover, setHover] = useState(false);
  const className = "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[12.5px] font-semibold whitespace-nowrap transition-colors no-underline";
  const style = { background: hover ? `${ACCENT}14` : 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` };
  if (href) {
    return (
      <a href={href} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} className={className} style={style}>
        <Icon size={15} />
        {label}
      </a>
    );
  }
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={className}
      style={style}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
