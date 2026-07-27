'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { Check, Minus, Zap, ShieldCheck, Star, Bell, Mail, Moon } from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';

interface Props {
  isDark: boolean;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 28 } },
};

const ACCENT = 'var(--primary)';
const COLORS = [
  { name: 'Indigo', value: 'var(--primary)' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
];

type Size = 'sm' | 'md' | 'lg';
const BOX: Record<Size, number> = { sm: 16, md: 20, lg: 24 };

/* ===================================================================== *
 *  GlassCheckbox                                                         *
 * ===================================================================== */
interface CheckboxProps {
  isDark: boolean;
  checked: boolean;
  onChange?: (v: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  color?: string;
  size?: Size;
  label?: React.ReactNode;
  description?: string;
}

function GlassCheckbox({
  isDark,
  checked,
  onChange,
  indeterminate = false,
  disabled = false,
  color = ACCENT,
  size = 'md',
  label,
  description,
}: CheckboxProps) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const s = BOX[size];
  const active = checked || indeterminate;
  const toggle = () => !disabled && onChange?.(!checked);

  return (
    <div
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={toggle}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
      className="flex items-start gap-2.5 outline-none group"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <span
        className="shrink-0 flex items-center justify-center transition-all duration-150"
        style={{
          width: s,
          height: s,
          borderRadius: 6,
          marginTop: label || description ? 1 : 0,
          background: active ? color : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1.5px solid ${active ? color : border}`,
          color: '#fff',
        }}
      >
        {indeterminate ? (
          <Minus size={s - 6} strokeWidth={3.5} />
        ) : checked ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
            <Check size={s - 6} strokeWidth={3.5} />
          </motion.span>
        ) : null}
      </span>
      {(label || description) && (
        <span className="flex flex-col leading-tight">
          {label && <span className="text-[13px] font-medium" style={{ color: pri }}>{label}</span>}
          {description && <span className="text-[11.5px] mt-0.5" style={{ color: mut }}>{description}</span>}
        </span>
      )}
    </div>
  );
}

/* ===================================================================== *
 *  GlassRadio                                                            *
 * ===================================================================== */
interface RadioProps {
  isDark: boolean;
  selected: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  color?: string;
  size?: Size;
  label?: React.ReactNode;
  description?: string;
}

function GlassRadio({
  isDark,
  selected,
  onSelect,
  disabled = false,
  color = ACCENT,
  size = 'md',
  label,
  description,
}: RadioProps) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const s = BOX[size];
  const choose = () => !disabled && onSelect?.();

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={choose}
      onKeyDown={e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          choose();
        }
      }}
      className="flex items-start gap-2.5 outline-none"
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
    >
      <span
        className="shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          width: s,
          height: s,
          marginTop: label || description ? 1 : 0,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1.5px solid ${selected ? color : border}`,
        }}
      >
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="rounded-full"
            style={{ width: s * 0.45, height: s * 0.45, background: color }}
          />
        )}
      </span>
      {(label || description) && (
        <span className="flex flex-col leading-tight">
          {label && <span className="text-[13px] font-medium" style={{ color: pri }}>{label}</span>}
          {description && <span className="text-[11.5px] mt-0.5" style={{ color: mut }}>{description}</span>}
        </span>
      )}
    </div>
  );
}

/* ===================================================================== *
 *  GlassSwitch                                                           *
 * ===================================================================== */
interface SwitchProps {
  isDark: boolean;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  color?: string;
  size?: Size;
}

const SWITCH: Record<Size, { w: number; h: number; thumb: number }> = {
  sm: { w: 34, h: 20, thumb: 14 },
  md: { w: 44, h: 26, thumb: 20 },
  lg: { w: 54, h: 32, thumb: 26 },
};

function GlassSwitch({ isDark, checked, onChange, disabled = false, color = ACCENT, size = 'md' }: SwitchProps) {
  const d = SWITCH[size];
  const off = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className="relative inline-flex items-center shrink-0 transition-colors duration-200"
      style={{
        width: d.w,
        height: d.h,
        borderRadius: d.h,
        padding: 3,
        background: checked ? color : off,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <motion.span
        className="rounded-full bg-white"
        style={{ width: d.thumb, height: d.thumb, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
        animate={{ x: checked ? d.w - d.thumb - 6 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      />
    </button>
  );
}

/* ===================================================================== *
 *  Section wrapper (module-scope to avoid remount on state change)      *
 * ===================================================================== */
function Section({ isDark, title, hint, children }: { isDark: boolean; title: string; hint?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-6 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? <p className="text-[12px] mt-1 mb-5" style={{ color: mut }}>{hint}</p> : <div className="mb-5" />}
      {children}
    </motion.section>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
const FEATURES = [
  { id: 'perf', label: 'Performance Boost', desc: 'Edge caching & faster builds', Icon: Zap },
  { id: 'security', label: 'Advanced Security', desc: 'WAF, audit logs & SSO', Icon: ShieldCheck },
  { id: 'priority', label: 'Priority Support', desc: '24/7 dedicated engineers', Icon: Star },
];
const PLANS = [
  { id: 'starter', label: 'Starter', desc: '$0 / month — for hobby projects' },
  { id: 'pro', label: 'Pro', desc: '$29 / month — for growing teams' },
  { id: 'enterprise', label: 'Enterprise', desc: 'Custom — advanced controls' },
];

export default function SafeCheckboxesRadios({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  // Checkboxes — indeterminate "select all" demo
  const [perms, setPerms] = useState({ read: true, write: false, deploy: false });
  const allOn = Object.values(perms).every(Boolean);
  const someOn = Object.values(perms).some(Boolean);

  const [colorChecks, setColorChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(COLORS.map(c => [c.value, true])),
  );
  const [sizeChecks, setSizeChecks] = useState<Record<Size, boolean>>({ sm: true, md: true, lg: true });
  const [agree, setAgree] = useState(true);
  const [news, setNews] = useState(false);

  // Radios
  const [radioDefault, setRadioDefault] = useState('opt2');
  const [stack, setStack] = useState('react');
  const [radioSize, setRadioSize] = useState<Size>('md');
  const [plan, setPlan] = useState('pro');

  // Switches
  const [sw, setSw] = useState(true);
  const [swSizes, setSwSizes] = useState<Record<Size, boolean>>({ sm: true, md: true, lg: false });
  const [swColors, setSwColors] = useState<Record<string, boolean>>(
    Object.fromEntries(COLORS.map(c => [c.value, true])),
  );
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [darkPref, setDarkPref] = useState(true);

  // Selectable cards
  const [features, setFeatures] = useState<string[]>(['perf']);
  const [cardPlan, setCardPlan] = useState('pro');

  const labelStyle: React.CSSProperties = { color: pri, fontSize: '12px', fontWeight: 600, marginBottom: '12px', display: 'block' };
  const subItem = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const toggleFeature = (id: string) =>
    setFeatures(f => (f.includes(id) ? f.filter(x => x !== id) : [...f, id]));

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Checkboxes &amp; Radios</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Checkboxes &amp; Radios</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Checkboxes --- */}
        <Section isDark={isDark} title="Checkboxes" hint="Custom checkboxes with an animated check, an indeterminate “select all” state, colours, sizes and descriptions.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">

            {/* Select-all / indeterminate */}
            <div>
              <label style={labelStyle}>Indeterminate “Select All”</label>
              <div className="flex flex-col gap-3">
                <GlassCheckbox
                  isDark={isDark}
                  checked={allOn}
                  indeterminate={someOn && !allOn}
                  onChange={v => setPerms({ read: v, write: v, deploy: v })}
                  label="All permissions"
                />
                <div className="flex flex-col gap-3 pl-6">
                  <GlassCheckbox isDark={isDark} checked={perms.read} onChange={v => setPerms(p => ({ ...p, read: v }))} label="Read" />
                  <GlassCheckbox isDark={isDark} checked={perms.write} onChange={v => setPerms(p => ({ ...p, write: v }))} label="Write" />
                  <GlassCheckbox isDark={isDark} checked={perms.deploy} onChange={v => setPerms(p => ({ ...p, deploy: v }))} label="Deploy" />
                </div>
              </div>
            </div>

            {/* States */}
            <div>
              <label style={labelStyle}>States</label>
              <div className="flex flex-col gap-3">
                <GlassCheckbox isDark={isDark} checked={false} onChange={() => {}} label="Unchecked" />
                <GlassCheckbox isDark={isDark} checked label="Checked (default)" onChange={() => {}} />
                <GlassCheckbox isDark={isDark} checked indeterminate label="Indeterminate" onChange={() => {}} />
                <GlassCheckbox isDark={isDark} checked={false} disabled label="Disabled" />
                <GlassCheckbox isDark={isDark} checked disabled label="Disabled checked" />
              </div>
            </div>

            {/* Colors */}
            <div>
              <label style={labelStyle}>Colours</label>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {COLORS.map(c => (
                  <GlassCheckbox
                    key={c.value}
                    isDark={isDark}
                    color={c.value}
                    checked={colorChecks[c.value]}
                    onChange={v => setColorChecks(s => ({ ...s, [c.value]: v }))}
                    label={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <label style={labelStyle}>Sizes</label>
              <div className="flex items-center gap-6">
                {(['sm', 'md', 'lg'] as Size[]).map(sz => (
                  <GlassCheckbox
                    key={sz}
                    isDark={isDark}
                    size={sz}
                    checked={sizeChecks[sz]}
                    onChange={v => setSizeChecks(s => ({ ...s, [sz]: v }))}
                    label={sz.toUpperCase()}
                  />
                ))}
              </div>
            </div>

            {/* With description */}
            <div className="md:col-span-2">
              <label style={labelStyle}>With Description</label>
              <div className="flex flex-col gap-4">
                <GlassCheckbox
                  isDark={isDark}
                  checked={agree}
                  onChange={setAgree}
                  label="I accept the Terms of Service"
                  description="You agree to our privacy policy and acceptable-use guidelines."
                />
                <GlassCheckbox
                  isDark={isDark}
                  checked={news}
                  onChange={setNews}
                  label="Subscribe to the newsletter"
                  description="Get product updates and security advisories — no more than twice a month."
                />
              </div>
            </div>

          </div>
        </Section>

        {/* --- Radio Buttons --- */}
        <Section isDark={isDark} title="Radio Buttons" hint="Single-choice groups with a spring-animated dot — vertical, inline, sized and described.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">

            <div>
              <label style={labelStyle}>Default Group</label>
              <div className="flex flex-col gap-3">
                {['opt1', 'opt2', 'opt3'].map((o, i) => (
                  <GlassRadio key={o} isDark={isDark} selected={radioDefault === o} onSelect={() => setRadioDefault(o)} label={`Option ${i + 1}`} />
                ))}
                <GlassRadio isDark={isDark} selected={false} disabled label="Disabled option" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Inline</label>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {['react', 'vue', 'svelte'].map(o => (
                  <GlassRadio key={o} isDark={isDark} selected={stack === o} onSelect={() => setStack(o)} label={o[0].toUpperCase() + o.slice(1)} />
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Sizes</label>
              <div className="flex items-center gap-6">
                {(['sm', 'md', 'lg'] as Size[]).map(sz => (
                  <GlassRadio key={sz} isDark={isDark} size={sz} selected={radioSize === sz} onSelect={() => setRadioSize(sz)} label={sz.toUpperCase()} />
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>With Description</label>
              <div className="flex flex-col gap-4">
                {PLANS.map(p => (
                  <GlassRadio key={p.id} isDark={isDark} selected={plan === p.id} onSelect={() => setPlan(p.id)} label={p.label} description={p.desc} />
                ))}
              </div>
            </div>

          </div>
        </Section>

        {/* --- Switches --- */}
        <Section isDark={isDark} title="Switches" hint="Toggle switches with a sliding thumb — sizes, colours, disabled states and full setting rows.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">

            <div>
              <label style={labelStyle}>Default</label>
              <div className="flex items-center gap-5">
                <GlassSwitch isDark={isDark} checked={sw} onChange={setSw} />
                <span className="text-[13px]" style={{ color: sec }}>{sw ? 'On' : 'Off'}</span>
                <GlassSwitch isDark={isDark} checked disabled />
                <GlassSwitch isDark={isDark} checked={false} disabled />
                <span className="text-[12px]" style={{ color: mut }}>Disabled</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Sizes</label>
              <div className="flex items-center gap-5">
                {(['sm', 'md', 'lg'] as Size[]).map(sz => (
                  <GlassSwitch key={sz} isDark={isDark} size={sz} checked={swSizes[sz]} onChange={v => setSwSizes(s => ({ ...s, [sz]: v }))} />
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label style={labelStyle}>Colours</label>
              <div className="flex items-center gap-5">
                {COLORS.map(c => (
                  <GlassSwitch key={c.value} isDark={isDark} color={c.value} checked={swColors[c.value]} onChange={v => setSwColors(s => ({ ...s, [c.value]: v }))} />
                ))}
              </div>
            </div>

            {/* Setting rows */}
            <div className="md:col-span-2">
              <label style={labelStyle}>Setting Rows</label>
              <div className="flex flex-col gap-2.5">
                {[
                  { Icon: Mail, title: 'Email notifications', desc: 'Receive activity summaries by email', on: notifEmail, set: setNotifEmail },
                  { Icon: Bell, title: 'Push notifications', desc: 'Real-time alerts on your devices', on: notifPush, set: setNotifPush },
                  { Icon: Moon, title: 'Dark appearance', desc: 'Use a dark theme across the dashboard', on: darkPref, set: setDarkPref },
                ].map(row => (
                  <div
                    key={row.title}
                    className="flex items-center gap-3 p-3.5 rounded-2xl"
                    style={{ background: subItem, border: `1px solid ${border}` }}
                  >
                    <span
                      className="flex items-center justify-center rounded-xl shrink-0"
                      style={{ width: 36, height: 36, background: isDark ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(var(--primary-rgb), 0.1)', color: ACCENT }}
                    >
                      <row.Icon size={18} />
                    </span>
                    <span className="flex flex-col leading-tight mr-auto">
                      <span className="text-[13px] font-semibold" style={{ color: pri }}>{row.title}</span>
                      <span className="text-[11.5px] mt-0.5" style={{ color: mut }}>{row.desc}</span>
                    </span>
                    <GlassSwitch isDark={isDark} checked={row.on} onChange={row.set} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Section>

        {/* --- Selectable Cards --- */}
        <Section isDark={isDark} title="Selectable Cards" hint="Checkbox and radio behaviour applied to rich cards — multi-select features and a single-select plan.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Multi-select feature cards */}
            <div>
              <label style={labelStyle}>Add-ons (multiple)</label>
              <div className="flex flex-col gap-3">
                {FEATURES.map(f => {
                  const on = features.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      role="checkbox"
                      aria-checked={on}
                      tabIndex={0}
                      onClick={() => toggleFeature(f.id)}
                      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleFeature(f.id); } }}
                      className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer outline-none transition-all duration-200"
                      style={{
                        background: on ? (isDark ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--primary-rgb), 0.06)') : subItem,
                        border: `1.5px solid ${on ? ACCENT : border}`,
                      }}
                    >
                      <span
                        className="flex items-center justify-center rounded-xl shrink-0 transition-colors"
                        style={{ width: 38, height: 38, background: on ? ACCENT : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'), color: on ? '#fff' : mut }}
                      >
                        <f.Icon size={18} />
                      </span>
                      <span className="flex flex-col leading-tight mr-auto">
                        <span className="text-[13px] font-semibold" style={{ color: pri }}>{f.label}</span>
                        <span className="text-[11.5px] mt-0.5" style={{ color: mut }}>{f.desc}</span>
                      </span>
                      <span className="pointer-events-none">
                        <GlassCheckbox isDark={isDark} checked={on} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Single-select plan cards */}
            <div>
              <label style={labelStyle}>Plan (single)</label>
              <div className="flex flex-col gap-3">
                {PLANS.map(p => {
                  const on = cardPlan === p.id;
                  return (
                    <div
                      key={p.id}
                      role="radio"
                      aria-checked={on}
                      tabIndex={0}
                      onClick={() => setCardPlan(p.id)}
                      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setCardPlan(p.id); } }}
                      className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer outline-none transition-all duration-200"
                      style={{
                        background: on ? (isDark ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(var(--primary-rgb), 0.06)') : subItem,
                        border: `1.5px solid ${on ? ACCENT : border}`,
                      }}
                    >
                      <span className="pointer-events-none">
                        <GlassRadio isDark={isDark} selected={on} />
                      </span>
                      <span className="flex flex-col leading-tight mr-auto">
                        <span className="text-[13px] font-semibold" style={{ color: pri }}>{p.label}</span>
                        <span className="text-[11.5px] mt-0.5" style={{ color: mut }}>{p.desc}</span>
                      </span>
                      {on && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: ACCENT, color: '#fff' }}>
                          SELECTED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </Section>

      </div>
    </motion.div>
  );
}
