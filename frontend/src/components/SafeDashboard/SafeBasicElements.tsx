'use client';

import { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { Mail, Calendar, Clock, Eye, EyeOff } from 'lucide-react';
import GlassDatePicker from './GlassDatePicker';
import GlassTimePicker from './GlassTimePicker';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import { useIsMobile } from './useIsMobile';
import SafeBasicElementsMobile from './SafeBasicElementsMobile';

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

const Section = ({ title, isDark, children }: { title: string, isDark: boolean, children: React.ReactNode }) => {
  const pri = textPrimary(isDark);
  return (
    <motion.section variants={fadeUp} className="mb-8 p-4 sm:p-6 rounded-3xl" style={glassStyle(isDark)}>
      <h3 className="text-base font-bold mb-6" style={{ color: pri }}>{title}</h3>
      {children}
    </motion.section>
  );
};

function SafeBasicElementsDesktop({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const bgHover = surfaceHover(isDark);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [colorValue, setColorValue] = useState('var(--primary)');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [timeValue, setTimeValue] = useState<string>('');

  // Common input styles
  // min-w-0 is essential: native file inputs have a large intrinsic min-width and
  // would otherwise blow the shared grid column wider than the phone viewport.
  const inputClass = "w-full min-w-0 text-[13px] px-3.5 py-2.5 rounded-xl outline-none transition-all duration-200 placeholder-opacity-50 focus:ring-2 ring-primary/20 focus:border-primary/50";
  const inputStyle: React.CSSProperties = { background: bg, border: `1px solid ${border}`, color: pri, colorScheme: isDark ? 'dark' : 'light', accentColor: 'var(--primary)' };
  
  const labelStyle = { color: pri, fontSize: '12px', fontWeight: 600, marginBottom: '6px', display: 'block' };

  return (
    <motion.div className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar px-4 sm:px-6 py-5 sm:py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Basic Elements</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Basic Elements</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6 min-w-0">
        
        {/* --- Input Examples --- */}
        <Section title="Input Example" isDark={isDark}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label style={labelStyle}>Basic Input</label>
              <input type="text" className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Input with Placeholder</label>
              <input type="text" placeholder="Enter your name..." className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Input with Value</label>
              <input type="text" defaultValue="John Doe" className={inputClass} style={inputStyle} />
            </div>
            
            <div>
              <label style={labelStyle}>Readonly Plain Text</label>
              <input type="text" readOnly defaultValue="Readonly input text" className="w-full text-[13px] py-2.5 outline-none bg-transparent" style={{ color: sec }} />
            </div>
            <div>
              <label style={labelStyle}>Readonly Input</label>
              <input type="text" readOnly defaultValue="Readonly input" className={inputClass} style={{ ...inputStyle, background: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', color: mut }} />
            </div>
            <div>
              <label style={labelStyle}>Disabled Input</label>
              <input type="text" disabled placeholder="Disabled input" className={inputClass} style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>

            <div>
              <label style={labelStyle}>Input with Icon</label>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Mail size={16} /></div>
                <input type="email" placeholder="example@gmail.com" className={inputClass} style={{ ...inputStyle, paddingLeft: '38px' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Input with Icon Right</label>
              <div className="relative">
                <input type="email" placeholder="example@gmail.com" className={inputClass} style={{ ...inputStyle, paddingRight: '38px' }} />
                <div className="absolute right-3 top-0 bottom-0 flex items-center pointer-events-none" style={{ color: mut }}><Mail size={16} /></div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Input Password</label>
              <div className="relative">
                <input type={passwordVisible ? "text" : "password"} defaultValue="password123" className={inputClass} style={{ ...inputStyle, paddingRight: '38px' }} />
                <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute right-3 top-0 bottom-0 flex items-center transition-colors hover:text-primary" style={{ color: mut }}>
                  {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Input Date</label>
              <GlassDatePicker isDark={isDark} value={dateValue} onChange={setDateValue} />
            </div>
            <div>
              <label style={labelStyle}>Input Time</label>
              <GlassTimePicker isDark={isDark} value={timeValue} onChange={setTimeValue} />
            </div>
            <div className="relative">
              <label style={labelStyle}>Color Picker</label>
              <div>
                <div onClick={() => setPickerOpen(!pickerOpen)} className="w-full h-[42px] rounded-xl cursor-pointer flex items-center p-1.5 transition-all duration-200 hover:opacity-90" style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="w-full h-full rounded-lg shadow-sm transition-colors duration-200" style={{ backgroundColor: colorValue }} />
                </div>
                {pickerOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 p-4 rounded-2xl shadow-xl z-50 w-[240px] max-w-[calc(100vw-2rem)] backdrop-blur-2xl" style={{ background: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)', border: `1px solid ${border}` }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: pri }}>Theme Colors</p>
                    <div className="grid grid-cols-5 gap-2.5 mb-4">
                      {['var(--primary)', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#10b981', '#06b6d4', '#3b82f6'].map(c => (
                        <div 
                          key={c}
                          onClick={() => { setColorValue(c); setPickerOpen(false); }}
                          className={`w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 ${colorValue === c ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''}`}
                          style={{ backgroundColor: c, '--tw-ring-color': pri } as React.CSSProperties}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold" style={{ color: mut }}>HEX</span>
                      <input 
                        type="text" 
                        value={colorValue} 
                        onChange={(e) => setColorValue(e.target.value)}
                        className="flex-1 min-w-0 text-[13px] px-3 py-1.5 rounded-lg outline-none font-mono"
                        style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: pri, border: `1px solid ${border}` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label style={labelStyle}>Example Textarea</label>
              <textarea rows={3} placeholder="Enter your message..." className={`${inputClass} resize-none`} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Form Text</label>
              <input type="text" className={inputClass} style={inputStyle} />
              <p className="text-[11px] mt-1.5" style={{ color: mut }}>Must be 8-20 characters long.</p>
            </div>

            <div>
              <label style={labelStyle}>Input Border Style</label>
              <input type="text" placeholder="Dashed border" className={inputClass} style={{ ...inputStyle, borderStyle: 'dashed' }} />
            </div>
            <div>
              <label style={labelStyle}>Rounded Input</label>
              <input type="text" placeholder="Rounded full" className={inputClass} style={{ ...inputStyle, borderRadius: '9999px' }} />
            </div>
            <div>
              <label style={labelStyle}>Datalist Example</label>
              <input list="browsers" placeholder="Search browser..." className={inputClass} style={inputStyle} />
              <datalist id="browsers">
                <option value="Chrome" />
                <option value="Firefox" />
                <option value="Safari" />
                <option value="Edge" />
              </datalist>
            </div>

            {/* Floating input logic via CSS peer */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-2">
              <div className="relative">
                <input type="text" id="floating_input" className={`peer ${inputClass}`} style={{ ...inputStyle, padding: '18px 14px 6px' }} placeholder=" " />
                <label htmlFor="floating_input" className="absolute text-[12px] duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-3.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3" style={{ color: mut }}>Floating Input</label>
              </div>
            </div>

          </div>
        </Section>

        {/* --- File Input --- */}
        <Section title="File Input" isDark={isDark}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label style={labelStyle}>Default File Input Example</label>
              <p className="text-[11px] mb-3" style={{ color: mut }}>Standard file selection.</p>
              <input type="file" className={`${inputClass} !p-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20`} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Multiple Files Input Example</label>
              <p className="text-[11px] mb-3" style={{ color: mut }}>Select multiple files at once.</p>
              <input type="file" multiple className={`${inputClass} !p-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20`} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Disabled File Input</label>
              <p className="text-[11px] mb-3" style={{ color: mut }}>Disabled state file input.</p>
              <input type="file" disabled className={`${inputClass} !p-1 opacity-50 cursor-not-allowed file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-500/10 file:text-gray-500`} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Small Size</label>
              <input type="file" className={`${inputClass} !p-0.5 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20`} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Default Size</label>
              <input type="file" className={`${inputClass} !p-1 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20`} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Large Size</label>
              <input type="file" className={`${inputClass} !p-2 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20`} style={inputStyle} />
            </div>
          </div>
        </Section>

        {/* --- Input Group --- */}
        <Section title="Input Group" isDark={isDark}>
          <div className="flex flex-col gap-5">
            <div>
              <label style={labelStyle}>Basic Example</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                  <span className="flex items-center px-4 text-sm font-medium" style={{ background: bgHover, borderRight: `1px solid ${border}`, color: mut }}>@</span>
                  <input type="text" placeholder="Username" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                </div>
                <div className="flex items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                  <input type="text" placeholder="Recipient's username" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                  <span className="flex items-center px-4 text-sm font-medium" style={{ background: bgHover, borderLeft: `1px solid ${border}`, color: mut }}>@example.com</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                <span className="flex items-center px-4 py-2.5 sm:py-0 text-sm font-medium border-b sm:border-b-0 sm:border-r" style={{ background: bgHover, borderColor: border, color: mut }}>https://example.com/users/</span>
                <input type="text" placeholder="vanity-url" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
              </div>
            </div>

            <div>
              <div className="flex items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                <span className="flex items-center px-4 text-sm font-medium" style={{ background: bgHover, borderRight: `1px solid ${border}`, color: mut }}>$</span>
                <input type="text" placeholder="0.00" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                <span className="flex items-center px-4 text-sm font-medium" style={{ background: bgHover, borderLeft: `1px solid ${border}`, color: mut }}>.00</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label style={labelStyle}>Checkbox & Radio Addons</label>
                <div className="flex items-stretch rounded-xl overflow-hidden mb-4 transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                  <div className="flex items-center px-4" style={{ background: bgHover, borderRight: `1px solid ${border}` }}>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary cursor-pointer" />
                  </div>
                  <input type="text" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                </div>
                <div className="flex items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                  <div className="flex items-center px-4" style={{ background: bgHover, borderRight: `1px solid ${border}` }}>
                    <input type="radio" className="w-3.5 h-3.5 accent-primary cursor-pointer" />
                  </div>
                  <input type="text" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Button Addons</label>
                <div className="flex items-stretch rounded-xl overflow-hidden mb-4 transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                  <button type="button" className="px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-primary/10 text-primary" style={{ borderRight: `1px solid ${border}`, background: bgHover }}>Action</button>
                  <input type="text" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                </div>
                <div className="flex items-stretch rounded-xl overflow-hidden transition-all duration-200 focus-within:ring-2 ring-primary/20 focus-within:border-primary/50" style={{ border: `1px solid ${border}`, background: bg }}>
                  <input type="text" className="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent placeholder-opacity-50" style={{ color: pri }} />
                  <button type="button" className="px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-emerald-500/10 text-emerald-500" style={{ borderLeft: `1px solid ${border}`, background: bgHover }}>Action</button>
                  <button type="button" className="px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-rose-500/10 text-rose-500" style={{ borderLeft: `1px solid ${border}`, background: bgHover }}>Delete</button>
                </div>
              </div>
            </div>

          </div>
        </Section>

      </div>
    </motion.div>
  );
}

export default function SafeBasicElements({ isDark }: Props) {
  // Below the `md` breakpoint the desktop grid overflows the viewport, so swap
  // in the purpose-built mobile layout (phones/small tablets get the stacked
  // touch design; ≥768px keeps the multi-column showcase grid).
  const isMobile = useIsMobile(768);
  if (isMobile) return <SafeBasicElementsMobile isDark={isDark} />;
  return <SafeBasicElementsDesktop isDark={isDark} />;
}
