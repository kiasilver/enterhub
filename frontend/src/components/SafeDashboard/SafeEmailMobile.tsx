'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, panelFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  type Email,
  CATEGORIES,
  PRIORITIES,
  INITIAL_EMAILS,
  getEmailFolders,
  getEmailCategoryLabel,
} from './SafeEmail';

interface Props {
  isDark: boolean;
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

// ─── Inline SVG Helpers ────────────────────────────────────────────────────
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconStar = ({ filled, color = 'currentColor' }: { filled: boolean; color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconPaperclip = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconCompose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);
const IconFolder = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d={d} />
  </svg>
);

type View = 'list' | 'detail' | 'compose';

// ─── Dedicated Mobile Email Screen (Gmail-style) ────────────────────────────
export default function SafeEmailMobile({ isDark, live }: Props) {
  const { primaryColor } = useTheme();
  const { t } = useLang();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255, 255, 255, 0.8)';
  const borderCol = borderSubtle(isDark);
  const appBg = panelFill(isDark);

  const [emailsLocal, setEmailsLocal] = useState<Email[]>(INITIAL_EMAILS);
  const emails = live?.emails ?? emailsLocal;
  const setEmails = (updater: Email[] | ((prev: Email[]) => Email[])) => {
    const prev = live?.emails ?? emailsLocal;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    if (live?.onEmailsChange) live.onEmailsChange(next);
    else setEmailsLocal(next);
  };
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [view, setView] = useState<View>('list');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeCategory, setComposeCategory] = useState<keyof typeof CATEGORIES>('general');
  const [composePriority, setComposePriority] = useState<keyof typeof PRIORITIES>('low');
  const [composeBody, setComposeBody] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [focused, setFocused] = useState<string | null>(null);

  const inputStyle = (name: string) => ({
    borderColor: focused === name ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focused === name ? '0 0 0 3px rgba(var(--primary-rgb), 0.18)' : 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
  });

  const folders = useMemo(() => getEmailFolders(t), [t]);
  const categoryOptions = useMemo(
    () =>
      (Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((k) => ({
        value: k,
        label: getEmailCategoryLabel(t, k),
      })),
    [t],
  );
  const priorityOptions = useMemo(() => Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label })), []);

  const activeFolderLabel = useMemo(
    () => folders.find((f) => f.id === activeFolder)?.label || t('emailPage.inbox'),
    [activeFolder, folders, t],
  );

  const filteredEmails = useMemo(() => {
    return emails.filter(e => {
      const matchesFolder = activeFolder === 'starred' ? e.starred : e.folder === activeFolder;
      const matchesCategory = !activeCategory || e.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        e.senderName.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q);
      return matchesFolder && matchesCategory && matchesSearch;
    });
  }, [emails, activeFolder, activeCategory, searchQuery]);

  const selectedEmail = useMemo(() => emails.find(e => e.id === selectedEmailId) || null, [emails, selectedEmailId]);

  const openEmail = (id: string) => {
    setSelectedEmailId(id);
    setView('detail');
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
    live?.onSelect?.(id);
  };

  const toggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const current = emails.find((x) => x.id === id);
    const nextStarred = !current?.starred;
    setEmails(prev => prev.map(item => item.id === id ? { ...item, starred: nextStarred } : item));
    live?.onToggleStar?.(id, nextStarred);
  };

  const selectFolder = (id: string) => {
    setActiveFolder(id);
    setActiveCategory(null);
    setIsDrawerOpen(false);
    setView('list');
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;

    if (live?.onSend && live.members?.length) {
      const member = live.members.find((m) => m.id === composeTo || m.email === composeTo);
      if (!member) {
        setEmailError('Select a workspace member');
        return;
      }
      const ok = await live.onSend({
        toUserId: member.id,
        subject: composeSubject,
        body: composeBody,
        category: composeCategory,
        priority: composePriority,
      });
      if (!ok) {
        setEmailError('Failed to send');
        return;
      }
      setComposeTo(''); setComposeSubject(''); setComposeBody(''); setEmailError(null);
      setView('list');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(composeTo.trim())) {
      setEmailError('Please enter a valid email address (e.g. operations@enterhub.io)');
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
    setComposeTo(''); setComposeSubject(''); setComposeBody(''); setEmailError(null);
    setView('list');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;
    const replyMsg = replyText;
    setEmails(prev => prev.map(item => item.id === selectedEmail.id
      ? { ...item, body: `${item.body}\n\n──────────────────────────────\nREPLY FROM YOU (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}):\n${replyMsg}` }
      : item));
    setReplyText('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative h-full">

      {/* ─── Folder navigation drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="absolute inset-y-0 start-0 z-50 w-72 max-w-[82%] flex flex-col p-4 overflow-y-auto"
              style={{ background: appBg, borderInlineEnd: `1px solid ${borderCol}`, scrollbarWidth: 'none' }}
            >
              <div className="flex items-center gap-2.5 px-1 pb-4 mb-2 border-b" style={{ borderColor: borderCol }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: primaryColor }}>S</div>
                <span className="text-base font-extrabold" style={{ color: pri }}>Enterhub Mail</span>
              </div>

              <div className="space-y-1">
                {folders.map(folder => {
                  const isActive = activeFolder === folder.id;
                  const count = emails.filter(e => e.folder === folder.id && !e.read).length;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => selectFolder(folder.id)}
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-full text-sm font-semibold transition-colors"
                      style={{
                        color: isActive ? primaryColor : sec,
                        background: isActive ? 'rgba(var(--primary-rgb), 0.12)' : 'transparent',
                      }}
                    >
                      <span className="flex items-center gap-3.5"><IconFolder d={folder.icon} />{folder.label}</span>
                      {count > 0 && <span className="text-xs font-bold" style={{ color: isActive ? primaryColor : mut }}>{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="my-3 border-t border-dashed" style={{ borderColor: borderCol }} />
              <p className="text-[11px] font-bold tracking-widest uppercase mb-1.5 px-2" style={{ color: mut }}>{t('emailPage.labels')}</p>
              <div className="space-y-1">
                {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((key) => {
                  const cat = CATEGORIES[key];
                  const isActive = activeCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setActiveCategory(isActive ? null : key); setIsDrawerOpen(false); setView('list'); }}
                      className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-full text-sm font-semibold transition-colors"
                      style={{ color: isActive ? pri : sec, background: isActive ? surfaceItem(isDark) : 'transparent' }}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {getEmailCategoryLabel(t, key)}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── LIST VIEW ─────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          {/* Gmail-style search bar */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div
              className="flex items-center gap-2 px-2 py-2 rounded-full border"
              style={{ borderColor: borderCol, background: surfaceItem(isDark) }}
            >
              <button onClick={() => setIsDrawerOpen(true)} className="p-1.5 rounded-full shrink-0" style={{ color: pri }} aria-label="Menu">
                <IconMenu />
              </button>
              <span style={{ color: mut }} className="shrink-0"><IconSearch /></span>
              <input
                type="text"
                placeholder={t('emailPage.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none"
                style={{ color: pri }}
              />
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.12)', color: primaryColor }}>AM</div>
            </div>
            <div className="flex items-center gap-2 px-2 pt-2.5">
              <span className="text-sm font-bold" style={{ color: pri }}>{activeFolderLabel}</span>
              {activeCategory && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5"
                  style={{ background: CATEGORIES[activeCategory as keyof typeof CATEGORIES].bg, color: CATEGORIES[activeCategory as keyof typeof CATEGORIES].color }}
                >
                  {getEmailCategoryLabel(t, activeCategory as keyof typeof CATEGORIES)}
                  <button onClick={() => setActiveCategory(null)} className="opacity-70">✕</button>
                </span>
              )}
            </div>
          </div>

          {/* Inbox rows */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {filteredEmails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-full border border-dashed flex items-center justify-center mb-3 text-xl" style={{ borderColor: borderCol, color: mut }}>✉</div>
                <p className="text-sm font-semibold" style={{ color: sec }}>{t('emailPage.noMessages')}</p>
                <p className="text-xs" style={{ color: mut }}>Try clearing filters or search queries</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredEmails.map((email, idx) => {
                  const cat = CATEGORIES[email.category] || CATEGORIES.general;
                  return (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      onClick={() => openEmail(email.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEmail(email.id); } }}
                      className="w-full flex items-start gap-3 px-4 py-3.5 border-b text-start cursor-pointer"
                      style={{ borderColor: borderCol, background: email.read ? 'transparent' : 'rgba(var(--primary-rgb),0.04)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5"
                        style={{ background: cat.bg, color: cat.color }}
                      >
                        {email.senderInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${email.read ? 'font-semibold' : 'font-extrabold'}`} style={{ color: email.read ? sec : pri }}>
                            {email.senderName}
                          </span>
                          <span className="text-[11px] shrink-0" style={{ color: mut }}>{email.date}</span>
                        </div>
                        <p className={`text-sm truncate ${email.read ? 'font-medium' : 'font-bold'}`} style={{ color: pri }}>{email.subject}</p>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs truncate flex-1" style={{ color: mut }}>{email.body.replace(/\n/g, ' ').substring(0, 60)}</p>
                          <button onClick={(e) => toggleStar(e, email.id)} className="shrink-0 p-0.5" aria-label="Star">
                            <IconStar filled={email.starred} color={email.starred ? '#f59e0b' : mut} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Extended Compose FAB */}
          <button
            onClick={() => { setView('compose'); setEmailError(null); }}
            className="absolute bottom-5 end-5 z-30 flex items-center gap-2 ps-4 pe-5 py-3.5 rounded-2xl font-bold text-sm shadow-xl"
            style={{ background: primaryColor, color: '#ffffff', boxShadow: '0 8px 24px rgba(var(--primary-rgb), 0.4)' }}
          >
            <IconCompose /> {t('emailPage.compose')}
          </button>
        </>
      )}

      {/* ─── DETAIL VIEW ───────────────────────────────────────────────── */}
      {view === 'detail' && selectedEmail && (
        <motion.div
          key={selectedEmail.id}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-2 py-2.5 border-b shrink-0" style={{ borderColor: borderCol }}>
            <button onClick={() => setView('list')} className="p-2 rounded-full" style={{ color: pri }} aria-label="Back">
              <IconBack />
            </button>
            <button onClick={(e) => toggleStar(e, selectedEmail.id)} className="p-2 rounded-full" aria-label="Star">
              <IconStar filled={selectedEmail.starred} color={selectedEmail.starred ? '#f59e0b' : mut} />
            </button>
          </div>

          {/* Body scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'none' }}>
            <h2 className="text-xl font-bold leading-snug mb-3" style={{ color: pri }}>{selectedEmail.subject}</h2>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="px-2.5 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: CATEGORIES[selectedEmail.category].bg, color: CATEGORIES[selectedEmail.category].color }}>
                {getEmailCategoryLabel(t, selectedEmail.category)}
              </span>
              <span className="px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wide" style={{ backgroundColor: PRIORITIES[selectedEmail.priority].bg, color: PRIORITIES[selectedEmail.priority].color }}>
                {selectedEmail.priority}
              </span>
            </div>

            <div className="flex items-center gap-3 pb-4 mb-4 border-b" style={{ borderColor: borderCol }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.1)', color: primaryColor, border: `1px solid rgba(var(--primary-rgb),0.2)` }}>
                {selectedEmail.senderInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight truncate" style={{ color: pri }}>{selectedEmail.senderName}</p>
                <p className="text-xs truncate" style={{ color: mut }}>&lt;{selectedEmail.senderEmail}&gt;</p>
              </div>
              <div className="text-end shrink-0">
                <p className="text-xs" style={{ color: sec }}>{selectedEmail.date}</p>
                <p className="text-[10px]" style={{ color: mut }}>{selectedEmail.time}</p>
              </div>
            </div>

            <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium" style={{ color: sec }}>
              {selectedEmail.body}
            </div>

            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="mt-5 p-4 rounded-xl border flex flex-col gap-3" style={{ borderColor: borderCol, background: surfaceItem(isDark) }}>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: mut }}>Attachments ({selectedEmail.attachments.length})</p>
                {selectedEmail.attachments.map(att => (
                  <div key={att.name} className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-lg border" style={{ borderColor: borderCol }}>
                    <span className="flex items-center gap-2 font-semibold truncate" style={{ color: pri }}><IconPaperclip />{att.name}</span>
                    <span className="shrink-0" style={{ color: mut }}>{att.size}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reply */}
            <form onSubmit={handleSendReply} className="border-t pt-4 mt-5" style={{ borderColor: borderCol }}>
              <textarea
                placeholder={`Reply to ${selectedEmail.senderName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setFocused('reply')} onBlur={() => setFocused(null)}
                rows={3}
                className="w-full p-3.5 rounded-xl text-sm border resize-none"
                style={inputStyle('reply')}
              />
              <div className="flex justify-end mt-3">
                <GlassButton type="submit" style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '10px' }}>
                  <IconSend /> Send Reply
                </GlassButton>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* ─── COMPOSE VIEW ──────────────────────────────────────────────── */}
      {view === 'compose' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <form onSubmit={handleSendCompose} noValidate className="flex-1 flex flex-col overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-2 py-2.5 border-b shrink-0" style={{ borderColor: borderCol }}>
              <button type="button" onClick={() => setView('list')} className="p-2 rounded-full" style={{ color: pri }} aria-label="Close">
                <IconBack />
              </button>
              <span className="text-sm font-bold" style={{ color: pri }}>{t('emailPage.compose')}</span>
              <button type="submit" className="p-2 rounded-full" style={{ color: primaryColor }} aria-label="Send">
                <IconSend />
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5" style={{ scrollbarWidth: 'none' }}>
              <div>
                <input
                  type="email" required placeholder={t('emailPage.to')}
                  value={composeTo}
                  onChange={(e) => { setComposeTo(e.target.value); if (emailError) setEmailError(null); }}
                  onFocus={() => setFocused('to')} onBlur={() => setFocused(null)}
                  className="w-full px-3.5 py-3 rounded-xl text-sm border"
                  style={{ ...inputStyle('to'), borderColor: emailError ? '#ef4444' : (focused === 'to' ? primaryColor : borderSubtle(isDark)) }}
                />
                <AnimatePresence>
                  {emailError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5 p-2 rounded-lg text-[11px] font-semibold border overflow-hidden"
                      style={{ background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.35)', color: '#ef4444' }}
                    >
                      {emailError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <input
                type="text" required placeholder={t('emailPage.subject')}
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                onFocus={() => setFocused('subject')} onBlur={() => setFocused(null)}
                className="w-full px-3.5 py-3 rounded-xl text-sm border"
                style={inputStyle('subject')}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: sec }}>{t('emailPage.category')}</label>
                  <CustomSelect value={composeCategory} onChange={(v) => setComposeCategory(v as keyof typeof CATEGORIES)} options={categoryOptions} isDark={isDark} className="w-full" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: sec }}>{t('emailPage.priority')}</label>
                  <CustomSelect value={composePriority} onChange={(v) => setComposePriority(v as keyof typeof PRIORITIES)} options={priorityOptions} isDark={isDark} className="w-full" />
                </div>
              </div>

              <textarea
                required rows={8} placeholder={t('emailPage.bodyPlaceholder')}
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                onFocus={() => setFocused('body')} onBlur={() => setFocused(null)}
                className="w-full p-3.5 rounded-xl text-sm border resize-none"
                style={inputStyle('body')}
              />

              <GlassButton type="submit" style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.15)' }}>
                <IconSend /> {t('emailPage.send')}
              </GlassButton>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
