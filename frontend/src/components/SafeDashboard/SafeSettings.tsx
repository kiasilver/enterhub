'use client';

import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { User, Bell, Shield, Settings, Mail, Lock, Check, CreditCard, Palette, Puzzle, Sun, Moon, Monitor } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, surfaceItem, borderSubtle } from './theme';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';

interface Props {
  isDark: boolean;
}

export default function SafeSettings({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const glass = glassStyle(isDark);

  const [activeTab, setActiveTab] = useState('profile');
  
  const [profile, setProfile] = useState({
    firstName: 'Ali',
    lastName: 'Mohammadi',
    email: 'ali.mohammadi@enterhub.com'
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [preferences, setPreferences] = useState({
    theme: isDark ? 'Dark' : 'System',
    language: 'English (US)',
    timezone: '(GMT-05:00) Eastern Time (US & Canada)'
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false
  });

  const [appearance, setAppearance] = useState({
    theme: isDark ? 'Dark' : 'System',
    accent: 'Indigo',
    density: 'Comfortable'
  });

  const [integrations, setIntegrations] = useState({
    slack: true,
    github: false,
    googleDrive: true,
    figma: false
  });

  const accentOptions = [
    { name: 'Indigo', color: 'var(--primary)' },
    { name: 'Emerald', color: '#10b981' },
    { name: 'Rose', color: '#ef4444' },
    { name: 'Amber', color: '#f59e0b' },
    { name: 'Violet', color: 'var(--primary)' },
    { name: 'Sky', color: '#0ea5e9' },
  ];

  const invoices = [
    { id: 'INV-2026-0612', date: 'Jun 12, 2026', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-0512', date: 'May 12, 2026', amount: '$49.00', status: 'Paid' },
    { id: 'INV-2026-0412', date: 'Apr 12, 2026', amount: '$49.00', status: 'Paid' },
  ];

  const themeOptions: { name: string; icon: React.ReactNode }[] = [
    { name: 'Light', icon: <Sun size={15} /> },
    { name: 'Dark', icon: <Moon size={15} /> },
    { name: 'System', icon: <Monitor size={15} /> },
  ];

  const inputStyle = {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${borderSubtle(isDark)}`,
    color: pri
  };

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={16} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'integrations', label: 'Integrations', icon: <Puzzle size={16} /> },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  };

  return (
    <div className="w-full h-full overflow-y-auto px-4 md:px-8 pt-5 pb-10" style={{ scrollbarWidth: 'none' }}>
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black mb-2" style={{ color: pri, letterSpacing: '-0.02em' }}>Settings</h2>
        <p className="text-sm font-medium" style={{ color: mut }}>Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="rounded-3xl p-4 sticky top-0" style={glass}>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 whitespace-nowrap" style={{ scrollbarWidth: 'none' }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileTap={{ scale: 0.96 }}
                    className="relative flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 flex-1 lg:flex-none"
                    style={{
                      background: 'transparent',
                      color: isActive ? 'var(--primary)' : sec,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = surfaceHover(isDark);
                        e.currentTarget.style.color = pri;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = sec;
                      }
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="settings-tab"
                        className="absolute inset-0 rounded-xl"
                        style={{ background: 'var(--primary)', opacity: 0.15 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-3">
                      {tab.icon}
                      {tab.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12, y: 6 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -12, y: 6 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl p-6 md:p-8"
            style={glass}
          >
            {activeTab === 'profile' && (
              <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
                <motion.div variants={item} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary overflow-hidden relative group cursor-pointer border-2" style={{ borderColor: borderSubtle(isDark) }}>
                    <img src="/profile.png" alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">Change</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Profile Picture</h3>
                    <p className="text-xs mb-3" style={{ color: mut }}>PNG, JPEG under 5MB</p>
                    <GlassButton>Upload Image</GlassButton>
                  </div>
                </motion.div>

                <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>First Name</label>
                    <input 
                      type="text" 
                      value={profile.firstName} 
                      onChange={e => setProfile({...profile, firstName: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all" 
                      style={inputStyle} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Last Name</label>
                    <input 
                      type="text" 
                      value={profile.lastName} 
                      onChange={e => setProfile({...profile, lastName: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all" 
                      style={inputStyle} 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" style={{ color: sec }} />
                      <input 
                        type="email" 
                        value={profile.email} 
                        onChange={e => setProfile({...profile, email: e.target.value})}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all" 
                        style={inputStyle} 
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="pt-4 flex justify-end">
                  <GlassButton hoverVariant="success">Save Changes</GlassButton>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Change Password</h3>
                  <p className="text-sm mb-6" style={{ color: mut }}>Ensure your account is using a long, random password to stay secure.</p>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Current Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" style={{ color: sec }} />
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={security.currentPassword}
                          onChange={e => setSecurity({...security, currentPassword: e.target.value})}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all" 
                          style={inputStyle} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>New Password</label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" style={{ color: sec }} />
                        <input 
                          type="password" 
                          placeholder="••••••••" 
                          value={security.newPassword}
                          onChange={e => setSecurity({...security, newPassword: e.target.value})}
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 ring-primary transition-all" 
                          style={inputStyle} 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={item} className="pt-4 border-t" style={{ borderColor: borderSubtle(isDark) }}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Two-Factor Authentication</h3>
                  <p className="text-sm mb-4" style={{ color: mut }}>Add additional security to your account using two factor authentication.</p>
                  <GlassButton>Enable 2FA</GlassButton>
                </motion.div>

                <motion.div variants={item} className="pt-4 flex justify-end">
                  <GlassButton hoverVariant="success">Update Password</GlassButton>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Notification Preferences</h3>
                  <p className="text-sm mb-6" style={{ color: mut }}>Choose what updates you want to receive.</p>
                </motion.div>

                <motion.div className="space-y-4" variants={container}>
                  {[
                    { id: 'email', title: 'Email Notifications', desc: 'Receive daily summary emails' },
                    { id: 'push', title: 'Push Notifications', desc: 'Real-time alerts on your devices' },
                    { id: 'sms', title: 'SMS Alerts', desc: 'Critical alerts via SMS' },
                    { id: 'marketing', title: 'Marketing', desc: 'Receive promotional materials' },
                  ].map((row) => {
                    const isOn = notifications[row.id as keyof typeof notifications];
                    return (
                    <motion.div variants={item} key={row.id} className="flex items-center justify-between p-4 rounded-2xl border transition-colors" style={{ borderColor: borderSubtle(isDark), background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                      <div>
                        <p className="font-bold text-sm" style={{ color: pri }}>{row.title}</p>
                        <p className="text-xs" style={{ color: mut }}>{row.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(p => ({ ...p, [row.id]: !p[row.id as keyof typeof notifications] }))}
                        className="w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center"
                        style={{ background: isOn ? 'var(--primary)' : (isDark ? '#333' : '#e5e7eb') }}
                      >
                        <motion.span
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                          animate={{ x: isOn ? 24 : 0 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      </button>
                    </motion.div>
                    );
                  })}
                </motion.div>

                <motion.div variants={item} className="pt-4 flex justify-end">
                  <GlassButton hoverVariant="success">Save Preferences</GlassButton>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>General Preferences</h3>
                  <p className="text-sm mb-6" style={{ color: mut }}>Customize how Enterhub looks and feels on your device.</p>
                </motion.div>

                <motion.div className="space-y-6" variants={container}>
                  {/* Theme */}
                  <motion.div variants={item} className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Appearance Theme</label>
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                      {['Light', 'Dark', 'System'].map(t => {
                        const isActive = preferences.theme === t;
                        return (
                          <button 
                            key={t} 
                            onClick={() => setPreferences({...preferences, theme: t})}
                            className="px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:border-primary"
                            style={{
                              background: isActive ? (isDark ? 'rgba(var(--primary-rgb),0.2)' : 'rgba(var(--primary-rgb),0.1)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                              borderColor: isActive ? 'var(--primary)' : borderSubtle(isDark),
                              color: isActive ? 'var(--primary)' : pri
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Language */}
                  <motion.div variants={item} className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Language</label>
                    <CustomSelect
                      isDark={isDark}
                      value={preferences.language}
                      onChange={(val) => setPreferences({ ...preferences, language: val })}
                      options={[
                        { value: 'English (US)', label: 'English (US)' },
                        { value: 'Spanish (ES)', label: 'Spanish (ES)' },
                        { value: 'French (FR)', label: 'French (FR)' },
                        { value: 'Persian (FA)', label: 'Persian (FA)' },
                      ]}
                    />
                  </motion.div>

                  {/* Timezone */}
                  <motion.div variants={item} className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Timezone</label>
                    <CustomSelect
                      isDark={isDark}
                      value={preferences.timezone}
                      onChange={(val) => setPreferences({ ...preferences, timezone: val })}
                      options={[
                        { value: '(GMT-05:00) Eastern Time (US & Canada)', label: '(GMT-05:00) Eastern Time (US & Canada)' },
                        { value: '(GMT-08:00) Pacific Time (US & Canada)', label: '(GMT-08:00) Pacific Time (US & Canada)' },
                        { value: '(GMT+00:00) Greenwich Mean Time', label: '(GMT+00:00) Greenwich Mean Time' },
                        { value: '(GMT+03:30) Tehran Time', label: '(GMT+03:30) Tehran Time' },
                      ]}
                    />
                  </motion.div>
                </motion.div>

                <motion.div variants={item} className="pt-4 flex justify-end">
                  <GlassButton hoverVariant="success">Save Preferences</GlassButton>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Billing & Plans</h3>
                  <p className="text-sm" style={{ color: mut }}>Manage your subscription and review your billing history.</p>
                </motion.div>

                {/* Current plan summary card */}
                <motion.div variants={item} className="rounded-2xl p-6 border" style={{ borderColor: 'var(--primary)', background: isDark ? 'rgba(var(--primary-rgb),0.08)' : 'rgba(var(--primary-rgb),0.04)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: 'var(--primary)', background: isDark ? 'rgba(var(--primary-rgb),0.18)' : 'rgba(var(--primary-rgb),0.12)' }}>Current Plan</span>
                      </div>
                      <h4 className="text-2xl font-black" style={{ color: pri, letterSpacing: '-0.02em' }}>Pro</h4>
                      <p className="text-sm mt-1" style={{ color: sec }}>
                        <span className="font-bold" style={{ color: pri }}>$49</span> / month · Renews Jul 12, 2026
                      </p>
                      <div className="flex flex-col gap-1.5 mt-4">
                        {['Unlimited monitored assets', 'Advanced threat analytics', 'Priority 24/7 support'].map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs" style={{ color: sec }}>
                            <Check size={14} style={{ color: 'var(--primary)' }} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <GlassButton>Upgrade Plan</GlassButton>
                      <GlassButton hoverVariant="danger">Cancel Subscription</GlassButton>
                    </div>
                  </div>
                </motion.div>

                {/* Payment method row */}
                <motion.div variants={item} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Payment Method</label>
                  <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ borderColor: borderSubtle(isDark), background: surfaceItem(isDark) }}>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-8 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                        <CreditCard size={18} style={{ color: sec }} />
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: pri }}>Visa ending in 4242</p>
                        <p className="text-xs" style={{ color: mut }}>Expires 08 / 2028</p>
                      </div>
                    </div>
                    <GlassButton>Update</GlassButton>
                  </div>
                </motion.div>

                {/* Recent invoices list */}
                <motion.div variants={item} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Recent Invoices</label>
                  <div className="rounded-2xl border overflow-hidden" style={{ borderColor: borderSubtle(isDark) }}>
                    {invoices.map((inv, i) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between px-4 py-3.5 transition-colors"
                        style={{
                          background: surfaceItem(isDark),
                          borderTop: i === 0 ? 'none' : `1px solid ${borderSubtle(isDark)}`,
                        }}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: pri }}>{inv.id}</p>
                          <p className="text-xs" style={{ color: mut }}>{inv.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: '#10b981', background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }}>{inv.status}</span>
                          <span className="text-sm font-bold tabular-nums" style={{ color: pri }}>{inv.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Appearance</h3>
                  <p className="text-sm" style={{ color: mut }}>Personalize the look and feel of your dashboard.</p>
                </motion.div>

                {/* Theme */}
                <motion.div variants={item} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Theme</label>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                    {themeOptions.map(t => {
                      const isActive = appearance.theme === t.name;
                      return (
                        <button
                          key={t.name}
                          onClick={() => setAppearance({ ...appearance, theme: t.name })}
                          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:border-primary"
                          style={{
                            background: isActive ? (isDark ? 'rgba(var(--primary-rgb),0.2)' : 'rgba(var(--primary-rgb),0.1)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                            borderColor: isActive ? 'var(--primary)' : borderSubtle(isDark),
                            color: isActive ? 'var(--primary)' : pri,
                          }}
                        >
                          {t.icon}
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Accent colour */}
                <motion.div variants={item} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Accent Colour</label>
                  <div className="flex flex-wrap gap-3">
                    {accentOptions.map(a => {
                      const isActive = appearance.accent === a.name;
                      return (
                        <button
                          key={a.name}
                          onClick={() => setAppearance({ ...appearance, accent: a.name })}
                          title={a.name}
                          className="relative w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{ background: a.color }}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="settings-accent"
                              className="absolute inset-0 rounded-full"
                              style={{ boxShadow: `0 0 0 2px ${isDark ? 'var(--background)' : '#ffffff'}, 0 0 0 4px ${a.color}` }}
                              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            />
                          )}
                          {isActive && <Check size={16} className="relative z-10 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Density */}
                <motion.div variants={item} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest" style={{ color: sec }}>Density</label>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
                    {['Compact', 'Comfortable', 'Spacious'].map(d => {
                      const isActive = appearance.density === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setAppearance({ ...appearance, density: d })}
                          className="px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:border-primary"
                          style={{
                            background: isActive ? (isDark ? 'rgba(var(--primary-rgb),0.2)' : 'rgba(var(--primary-rgb),0.1)') : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                            borderColor: isActive ? 'var(--primary)' : borderSubtle(isDark),
                            color: isActive ? 'var(--primary)' : pri,
                          }}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div variants={item} className="pt-4 flex justify-end">
                  <GlassButton hoverVariant="success">Save Appearance</GlassButton>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'integrations' && (
              <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
                <motion.div variants={item}>
                  <h3 className="text-lg font-bold mb-1" style={{ color: pri }}>Integrations</h3>
                  <p className="text-sm mb-2" style={{ color: mut }}>Connect Enterhub with the tools your team already uses.</p>
                </motion.div>

                <motion.div className="space-y-4" variants={container}>
                  {[
                    { id: 'slack', title: 'Slack', desc: 'Send alerts to your team channels' },
                    { id: 'github', title: 'GitHub', desc: 'Link repositories for code scanning' },
                    { id: 'googleDrive', title: 'Google Drive', desc: 'Export reports to your Drive' },
                    { id: 'figma', title: 'Figma', desc: 'Attach design files to incidents' },
                  ].map((row) => {
                    const isOn = integrations[row.id as keyof typeof integrations];
                    return (
                      <motion.div variants={item} key={row.id} className="flex items-center justify-between p-4 rounded-2xl border transition-colors" style={{ borderColor: borderSubtle(isDark), background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
                            <span className="text-sm font-black" style={{ color: sec }}>{row.title.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm" style={{ color: pri }}>{row.title}</p>
                            <p className="text-xs truncate" style={{ color: mut }}>{row.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setIntegrations(p => ({ ...p, [row.id]: !p[row.id as keyof typeof integrations] }))}
                          className="w-12 h-6 rounded-full relative transition-colors duration-300 flex items-center flex-shrink-0"
                          style={{ background: isOn ? 'var(--primary)' : (isDark ? '#333' : '#e5e7eb') }}
                        >
                          <motion.span
                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                            animate={{ x: isOn ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

          </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
