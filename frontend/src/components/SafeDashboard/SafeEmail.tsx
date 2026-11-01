'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, panelFill, canvasBg } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { useIsMobile } from './useIsMobile';
import SafeEmailMobile from './SafeEmailMobile';

type TFn = (key: string, params?: Record<string, string | number>) => string;

interface Props {
  isDark: boolean;
  /** When set, Email app uses live workspace data instead of demo inbox */
  live?: {
    emails: Email[];
    onEmailsChange: (emails: Email[]) => void;
    members?: { id: string; label: string; email: string }[];
    onSend?: (payload: {
      toUserId: string;
      subject: string;
      body: string;
      category: keyof typeof CATEGORIES;
      priority: keyof typeof PRIORITIES;
    }) => Promise<boolean>;
    onSelect?: (id: string) => void;
    onToggleStar?: (id: string, starred: boolean) => void;
  };
}

// ─── Email Interface ───────────────────────────────────────────────────────
export interface Email {
  id: string;
  senderName: string;
  senderEmail: string;
  senderInitials: string;
  subject: string;
  date: string;
  time: string;
  body: string;
  category: 'alerts' | 'inspections' | 'trainings' | 'general';
  priority: 'critical' | 'high' | 'medium' | 'low';
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash';
  read: boolean;
  attachments?: { name: string; size: string }[];
}

// ─── Constants ─────────────────────────────────────────────────────────────
const FOLDER_ICONS: Record<string, string> = {
  inbox: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 4l8 5 8-5',
  starred: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  sent: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  drafts: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2L20 8M14 2v6h6',
  spam: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
};

const FOLDER_LABEL_KEYS: Record<string, string> = {
  inbox: 'emailPage.inbox',
  starred: 'emailPage.starred',
  sent: 'emailPage.sent',
  drafts: 'emailPage.drafts',
  spam: 'emailPage.spam',
  trash: 'emailPage.trash',
};

const CATEGORY_LABEL_KEYS: Record<keyof typeof CATEGORIES, string> = {
  alerts: 'emailPage.systemAlerts',
  inspections: 'emailPage.inspections',
  trainings: 'emailPage.trainings',
  general: 'emailPage.general',
};

export function getEmailFolders(t: TFn) {
  return Object.entries(FOLDER_ICONS).map(([id, icon]) => ({
    id,
    icon,
    label: t(FOLDER_LABEL_KEYS[id]),
  }));
}

export function getEmailCategoryLabel(t: TFn, key: keyof typeof CATEGORIES) {
  return t(CATEGORY_LABEL_KEYS[key]);
}

export const CATEGORIES = {
  alerts: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  inspections: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  trainings: { color: 'var(--primary)', bg: 'rgba(var(--primary-rgb), 0.1)' },
  general: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
};

export const PRIORITIES = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  high: { label: 'High', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  medium: { label: 'Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  low: { label: 'Low', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

// ─── Initial Mock Inbox Data ────────────────────────────────────────────────
export const INITIAL_EMAILS: Email[] = [
  {
    id: 'm1',
    senderName: 'Thermal Sensor A4',
    senderEmail: 'sensor.a4@enterhub.io',
    senderInitials: 'TS',
    subject: 'CRITICAL WARNING: Overheating in Zone A Panel 3',
    date: 'Jun 19',
    time: '18:42',
    body: `Warning Alert: Thermal sensor A4 detected a temperature spike in Breaker Panel 3, reaching 84°C (Safe limit: 70°C). 

Immediate safety dispatch is recommended to prevent breaker trip or insulation damage. Electrical maintenance teams have been notified, but a manual safety inspection should be logged.

Please verify the ventilation panels are not obstructed.`,
    category: 'alerts',
    priority: 'critical',
    starred: true,
    folder: 'inbox',
    read: false,
    attachments: [{ name: 'zoneA_thermal_panel3.jpg', size: '242 KB' }],
  },
  {
    id: 'm2',
    senderName: 'Hassan Alavi',
    senderEmail: 'h.alavi@enterhub.io',
    senderInitials: 'HA',
    subject: 'Daily Scaffolding Checklist - Zone C Logistics',
    date: 'Jun 19',
    time: '14:10',
    body: `Hi Safety Manager,

I have completed the safety scaffolding audit on Rack 14 in Zone C. Ground level locks are verified, and load tags have been attached. 

Everything looks compliant except for minor rust on the safety ladder extension latch. We can address it during the next weekly cycle.

Full checklist checklist is attached.

Best,
Hassan`,
    category: 'inspections',
    priority: 'medium',
    starred: false,
    folder: 'inbox',
    read: true,
    attachments: [{ name: 'Scaffold_C14_signed.pdf', size: '1.2 MB' }],
  },
  {
    id: 'm3',
    senderName: 'OSHA Compliance Agent',
    senderEmail: 'audit@osha.gov',
    senderInitials: 'OC',
    subject: 'Draft Audit Itinerary - Enterhub Plant 1',
    date: 'Jun 18',
    time: '11:20',
    body: `Dear Enterhub Safety Team,

Attached is the draft schedule for our upcoming OSHA compliance review scheduled for early Q3. 

We will begin with an review of logbooks and employee certifications in the Main Office, followed by walk-through inspections in the Manufacturing and Logistics zones. 

Please review the timetable and let us know if any slots conflict with scheduled plant down-times.`,
    category: 'general',
    priority: 'high',
    starred: true,
    folder: 'inbox',
    read: false,
    attachments: [{ name: 'OSHA_Draft_Plant1.pdf', size: '488 KB' }],
  },
  {
    id: 'm4',
    senderName: 'Training Coordinator',
    senderEmail: 'training@enterhub.io',
    senderInitials: 'TC',
    subject: 'Forklift Safety briefing completion list',
    date: 'Jun 18',
    time: '09:05',
    body: `Hello Team,

Here is the final list of operators who successfully renewed their Forklift safety certification this morning in the warehouse. 

Five staff members were certified, and two members have been rescheduled due to scheduling conflicts. Please update their safety badges in the team registry.`,
    category: 'trainings',
    priority: 'low',
    starred: false,
    folder: 'inbox',
    read: true,
  },
  {
    id: 'm5',
    senderName: 'Sara Nouri',
    senderEmail: 's.nouri@enterhub.io',
    senderInitials: 'SN',
    subject: 'Incident Report Ref #883',
    date: 'Jun 17',
    time: '16:50',
    body: `Hello,

I filed a formal report for the minor solvent container leakage that occurred in the chemical cabinets of Zone B yesterday afternoon. 

Absorbent socks were successfully deployed, and the container was transferred to chemical safety containers. There were no worker exposures.

Please review the containment timeline in the system log.`,
    category: 'alerts',
    priority: 'high',
    starred: false,
    folder: 'inbox',
    read: true,
  },
];

// ─── Inline SVG Helpers ────────────────────────────────────────────────────
const IconFolder = ({ d }: { d: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d={d} />
  </svg>
);

const IconStar = ({ filled, color = 'currentColor' }: { filled: boolean; color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconPaperclip = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const IconReply = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polyline points="9 17 4 12 9 7" />
    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconSend = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function SafeEmail({ isDark, live }: Props) {
  // Below the lg breakpoint, render the dedicated Gmail-style mobile screen.
  const isMobile = useIsMobile();
  if (isMobile) return <SafeEmailMobile isDark={isDark} live={live} />;
  return <SafeEmailDesktop isDark={isDark} live={live} />;
}

function SafeEmailDesktop({ isDark, live }: Props) {
  const { primaryColor } = useTheme();
  const { t } = useLang();
  // Theme styles
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255, 255, 255, 0.8)';
  const borderCol = borderSubtle(isDark);

  // Email App states
  const [emailsLocal, setEmailsLocal] = useState<Email[]>(INITIAL_EMAILS);
  const emails = live?.emails ?? emailsLocal;
  const setEmails = (updater: Email[] | ((prev: Email[]) => Email[])) => {
    const prev = live?.emails ?? emailsLocal;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (live?.onEmailsChange) live.onEmailsChange(next);
    else setEmailsLocal(next);
  };
  const [activeFolder, setActiveFolder] = useState<string>('inbox');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(live ? null : 'm1');
  const [searchQuery, setSearchQuery] = useState('');

  // Compose Modal (Gmail Style, bottom-right)
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeCategory, setComposeCategory] = useState<keyof typeof CATEGORIES>('general');
  const [composePriority, setComposePriority] = useState<keyof typeof PRIORITIES>('low');
  const [composeBody, setComposeBody] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Inline Reply state
  const [replyText, setReplyText] = useState('');

  // Focused state for inputs
  const [focusedComposeField, setFocusedComposeField] = useState<string | null>(null);
  const [focusedReplyField, setFocusedReplyField] = useState(false);

  const getComposeInputStyle = (fieldName: string) => ({
    borderColor: focusedComposeField === fieldName ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedComposeField === fieldName
      ? (isDark ? `0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)` : `0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)`)
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const getReplyInputStyle = () => ({
    borderColor: focusedReplyField ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedReplyField
      ? (isDark ? `0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)` : `0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)`)
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  // Select Option Lists
  const folders = useMemo(() => getEmailFolders(t), [t]);

  const categorySelectOptions = useMemo(() => {
    return (Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((k) => ({
      value: k,
      label: getEmailCategoryLabel(t, k),
    }));
  }, [t]);

  const prioritySelectOptions = useMemo(() => {
    return Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }));
  }, []);

  // Filtered emails list
  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      // Folder logic
      let matchesFolder = true;
      if (activeFolder === 'starred') {
        matchesFolder = e.starred;
      } else {
        matchesFolder = e.folder === activeFolder;
      }

      // Category logic
      const matchesCategory = !activeCategory || e.category === activeCategory;

      // Search query logic
      const matchesSearch = e.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.body.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFolder && matchesCategory && matchesSearch;
    });
  }, [emails, activeFolder, activeCategory, searchQuery]);

  // Selected email details
  const selectedEmail = useMemo(() => {
    return emails.find(e => e.id === selectedEmailId) || null;
  }, [emails, selectedEmailId]);

  // Handle email clicking (marks as read)
  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
    live?.onSelect?.(id);
  };

  // Toggle Star state (re-evaluates automatically)
  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const current = emails.find((x) => x.id === id);
    const nextStarred = !current?.starred;
    setEmails(prev => prev.map(item => item.id === id ? { ...item, starred: nextStarred } : item));
    live?.onToggleStar?.(id, nextStarred);
  };

  // Send composing message
  const [isSending, setIsSending] = useState(false);
  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;

    if (live?.onSend && live.members?.length) {
      const member = live.members.find((m) => m.id === composeTo || m.email === composeTo);
      if (!member) {
        setEmailError('Select a workspace member');
        return;
      }
      setIsSending(true);
      const ok = await live.onSend({
        toUserId: member.id,
        subject: composeSubject,
        body: composeBody,
        category: composeCategory,
        priority: composePriority,
      });
      setIsSending(false);
      if (!ok) {
        setEmailError('Failed to send');
        return;
      }
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setEmailError(null);
      setIsComposeOpen(false);
      return;
    }

    // Custom Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(composeTo.trim())) {
      setEmailError(`Please enter a valid email address (e.g. operations@enterhub.io)`);
      return;
    }

    const newEmail: Email = {
      id: `m-${Date.now()}`,
      senderName: 'Ali Mohammadi (You)',
      senderEmail: 'a.mohammadi@enterhub.io',
      senderInitials: 'AM',
      subject: composeSubject,
      date: 'Jun 19',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      body: composeBody,
      category: composeCategory,
      priority: composePriority,
      starred: false,
      folder: 'sent',
      read: true,
    };

    setEmails(prev => [newEmail, ...prev]);

    // Reset Compose State
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setEmailError(null);
    setIsComposeOpen(false);
  };

  // Handle inline reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;

    const replyMsg = replyText;

    // Simulate appending our response to the email body
    setEmails(prev => prev.map(item => {
      if (item.id === selectedEmail.id) {
        return {
          ...item,
          body: `${item.body}\n\n──────────────────────────────\nREPLY FROM YOU (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}):\n${replyMsg}`,
        };
      }
      return item;
    }));

    setReplyText('');
  };

  return (
    <div
      className="flex-1 flex overflow-x-auto lg:overflow-hidden snap-x snap-mandatory h-full min-h-0"
      style={{ scrollbarWidth: 'none', background: canvasBg(isDark) }}
    >
      {/* ─── Inbox Left Folder Sidebar ───────────────────────────────────── */}
      <div
        className="w-full lg:w-64 shrink-0 border-r flex flex-col p-4 space-y-5 transition-colors snap-start h-full min-h-0 overflow-y-auto"
        style={{ borderColor: borderCol, background: panelFill(isDark) }}
      >
        {/* Compose trigger */}
        <GlassButton
          onClick={() => setIsComposeOpen(true)}
          style={{ width: '100%', padding: '12px 18px', fontSize: '14px', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.15)', borderColor: 'rgba(var(--primary-rgb), 0.3)' }}
        >
          <IconPlus /> {t('emailPage.compose')}
        </GlassButton>

        {/* Folders navigation */}
        <div className="space-y-1.5 flex-1">
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: mut }}>{t('emailPage.folders')}</p>
          {folders.map(folder => {
            const isActive = activeFolder === folder.id;
            const count = emails.filter(e => e.folder === folder.id && !e.read).length;

            return (
              <button
                key={folder.id}
                onClick={() => {
                  setActiveFolder(folder.id);
                  setActiveCategory(null); // clear categories filter on folder change
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold select-none cursor-pointer transition-colors"
                style={{
                  color: isActive ? 'var(--primary)' : sec,
                  background: isActive ? (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span className="flex items-center gap-2.5">
                  <IconFolder d={folder.icon} />
                  {folder.label}
                </span>
                {count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: primaryColor }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ borderTop: `1px dashed ${borderCol}`, margin: '16px 4px' }} />

          {/* Categories tag filter */}
          <p className="text-[11px] font-bold tracking-widest uppercase mb-2.5 px-1" style={{ color: mut }}>{t('emailPage.labels')}</p>
          {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((key) => {
            const cat = CATEGORIES[key];
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(isActive ? null : key)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
                style={{
                  color: isActive ? pri : sec,
                  background: isActive ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') : 'transparent',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span>{getEmailCategoryLabel(t, key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Right Contents Panel (List + Details Split) ────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

        {/* Search header bar */}
        <div
          className="p-4 border-b flex items-center transition-colors"
          style={{ borderColor: borderCol }}
        >
          <div className="relative w-full max-w-md">
            <span className="absolute start-3.5 top-1/2 -translate-y-1/2" style={{ color: sec }}>
              <IconSearch />
            </span>
            <input
              type="text"
              placeholder={t('emailPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl text-sm border outline-none transition-all duration-200"
              style={{
                borderColor: borderSubtle(isDark),
                background: inputBg,
                color: pri,
              }}
            />
          </div>
          {activeCategory && (
            <div className="ms-3 px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5" style={{ background: CATEGORIES[activeCategory as keyof typeof CATEGORIES].bg, color: CATEGORIES[activeCategory as keyof typeof CATEGORIES].color }}>
              {getEmailCategoryLabel(t, activeCategory as keyof typeof CATEGORIES)}
              <button onClick={() => setActiveCategory(null)} className="font-bold text-[10px] cursor-pointer opacity-70 hover:opacity-100">✕</button>
            </div>
          )}
        </div>

        {/* Split grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 overflow-hidden">

          {/* Column 1 & 2: Email inbox rows */}
          <div
            className="lg:col-span-2 min-h-0 border-r flex flex-col overflow-y-auto"
            style={{ borderColor: borderCol, scrollbarWidth: 'none' }}
          >
            {filteredEmails.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center mb-2" style={{ borderColor: borderCol, color: mut }}>
                  ✉
                </div>
                <p className="text-xs font-semibold" style={{ color: sec }}>{t('emailPage.noMessages')}</p>
                <p className="text-[10px]" style={{ color: mut }}>Try clearing filters or search queries</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredEmails.map((email, idx) => {
                  const isSelected = email.id === selectedEmailId;
                  const cat = CATEGORIES[email.category] || CATEGORIES.general;
                  const prio = PRIORITIES[email.priority] || PRIORITIES.low;

                  return (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 20, delay: idx * 0.03 }}
                      onClick={() => handleSelectEmail(email.id)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-4 border-b cursor-pointer transition-colors relative flex flex-col gap-2.5 group select-none"
                      style={{
                        borderColor: borderCol,
                        background: isSelected
                          ? (isDark ? 'rgba(var(--primary-rgb), 0.12)' : 'rgba(var(--primary-rgb), 0.06)')
                          : 'transparent',
                      }}
                    >
                      {/* Unread indicator */}
                      {!email.read && (
                        <span className="w-1.5 h-1.5 rounded-full absolute start-1.5 top-6" style={{ background: primaryColor }} />
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {/* Profile Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                              color: pri,
                              border: `1px solid ${borderCol}`,
                            }}
                          >
                            {email.senderInitials}
                          </div>
                          <span className="text-sm font-semibold" style={{ color: email.read ? sec : pri }}>
                            {email.senderName}
                          </span>
                        </div>
                        <span className="text-xs" style={{ color: mut }}>{email.date}</span>
                      </div>

                      {/* Subject */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm ${email.read ? 'font-semibold' : 'font-black'} truncate flex-1`} style={{ color: pri }}>
                          {email.subject}
                        </h4>
                        <button
                          onClick={(e) => handleToggleStar(e, email.id)}
                          className="text-xs cursor-pointer text-yellow-500/80 hover:text-yellow-500 transition-colors"
                        >
                          <IconStar filled={email.starred} color={email.starred ? '#f59e0b' : mut} />
                        </button>
                      </div>

                      {/* Snippet */}
                      <p className="text-xs truncate" style={{ color: mut }}>
                        {email.body.substring(0, 80)}...
                      </p>

                      {/* Badges */}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: cat.bg, color: cat.color }}>
                          {getEmailCategoryLabel(t, email.category)}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: prio.bg, color: prio.color }}>
                          {prio.label}
                        </span>
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Column 3, 4 & 5: Email detailed reader */}
          <div className="lg:col-span-3 min-h-0 flex flex-col overflow-y-auto p-5" style={{ scrollbarWidth: 'none' }}>
            <AnimatePresence mode="wait">
              {!selectedEmail ? (
                <motion.div
                  key="no-mail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 rounded-full border border-dashed flex items-center justify-center mb-2" style={{ borderColor: borderCol, color: mut }}>
                    ✉
                  </div>
                  <p className="text-sm font-semibold" style={{ color: sec }}>Select an email</p>
                  <p className="text-xs" style={{ color: mut }}>Click a message in the inbox to view safety logs and reports</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedEmail.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  {/* Mail Reader Header */}
                  <div className="border-b pb-5 flex flex-col gap-3" style={{ borderColor: borderCol }}>
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-xl font-bold leading-snug" style={{ color: pri }}>{selectedEmail.subject}</h2>
                      <span className="px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wide shrink-0" style={{ backgroundColor: PRIORITIES[selectedEmail.priority].bg, color: PRIORITIES[selectedEmail.priority].color }}>
                        {selectedEmail.priority}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[rgba(var(--primary-rgb),0.1)] border border-[rgba(var(--primary-rgb),0.2)] flex items-center justify-center font-bold text-sm shrink-0" style={{ color: primaryColor }}>
                          {selectedEmail.senderInitials}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-tight" style={{ color: pri }}>{selectedEmail.senderName}</p>
                          <p className="text-xs mt-0.5" style={{ color: mut }}>&lt;{selectedEmail.senderEmail}&gt;</p>
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-xs" style={{ color: sec }}>{selectedEmail.date}</p>
                        <p className="text-[10px]" style={{ color: mut }}>{selectedEmail.time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mail Body */}
                  <div className="flex-1 text-[15px] leading-relaxed whitespace-pre-wrap font-medium" style={{ color: sec }}>
                    {selectedEmail.body}
                  </div>

                  {/* Attachments */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="p-4 rounded-xl border flex flex-col gap-3.5" style={{ borderColor: borderCol, background: surfaceItem(isDark) }}>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: mut }}>ATTACHMENTS ({selectedEmail.attachments.length})</p>
                      {selectedEmail.attachments.map(att => (
                        <div key={att.name} className="flex items-center justify-between text-xs p-2.5 rounded-lg border bg-black/5 hover:bg-[rgba(var(--primary-rgb),0.05)] transition-colors" style={{ borderColor: borderCol }}>
                          <span className="flex items-center gap-2 font-semibold text-wrap truncate" style={{ color: pri }}>
                            <IconPaperclip />
                            {att.name}
                          </span>
                          <span style={{ color: mut }}>{att.size}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  <form onSubmit={handleSendReply} className="border-t pt-4 mt-4" style={{ borderColor: borderCol }}>
                    <div className="flex flex-col gap-3.5">
                      <div className="relative">
                        <textarea
                          placeholder={`Reply to ${selectedEmail.senderName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onFocus={() => setFocusedReplyField(true)}
                          onBlur={() => setFocusedReplyField(false)}
                          rows={3}
                          className="w-full p-3.5 rounded-xl text-sm border resize-none transition-all"
                          style={getReplyInputStyle()}
                        />
                      </div>
                      <div className="flex justify-end">
                        <GlassButton type="submit" style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}>
                          <IconSend /> Send Reply
                        </GlassButton>
                      </div>
                    </div>
                  </form>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* ─── Compose Modal (Gmail Style floating in bottom-right) ────────── */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-4 sm:bottom-6 end-4 sm:end-6 start-4 sm:start-auto z-[999] w-auto sm:w-[460px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl overflow-hidden transition-colors flex flex-col"
            style={{
              ...glassStyle(isDark),
              background: isDark ? 'var(--elevated)' : '#ffffff',
              borderColor: borderCol,
              height: '420px',
              maxHeight: 'calc(100dvh - 2rem)',
              boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.8)' : '0 20px 50px rgba(var(--primary-rgb), 0.15)',
            }}
          >
            {/* Compose Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b bg-primary/10" style={{ borderColor: borderCol }}>
              <span className="text-xs font-bold" style={{ color: pri }}>{t('emailPage.compose')}</span>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                style={{ color: sec }}
              >
                ✕
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendCompose} noValidate className="p-4 flex-1 flex flex-col justify-between space-y-3 overflow-y-auto">
              <div className="space-y-3">
                {/* To */}
                <div>
                  {live?.members?.length ? (
                    <CustomSelect
                      value={composeTo}
                      onChange={(val) => {
                        setComposeTo(val);
                        if (emailError) setEmailError(null);
                      }}
                      options={live.members.map((m) => ({
                        value: m.id,
                        label: `${m.label} (${m.email})`,
                      }))}
                      isDark={isDark}
                      className="w-full"
                    />
                  ) : (
                    <input
                      type="email"
                      required
                      placeholder="To: (e.g. ops@enterhub.io)"
                      value={composeTo}
                      onChange={(e) => {
                        setComposeTo(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      onFocus={() => setFocusedComposeField('to')}
                      onBlur={() => setFocusedComposeField(null)}
                      className="w-full px-3 py-2 rounded-xl text-xs border"
                      style={{
                        ...getComposeInputStyle('to'),
                        borderColor: emailError ? '#ef4444' : (focusedComposeField === 'to' ? primaryColor : borderSubtle(isDark)),
                        boxShadow: emailError ? '0 0 0 3px rgba(239, 68, 68, 0.25)' : getComposeInputStyle('to').boxShadow,
                      }}
                    />
                  )}
                  <AnimatePresence>
                    {emailError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        className="mt-1.5 p-2 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 overflow-hidden"
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          borderColor: 'rgba(239, 68, 68, 0.35)',
                          color: '#ef4444',
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-ping inline-block shrink-0" />
                        <span>{emailError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subject */}
                <div>
                  <input
                    type="text"
                    required
                    placeholder={t('emailPage.subject')}
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    onFocus={() => setFocusedComposeField('subject')}
                    onBlur={() => setFocusedComposeField(null)}
                    className="w-full px-3 py-2 rounded-xl text-xs border"
                    style={getComposeInputStyle('subject')}
                  />
                </div>

                {/* Category & Priority selector rows */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: sec }}>{t('emailPage.category')}</label>
                    <CustomSelect
                      value={composeCategory}
                      onChange={(val) => setComposeCategory(val)}
                      options={categorySelectOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: sec }}>{t('emailPage.priority')}</label>
                    <CustomSelect
                      value={composePriority}
                      onChange={(val) => setComposePriority(val)}
                      options={prioritySelectOptions}
                      isDark={isDark}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Body */}
                <div>
                  <textarea
                    required
                    rows={5}
                    placeholder={t('emailPage.bodyPlaceholder')}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    onFocus={() => setFocusedComposeField('body')}
                    onBlur={() => setFocusedComposeField(null)}
                    className="w-full p-3 rounded-xl text-xs border resize-none"
                    style={getComposeInputStyle('body')}
                  />
                </div>
              </div>

              {/* Action bar */}
              <div className="flex justify-end pt-2 border-t" style={{ borderColor: borderCol }}>
                <GlassButton type="submit" style={{ padding: '8px 22px', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.15)' }}>
                  <IconSend /> {t('emailPage.send')}
                </GlassButton>
              </div>

            </form>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
