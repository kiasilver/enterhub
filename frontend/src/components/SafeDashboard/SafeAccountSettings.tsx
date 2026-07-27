'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, Globe, Clock, Bell, Key, Shield, Smartphone } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import SafeAccountShell, { accountFadeUp, iconTile, getIconColors } from './SafeAccountShell';

interface Props { isDark: boolean; setActivePage: (id: string) => void; }

function Toggle({ on, onChange, isDark, accent }: { on: boolean; onChange: () => void; isDark: boolean; accent: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="relative flex-shrink-0 rounded-full transition-colors duration-300"
      style={{
        width: 44,
        height: 24,
        background: on ? accent : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
        border: `1px solid ${on ? accent : borderSubtle(isDark)}`,
      }}
    >
      <motion.span
        className="absolute top-1/2 rounded-full bg-white shadow-sm"
        style={{ width: 18, height: 18, left: 2, marginTop: -9 }}
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    </button>
  );
}

export default function SafeAccountSettings({ isDark, setActivePage }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const ICON_COLORS = getIconColors(primaryColor);
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const bg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const [fullName, setFullName] = useState('Ali Mohammadi');
  const [email, setEmail] = useState('ali.mohammadi@enterhub.io');
  const [phone, setPhone] = useState('+98 912 345 6789');
  const [language, setLanguage] = useState<'en' | 'fa'>('en');

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    digest: false,
    incidentSms: true,
  });
  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((p) => ({ ...p, [key]: !p[key] }));

  const [twoFactor, setTwoFactor] = useState(true);

  const [focused, setFocused] = useState<string | null>(null);

  const inputStyle = (id: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${focused === id ? ACCENT : border}`,
    color: pri,
    boxShadow: focused === id ? `0 0 0 3px ${ACCENT}22` : 'none',
  });

  const outlineBtn = (color: string): React.CSSProperties => ({
    background: 'transparent',
    color,
    border: `1.5px solid ${color}`,
  });
  const onBtnEnter = (color: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = `${color}14`;
  };
  const onBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent';
  };

  const labelCls = 'text-[10px] font-black uppercase tracking-wider';
  const sectionTitleCls = 'text-[15px] font-semibold';

  const personalFields = [
    { id: 'name', label: 'Full Name', value: fullName, set: setFullName, icon: User, type: 'text', placeholder: 'Your name' },
    { id: 'email', label: 'Email Address', value: email, set: setEmail, icon: Mail, type: 'email', placeholder: 'you@example.com' },
    { id: 'phone', label: 'Phone Number', value: phone, set: setPhone, icon: Phone, type: 'tel', placeholder: '+98 ...' },
  ] as const;

  const notifRows = [
    { id: 'email' as const, icon: Bell, title: 'Email alerts', desc: 'Account activity and security notices sent to your inbox.' },
    { id: 'push' as const, icon: Smartphone, title: 'Push notifications', desc: 'Real-time alerts pushed to your registered devices.' },
    { id: 'digest' as const, icon: Mail, title: 'Weekly digest', desc: 'A summary of incidents and reports every Monday.' },
    { id: 'incidentSms' as const, icon: Phone, title: 'Incident SMS', desc: 'Critical incident escalations delivered via text message.' },
  ];

  return (
    <SafeAccountShell isDark={isDark} active="account-settings" setActivePage={setActivePage}>

      {/* 1) Personal information */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="mb-5">
          <h3 className={sectionTitleCls} style={{ color: pri }}>Personal information</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: sec }}>Update your name and contact details.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personalFields.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.id} className={`space-y-1.5 ${f.id === 'name' ? 'sm:col-span-2' : ''}`}>
                <label className={labelCls} style={{ color: mut }}>{f.label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: focused === f.id ? ACCENT : mut }} />
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    onFocus={() => setFocused(f.id)}
                    onBlur={() => setFocused(null)}
                    placeholder={f.placeholder}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                    style={inputStyle(f.id)}
                  />
                </div>
                {i === personalFields.length - 1 && null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors"
            style={outlineBtn(ACCENT)}
            onMouseEnter={onBtnEnter(ACCENT)}
            onMouseLeave={onBtnLeave}
          >
            Save changes
          </button>
        </div>
      </motion.div>

      {/* 2) Preferences */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="mb-5">
          <h3 className={sectionTitleCls} style={{ color: pri }}>Preferences</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: sec }}>Choose how the dashboard is presented to you.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Language segmented */}
          <div className="space-y-2">
            <label className={`${labelCls} flex items-center gap-1.5`} style={{ color: mut }}>
              <Globe size={12} /> Language
            </label>
            <div
              className="inline-flex p-1 rounded-xl w-full"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              {([['en', 'English']] as const).map(([key, lbl]) => {
                const active = language === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLanguage(key)}
                    className="relative flex-1 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-colors"
                    style={{ color: active ? '#ffffff' : sec, zIndex: 1 }}
                  >
                    {active && (
                      <motion.span
                        layoutId="lang-pill"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: ACCENT, zIndex: -1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone display */}
          <div className="space-y-2">
            <label className={`${labelCls} flex items-center gap-1.5`} style={{ color: mut }}>
              <Clock size={12} /> Timezone
            </label>
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <span className="text-[13px] font-medium" style={{ color: pri }}>Asia/Tehran</span>
              <span className="text-[11px] font-medium" style={{ color: mut }}>GMT+3:30</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3) Notifications */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="mb-5">
          <h3 className={sectionTitleCls} style={{ color: pri }}>Notifications</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: sec }}>Decide which updates you want to receive.</p>
        </div>

        <div className="space-y-2.5">
          {notifRows.map((row, i) => {
            const Icon = row.icon;
            const on = notifications[row.id];
            return (
              <div
                key={row.id}
                className="flex items-center gap-4 p-3.5 rounded-2xl"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={iconTile(ICON_COLORS[i % ICON_COLORS.length])}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold" style={{ color: pri }}>{row.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: sec }}>{row.desc}</p>
                </div>
                <Toggle on={on} onChange={() => toggleNotif(row.id)} isDark={isDark} accent={ACCENT} />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 4) Security */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="mb-5">
          <h3 className={sectionTitleCls} style={{ color: pri }}>Security</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: sec }}>Keep your account protected and review access.</p>
        </div>

        <div className="space-y-2.5">
          {/* Change password */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={iconTile(ICON_COLORS[0])}>
              <Key size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold" style={{ color: pri }}>Change password</p>
              <p className="text-[12px] mt-0.5" style={{ color: sec }}>Last changed 4 months ago.</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-colors flex-shrink-0"
              style={outlineBtn(ACCENT)}
              onMouseEnter={onBtnEnter(ACCENT)}
              onMouseLeave={onBtnLeave}
            >
              Update
            </button>
          </div>

          {/* Two-factor authentication */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={iconTile(ICON_COLORS[1])}>
              <Shield size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold flex items-center gap-2" style={{ color: pri }}>
                Two-factor authentication
                {twoFactor && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />}
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: sec }}>
                {twoFactor ? 'Enabled via authenticator app.' : 'Add an extra layer of security at sign-in.'}
              </p>
            </div>
            <Toggle on={twoFactor} onChange={() => setTwoFactor((v) => !v)} isDark={isDark} accent={ACCENT} />
          </div>

          {/* Active sessions */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl" style={{ background: bg, border: `1px solid ${border}` }}>
            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={iconTile(ICON_COLORS[2])}>
              <Smartphone size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold" style={{ color: pri }}>Active sessions</p>
              <p className="text-[12px] mt-0.5" style={{ color: sec }}>2 devices currently signed in.</p>
            </div>
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-colors flex-shrink-0"
              style={outlineBtn(ACCENT)}
              onMouseEnter={onBtnEnter(ACCENT)}
              onMouseLeave={onBtnLeave}
            >
              Manage
            </button>
          </div>
        </div>
      </motion.div>

    </SafeAccountShell>
  );
}
