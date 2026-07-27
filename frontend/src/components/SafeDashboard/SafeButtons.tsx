'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ArrowRight, RefreshCw, Download, Heart, Mail, Bell, Plus, Star, Trash2, Settings, Search, Check,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List,
} from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceItem, surfaceHover, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props {
  isDark: boolean;
}

const SIZES: { label: string; cls: string }[] = [
  { label: 'XS', cls: 'text-[11px] px-2.5 py-1 rounded-md' },
  { label: 'SM', cls: 'text-xs px-3 py-1.5 rounded-lg' },
  { label: 'MD', cls: 'text-[13px] px-4 py-2 rounded-lg' },
  { label: 'LG', cls: 'text-sm px-5 py-2.5 rounded-lg' },
  { label: 'XL', cls: 'text-base px-6 py-3 rounded-xl' },
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

// ── Reusable button with dynamic-colour hover ──
function Btn({ children, base, hover, className = '', onClick, type = 'button' }: {
  children: React.ReactNode;
  base: React.CSSProperties;
  hover?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 active:scale-[0.97] cursor-pointer select-none ${className}`}
      style={base}
      onMouseEnter={(e) => { if (hover) Object.assign(e.currentTarget.style, hover); }}
      onMouseLeave={(e) => { Object.assign(e.currentTarget.style, base); }}
    >
      {children}
    </button>
  );
}

// ── iOS-style switch ──
function Switch({ on, onToggle, color, isDark }: { on: boolean; onToggle: () => void; color?: string; isDark: boolean }) {
  const { primaryColor } = useTheme();
  const switchColor = color ?? primaryColor;
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer"
      style={{ background: on ? switchColor : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') }}
    >
      <motion.span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        animate={{ left: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

function Section({ title, desc, isDark, children }: { title: string; desc: string; isDark: boolean; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-6">
      <h3 className="text-sm font-semibold mb-0.5" style={{ color: textPrimary(isDark) }}>{title}</h3>
      <p className="text-xs mb-3" style={{ color: textMuted(isDark) }}>{desc}</p>
      <div className="rounded-2xl p-5" style={glassStyle(isDark)}>{children}</div>
    </motion.section>
  );
}

export default function SafeButtons({ isDark }: Props) {
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
  ];

  const GRADIENTS: { label: string; from: string; to: string }[] = [
    { label: 'Primary', from: primaryColor, to: 'var(--primary)' },
    { label: 'Success', from: '#10b981', to: '#059669' },
    { label: 'Sunset', from: '#f59e0b', to: '#ef4444' },
    { label: 'Ocean', from: '#0ea5e9', to: '#0284c7' },
  ];

  const [loading, setLoading] = useState(false);
  const [sw, setSw] = useState<{ notifications: boolean; sound: boolean }>({ notifications: true, sound: false });
  const [following, setFollowing] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({ Email: true, SMS: false, Push: true });
  const [radioVal, setRadioVal] = useState('Weekly');
  const [cbox, setCbox] = useState<Record<string, boolean>>({ terms: true, news: false });
  const [cradio, setCradio] = useState('standard');
  const [group, setGroup] = useState('Week');
  const [fmt, setFmt] = useState<{ bold: boolean; italic: boolean; underline: boolean }>({ bold: true, italic: false, underline: false });
  const [align, setAlign] = useState('left');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const loadMore = () => {
    if (loading) return;
    setLoading(true);
    timer.current = setTimeout(() => setLoading(false), 1600);
  };

  // ── Variant style builders ──
  const solid = (c: string): { base: React.CSSProperties; hover: React.CSSProperties } => ({
    base: { background: c, color: '#fff', boxShadow: 'none' },
    hover: { background: c, color: '#fff', boxShadow: `0 6px 16px ${c}59` },
  });
  const outline = (c: string) => ({
    base: { background: 'transparent', border: `1px solid ${c}`, color: c } as React.CSSProperties,
    hover: { background: `${c}14`, border: `1px solid ${c}`, color: c } as React.CSSProperties,
  });
  const soft = (c: string) => ({
    base: { background: `${c}1f`, color: c, boxShadow: 'none' } as React.CSSProperties,
    hover: { background: `${c}33`, color: c, boxShadow: 'none' } as React.CSSProperties,
  });
  const ghost = (c: string) => ({
    base: { background: 'transparent', color: c } as React.CSSProperties,
    hover: { background: `${c}14`, color: c } as React.CSSProperties,
  });
  const bordered = (c: string) => ({
    base: { background: surfaceItem(isDark), border: `1px solid ${c}59`, color: c } as React.CSSProperties,
    hover: { background: `${c}14`, border: `1px solid ${c}`, color: c } as React.CSSProperties,
  });

  const MD = 'text-[13px] px-4 py-2 rounded-lg';

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
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Buttons</h2>
        <p className="text-sm mt-1.5" style={{ color: mut }}>A complete set of button styles, sizes, states, and groupings.</p>
      </motion.div>

      <div className="max-w-3xl">

        {/* 1 ── Default ── */}
        <Section title="Default buttons" desc="Solid, filled buttons in the core palette." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => <Btn key={c.label} {...solid(c.color)} className={`${MD} hover:-translate-y-0.5`}>{c.label}</Btn>)}
          </div>
        </Section>

        {/* 2 ── Outline ── */}
        <Section title="Outline buttons" desc="Border-only buttons that fill softly on hover." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => <Btn key={c.label} {...outline(c.color)} className={MD}>{c.label}</Btn>)}
          </div>
        </Section>

        {/* 3 ── Rounded ── */}
        <Section title="Rounded buttons" desc="Fully rounded pill buttons." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => <Btn key={c.label} {...solid(c.color)} className="text-[13px] px-5 py-2 rounded-full hover:-translate-y-0.5">{c.label}</Btn>)}
          </div>
        </Section>

        {/* 4 ── Soft ── */}
        <Section title="Soft buttons" desc="Tinted background with matching text." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => <Btn key={c.label} {...soft(c.color)} className={MD}>{c.label}</Btn>)}
          </div>
        </Section>

        {/* 5 ── Ghost ── */}
        <Section title="Ghost buttons" desc="No fill until hovered — the quietest action." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => <Btn key={c.label} {...ghost(c.color)} className={MD}>{c.label}</Btn>)}
          </div>
        </Section>

        {/* 6 ── Gradient ── */}
        <Section title="Gradient buttons" desc="Filled gradients for premium, high-emphasis actions." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {GRADIENTS.map((g) => (
              <Btn
                key={g.label}
                base={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, color: '#fff', boxShadow: 'none' }}
                hover={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})`, color: '#fff', boxShadow: `0 8px 20px ${g.from}66` }}
                className="text-[13px] px-5 py-2 rounded-lg hover:-translate-y-0.5"
              >
                {g.label}
              </Btn>
            ))}
          </div>
        </Section>

        {/* 7 ── Animation ── */}
        <Section title="Animation buttons" desc="Motion that triggers only on hover — never idle." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-4">
            <button className="group inline-flex items-center gap-2 text-[13px] font-semibold px-5 py-2 rounded-lg transition-all active:scale-95" style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)' }}>
              Get started <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            {/* shimmer */}
            <button className="group relative overflow-hidden inline-flex items-center text-[13px] font-semibold px-5 py-2 rounded-lg transition-all active:scale-95" style={{ background: '#10b981', color: 'var(--primary-fg, white)' }}>
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
              <span className="relative z-10">Shimmer</span>
            </button>
            {/* icon spin */}
            <Btn {...soft('var(--primary)')} className={`group ${MD}`}>
              <RefreshCw size={15} className="transition-transform duration-500 group-hover:rotate-180" /> Refresh
            </Btn>
            {/* glow */}
            <button className="text-[13px] font-semibold px-5 py-2 rounded-lg transition-all duration-300 active:scale-95 hover:shadow-[0_0_22px_rgba(14,165,233,0.65)]" style={{ background: '#0ea5e9', color: 'var(--primary-fg, white)' }}>
              Glow
            </button>
          </div>
        </Section>

        {/* 8 ── With label ── */}
        <Section title="Buttons with label" desc="An action paired with a leading icon and a trailing count." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              { Icon: Mail, text: 'Messages', count: '12', c: primaryColor },
              { Icon: Heart, text: 'Likes', count: '248', c: '#ef4444' },
              { Icon: Bell, text: 'Alerts', count: '5', c: '#f59e0b' },
            ].map(({ Icon, text, count, c }) => (
              <Btn key={text} {...soft(c)} className={MD}>
                <Icon size={14} /> {text}
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold" style={{ background: c, color: 'var(--primary-fg, white)' }}>{count}</span>
              </Btn>
            ))}
          </div>
        </Section>

        {/* 9 ── Load more ── */}
        <Section title="Load more — with load animation" desc="Click to fetch; a spinner runs only while loading." isDark={isDark}>
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-95 disabled:cursor-default"
            style={{ background: surfaceItem(isDark), border: `1px solid ${border}`, color: pri, opacity: loading ? 0.8 : 1 }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full animate-spin" style={{ borderWidth: '2px', borderStyle: 'solid', borderColor: border, borderTopColor: 'var(--primary)' }} />
                Loading…
              </>
            ) : (
              <><Plus size={15} /> Load more</>
            )}
          </button>
        </Section>

        {/* 10 ── Border ── */}
        <Section title="Border buttons" desc="A subtle surface with a coloured border." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {COLORS.map((c) => <Btn key={c.label} {...bordered(c.color)} className={MD}>{c.label}</Btn>)}
          </div>
        </Section>

        {/* 11 ── Custom toggle ── */}
        <Section title="Custom toggle buttons" desc="Switches and a stateful follow toggle." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch on={sw.notifications} onToggle={() => setSw((s) => ({ ...s, notifications: !s.notifications }))} isDark={isDark} />
              <span className="text-[13px] font-medium" style={{ color: sec }}>Notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch on={sw.sound} onToggle={() => setSw((s) => ({ ...s, sound: !s.sound }))} color="#10b981" isDark={isDark} />
              <span className="text-[13px] font-medium" style={{ color: sec }}>Sound</span>
            </div>
            {following ? (
              <Btn {...soft('#10b981')} className={MD} onClick={() => setFollowing(false)}>
                <Check size={14} /> Following
              </Btn>
            ) : (
              <Btn {...solid(primaryColor)} className={`${MD} hover:-translate-y-0.5`} onClick={() => setFollowing(true)}>
                <Plus size={14} /> Follow
              </Btn>
            )}
          </div>
        </Section>

        {/* 12 ── Sizes ── */}
        <Section title="Button sizes" desc="From extra-small to extra-large." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {SIZES.map((s) => <Btn key={s.label} {...solid(primaryColor)} className={`${s.cls} hover:-translate-y-0.5`}>{s.label}</Btn>)}
          </div>
        </Section>

        {/* 13 ── Width ── */}
        <Section title="Button width" desc="Auto width versus full width." isDark={isDark}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2.5">
              <Btn {...outline(primaryColor)} className={MD}>Auto width</Btn>
              <Btn {...soft(primaryColor)} className={MD}>Another</Btn>
            </div>
            <Btn {...solid(primaryColor)} className={`${MD} w-full hover:brightness-95`}>Full width</Btn>
          </div>
        </Section>

        {/* 14 ── Tag ── */}
        <Section title="Button tags" desc="The same style applied to a link, a button, and an input." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#" onClick={(e) => e.preventDefault()} className={`inline-flex items-center gap-2 font-semibold no-underline ${MD} transition-all active:scale-95 hover:-translate-y-0.5`} style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)' }}>&lt;a&gt; Link</a>
            <button className={`inline-flex items-center gap-2 font-semibold ${MD} transition-all active:scale-95 hover:-translate-y-0.5`} style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)' }}>&lt;button&gt;</button>
            <input type="button" value="<input>" className={`font-semibold cursor-pointer ${MD} transition-all active:scale-95`} style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)' }} />
          </div>
        </Section>

        {/* 15 ── Toggle status ── */}
        <Section title="Toggle status" desc="A button that holds a pressed state (aria-pressed)." isDark={isDark}>
          <button
            aria-pressed={pressed}
            onClick={() => setPressed((p) => !p)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-lg transition-all active:scale-95"
            style={pressed
              ? { background: '#10b981', color: 'var(--primary-fg, white)' }
              : { background: surfaceItem(isDark), border: `1px solid ${border}`, color: pri }}
          >
            {pressed ? <><Check size={14} /> Active</> : 'Inactive'}
          </button>
        </Section>

        {/* 16 ── Grid ── */}
        <Section title="Button grid" desc="Equal-width buttons in a responsive grid." isDark={isDark}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {['Save', 'Share', 'Export', 'Delete'].map((t, i) => {
              const c = [primaryColor, '#0ea5e9', '#10b981', '#ef4444'][i];
              return <Btn key={t} {...soft(c)} className="text-[13px] px-4 py-2.5 rounded-lg w-full">{t}</Btn>;
            })}
          </div>
        </Section>

        {/* 17 ── Checkbox & radio ── */}
        <Section title="Checkbox & radio buttons" desc="Four models: button-group checkbox, button-group radio, and custom check / radio inputs." isDark={isDark}>
          <div className="flex flex-col gap-6">
            {/* model 1: checkbox button group (multi) */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: mut }}>Checkbox buttons</p>
              <div className="flex flex-wrap gap-2.5">
                {['Email', 'SMS', 'Push'].map((k) => {
                  const on = checks[k];
                  return (
                    <button key={k} onClick={() => setChecks((s) => ({ ...s, [k]: !s[k] }))}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95"
                      style={on ? { background: 'rgba(var(--primary-rgb), 0.12)', border: '1px solid rgba(var(--primary-rgb), 0.35)', color: 'var(--primary)' } : { background: 'transparent', border: `1px solid ${border}`, color: sec }}>
                      <span className="w-4 h-4 rounded flex items-center justify-center" style={{ background: on ? 'var(--primary)' : 'transparent', border: on ? 'none' : `1px solid ${border}` }}>
                        {on && <Check size={11} color="var(--primary-fg, white)" />}
                      </span>
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* model 2: radio button group (single) */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: mut }}>Radio buttons</p>
              <div className="flex flex-wrap gap-2.5">
                {['Daily', 'Weekly', 'Monthly'].map((k) => {
                  const on = radioVal === k;
                  return (
                    <button key={k} onClick={() => setRadioVal(k)}
                      className="inline-flex items-center gap-2 text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95"
                      style={on ? { background: '#10b9811f', border: '1px solid #10b98159', color: '#10b981' } : { background: 'transparent', border: `1px solid ${border}`, color: sec }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `1px solid ${on ? '#10b981' : border}` }}>
                        {on && <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />}
                      </span>
                      {k}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* model 3: custom checkbox inputs */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: mut }}>Custom checkbox</p>
              <div className="flex flex-col gap-2.5">
                {[{ k: 'terms', label: 'I accept the terms' }, { k: 'news', label: 'Send me product news' }].map(({ k, label }) => {
                  const on = cbox[k];
                  return (
                    <button key={k} onClick={() => setCbox((s) => ({ ...s, [k]: !s[k] }))} className="inline-flex items-center gap-2.5 text-[13px] font-medium" style={{ color: sec }}>
                      <span className="w-5 h-5 rounded-md flex items-center justify-center transition-colors" style={{ background: on ? 'var(--primary)' : 'transparent', border: on ? 'none' : `1.5px solid ${border}` }}>
                        {on && <Check size={13} color="var(--primary-fg, white)" />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* model 4: custom radio inputs */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: mut }}>Custom radio</p>
              <div className="flex flex-col gap-2.5">
                {[{ k: 'standard', label: 'Standard shipping' }, { k: 'express', label: 'Express shipping' }].map(({ k, label }) => {
                  const on = cradio === k;
                  return (
                    <button key={k} onClick={() => setCradio(k)} className="inline-flex items-center gap-2.5 text-[13px] font-medium" style={{ color: sec }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center transition-colors" style={{ border: `1.5px solid ${on ? 'var(--primary)' : border}` }}>
                        {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--primary)' }} />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* 18 ── Button group ── */}
        <Section title="Button group" desc="Connected buttons acting as a segmented control." isDark={isDark}>
          <div className="inline-flex rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
            {['Day', 'Week', 'Month', 'Year'].map((g, i) => (
              <button key={g} onClick={() => setGroup(g)}
                className="px-4 py-2 text-[13px] font-semibold transition-colors"
                style={{ background: group === g ? 'var(--primary)' : 'transparent', color: group === g ? 'var(--primary-fg, white)' : sec, borderLeft: i > 0 ? `1px solid ${border}` : 'none' }}>
                {g}
              </button>
            ))}
          </div>
        </Section>

        {/* 19 ── Icon buttons ── */}
        <Section title="Icon buttons" desc="Compact, icon-only actions." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {[Plus, Heart, Star, Download, Search, Trash2, Settings].map((Icon, i) => {
              const c = [primaryColor, '#ef4444', '#f59e0b', '#0ea5e9', '#10b981', '#ef4444', 'var(--primary)'][i];
              return (
                <Btn key={i} {...soft(c)} className="w-10 h-10 rounded-lg p-0">
                  <Icon size={16} />
                </Btn>
              );
            })}
          </div>
        </Section>

        {/* 20 ── Toolbar ── */}
        <Section title="Buttons toolbar" desc="Several groups combined into a toolbar." isDark={isDark}>
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-xl" style={{ background: surfaceItem(isDark), border: `1px solid ${border}` }}>
            {[{ k: 'bold', Icon: Bold }, { k: 'italic', Icon: Italic }, { k: 'underline', Icon: Underline }].map(({ k, Icon }) => {
              const on = fmt[k as keyof typeof fmt];
              return (
                <button key={k} onClick={() => setFmt((f) => ({ ...f, [k]: !f[k as keyof typeof fmt] }))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: on ? 'rgba(var(--primary-rgb), 0.12)' : 'transparent', color: on ? 'var(--primary)' : sec }}>
                  <Icon size={15} />
                </button>
              );
            })}
            <span className="w-px h-5 mx-1" style={{ background: border }} />
            {[{ k: 'left', Icon: AlignLeft }, { k: 'center', Icon: AlignCenter }, { k: 'right', Icon: AlignRight }].map(({ k, Icon }) => {
              const on = align === k;
              return (
                <button key={k} onClick={() => setAlign(k)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: on ? 'rgba(var(--primary-rgb), 0.12)' : 'transparent', color: on ? 'var(--primary)' : sec }}>
                  <Icon size={15} />
                </button>
              );
            })}
            <span className="w-px h-5 mx-1" style={{ background: border }} />
            <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: sec }}>
              <List size={15} />
            </button>
          </div>
        </Section>

        {/* 21 ── Group sizing ── */}
        <Section title="Button group sizing" desc="The same group in three sizes." isDark={isDark}>
          <div className="flex flex-col gap-3 items-start">
            {[
              { s: 'text-xs px-3 py-1.5' },
              { s: 'text-[13px] px-4 py-2' },
              { s: 'text-sm px-5 py-2.5' },
            ].map(({ s }, gi) => (
              <div key={gi} className="inline-flex rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
                {['One', 'Two', 'Three'].map((g, i) => (
                  <button key={g} className={`${s} font-semibold transition-colors`}
                    style={{ background: i === 0 ? 'var(--primary)' : 'transparent', color: i === 0 ? 'var(--primary-fg, white)' : sec, borderLeft: i > 0 ? `1px solid ${border}` : 'none' }}>
                    {g}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* 22 ── Vertical variation ── */}
        <Section title="Vertical variation" desc="A vertically stacked button group." isDark={isDark}>
          <div className="inline-flex flex-col rounded-lg overflow-hidden" style={{ border: `1px solid ${border}` }}>
            {['Profile', 'Settings', 'Billing', 'Logout'].map((g, i) => (
              <button key={g}
                className="px-5 py-2 text-[13px] font-semibold text-left transition-colors"
                style={{ background: 'transparent', color: g === 'Logout' ? '#ef4444' : sec, borderTop: i > 0 ? `1px solid ${border}` : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = surfaceHover(isDark); }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                {g}
              </button>
            ))}
          </div>
        </Section>

        {/* 23 ── Focus States ── */}
        <Section title="Focus States" desc="Accessible focus rings for keyboard navigation." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-4 p-6 rounded-2xl" style={{ border: `1px dashed ${borderSubtle(isDark)}` }}>
            <button className="text-[13px] font-semibold px-4 py-2 rounded-lg outline-none transition-all focus-visible:ring-2 focus-visible:ring-offset-2" style={{ background: 'var(--primary)', color: 'var(--primary-fg, white)', ['--tw-ring-color' as string]: 'var(--primary)', ['--tw-ring-offset-color' as string]: isDark ? 'var(--background)' : '#f0eded' }}>
              Focused Primary
            </button>
            <button className="text-[13px] font-semibold px-4 py-2 rounded-lg outline-none transition-all focus-visible:ring-2" style={{ background: surfaceItem(isDark), border: `1px solid ${border}`, color: pri, ['--tw-ring-color' as string]: 'var(--primary)' }}>
              And me
            </button>
          </div>
        </Section>

        {/* 24 ── Focus ring utilities ── */}
        <Section title="Focus ring utilities" desc="Different ring colours and widths on focus." isDark={isDark}>
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              { c: '#10b981', w: 'focus-visible:ring-2', label: 'Success ring' },
              { c: '#f59e0b', w: 'focus-visible:ring-4', label: 'Warning ring' },
              { c: '#ef4444', w: 'focus-visible:ring-2', label: 'Danger ring' },
            ].map(({ c, w, label }) => (
              <button key={label} className={`text-[13px] font-semibold px-4 py-2 rounded-lg outline-none transition-all ${w}`} style={{ background: `${c}1f`, color: c, ['--tw-ring-color' as string]: `${c}99` }}>
                {label}
              </button>
            ))}
          </div>
        </Section>

      </div>
    </motion.div>
  );
}
