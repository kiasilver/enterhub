'use client';

import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Search, UserPlus, MapPin, Mail, MoreHorizontal, Users, X, MessageSquare, Copy, Trash2, Check } from 'lucide-react';
import { textPrimary, textSecondary, textMuted, glassStyle, surfaceHover, borderSubtle } from './theme';
import GlassButton from './GlassButton';

interface Props {
  isDark: boolean;
}

type Status = 'online' | 'busy' | 'offline';

interface Member {
  id: number;
  name: string;
  role: string;
  dept: string;
  location: string;
  email: string;
  projects: number;
  rating: number;
  status: Status;
  avatar: string;
}

const TEAM_MEMBERS: Member[] = [
  { id: 1, name: 'Ali Mohammadi', role: 'Safety Manager', dept: 'Operations', location: 'Tehran, IR', email: 'ali.mohammadi@enterhub.co', projects: 42, rating: 4.9, status: 'online', avatar: '/profile.png' },
  { id: 2, name: 'Sarah Jenkins', role: 'Lead Inspector', dept: 'Field Ops', location: 'London, UK', email: 'sarah.jenkins@enterhub.co', projects: 128, rating: 4.8, status: 'busy', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 3, name: 'Mark Davis', role: 'Field Officer', dept: 'Field Ops', location: 'New York, US', email: 'mark.davis@enterhub.co', projects: 85, rating: 4.7, status: 'offline', avatar: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { id: 4, name: 'Elena Rostova', role: 'Compliance Expert', dept: 'Compliance', location: 'Berlin, DE', email: 'elena.rostova@enterhub.co', projects: 210, rating: 5.0, status: 'online', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: 5, name: 'Michael Chang', role: 'Safety Analyst', dept: 'Analytics', location: 'Singapore', email: 'michael.chang@enterhub.co', projects: 34, rating: 4.5, status: 'online', avatar: 'https://randomuser.me/api/portraits/men/76.jpg' },
  { id: 6, name: 'Jessica Smith', role: 'Auditor', dept: 'Compliance', location: 'Sydney, AU', email: 'jessica.smith@enterhub.co', projects: 92, rating: 4.9, status: 'offline', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
];

const STATUS_COLOR: Record<Status, string> = {
  online: '#10b981',
  busy: '#f59e0b',
  offline: '#9ca3af',
};

const FILTERS: Array<'all' | Status> = ['all', 'online', 'busy', 'offline'];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

export default function SafeTeamPage({ isDark }: Props) {
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const border = borderSubtle(isDark);

  const [filter, setFilter] = useState<'all' | Status>('all');
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<Member[]>(TEAM_MEMBERS);

  // Compose modal state
  const [composeMember, setComposeMember] = useState<Member | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sentToast, setSentToast] = useState(false);

  // Per-card "more options" dropdown state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const onlineCount = useMemo(() => members.filter(m => m.status === 'online').length, [members]);

  const filteredTeam = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(m => {
      const matchStatus = filter === 'all' || m.status === filter;
      const matchQuery = !q || [m.name, m.role, m.dept, m.location].some(v => v.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [filter, query, members]);

  // Close the per-card menu on click-outside / Escape
  useEffect(() => {
    if (openMenuId === null) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenuId]);

  // Auto-hide the "Message sent" confirmation
  useEffect(() => {
    if (!sentToast) return;
    const t = setTimeout(() => setSentToast(false), 2000);
    return () => clearTimeout(t);
  }, [sentToast]);

  const openCompose = (member: Member) => {
    setComposeMember(member);
    setSubject('');
    setBody('');
    setOpenMenuId(null);
  };

  const closeCompose = () => setComposeMember(null);

  const handleSend = () => {
    setComposeMember(null);
    setSubject('');
    setBody('');
    setSentToast(true);
  };

  const handleCopyEmail = (member: Member) => {
    navigator.clipboard?.writeText(member.email);
    setOpenMenuId(null);
  };

  const handleRemove = (id: number) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setOpenMenuId(null);
  };

  return (
    <motion.div
      className="w-full h-full overflow-y-auto no-scrollbar px-6 py-7 pb-12"
      variants={container}
      initial="hidden"
      animate="show"
    >

      {/* ── Header ── */}
      <motion.div variants={item} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-7">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: pri, letterSpacing: '-0.01em' }}>Team</h2>
          <p className="text-sm" style={{ color: mut }}>
            {members.length} members · {onlineCount} online
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm flex-1 lg:w-60 lg:flex-none"
            style={{ background: surfaceHover(isDark), border: `1px solid ${border}` }}
          >
            <Search size={15} style={{ color: mut, flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search members"
              className="bg-transparent outline-none border-none text-sm w-full"
              style={{ color: pri }}
            />
          </div>
          <GlassButton style={{ padding: '9px 16px', borderRadius: '10px', flexShrink: 0 }}>
            <UserPlus size={15} /> Add Member
          </GlassButton>
        </div>
      </motion.div>

      {/* ── Filter (segmented) ── */}
      <motion.div
        variants={item}
        className="inline-flex items-center gap-1 p-1 rounded-xl mb-6"
        style={{ background: surfaceHover(isDark), border: `1px solid ${border}` }}
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors duration-200"
              style={{
                color: active ? pri : sec,
              }}
            >
              {active && (
                <motion.div
                  layoutId="team-filter"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                    boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{f}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Member grid ── */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTeam.map((member) => {
            const statusColor = STATUS_COLOR[member.status];
            return (
              <motion.div
                key={member.id}
                layout
                variants={item}
                initial="hidden"
                whileInView="show"
                exit={{ opacity: 0, y: 8, transition: { duration: 0.25 } }}
                viewport={{ once: true, margin: '-60px' }}
                whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } }}
                className="rounded-2xl p-5"
                style={{ ...glassStyle(isDark), transition: 'box-shadow 0.25s ease, border-color 0.25s ease' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.16)';
                  e.currentTarget.style.boxShadow = isDark ? '0 10px 30px -14px rgba(0,0,0,0.6)' : '0 10px 30px -14px rgba(0,0,0,0.18)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top: avatar + identity + menu */}
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover"
                      style={{ border: `1px solid ${border}` }}
                    />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                      style={{ background: statusColor, borderColor: isDark ? 'var(--surface)' : '#ffffff' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="text-[15px] font-semibold truncate" style={{ color: pri }}>{member.name}</h3>
                    <p className="text-xs truncate" style={{ color: sec }}>{member.role} · {member.dept}</p>
                  </div>
                  <div className="relative flex-shrink-0" ref={openMenuId === member.id ? menuRef : undefined}>
                    <motion.button
                      aria-label="More options"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setOpenMenuId(prev => (prev === member.id ? null : member.id))}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: openMenuId === member.id ? pri : mut, background: openMenuId === member.id ? surfaceHover(isDark) : 'transparent' }}
                      onMouseEnter={e => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                      onMouseLeave={e => {
                        if (openMenuId === member.id) return;
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = mut;
                      }}
                    >
                      <MoreHorizontal size={17} />
                    </motion.button>

                    <AnimatePresence>
                      {openMenuId === member.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1.5 z-20 w-44 p-1.5 rounded-xl origin-top-right"
                          style={glassStyle(isDark)}
                        >
                          <MenuItem isDark={isDark} color={pri} icon={<MessageSquare size={14} />} label="Send message" onClick={() => openCompose(member)} />
                          <MenuItem isDark={isDark} color={pri} icon={<Copy size={14} />} label="Copy email" onClick={() => handleCopyEmail(member)} />
                          <MenuItem isDark={isDark} color="#ef4444" icon={<Trash2 size={14} />} label="Remove" danger onClick={() => handleRemove(member.id)} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-4 h-px" style={{ background: border }} />

                {/* Contact info */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs" style={{ color: sec }}>
                    <MapPin size={14} style={{ color: mut, flexShrink: 0 }} />
                    <span className="truncate">{member.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs" style={{ color: sec }}>
                    <Mail size={14} style={{ color: mut, flexShrink: 0 }} />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                {/* Meta + action */}
                <div className="flex items-center justify-between mt-5">
                  <p className="text-xs" style={{ color: mut }}>
                    <span style={{ color: sec, fontWeight: 600 }}>{member.projects}</span> projects
                    <span className="mx-1.5">·</span>
                    <span style={{ color: sec, fontWeight: 600 }}>{member.rating.toFixed(1)}</span> rating
                  </p>
                  <GlassButton onClick={() => openCompose(member)} style={{ padding: '7px 14px', borderRadius: '10px' }}>
                    <Mail size={13} /> Message
                  </GlassButton>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filteredTeam.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: surfaceHover(isDark), color: mut }}>
            <Users size={22} />
          </div>
          <p className="text-sm font-semibold" style={{ color: pri }}>No members found</p>
          <p className="text-xs mt-1" style={{ color: mut }}>Try a different search or filter.</p>
        </motion.div>
      )}

      {/* ── Compose message modal ── */}
      <AnimatePresence>
        {composeMember && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCompose}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl"
              style={{ ...glassStyle(isDark), padding: '24px' }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={composeMember.avatar}
                    alt={composeMember.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    style={{ border: `1px solid ${border}` }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold truncate" style={{ color: pri }}>To: {composeMember.name}</h3>
                    <p className="text-xs truncate" style={{ color: sec }}>{composeMember.email}</p>
                  </div>
                </div>
                <button
                  aria-label="Close"
                  onClick={closeCompose}
                  className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: mut }}
                  onMouseEnter={e => { e.currentTarget.style.background = surfaceHover(isDark); e.currentTarget.style.color = pri; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = mut; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: surfaceHover(isDark), border: `1px solid ${border}`, color: pri }}
                />
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write your message..."
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: surfaceHover(isDark), border: `1px solid ${border}`, color: pri }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 mt-5">
                <GlassButton onClick={closeCompose} style={{ padding: '8px 16px', borderRadius: '10px' }}>
                  Cancel
                </GlassButton>
                <GlassButton variant="success" hoverVariant="success" onClick={handleSend} style={{ padding: '8px 18px', borderRadius: '10px' }}>
                  <Mail size={13} /> Send
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "Message sent" confirmation toast ── */}
      <AnimatePresence>
        {sentToast && (
          <motion.div
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{ ...glassStyle(isDark), color: pri, x: '-50%' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
            >
              <Check size={13} />
            </span>
            Message sent
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface MenuItemProps {
  isDark: boolean;
  color: string;
  icon: ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}

function MenuItem({ isDark, color, icon, label, danger, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors text-left"
      style={{ color }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger
          ? (isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)')
          : surfaceHover(isDark);
      }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}
