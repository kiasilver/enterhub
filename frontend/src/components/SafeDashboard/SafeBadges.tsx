'use client';

import { motion, type Variants } from 'motion/react';
import { CheckCircle, Clock, XCircle, Sparkles, Bell, Mail, MessageSquare } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import GlassButton from './GlassButton';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-6">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-3" style={{ color: textMuted(isDark) }}>{desc}</p>
      <div className="rounded-2xl p-5" style={glassStyle(isDark)}>{children}</div>
    </motion.section>
  );
}

export default function SafeBadges({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const COLORS: { color: string; label: string }[] = [
    { color: primaryColor, label: 'Primary' },
    { color: '#10b981', label: 'Success' },
    { color: '#f59e0b', label: 'Warning' },
    { color: '#ef4444', label: 'Danger' },
    { color: '#0ea5e9', label: 'Info' },
    { color: '#8b5cf6', label: 'Purple' },
  ];

  const LABELS: { label: string; color: string; Icon: React.ElementType }[] = [
    { label: 'Active', color: '#10b981', Icon: CheckCircle },
    { label: 'Pending', color: '#f59e0b', Icon: Clock },
    { label: 'Failed', color: '#ef4444', Icon: XCircle },
    { label: 'New', color: primaryColor, Icon: Sparkles },
  ];

  const GRADIENTS: { label: string; from: string; to: string }[] = [
    { label: 'Primary', from: primaryColor, to: 'var(--primary)' },
    { label: 'Success', from: '#10b981', to: '#059669' },
    { label: 'Sunset', from: '#f59e0b', to: '#ef4444' },
    { label: 'Ocean', from: '#0ea5e9', to: '#0284c7' },
  ];

  const row = 'flex flex-wrap items-center gap-2.5';
  const base = 'inline-flex items-center text-[11px] font-semibold leading-none';

  const glassBadge: React.CSSProperties = {
    background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.8)'}`,
    color: pri,
  };

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="mb-7 max-w-3xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Base UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Badges</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Small status descriptors for labels, counts, and tags.</p>
      </motion.div>

      <div className="max-w-3xl">

        {/* 1 ── Default ── */}
        <Section title="Default badges" desc="Solid, filled badges in the core palette." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} px-2 py-1 rounded-md text-white`} style={{ background: c.color }}>{c.label}</span>
            ))}
          </div>
        </Section>

        {/* 2 ── Soft ── */}
        <Section title="Soft badges" desc="Tinted background with matching text — quiet and legible." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} px-2 py-1 rounded-md`} style={{ background: `${c.color}1f`, color: c.color }}>{c.label}</span>
            ))}
          </div>
        </Section>

        {/* 3 ── Rounded pill ── */}
        <Section title="Rounded pill badges" desc="Fully rounded, solid badges." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} px-2.5 py-1 rounded-full text-white`} style={{ background: c.color }}>{c.label}</span>
            ))}
          </div>
        </Section>

        {/* 4 ── Outline ── */}
        <Section title="Outline badges" desc="Border-only badges with transparent fill." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} px-2 py-1 rounded-md`} style={{ background: 'transparent', border: `1px solid ${c.color}`, color: c.color }}>{c.label}</span>
            ))}
          </div>
        </Section>

        {/* 5 ── Soft border ── */}
        <Section title="Soft border badges" desc="A soft tint paired with a matching border." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} px-2 py-1 rounded-md`} style={{ background: `${c.color}14`, border: `1px solid ${c.color}59`, color: c.color }}>{c.label}</span>
            ))}
          </div>
        </Section>

        {/* 6 ── Rounded pill, soft ── */}
        <Section title="Rounded pill badges — soft" desc="Pill shape with a soft tint and a leading status dot." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} gap-1.5 px-2.5 py-1 rounded-full`} style={{ background: `${c.color}1f`, color: c.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </Section>

        {/* 7 ── Glass ── */}
        <Section title="Glass badges" desc="Translucent, blurred badges that sit on top of any surface." isDark={isDark}>
          <div className="rounded-xl p-5 flex flex-wrap items-center gap-2.5" style={{ background: 'linear-gradient(120deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.05))' }}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} gap-1.5 px-2.5 py-1 rounded-full`} style={glassBadge}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </div>
        </Section>

        {/* 8 ── Outline pill ── */}
        <Section title="Outline pill badges" desc="Border-only badges in a pill shape." isDark={isDark}>
          <div className={row}>
            {COLORS.map((c) => (
              <span key={c.label} className={`${base} px-2.5 py-1 rounded-full`} style={{ background: 'transparent', border: `1px solid ${c.color}`, color: c.color }}>{c.label}</span>
            ))}
          </div>
        </Section>

        {/* 9 ── Label (with icon) ── */}
        <Section title="Label badges" desc="Status labels paired with a meaningful icon." isDark={isDark}>
          <div className={row}>
            {LABELS.map(({ label, color, Icon }) => (
              <span key={label} className={`${base} gap-1.5 px-2.5 py-1 rounded-md`} style={{ background: `${color}1f`, color }}>
                <Icon size={12} /> {label}
              </span>
            ))}
          </div>
        </Section>

        {/* 10 ── Gradient ── */}
        <Section title="Gradient badges" desc="Filled gradients for a premium, high-emphasis accent." isDark={isDark}>
          <div className={row}>
            {GRADIENTS.map((g) => (
              <span key={g.label} className={`${base} px-2.5 py-1 rounded-full text-white`} style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, boxShadow: `0 4px 12px ${g.from}40` }}>{g.label}</span>
            ))}
          </div>
        </Section>

        {/* 11 ── Button position ── */}
        <Section title="Button position badges" desc="Counts and indicators anchored to icons, buttons, and avatars." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-5">
            {[
              { Icon: Bell, count: '5', color: '#ef4444' },
              { Icon: Mail, count: '12', color: 'var(--primary)' },
              { Icon: MessageSquare, count: '9+', color: '#10b981' },
            ].map(({ Icon, count, color }, i) => (
              <motion.div key={i} whileHover={{ y: -2 }} className="relative">
                <button
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors"
                  style={{ background: surfaceHover(isDark), border: `1px solid ${border}`, color: sec }}
                >
                  <Icon size={18} />
                </button>
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: color, border: `2px solid ${isDark ? 'var(--surface)' : 'var(--primary-fg, white)'}` }}
                >
                  {count}
                </span>
              </motion.div>
            ))}

            {/* Avatar with status dot */}
            <motion.div whileHover={{ y: -2 }} className="relative">
              <img src="/profile.png" alt="Ali Mohammadi" className="w-11 h-11 rounded-full object-cover" style={{ border: `1px solid ${border}` }} />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full" style={{ background: '#10b981', border: `2px solid ${isDark ? 'var(--surface)' : 'var(--primary-fg, white)'}` }} />
            </motion.div>
          </div>
        </Section>

        {/* 12 ── With heading ── */}
        <Section title="Badges with heading" desc="Pair a badge with a title to add quick context." isDark={isDark}>
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2.5" style={{ color: pri }}>
              Inbox
              <span className={`${base} px-2 py-1 rounded-md`} style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>12 New</span>
            </h3>
            <h4 className="text-base font-semibold flex items-center gap-2" style={{ color: pri }}>
              Analytics Reports
              <span className={`${base} px-2 py-0.5 rounded-md`} style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>Beta</span>
            </h4>
            <p className="text-sm font-medium flex items-center gap-2" style={{ color: sec }}>
              Server status
              <span className={`${base} gap-1.5 px-2.5 py-1 rounded-full`} style={{ background: '#10b9811f', color: '#10b981' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                Operational
              </span>
            </p>
          </div>
        </Section>

        {/* 13 ── With button ── */}
        <Section title="Badges with button" desc="Embed a count or status inside an action." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-3">
            <GlassButton style={{ padding: '9px 16px', borderRadius: '10px' }}>
              Inbox
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold" style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)' }}>3</span>
            </GlassButton>

            <button
              className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2.5 rounded-[10px] transition-transform active:scale-[0.98]"
              style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--primary)'; }}
            >
              <Bell size={15} /> Notifications
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.25)' }}>12</span>
            </button>

            <GlassButton style={{ padding: '9px 16px', borderRadius: '10px' }}>
              Messages
              <span className="ml-1 inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#10b9811f', color: '#10b981' }}>9+</span>
            </GlassButton>
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
