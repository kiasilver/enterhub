'use client';

import { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Heart, ArrowUpRight, ArrowRight, MoreHorizontal, CheckCircle, FileText, Bell, Bookmark } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

function CardShell({ isDark, children, className = '', style }: { isDark: boolean; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const border = borderSubtle(isDark);
  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
      className={`rounded-2xl ${className}`}
      style={{ ...glassStyle(isDark), transition: 'box-shadow 0.25s ease, border-color 0.25s ease', ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = isDark ? '0 14px 36px -14px rgba(0,0,0,0.6)' : '0 14px 36px -14px rgba(0,0,0,0.18)';
        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = border;
      }}
    >
      {children}
    </motion.div>
  );
}

function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-8">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-3.5" style={{ color: textMuted(isDark) }}>{desc}</p>
      {children}
    </motion.section>
  );
}

const BASIC = [
  { title: 'Getting started', text: 'Set up your workspace and invite your team in just a few minutes.' },
  { title: 'Best practices', text: 'Learn how leading teams keep their compliance airtight all year round.' },
  { title: 'Integrations', text: 'Connect Enterhub to the tools your organisation already relies on.' },
];

export default function SafeCards({ isDark }: Props) {
  const { primaryColor } = useTheme();

  const COLORS = [
    { color: primaryColor, label: 'Primary' },
    { color: '#10b981', label: 'Success' },
    { color: '#f59e0b', label: 'Warning' },
    { color: '#ef4444', label: 'Danger' },
    { color: '#0ea5e9', label: 'Info' },
  ];

  const STATS = [
    { label: 'Revenue', value: '$48.2k', delta: '+12.5%', up: true, Icon: DollarSign, color: primaryColor },
    { label: 'Users', value: '8,420', delta: '+8.2%', up: true, Icon: Users, color: '#10b981' },
    { label: 'Active now', value: '312', delta: '-3.1%', up: false, Icon: Activity, color: '#f59e0b' },
    { label: 'Engagement', value: '72%', delta: '+5.4%', up: true, Icon: Heart, color: '#ef4444' },
  ];

  const ACTIVITY = [
    { Icon: CheckCircle, color: '#10b981', text: 'Audit completed for Facility Alpha', time: '2h ago' },
    { Icon: FileText, color: primaryColor, text: 'New compliance report published', time: '5h ago' },
    { Icon: Bell, color: '#f59e0b', text: 'Maintenance scheduled for Zone B', time: '1d ago' },
  ];

  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(248);

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Header ── */}
      <motion.div variants={item} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Components / Base UI</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Cards</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>Flexible content containers for stats, profiles, media, and more.</p>
      </motion.div>

      <div className="max-w-4xl">

        {/* Stat cards */}
        <Section title="Stat cards" desc="Compact KPI cards with an icon and a trend indicator." isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <CardShell key={s.label} isDark={isDark} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}1f`, color: s.color }}>
                    <s.Icon size={18} />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.up ? '#10b9811f' : '#ef44441f', color: s.up ? '#10b981' : '#ef4444' }}>
                    {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {s.delta}
                  </span>
                </div>
                <p className="text-2xl font-bold mt-4" style={{ color: pri }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: mut }}>{s.label}</p>
              </CardShell>
            ))}
          </div>
        </Section>

        {/* Basic cards */}
        <Section title="Basic cards" desc="A title, supporting copy, and a quiet call to action." isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BASIC.map((b) => (
              <CardShell key={b.title} isDark={isDark} className="p-5">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>{b.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>{b.text}</p>
                <a href="#" onClick={(e) => e.preventDefault()} className="group inline-flex items-center gap-1 text-xs font-semibold mt-3 no-underline" style={{ color: 'var(--primary)' }}>
                  Read more <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </CardShell>
            ))}
          </div>
        </Section>

        {/* Profile + Cover */}
        <Section title="Profile & media cards" desc="Richer cards with a cover, avatar, and actions." isDark={isDark}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Profile card */}
            <CardShell isDark={isDark} className="overflow-hidden">
              <div className="h-20" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary))' }} />
              <div className="px-5 pb-5 -mt-9">
                <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Elena Rostova" className="w-16 h-16 rounded-full object-cover border-4" style={{ borderColor: isDark ? 'var(--surface)' : 'var(--primary-fg, white)' }} />
                <h4 className="text-base font-bold mt-2" style={{ color: pri }}>Elena Rostova</h4>
                <p className="text-xs" style={{ color: sec }}>Compliance Expert · Berlin</p>
                <div className="flex items-center gap-5 my-4">
                  {[['210', 'Projects'], ['1.2k', 'Followers'], ['5.0', 'Rating']].map(([v, l]) => (
                    <div key={l}>
                      <p className="text-sm font-bold" style={{ color: pri }}>{v}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: mut }}>{l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 text-[13px] font-semibold py-2 rounded-lg text-white transition-all active:scale-95 hover:brightness-95" style={{ background: 'var(--primary)' }}>Message</button>
                  <button className="flex-1 text-[13px] font-semibold py-2 rounded-lg transition-colors" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>Follow</button>
                </div>
              </div>
            </CardShell>

            {/* Cover / media card */}
            <CardShell isDark={isDark} className="overflow-hidden">
              <div className="h-36 relative bg-cover bg-center" style={{ backgroundImage: "url('/img/4.jpg')" }}>
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', backdropFilter: 'blur(6px)' }}>Featured</span>
              </div>
              <div className="p-5">
                <h4 className="text-base font-bold" style={{ color: pri }}>Safety culture in 2024</h4>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: sec }}>How leading organisations turn protocols into everyday habits across every shift.</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <img src="https://randomuser.me/api/portraits/men/41.jpg" alt="" className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-xs font-medium" style={{ color: sec }}>Michael Davis</span>
                  </div>
                  <span className="text-xs" style={{ color: mut }}>6 min read</span>
                </div>
              </div>
            </CardShell>
          </div>
        </Section>

        {/* List + Highlight */}
        <Section title="List & highlight cards" desc="An activity list, plus a gradient promotional card." isDark={isDark}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity list card */}
            <CardShell isDark={isDark} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold" style={{ color: pri }}>Recent activity</h4>
                <MoreHorizontal size={17} style={{ color: mut }} />
              </div>
              <div className="flex flex-col gap-3">
                {ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}1f`, color: a.color }}>
                      <a.Icon size={16} />
                    </div>
                    <p className="flex-1 text-xs" style={{ color: sec }}>{a.text}</p>
                    <span className="text-[11px]" style={{ color: mut }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </CardShell>

            {/* Highlight / upgrade card */}
            <motion.div
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary))' }}
            >
              <div className="absolute -top-10 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.18)', filter: 'blur(40px)' }} />
              <div className="relative">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.85)' }}>Pro plan</span>
                <h4 className="text-lg font-bold mt-2" style={{ color: '#fff' }}>Unlock advanced analytics</h4>
                <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'rgba(255,255,255,0.85)' }}>Upgrade to access predictive risk scoring, custom dashboards, and priority support.</p>
                <button className="mt-4 text-[13px] font-semibold px-4 py-2 rounded-lg transition-transform active:scale-95" style={{ background: '#fff', color: 'var(--primary)' }}>Upgrade now</button>
              </div>
            </motion.div>
          </div>
        </Section>

        {/* Using grid markup */}
        <Section title="Using grid markup" desc="Lay cards out on a responsive grid that reflows by breakpoint." isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {['Inspections', 'Incidents', 'Audits'].map((t) => (
              <CardShell key={t} isDark={isDark} className="p-5">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>{t}</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>A responsive grid column that stacks on small screens and lines up on large ones.</p>
              </CardShell>
            ))}
          </div>
        </Section>

        {/* Text alignment */}
        <Section title="Card text alignment" desc="Left, centered, or right-aligned content." isDark={isDark}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['left', 'center', 'right'] as const).map((al) => (
              <CardShell key={al} isDark={isDark} className="p-5" style={{ textAlign: al }}>
                <h4 className="text-sm font-semibold mb-1.5 capitalize" style={{ color: pri }}>{al} aligned</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>The text in this card is {al}-aligned.</p>
                <button className="mt-3 text-xs font-semibold" style={{ color: 'var(--primary)' }}>Action</button>
              </CardShell>
            ))}
          </div>
        </Section>

        {/* Header & footer */}
        <Section title="Card header & footer" desc="A bordered header and footer wrap the body." isDark={isDark}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardShell isDark={isDark} className="overflow-hidden">
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: mut }}>Featured</span>
                <MoreHorizontal size={16} style={{ color: mut }} />
              </div>
              <div className="p-5">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>Quarterly safety review</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>Summary of inspections, incidents, and resolved tickets for Q3.</p>
              </div>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${border}` }}>
                <span className="text-xs" style={{ color: mut }}>Updated 3 min ago</span>
                <button onClick={() => setSaved((s) => !s)} className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: saved ? 'var(--primary)' : mut }}>
                  <Bookmark size={13} style={{ fill: saved ? 'var(--primary)' : 'transparent' }} /> {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </CardShell>

            <CardShell isDark={isDark} className="overflow-hidden">
              <div className="px-5 py-3" style={{ borderBottom: `1px solid ${border}` }}>
                <span className="text-sm font-semibold" style={{ color: pri }}>Team notes</span>
              </div>
              <div className="p-5">
                <p className="text-xs leading-relaxed" style={{ color: sec }}>Header and footer sections are great for titles, metadata, and grouped actions.</p>
              </div>
              <div className="px-5 py-3" style={{ borderTop: `1px solid ${border}` }}>
                <button className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>View all notes</button>
              </div>
            </CardShell>
          </div>
        </Section>

        {/* Image caps & overlays */}
        <Section title="Image caps & overlays" desc="A top image cap, and text laid over an image." isDark={isDark}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardShell isDark={isDark} className="overflow-hidden">
              <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('/img/8.jpg')" }} />
              <div className="p-5">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>Image cap</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>The image sits at the top of the card, with content beneath it.</p>
              </div>
            </CardShell>
            <CardShell isDark={isDark} className="overflow-hidden relative">
              <div className="h-56 relative bg-cover bg-center" style={{ backgroundImage: "url('/img/2.jpg')" }}>
                <div className="absolute inset-0 flex flex-col justify-end p-5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                  <h4 className="text-base font-bold" style={{ color: '#fff' }}>Text overlay</h4>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>Content laid directly over the image.</p>
                </div>
                <button onClick={() => { setLiked((l) => !l); setLikeCount((c) => (liked ? c - 1 : c + 1)); }} className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                  <Heart size={13} style={{ fill: liked ? '#ef4444' : 'transparent', color: liked ? '#ef4444' : '#fff' }} /> {likeCount}
                </button>
              </div>
            </CardShell>
          </div>
        </Section>

        {/* Horizontal card */}
        <Section title="Horizontal card" desc="Image beside the content instead of above it." isDark={isDark}>
          <CardShell isDark={isDark} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-44 h-32 sm:h-auto flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: "url('/img/5.jpg')" }} />
              <div className="p-5 flex-1">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>Horizontal layout</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>Great for list items and previews where the media sits to the side.</p>
                <a href="#" onClick={(e) => e.preventDefault()} className="group inline-flex items-center gap-1 text-xs font-semibold mt-3 no-underline" style={{ color: 'var(--primary)' }}>Read more <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" /></a>
              </div>
            </div>
          </CardShell>
        </Section>

        {/* Background color */}
        <Section title="Card background color" desc="Filled cards for high-emphasis content." isDark={isDark}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLORS.map((c) => (
              <motion.div key={c.label} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="rounded-2xl p-4" style={{ background: c.color }}>
                <p className="text-sm font-bold" style={{ color: '#fff' }}>{c.label}</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>Filled background card.</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Border color */}
        <Section title="Card border color" desc="A coloured border with a transparent fill." isDark={isDark}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLORS.map((c) => (
              <motion.div key={c.label} whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="rounded-2xl p-4" style={{ ...glassStyle(isDark), borderColor: c.color }}>
                <p className="text-sm font-bold" style={{ color: c.color }}>{c.label}</p>
                <p className="text-[11px] mt-1 leading-relaxed" style={{ color: sec }}>Outlined card.</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Card groups */}
        <Section title="Card groups" desc="Cards joined edge-to-edge with shared borders." isDark={isDark}>
          <div className="flex flex-col sm:flex-row rounded-2xl overflow-hidden" style={glassStyle(isDark)}>
            {['Plan', 'Build', 'Monitor'].map((t, i) => (
              <div key={t} className="flex-1 p-5" style={{ borderLeft: i > 0 ? `1px solid ${border}` : 'none' }}>
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>{t}</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>One stage of the safety workflow, grouped with its neighbours.</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Grid card groups */}
        <Section title="Grid card groups" desc="Equal-height cards aligned on a grid." isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { t: 'Starter', d: 'For small teams getting started with safety tracking.' },
              { t: 'Growth', d: 'For growing organisations that need more workspaces and analytics across many sites and shifts.' },
              { t: 'Scale', d: 'For enterprises operating at scale.' },
            ].map((c) => (
              <CardShell key={c.t} isDark={isDark} className="p-5 flex flex-col">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>{c.t}</h4>
                <p className="text-xs leading-relaxed flex-1" style={{ color: sec }}>{c.d}</p>
                <button className="mt-4 text-xs font-semibold py-2 rounded-lg" style={{ background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary)' }}>Choose</button>
              </CardShell>
            ))}
          </div>
        </Section>

        {/* Masonry */}
        <Section title="Cards masonry" desc="A masonry layout with varying card heights." isDark={isDark}>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {[
              'Short note.',
              'A medium-length card describing the latest inspection results and what the team should focus on next.',
              'Tiny.',
              'Masonry packs cards of different heights tightly into columns for a layout that uses vertical space efficiently.',
              'A quick reminder about tomorrow’s fire drill at 10am.',
              'Compliance is holding steady at 98%.',
            ].map((t, i) => (
              <motion.div key={i} whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 28 } }} className="rounded-2xl p-5 mb-4 break-inside-avoid" style={glassStyle(isDark)}>
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>Note {i + 1}</h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>{t}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Stretched link */}
        <Section title="Stretched link" desc="The whole card is clickable, not just the link text." isDark={isDark}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { t: 'Open report', d: 'Click anywhere on this card to open the full report.' },
              { t: 'View dashboard', d: 'The entire surface acts as the link target.' },
            ].map((c) => (
              <CardShell key={c.t} isDark={isDark} className="p-5 relative">
                <h4 className="text-sm font-semibold mb-1.5" style={{ color: pri }}>
                  {c.t}
                  <a href="#" onClick={(e) => e.preventDefault()} aria-label={c.t} className="absolute inset-0" />
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: sec }}>{c.d}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold mt-3" style={{ color: 'var(--primary)' }}>Open <ArrowUpRight size={13} /></span>
              </CardShell>
            ))}
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
