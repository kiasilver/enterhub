'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { User, Lock, Phone, Building2, MapPin, AtSign, Eye, EyeOff, Search } from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';
import CustomSelect from './CustomSelect';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

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
const fieldsWrap: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const fieldRise: Variants = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } } };

/* ===================================================================== *
 *  Section + atoms                                                      *
 * ===================================================================== */
function Section({ isDark, title, hint, children }: { isDark: boolean; title: string; hint?: string; children: React.ReactNode }) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  return (
    <motion.section variants={fadeUp} className="p-6 sm:p-7 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold" style={{ color: pri }}>{title}</h3>
      {hint ? <p className="text-[12px] mt-1 mb-6" style={{ color: mut }}>{hint}</p> : <div className="mb-6" />}
      {children}
    </motion.section>
  );
}

const Item = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div variants={fieldRise} className={className}>{children}</motion.div>
);

function useFieldKit(isDark: boolean) {
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const inputClass = 'w-full text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200 focus:border-primary/60';
  const inputStyle: React.CSSProperties = { background: bg, border: `1px solid ${border}`, color: pri };
  const labelStyle: React.CSSProperties = { color: pri, fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' };
  return { pri, mut, border, bg, inputClass, inputStyle, labelStyle };
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const GRAD = `linear-gradient(135deg, ${primaryColor} 0%, var(--primary) 100%)`;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.03, boxShadow: `0 12px 28px ${ACCENT}55` }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold"
      style={{ background: GRAD, color: '#fff', boxShadow: `0 8px 20px ${ACCENT}40` }}
    >
      {children}
    </motion.button>
  );
}

function GhostBtn({ isDark, children, onClick }: { isDark: boolean; children: React.ReactNode; onClick?: () => void }) {
  const sec = textSecondary(isDark);
  const border = borderSubtle(isDark);
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors hover:border-primary/60"
      style={{ background: 'transparent', color: sec, border: `1px solid ${border}` }}
    >
      {children}
    </button>
  );
}

/* icon-wrapped input */
function IconInput({ isDark, icon, ...rest }: { isDark: boolean; icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const { mut, inputClass, inputStyle } = useFieldKit(isDark);
  return (
    <div className="relative">
      <span className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}>{icon}</span>
      <input {...rest} className={inputClass} style={{ ...inputStyle, paddingLeft: 38 }} />
    </div>
  );
}

/* floating-label input (CSS peer) */
function FloatingInput({ isDark, id, label, type = 'text' }: { isDark: boolean; id: string; label: string; type?: string }) {
  const { pri, mut, border, bg } = useFieldKit(isDark);
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        placeholder=" "
        className="peer w-full text-[13px] rounded-xl outline-none transition-all duration-200 focus:border-primary/60"
        style={{ background: bg, border: `1px solid ${border}`, color: pri, padding: '18px 14px 6px' }}
      />
      <label
        htmlFor={id}
        className="absolute text-[12px] duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 pointer-events-none"
        style={{ color: mut }}
      >
        {label}
      </label>
    </div>
  );
}

/* ===================================================================== *
 *  Page                                                                 *
 * ===================================================================== */
export default function SafeFormLayouts({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const { pri, mut, border, bg, inputClass, inputStyle, labelStyle } = useFieldKit(isDark);
  const sec = textSecondary(isDark);
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState('all');

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Form Layouts</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Form Layouts</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Vertical + Horizontal side by side --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vertical */}
          <Section isDark={isDark} title="Vertical Form" hint="Labels stacked above each control — the most common layout.">
            <motion.div variants={fieldsWrap} initial="hidden" animate="show" className="flex flex-col gap-4">
              <Item>
                <label style={labelStyle}>Email</label>
                <input type="email" placeholder="you@example.com" className={inputClass} style={inputStyle} />
              </Item>
              <Item>
                <label style={labelStyle}>Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" className={inputClass} style={{ ...inputStyle, paddingRight: 38 }} />
                  <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-0 bottom-0 flex items-center transition-colors hover:text-primary" style={{ color: mut }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Item>
              <Item>
                <button type="button" onClick={() => setRemember(r => !r)} className="flex items-center gap-2.5 outline-none" style={{ cursor: 'pointer' }}>
                  <span className="w-5 h-5 rounded-md flex items-center justify-center transition-all" style={{ background: remember ? ACCENT : bg, border: `1.5px solid ${remember ? ACCENT : border}`, color: '#fff' }}>
                    {remember && (
                      <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></motion.svg>
                    )}
                  </span>
                  <span className="text-[12.5px]" style={{ color: sec }}>Remember me</span>
                </button>
              </Item>
              <Item><PrimaryBtn>Sign in</PrimaryBtn></Item>
            </motion.div>
          </Section>

          {/* Horizontal */}
          <Section isDark={isDark} title="Horizontal Form" hint="Labels aligned to the left of each control.">
            <motion.div variants={fieldsWrap} initial="hidden" animate="show" className="flex flex-col gap-4">
              {[
                { l: 'Full name', el: <input placeholder="Jane Cooper" className={inputClass} style={inputStyle} /> },
                { l: 'Email', el: <input type="email" placeholder="jane@company.com" className={inputClass} style={inputStyle} /> },
                { l: 'Bio', el: <textarea rows={3} placeholder="A short bio…" className={`${inputClass} resize-none`} style={inputStyle} /> },
              ].map(row => (
                <Item key={row.l} className="grid grid-cols-1 sm:grid-cols-[110px_1fr] sm:items-center gap-x-4 gap-y-1.5">
                  <label className="text-[12px] font-semibold sm:text-right" style={{ color: pri }}>{row.l}</label>
                  {row.el}
                </Item>
              ))}
              <Item className="grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-x-4">
                <span />
                <div className="flex gap-2.5">
                  <PrimaryBtn>Save</PrimaryBtn>
                  <GhostBtn isDark={isDark}>Cancel</GhostBtn>
                </div>
              </Item>
            </motion.div>
          </Section>
        </div>

        {/* --- Inline form --- */}
        <Section isDark={isDark} title="Inline Form" hint="Compact controls on a single row — ideal for filters and quick search.">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label style={labelStyle}>Search</label>
              <IconInput isDark={isDark} icon={<Search size={16} />} placeholder="Search orders…" />
            </div>
            <div className="min-w-[160px]">
              <label style={labelStyle}>Status</label>
              <CustomSelect
                isDark={isDark}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
            </div>
            <PrimaryBtn>Apply filters</PrimaryBtn>
          </div>
        </Section>

        {/* --- Grid (two-column) form --- */}
        <Section isDark={isDark} title="Grid Form" hint="A responsive multi-column grid for longer forms.">
          <motion.div variants={fieldsWrap} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Item>
              <label style={labelStyle}>First name</label>
              <input placeholder="Jane" className={inputClass} style={inputStyle} />
            </Item>
            <Item>
              <label style={labelStyle}>Last name</label>
              <input placeholder="Cooper" className={inputClass} style={inputStyle} />
            </Item>
            <Item>
              <label style={labelStyle}>Email</label>
              <input type="email" placeholder="jane@company.com" className={inputClass} style={inputStyle} />
            </Item>
            <Item>
              <label style={labelStyle}>Phone</label>
              <input placeholder="+1 (555) 000-0000" className={inputClass} style={inputStyle} />
            </Item>
            <Item className="md:col-span-2">
              <label style={labelStyle}>Address</label>
              <input placeholder="1600 Amphitheatre Pkwy" className={inputClass} style={inputStyle} />
            </Item>
            <Item>
              <label style={labelStyle}>City</label>
              <input placeholder="Mountain View" className={inputClass} style={inputStyle} />
            </Item>
            <Item>
              <label style={labelStyle}>State</label>
              <input placeholder="California" className={inputClass} style={inputStyle} />
            </Item>
            <Item className="md:col-span-2 flex justify-end gap-2.5 mt-1">
              <GhostBtn isDark={isDark}>Reset</GhostBtn>
              <PrimaryBtn>Save changes</PrimaryBtn>
            </Item>
          </motion.div>
        </Section>

        {/* --- Inputs with icons + Floating labels --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section isDark={isDark} title="With Icons" hint="Leading icons that hint at each field's purpose.">
            <motion.div variants={fieldsWrap} initial="hidden" animate="show" className="flex flex-col gap-4">
              <Item>
                <label style={labelStyle}>Username</label>
                <IconInput isDark={isDark} icon={<User size={16} />} placeholder="jane.cooper" />
              </Item>
              <Item>
                <label style={labelStyle}>Email</label>
                <IconInput isDark={isDark} icon={<AtSign size={16} />} type="email" placeholder="jane@company.com" />
              </Item>
              <Item>
                <label style={labelStyle}>Company</label>
                <IconInput isDark={isDark} icon={<Building2 size={16} />} placeholder="Acme Inc." />
              </Item>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Item>
                  <label style={labelStyle}>Phone</label>
                  <IconInput isDark={isDark} icon={<Phone size={16} />} placeholder="555-0132" />
                </Item>
                <Item>
                  <label style={labelStyle}>City</label>
                  <IconInput isDark={isDark} icon={<MapPin size={16} />} placeholder="London" />
                </Item>
              </div>
            </motion.div>
          </Section>

          <Section isDark={isDark} title="Floating Labels" hint="The label rises into place as the field is focused or filled.">
            <motion.div variants={fieldsWrap} initial="hidden" animate="show" className="flex flex-col gap-4">
              <Item><FloatingInput isDark={isDark} id="fl-name" label="Full name" /></Item>
              <Item><FloatingInput isDark={isDark} id="fl-email" label="Email address" type="email" /></Item>
              <Item><FloatingInput isDark={isDark} id="fl-pwd" label="Password" type="password" /></Item>
              <Item className="flex items-center gap-2 text-[12px]" >
                <Lock size={14} style={{ color: mut }} />
                <span style={{ color: mut }}>We never share your details with anyone.</span>
              </Item>
            </motion.div>
          </Section>
        </div>

      </div>
    </motion.div>
  );
}
