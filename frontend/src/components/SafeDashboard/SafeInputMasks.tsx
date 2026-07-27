'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  Calendar,
  Clock,
  CalendarClock,
  Phone,
  Smartphone,
  MapPin,
  CreditCard,
  DollarSign,
  Percent,
  Wifi,
  Network,
  Hash,
  Palette,
  IdCard,
  Type,
  Lock,
} from 'lucide-react';
import {
  textPrimary,
  textSecondary,
  textMuted,
  glassStyle,
  borderSubtle,
} from './theme';
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
const fieldGrid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const fieldItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 240, damping: 26 } },
};

const DONE = '#10b981';

/* ===================================================================== *
 *  Mask engine                                                          *
 *  Tokens:  9 = digit · A = letter · * = alphanumeric · H = hex         *
 *  Anything else is treated as a literal separator.                     *
 * ===================================================================== */
function applyMask(value: string, mask: string): string {
  let out = '';
  let vi = 0;
  for (let mi = 0; mi < mask.length && vi < value.length; ) {
    const m = mask[mi];
    const c = value[vi];
    const isDigit = /[0-9]/.test(c);
    const isAlpha = /[a-zA-Z]/.test(c);
    const isHex = /[0-9a-fA-F]/.test(c);

    if (m === '9' || m === 'A' || m === '*' || m === 'H') {
      const ok = m === '9' ? isDigit : m === 'A' ? isAlpha : m === 'H' ? isHex : isDigit || isAlpha;
      if (ok) {
        out += c;
        mi++;
      }
      vi++; // skip char that doesn't fit the token
    } else {
      // literal — emit it, and consume the typed char if it matches
      out += m;
      mi++;
      if (c === m) vi++;
    }
  }
  return out;
}

function maskCurrency(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [rawInt = '', ...rest] = cleaned.split('.');
  const intPart = rawInt.replace(/^0+(?=\d)/, '') || (cleaned.startsWith('.') ? '0' : '');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = rest.length ? '.' + rest.join('').slice(0, 2) : '';
  if (!grouped && !dec && cleaned.includes('.')) return '0.';
  return grouped + dec;
}

function maskPercent(value: string): string {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 3);
  if (!digits) return '';
  const n = Math.min(100, parseInt(digits, 10));
  return `${n}%`;
}

function maskHexColor(value: string): string {
  const hex = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
  return hex ? `#${hex}` : '';
}

function detectCard(value: string): { brand: string; color: string } | null {
  const d = value.replace(/\D/g, '');
  if (!d) return null;
  if (/^4/.test(d)) return { brand: 'Visa', color: '#1a52c4' };
  if (/^(5[1-5]|2[2-7])/.test(d)) return { brand: 'Mastercard', color: '#eb6c1c' };
  if (/^3[47]/.test(d)) return { brand: 'Amex', color: '#1aa3c4' };
  if (/^6(011|5)/.test(d)) return { brand: 'Discover', color: '#e0922a' };
  return { brand: 'Card', color: '#9ca3af' };
}

/* ===================================================================== *
 *  MaskField                                                            *
 * ===================================================================== */
interface MaskFieldProps {
  isDark: boolean;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  format: (v: string) => string;
  placeholder: string;
  icon: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  trailing?: React.ReactNode;
  targetLength?: number;
}

function MaskField({ isDark, label, hint, value, onChange, format, placeholder, icon, inputMode, trailing, targetLength }: MaskFieldProps) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const track = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const [focused, setFocused] = useState(false);
  const hasProgress = targetLength !== undefined;
  const filled = hasProgress ? Math.min(1, value.length / targetLength) : 0;
  const complete = hasProgress && value.length >= targetLength;
  const activeColor = complete ? DONE : primaryColor;
  const lit = focused || value.length > 0;
  const iconColor = lit ? activeColor : mut;

  return (
    <motion.div variants={fieldItem}>
      <label
        className="text-[12px] font-semibold block mb-1.5 transition-colors duration-200"
        style={{ color: focused ? activeColor : pri }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-0 bottom-0 flex items-center pointer-events-none transition-colors duration-200"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
        <input
          value={value}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => onChange(format(e.target.value))}
          placeholder={placeholder}
          className="w-full text-[13px] py-2.5 rounded-xl outline-none transition-all duration-200 font-mono tracking-wide"
          style={{
            background: bg,
            border: `1px solid ${focused ? activeColor : border}`,
            boxShadow: focused ? `0 0 0 3px ${activeColor}22` : 'none',
            color: pri,
            paddingLeft: 38,
            paddingRight: trailing ? 76 : 14,
          }}
        />
        {trailing && <span className="absolute right-3 top-0 bottom-0 flex items-center">{trailing}</span>}
      </div>

      {hasProgress ? (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: track }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: activeColor }}
              animate={{ width: `${filled * 100}%` }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            />
          </div>
          <span className="text-[11px] font-mono shrink-0" style={{ color: complete ? DONE : mut }}>{hint}</span>
        </div>
      ) : (
        <p className="text-[11px] mt-1.5 font-mono" style={{ color: mut }}>{hint}</p>
      )}
    </motion.div>
  );
}

/* ===================================================================== *
 *  Section wrapper                                                      *
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
export default function SafeInputMasks({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);

  const iconSize = 16;
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [datetime, setDatetime] = useState('');
  const [phoneUS, setPhoneUS] = useState('');
  const [phoneIntl, setPhoneIntl] = useState('');
  const [zip, setZip] = useState('');

  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [currency, setCurrency] = useState('');
  const [percent, setPercent] = useState('');

  const [ip, setIp] = useState('');
  const [mac, setMac] = useState('');
  const [ssn, setSsn] = useState('');
  const [hex, setHex] = useState('');
  const [plate, setPlate] = useState('');

  const [numeric, setNumeric] = useState('');
  const [letters, setLetters] = useState('');
  const [alnum, setAlnum] = useState('');

  const brand = detectCard(card);
  const validHex = /^#[0-9A-F]{6}$/.test(hex);

  const grid = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5';

  return (
    <motion.div className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12" variants={container} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-7 max-w-4xl">
        <p className="text-xs font-medium mb-1" style={{ color: mut }}>Forms / Input Masks</p>
        <h2 className="text-2xl font-bold" style={{ color: pri, letterSpacing: '-0.01em' }}>Input Masks</h2>
      </motion.div>

      <div className="max-w-4xl grid gap-6">

        {/* --- Date, Time & Contact --- */}
        <Section isDark={isDark} title="Date, Time & Contact" hint="Live formatting applied as you type — only valid characters are kept.">
          <motion.div className={grid} variants={fieldGrid} initial="hidden" animate="show">
            <MaskField isDark={isDark} label="Date" hint="DD / MM / YYYY" value={date} onChange={setDate} format={v => applyMask(v, '99/99/9999')} placeholder="31/12/2026" icon={<Calendar size={iconSize} />} inputMode="numeric" targetLength={10} />
            <MaskField isDark={isDark} label="Time" hint="HH : MM (24h)" value={time} onChange={setTime} format={v => applyMask(v, '99:99')} placeholder="14:30" icon={<Clock size={iconSize} />} inputMode="numeric" targetLength={5} />
            <MaskField isDark={isDark} label="Date & Time" hint="DD/MM/YYYY HH:MM" value={datetime} onChange={setDatetime} format={v => applyMask(v, '99/99/9999 99:99')} placeholder="31/12/2026 14:30" icon={<CalendarClock size={iconSize} />} inputMode="numeric" targetLength={16} />
            <MaskField isDark={isDark} label="Phone (US)" hint="(999) 999-9999" value={phoneUS} onChange={setPhoneUS} format={v => applyMask(v, '(999) 999-9999')} placeholder="(415) 555-0132" icon={<Phone size={iconSize} />} inputMode="tel" targetLength={14} />
            <MaskField isDark={isDark} label="Phone (Intl)" hint="+99 999 999 9999" value={phoneIntl} onChange={setPhoneIntl} format={v => applyMask(v, '+99 999 999 9999')} placeholder="+44 207 555 0132" icon={<Smartphone size={iconSize} />} inputMode="tel" targetLength={16} />
            <MaskField isDark={isDark} label="ZIP + 4" hint="99999-9999" value={zip} onChange={setZip} format={v => applyMask(v, '99999-9999')} placeholder="94103-1234" icon={<MapPin size={iconSize} />} inputMode="numeric" targetLength={10} />
          </motion.div>
        </Section>

        {/* --- Financial --- */}
        <Section isDark={isDark} title="Financial" hint="Card number detects the brand automatically; currency adds thousands separators on the fly.">
          <motion.div className={grid} variants={fieldGrid} initial="hidden" animate="show">
            <MaskField
              isDark={isDark}
              label="Credit Card"
              hint="9999 9999 9999 9999"
              value={card}
              onChange={setCard}
              format={v => applyMask(v, '9999 9999 9999 9999')}
              placeholder="4242 4242 4242 4242"
              icon={<CreditCard size={iconSize} />}
              inputMode="numeric"
              targetLength={19}
              trailing={
                brand ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-md" style={{ background: `${brand.color}22`, color: brand.color }}>
                    {brand.brand}
                  </span>
                ) : null
              }
            />
            <MaskField isDark={isDark} label="Card Expiry" hint="MM / YY" value={expiry} onChange={setExpiry} format={v => applyMask(v, '99/99')} placeholder="12/28" icon={<Calendar size={iconSize} />} inputMode="numeric" targetLength={5} />
            <MaskField isDark={isDark} label="CVV" hint="999" value={cvv} onChange={setCvv} format={v => applyMask(v, '999')} placeholder="123" icon={<Lock size={iconSize} />} inputMode="numeric" targetLength={3} />
            <MaskField isDark={isDark} label="Currency" hint="1,234.56" value={currency} onChange={setCurrency} format={maskCurrency} placeholder="12,500.00" icon={<DollarSign size={iconSize} />} inputMode="decimal" />
            <MaskField isDark={isDark} label="Percentage" hint="0 – 100 %" value={percent} onChange={setPercent} format={maskPercent} placeholder="75%" icon={<Percent size={iconSize} />} inputMode="numeric" />
          </motion.div>
        </Section>

        {/* --- Network & Identifiers --- */}
        <Section isDark={isDark} title="Network & Identifiers" hint="Hex-only, digit-only and pattern masks for technical fields.">
          <motion.div className={grid} variants={fieldGrid} initial="hidden" animate="show">
            <MaskField isDark={isDark} label="IP Address" hint="999.999.999.999" value={ip} onChange={setIp} format={v => applyMask(v, '999.999.999.999')} placeholder="192.168.0.1" icon={<Wifi size={iconSize} />} inputMode="numeric" />
            <MaskField isDark={isDark} label="MAC Address" hint="HH:HH:HH:HH:HH:HH" value={mac} onChange={v => setMac(v.toUpperCase())} format={v => applyMask(v, 'HH:HH:HH:HH:HH:HH')} placeholder="3C:5A:B4:0F:7E:21" icon={<Network size={iconSize} />} targetLength={17} />
            <MaskField isDark={isDark} label="SSN" hint="999-99-9999" value={ssn} onChange={setSsn} format={v => applyMask(v, '999-99-9999')} placeholder="123-45-6789" icon={<IdCard size={iconSize} />} inputMode="numeric" targetLength={11} />
            <MaskField
              isDark={isDark}
              label="Hex Colour"
              hint="#FFFFFF"
              value={hex}
              onChange={setHex}
              format={maskHexColor}
              placeholder="var(--primary)"
              icon={<Palette size={iconSize} />}
              targetLength={7}
              trailing={
                <span
                  className="w-5 h-5 rounded-md transition-colors"
                  style={{ background: validHex ? hex : 'transparent', border: `1px solid ${validHex ? 'transparent' : borderSubtle(isDark)}` }}
                />
              }
            />
            <MaskField isDark={isDark} label="License Plate" hint="AAA-9999" value={plate} onChange={v => setPlate(v.toUpperCase())} format={v => applyMask(v, 'AAA-9999')} placeholder="ABC-1234" icon={<Hash size={iconSize} />} targetLength={8} />
          </motion.div>
        </Section>

        {/* --- Character Rules --- */}
        <Section isDark={isDark} title="Character Rules" hint="Restrict input to a single character class.">
          <motion.div className={grid} variants={fieldGrid} initial="hidden" animate="show">
            <MaskField isDark={isDark} label="Numbers Only" hint="0-9" value={numeric} onChange={setNumeric} format={v => v.replace(/[^0-9]/g, '')} placeholder="0123456789" icon={<Hash size={iconSize} />} inputMode="numeric" />
            <MaskField isDark={isDark} label="Letters Only" hint="A-Z a-z" value={letters} onChange={setLetters} format={v => v.replace(/[^a-zA-Z ]/g, '')} placeholder="Hello World" icon={<Type size={iconSize} />} />
            <MaskField isDark={isDark} label="Alphanumeric" hint="A-Z 0-9" value={alnum} onChange={setAlnum} format={v => v.replace(/[^a-zA-Z0-9]/g, '')} placeholder="Order2026" icon={<Type size={iconSize} />} />
          </motion.div>
        </Section>

        {/* --- Live preview note --- */}
        <motion.p variants={fadeUp} className="text-[12px]" style={{ color: sec }}>
          Every field above is fully controlled — the displayed text <span style={{ color: primaryColor, fontWeight: 600 }}>is</span> the masked value, so it is always submit-ready.
        </motion.p>

      </div>
    </motion.div>
  );
}
