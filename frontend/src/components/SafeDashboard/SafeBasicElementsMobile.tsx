'use client';

import { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { Mail, Eye, EyeOff, AtSign, DollarSign, PenLine, Calendar, FileText, UploadCloud } from 'lucide-react';
import GlassDatePicker from './GlassDatePicker';
import GlassTimePicker from './GlassTimePicker';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';

interface Props {
  isDark: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────
 * Dedicated MOBILE design for Forms / Basic Elements.
 *
 * The desktop page packs every control into a 2/3-column grid that cannot
 * survive a phone viewport (inputs and input-groups overflow and get clipped).
 * Instead of squeezing that grid down, this is a purpose-built mobile layout:
 * a vertical stack of icon-headed glass cards, full-width 16px touch inputs
 * (16px also stops iOS focus-zoom), and input-groups that stack vertically so
 * nothing can ever push past the screen edge. Rendered by SafeBasicElements
 * below the `md` breakpoint via useIsMobile().
 * ───────────────────────────────────────────────────────────────────────── */

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 230, damping: 28 } },
};

const SWATCHES = ['var(--primary)', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6'];

export default function SafeBasicElementsMobile({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)';
  const bgHover = surfaceHover(isDark);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [colorValue, setColorValue] = useState('var(--primary)');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [timeValue, setTimeValue] = useState<string>('');

  // 16px font: comfortable touch target + prevents the iOS focus-zoom jump.
  const inputClass = 'w-full min-w-0 text-[16px] px-4 py-3 rounded-xl outline-none transition-all duration-200 placeholder-opacity-50 focus:ring-2 ring-primary/25 focus:border-primary/60';
  const inputStyle: React.CSSProperties = { background: bg, border: `1px solid ${border}`, color: pri, colorScheme: isDark ? 'dark' : 'light', accentColor: 'var(--primary)' };

  // ── Section card with an iconed header ──────────────────────────────────
  const Section = ({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) => (
    <motion.section variants={fadeUp} className="rounded-3xl overflow-hidden" style={glassStyle(isDark)}>
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.12)', color: 'var(--primary)' }}>
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold leading-tight truncate" style={{ color: pri }}>{title}</h3>
          {subtitle && <p className="text-[11px] mt-0.5 truncate" style={{ color: mut }}>{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 pb-5 flex flex-col gap-4">{children}</div>
    </motion.section>
  );

  // ── Labelled field wrapper ──────────────────────────────────────────────
  const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="min-w-0">
      <label className="block mb-1.5 text-[12.5px] font-semibold" style={{ color: pri }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1.5" style={{ color: mut }}>{hint}</p>}
    </div>
  );

  // ── Affixed input group — affix never shrinks, input always does ────────
  const groupWrap = 'flex items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/25 focus-within:border-primary/60';
  const groupAffix = 'flex items-center px-3.5 text-[14px] font-medium shrink-0';
  const groupInput = 'flex-1 min-w-0 px-3.5 py-3 text-[16px] outline-none bg-transparent placeholder-opacity-50';

  return (
    <motion.div
      className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-5 pb-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-5 min-w-0">
        <p className="text-[11px] font-medium mb-1" style={{ color: mut }}>Forms / Basic Elements</p>
        <h2 className="text-[26px] font-bold leading-none" style={{ color: pri, letterSpacing: '-0.02em' }}>Basic Elements</h2>
        <p className="text-[12.5px] mt-2" style={{ color: sec }}>Form controls, optimised for touch.</p>
      </motion.div>

      <div className="flex flex-col gap-5 min-w-0">

        {/* ── Text inputs ── */}
        <Section icon={<PenLine size={18} />} title="Text Inputs" subtitle="Standard single-line fields">
          <Field label="Basic Input">
            <input type="text" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Input with Placeholder">
            <input type="text" placeholder="Enter your name..." className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Input with Value">
            <input type="text" defaultValue="John Doe" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Readonly Plain Text">
            <input type="text" readOnly defaultValue="Readonly input text" className="w-full min-w-0 text-[16px] py-2 outline-none bg-transparent" style={{ color: sec }} />
          </Field>
          <Field label="Readonly Input">
            <input type="text" readOnly defaultValue="Readonly input" className={inputClass} style={{ ...inputStyle, background: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)', color: mut }} />
          </Field>
          <Field label="Disabled Input">
            <input type="text" disabled placeholder="Disabled input" className={inputClass} style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
          </Field>
        </Section>

        {/* ── Icons & password ── */}
        <Section icon={<Mail size={18} />} title="Icons & Password" subtitle="Adorned and secure fields">
          <Field label="Input with Icon">
            <div className="relative">
              <div className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Mail size={18} /></div>
              <input type="email" placeholder="example@gmail.com" className={inputClass} style={{ ...inputStyle, paddingLeft: '44px' }} />
            </div>
          </Field>
          <Field label="Input with Icon (Right)">
            <div className="relative">
              <input type="email" placeholder="example@gmail.com" className={inputClass} style={{ ...inputStyle, paddingRight: '44px' }} />
              <div className="absolute right-3.5 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Mail size={18} /></div>
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <input type={passwordVisible ? 'text' : 'password'} defaultValue="password123" className={inputClass} style={{ ...inputStyle, paddingRight: '48px' }} />
              <button type="button" onClick={() => setPasswordVisible(v => !v)} className="absolute right-3.5 top-0 bottom-0 flex items-center transition-colors hover:text-primary" style={{ color: mut }} aria-label="Toggle password visibility">
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
        </Section>

        {/* ── Pickers ── */}
        <Section icon={<Calendar size={18} />} title="Pickers" subtitle="Date, time & colour">
          <Field label="Input Date">
            <GlassDatePicker isDark={isDark} value={dateValue} onChange={setDateValue} />
          </Field>
          <Field label="Input Time">
            <GlassTimePicker isDark={isDark} value={timeValue} onChange={setTimeValue} />
          </Field>
          <Field label="Color Picker">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: colorValue, border: `1px solid ${border}` }} />
              <input
                type="text"
                value={colorValue}
                onChange={(e) => setColorValue(e.target.value)}
                className={`${inputClass} font-mono`}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-wrap gap-2.5 mt-3">
              {SWATCHES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorValue(c)}
                  className={`w-8 h-8 rounded-full transition-transform active:scale-90 ${colorValue === c ? 'ring-2 ring-offset-2' : ''}`}
                  style={{ backgroundColor: c, '--tw-ring-color': pri, '--tw-ring-offset-color': 'transparent' } as React.CSSProperties}
                  aria-label={`Select colour ${c}`}
                />
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Textarea & variants ── */}
        <Section icon={<FileText size={18} />} title="Textarea & Variants" subtitle="Multiline and styled inputs">
          <Field label="Example Textarea">
            <textarea rows={4} placeholder="Enter your message..." className={`${inputClass} resize-none`} style={inputStyle} />
          </Field>
          <Field label="Form Text" hint="Must be 8-20 characters long.">
            <input type="text" className={inputClass} style={inputStyle} />
          </Field>
          <Field label="Dashed Border">
            <input type="text" placeholder="Dashed border" className={inputClass} style={{ ...inputStyle, borderStyle: 'dashed' }} />
          </Field>
          <Field label="Rounded Input">
            <input type="text" placeholder="Rounded full" className={inputClass} style={{ ...inputStyle, borderRadius: '9999px' }} />
          </Field>
          <Field label="Datalist Example">
            <input list="browsers-mobile" placeholder="Search browser..." className={inputClass} style={inputStyle} />
            <datalist id="browsers-mobile">
              <option value="Chrome" />
              <option value="Firefox" />
              <option value="Safari" />
              <option value="Edge" />
            </datalist>
          </Field>
          {/* Floating label */}
          <div className="relative">
            <input type="text" id="floating_input_m" className={`peer ${inputClass}`} style={{ ...inputStyle, paddingTop: '22px', paddingBottom: '8px' }} placeholder=" " />
            <label htmlFor="floating_input_m" className="absolute text-[13px] duration-200 transform -translate-y-3.5 scale-90 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-90 peer-focus:-translate-y-3.5" style={{ color: mut }}>Floating Input</label>
          </div>
        </Section>

        {/* ── File upload ── */}
        <Section icon={<UploadCloud size={18} />} title="File Upload" subtitle="Single, multiple & sizes">
          <Field label="Default File Input">
            <input type="file" className={`${inputClass} !py-2 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-[13px] file:font-semibold file:bg-primary/10 file:text-primary`} style={inputStyle} />
          </Field>
          <Field label="Multiple Files">
            <input type="file" multiple className={`${inputClass} !py-2 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-[13px] file:font-semibold file:bg-emerald-500/10 file:text-emerald-500`} style={inputStyle} />
          </Field>
          <Field label="Disabled File Input">
            <input type="file" disabled className={`${inputClass} !py-2 opacity-50 cursor-not-allowed file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-[13px] file:font-semibold file:bg-gray-500/10 file:text-gray-500`} style={inputStyle} />
          </Field>
          <Field label="Small Size">
            <input type="file" className={`${inputClass} !py-1.5 !text-[14px] file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-semibold file:bg-primary/10 file:text-primary`} style={inputStyle} />
          </Field>
          <Field label="Large Size">
            <input type="file" className={`${inputClass} !py-3 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[14px] file:font-semibold file:bg-primary/10 file:text-primary`} style={inputStyle} />
          </Field>
        </Section>

        {/* ── Input groups (stacked / wrapped so nothing overflows) ── */}
        <Section icon={<AtSign size={18} />} title="Input Groups" subtitle="Prefixes, suffixes & addons">
          <Field label="Username">
            <div className={groupWrap} style={{ border: `1px solid ${border}`, background: bg }}>
              <span className={groupAffix} style={{ background: bgHover, borderRight: `1px solid ${border}`, color: mut }}>@</span>
              <input type="text" placeholder="Username" className={groupInput} style={{ color: pri }} />
            </div>
          </Field>

          <Field label="Email Suffix">
            <div className={groupWrap} style={{ border: `1px solid ${border}`, background: bg }}>
              <input type="text" placeholder="recipient" className={groupInput} style={{ color: pri }} />
              <span className={groupAffix} style={{ background: bgHover, borderLeft: `1px solid ${border}`, color: mut }}>@mail.com</span>
            </div>
          </Field>

          {/* Long prefix: stack the affix above the input so it never overflows */}
          <Field label="Vanity URL">
            <div className="rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/25 focus-within:border-primary/60" style={{ border: `1px solid ${border}`, background: bg }}>
              <span className="block px-3.5 py-2 text-[12.5px] font-medium border-b break-all" style={{ background: bgHover, borderColor: border, color: mut }}>https://example.com/users/</span>
              <input type="text" placeholder="vanity-url" className="w-full min-w-0 px-3.5 py-3 text-[16px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
            </div>
          </Field>

          <Field label="Amount">
            <div className={groupWrap} style={{ border: `1px solid ${border}`, background: bg }}>
              <span className={groupAffix} style={{ background: bgHover, borderRight: `1px solid ${border}`, color: mut }}><DollarSign size={15} /></span>
              <input type="text" placeholder="0.00" className={groupInput} style={{ color: pri }} />
              <span className={groupAffix} style={{ background: bgHover, borderLeft: `1px solid ${border}`, color: mut }}>.00</span>
            </div>
          </Field>

          <Field label="Checkbox Addon">
            <div className={groupWrap} style={{ border: `1px solid ${border}`, background: bg }}>
              <span className="flex items-center px-4 shrink-0" style={{ background: bgHover, borderRight: `1px solid ${border}` }}>
                <input type="checkbox" className="w-4 h-4 rounded accent-primary" />
              </span>
              <input type="text" placeholder="With a checkbox" className={groupInput} style={{ color: pri }} />
            </div>
          </Field>

          <Field label="Radio Addon">
            <div className={groupWrap} style={{ border: `1px solid ${border}`, background: bg }}>
              <span className="flex items-center px-4 shrink-0" style={{ background: bgHover, borderRight: `1px solid ${border}` }}>
                <input type="radio" name="radio-addon-m" className="w-4 h-4 accent-primary" />
              </span>
              <input type="text" placeholder="With a radio" className={groupInput} style={{ color: pri }} />
            </div>
          </Field>

          {/* Button addons: input on top, full-width button row beneath */}
          <Field label="Button Addons">
            <input type="text" placeholder="Type something..." className={`${inputClass} mb-2.5`} style={inputStyle} />
            <div className="flex gap-2.5">
              <button type="button" className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-95 text-primary" style={{ background: 'rgba(var(--primary-rgb),0.12)' }}>Action</button>
              <button type="button" className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-colors active:scale-95 text-rose-500" style={{ background: 'rgba(244,63,94,0.12)' }}>Delete</button>
            </div>
          </Field>
        </Section>

      </div>
    </motion.div>
  );
}
