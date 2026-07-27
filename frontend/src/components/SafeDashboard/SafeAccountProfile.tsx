'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Calendar, Building, Pencil, Activity, FileText, User, Clock, ShieldCheck, CheckCircle, Award } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, borderSubtle, panelFill } from './theme';
import SafeAccountShell, { accountFadeUp, iconTile, getIconColors } from './SafeAccountShell';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

interface Props { isDark: boolean; setActivePage: (id: string) => void; }

interface ContactRow { label: string; value: string; icon: typeof Mail; }
interface Stat { label: string; value: string; icon: typeof Activity; }
interface ActivityRow { title: string; time: string; icon: typeof ShieldCheck; }

const CONTACT: ContactRow[] = [
  { label: 'Email', value: 'ali.mohammadi@enterhub.io', icon: Mail },
  { label: 'Phone', value: '+98 912 345 6789', icon: Phone },
  { label: 'Location', value: 'Tehran, Iran', icon: MapPin },
  { label: 'Member since', value: 'March 2023', icon: Calendar },
  { label: 'Workspace', value: 'Enterhub', icon: Building },
  { label: 'Role', value: 'Safety Manager', icon: ShieldCheck },
];

const STATS: Stat[] = [
  { label: 'Incidents Resolved', value: '248', icon: Activity },
  { label: 'Reports Filed', value: '86', icon: FileText },
  { label: 'Team Members', value: '12', icon: User },
  { label: 'Avg. Response', value: '4.2m', icon: Clock },
];

const ACTIVITY: ActivityRow[] = [
  { title: 'Closed incident report #SG-2048 at Plant B', time: '2 hours ago', icon: CheckCircle },
  { title: 'Approved updated fire evacuation protocol', time: 'Yesterday', icon: ShieldCheck },
  { title: 'Filed monthly compliance audit summary', time: '3 days ago', icon: FileText },
  { title: 'Completed OSHA recertification training', time: '1 week ago', icon: Award },
  { title: 'Onboarded 2 new safety inspectors', time: '2 weeks ago', icon: User },
];

export default function SafeAccountProfile({ isDark, setActivePage }: Props) {
  const { primaryColor } = useTheme();
  const ACCENT = primaryColor;
  const ICON_COLORS = getIconColors(primaryColor);
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);
  const glassBg = panelFill(isDark);

  const [hoverEdit, setHoverEdit] = useState(false);

  return (
    <SafeAccountShell isDark={isDark} active="account-profile" setActivePage={setActivePage}>

      {/* Stats strip — hairline grid (no boxy cards) */}
      <motion.div variants={accountFadeUp} className="rounded-3xl overflow-hidden" style={glassStyle(isDark)}>
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 1, background: border }}>
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            const c = ICON_COLORS[i % ICON_COLORS.length];
            return (
              <div key={stat.label} className="p-5 flex flex-col gap-3" style={{ background: glassBg }}>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={iconTile(c)}>
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-[22px] font-bold leading-none" style={{ color: pri, letterSpacing: '-0.02em' }}>{stat.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider mt-2" style={{ color: mut }}>{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* About */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-[15px] font-semibold" style={{ color: pri }}>About</h3>
          <button
            type="button"
            onMouseEnter={() => setHoverEdit(true)}
            onMouseLeave={() => setHoverEdit(false)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-colors flex-shrink-0"
            style={{ background: hoverEdit ? `${ACCENT}14` : 'transparent', color: ACCENT, border: `1.5px solid ${ACCENT}` }}
          >
            <Pencil size={14} /> Edit Profile
          </button>
        </div>
        <p className="text-[13px] leading-relaxed" style={{ color: sec }}>
          Safety Manager at Enterhub with a focus on proactive risk assessment, incident prevention, and building a
          culture of compliance across distributed industrial sites. Leads a team of 12 inspectors and owns the
          organization&apos;s incident-response playbook.
        </p>
      </motion.div>

      {/* Contact — light two-column grid */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <h3 className="text-[15px] font-semibold mb-4" style={{ color: pri }}>Contact information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {CONTACT.map((row, i) => {
            const Icon = row.icon;
            const c = ICON_COLORS[i % ICON_COLORS.length];
            return (
              <div key={row.label} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
                <Icon size={15} style={{ color: c }} className="flex-shrink-0" />
                <span className="text-[12px] font-medium w-28 flex-shrink-0" style={{ color: mut }}>{row.label}</span>
                <span className="text-[13px] font-medium truncate" style={{ color: pri }}>{row.value}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={accountFadeUp} style={glassStyle(isDark)} className="rounded-3xl p-6">
        <h3 className="text-[15px] font-semibold mb-4" style={{ color: pri }}>Recent activity</h3>
        <div className="relative pl-1">
          {ACTIVITY.map((row, i) => {
            const Icon = row.icon;
            const last = i === ACTIVITY.length - 1;
            return (
              <div key={i} className="flex gap-3.5">
                {/* timeline rail */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={iconTile(ICON_COLORS[i % ICON_COLORS.length])}>
                    <Icon size={15} />
                  </span>
                  {!last && <span className="w-px flex-1 my-1" style={{ background: border }} />}
                </div>
                <div className={`flex-1 min-w-0 flex items-center justify-between gap-3 ${last ? '' : 'pb-4'}`}>
                  <p className="text-[13px] font-medium" style={{ color: pri }}>{row.title}</p>
                  <span className="text-[11px] font-medium flex-shrink-0" style={{ color: mut }}>{row.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

    </SafeAccountShell>
  );
}
