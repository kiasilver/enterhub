'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, surfaceHover, panelFill, bubbleFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  type ChatRoom,
  type Message,
  type UserProfile,
  type SharedFile,
  OPERATOR_PROFILES,
  INITIAL_ROOMS,
  QUICK_TEMPLATES,
  MOCK_ATTACHMENTS,
  IconFile,
} from './SafeChat';

interface Props {
  isDark: boolean;
}

// ─── Inline SVG Helpers ────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconHash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconSend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconPaperclip = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const REACT_EMOJIS = ['👍', '❤️', '🔥', '👏', '⚠️'];
type View = 'rooms' | 'chat' | 'details';

// ─── Dedicated Mobile Chat Screen ───────────────────────────────────────────
export default function SafeChatMobile({ isDark }: Props) {
  const { primaryColor } = useTheme();
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState('c1');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedInput, setFocusedInput] = useState(false);

  const [view, setView] = useState<View>('rooms');
  const [drawerTab, setDrawerTab] = useState<'info' | 'files'>('info');

  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchKeyword, setChatSearchKeyword] = useState('');

  const [showFilePicker, setShowFilePicker] = useState(false);
  const [reactionMenuFor, setReactionMenuFor] = useState<string | null>(null);

  const [currentUser] = useState<UserProfile>({
    name: 'Ali Mohammadi',
    initials: 'AM',
    role: 'Safety Manager',
    status: 'online',
    email: 'a.mohammadi@enterhub.io',
    zone: 'Control Center Terminal',
    credentials: ['OSHA-30 Certified', 'Hazmat Specialist', 'Plant Safety Director'],
  });
  const [selectedOperator, setSelectedOperator] = useState<UserProfile | null>(null);

  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const filteredRooms = useMemo(() => rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())), [rooms, searchQuery]);
  const activeRoom = useMemo(() => rooms.find(r => r.id === activeRoomId) || rooms[0], [rooms, activeRoomId]);
  const filteredMessages = useMemo(() => {
    if (!chatSearchKeyword.trim()) return activeRoom.messages;
    return activeRoom.messages.filter(m =>
      m.body.toLowerCase().includes(chatSearchKeyword.toLowerCase()) ||
      m.senderName.toLowerCase().includes(chatSearchKeyword.toLowerCase()));
  }, [activeRoom.messages, chatSearchKeyword]);

  const getStatusColor = (status: UserProfile['status']) => {
    if (status === 'online') return '#10b981';
    if (status === 'away') return '#f59e0b';
    if (status === 'dnd') return '#ef4444';
    return '#9ca3af';
  };

  // Auto-scroll to newest message
  useEffect(() => {
    if (view === 'chat') chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom.messages, isTyping, view]);

  // Simulated reply when entering a DM
  useEffect(() => {
    setIsTyping(false);
    if (!activeRoom.isChannel && view === 'chat') {
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
        const replyTimer = setTimeout(() => {
          setIsTyping(false);
          const roomMsgs = activeRoom.messages;
          const lastMsg = roomMsgs[roomMsgs.length - 1];
          if (lastMsg && lastMsg.isCurrentUser) {
            const replies = [
              'Acknowledged. I will update the inspection status.',
              'I am monitoring the current metrics. All green.',
              'On my way to check now. Will ping you soon.',
              'Copy that. I have updated the safety checklists.',
            ];
            const simMsg: Message = {
              id: `sim-${Date.now()}`,
              senderName: activeRoom.name,
              senderInitials: activeRoom.initials || activeRoom.name.substring(0, 2).toUpperCase(),
              body: replies[Math.floor(Math.random() * replies.length)],
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isCurrentUser: false,
              reactions: [],
            };
            setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, messages: [...r.messages, simMsg] } : r));
          }
        }, 2200);
        return () => clearTimeout(replyTimer);
      }, 1000);
      return () => clearTimeout(typingTimer);
    }
  }, [activeRoomId, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unreadCount: 0 } : r));
    setChatSearchOpen(false);
    setChatSearchKeyword('');
    setView('chat');
  };

  const sendMessage = (bodyStr: string, fileAttach?: SharedFile) => {
    if (!bodyStr.trim() && !fileAttach) return;
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderName: currentUser.name + ' (You)',
      senderInitials: currentUser.initials,
      body: bodyStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true,
      fileAttachment: fileAttach,
      reactions: [],
    };
    setRooms(prev => prev.map(r => r.id === activeRoom.id
      ? { ...r, messages: [...r.messages, newMessage], sharedFiles: fileAttach ? [fileAttach, ...r.sharedFiles] : r.sharedFiles }
      : r));
    setMessageText('');
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(messageText);
  };

  const handleAttachFile = (file: SharedFile) => {
    sendMessage(`Shared a file document: ${file.name}`, file);
    setShowFilePicker(false);
  };

  const handleReact = (msgId: string, emoji: string) => {
    setReactionMenuFor(null);
    setRooms(prev => prev.map(r => {
      if (r.id !== activeRoom.id) return r;
      return {
        ...r,
        messages: r.messages.map(m => {
          if (m.id !== msgId) return m;
          const rx = m.reactions || [];
          const existing = rx.find(item => item.emoji === emoji);
          let nextRx;
          if (existing) {
            if (existing.users.includes(currentUser.name)) {
              const nextUsers = existing.users.filter(u => u !== currentUser.name);
              nextRx = nextUsers.length === 0 ? rx.filter(item => item.emoji !== emoji) : rx.map(item => item.emoji === emoji ? { ...item, users: nextUsers } : item);
            } else {
              nextRx = rx.map(item => item.emoji === emoji ? { ...item, users: [...item.users, currentUser.name] } : item);
            }
          } else {
            nextRx = [...rx, { emoji, users: [currentUser.name] }];
          }
          return { ...m, reactions: nextRx };
        }),
      };
    }));
  };

  const handleColleagueClick = (name: string) => {
    const cleaned = name.replace(' (You)', '').trim();
    if (cleaned === currentUser.name) { setSelectedOperator(currentUser); return; }
    const prof = OPERATOR_PROFILES[cleaned];
    if (prof) { setSelectedOperator(prof); return; }
    const foundMember = activeRoom.members.find(m => m.name.replace(' (You)', '').trim() === cleaned);
    setSelectedOperator(foundMember
      ? { name: foundMember.name, initials: foundMember.initials, role: foundMember.role, status: foundMember.status, email: `${foundMember.name.toLowerCase().replace(/\s+/g, '.')}@enterhub.io`, zone: 'Assigned Site Zone', credentials: ['Safety Certified', 'On-Duty Operator'] }
      : { name: cleaned, initials: cleaned.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3), role: 'Safety Operations Colleague', status: 'online', email: `${cleaned.toLowerCase().replace(/\s+/g, '.')}@enterhub.io`, zone: 'General Plant Site', credentials: ['Safety Certified'] });
  };

  const handleStartDM = (opName: string) => {
    const targetRoom = rooms.find(r => !r.isChannel && r.name === opName);
    if (targetRoom) handleSelectRoom(targetRoom.id);
    setSelectedOperator(null);
  };

  const chatInputStyle = {
    borderColor: focusedInput ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedInput ? '0 0 0 3px rgba(var(--primary-rgb), 0.18)' : 'none',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative h-full">

      {/* ─── ROOMS VIEW ────────────────────────────────────────────────── */}
      {view === 'rooms' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Profile + search header */}
          <div className="p-4 space-y-3.5 border-b shrink-0" style={{ borderColor: borderCol }}>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(var(--primary-rgb),0.1)', border: '1px solid rgba(var(--primary-rgb),0.2)', color: primaryColor }}>
                  {currentUser.initials}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: getStatusColor(currentUser.status) }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate" style={{ color: pri }}>{currentUser.name}</p>
                <p className="text-[11px] capitalize font-semibold" style={{ color: mut }}>{currentUser.role}</p>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: mut }}><IconSearch /></span>
              <input
                type="text" placeholder="Search channels & staff..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none"
                style={{ borderColor: borderSubtle(isDark), background: inputBg, color: pri }}
              />
            </div>
          </div>

          {/* Rooms list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ scrollbarWidth: 'none' }}>
            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5 px-2" style={{ color: mut }}>Channels</p>
              {filteredRooms.filter(r => r.isChannel).map(channel => (
                <button
                  key={channel.id}
                  onClick={() => handleSelectRoom(channel.id)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition-colors"
                  style={{ color: sec, background: surfaceItem(isDark) }}
                >
                  <span className="flex items-center gap-2 truncate" style={{ color: pri }}><IconHash />{channel.name}</span>
                  {channel.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: primaryColor }}>{channel.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5 px-2" style={{ color: mut }}>Direct Messages</p>
              {filteredRooms.filter(r => !r.isChannel).map(dm => {
                const dmProfile = OPERATOR_PROFILES[dm.name];
                const displayStatus = dmProfile ? dmProfile.status : 'offline';
                return (
                  <button
                    key={dm.id}
                    onClick={() => handleSelectRoom(dm.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ color: pri, background: surfaceItem(isDark) }}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <span className="relative shrink-0">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: 'rgba(var(--primary-rgb),0.1)', border: `1px solid ${borderCol}`, color: pri }}>{dm.initials}</span>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black" style={{ backgroundColor: getStatusColor(displayStatus) }} />
                      </span>
                      {dm.name}
                    </span>
                    {dm.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: primaryColor }}>{dm.unreadCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── CHAT VIEW ─────────────────────────────────────────────────── */}
      {view === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-2 py-3 border-b shrink-0" style={{ borderColor: borderCol }}>
            <button onClick={() => setView('rooms')} className="p-1.5 rounded-full shrink-0" style={{ color: pri }} aria-label="Back"><IconBack /></button>
            <button
              onClick={() => { if (!activeRoom.isChannel) handleColleagueClick(activeRoom.name); }}
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
            >
              <span style={{ color: pri }} className="shrink-0">{activeRoom.isChannel ? <IconHash /> : null}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold leading-tight truncate" style={{ color: pri }}>
                  {activeRoom.isChannel ? '#' + activeRoom.name : activeRoom.name}
                </h3>
                <p className="text-[11px] leading-tight truncate" style={{ color: mut }}>
                  {chatSearchKeyword.trim() ? `Filtering: "${chatSearchKeyword}"` : (activeRoom.isChannel ? `${activeRoom.members.length} members` : `Direct • ${OPERATOR_PROFILES[activeRoom.name]?.status || 'online'}`)}
                </p>
              </div>
            </button>
            <button onClick={() => { setChatSearchOpen(p => !p); setChatSearchKeyword(''); }} className="p-2 rounded-full shrink-0" style={{ color: chatSearchOpen ? primaryColor : pri }} aria-label="Search"><IconSearch /></button>
            <button onClick={() => setView('details')} className="p-2 rounded-full shrink-0" style={{ color: pri }} aria-label="Details"><IconInfo /></button>
          </div>

          {/* In-room search */}
          <AnimatePresence>
            {chatSearchOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b shrink-0" style={{ borderColor: borderCol }}>
                <input
                  type="text" placeholder="Find in conversation..."
                  value={chatSearchKeyword} onChange={(e) => setChatSearchKeyword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm outline-none bg-transparent"
                  style={{ color: pri }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message feed */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5" style={{ scrollbarWidth: 'none' }} onClick={() => reactionMenuFor && setReactionMenuFor(null)}>
            <AnimatePresence mode="popLayout">
              {filteredMessages.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-2 opacity-65">
                  <IconSearch />
                  <p className="text-xs font-bold" style={{ color: sec }}>No messages found</p>
                </div>
              ) : (
                filteredMessages.map(msg => {
                  const isMe = msg.isCurrentUser;
                  if (msg.isSystem) {
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="mx-auto max-w-[90%] p-3.5 rounded-xl border text-center flex flex-col gap-1.5"
                        style={{ background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.35)' }}
                      >
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">System Alert</span>
                        <p className="text-sm font-semibold leading-relaxed" style={{ color: pri }}>{msg.body}</p>
                        <span className="text-[10px]" style={{ color: mut }}>{msg.time}</span>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                      className={`flex gap-2.5 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {!isMe && (
                        <button
                          onClick={() => handleColleagueClick(msg.senderName)}
                          className="w-9 h-9 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 self-end"
                          style={{ background: 'rgba(var(--primary-rgb),0.1)', border: `1px solid ${borderCol}`, color: pri }}
                        >
                          {msg.senderInitials}
                        </button>
                      )}
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className={`flex items-center gap-2 px-1 ${isMe ? 'justify-end' : ''}`}>
                          <span className="text-[11px] font-extrabold" style={{ color: pri }}>{isMe ? 'You' : msg.senderName}</span>
                          <span className="text-[10px]" style={{ color: mut }}>{msg.time}</span>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setReactionMenuFor(reactionMenuFor === msg.id ? null : msg.id); }}
                          className="text-left p-3 px-3.5 text-[15px] leading-relaxed font-medium flex flex-col gap-2 relative"
                          style={{
                            background: bubbleFill(isDark, isMe),
                            border: `1px solid ${isMe ? 'rgba(var(--primary-rgb), 0.4)' : borderCol}`,
                            color: pri,
                            borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                            boxShadow: isDark
                              ? '0 4px 14px rgba(0,0,0,0.35)'
                              : '0 4px 12px rgba(15,23,42,0.06)',
                          }}
                        >
                          <span className="break-words">{msg.body}</span>
                          {msg.fileAttachment && (
                            <span className="p-3 rounded-xl border flex items-center gap-2.5 bg-black/15 w-full" style={{ borderColor: borderCol }}>
                              <IconFile type={msg.fileAttachment.type} size={16} />
                              <span className="min-w-0">
                                <span className="text-xs font-bold truncate block" style={{ color: pri }}>{msg.fileAttachment.name}</span>
                                <span className="text-[9px]" style={{ color: mut }}>{msg.fileAttachment.size}</span>
                              </span>
                            </span>
                          )}
                        </button>

                        {/* Quick reaction menu */}
                        <AnimatePresence>
                          {reactionMenuFor === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-full border shadow-lg w-fit ${isMe ? 'self-end' : ''}`}
                              style={{ background: isDark ? 'rgba(20,20,20,0.98)' : '#ffffff', borderColor: borderCol }}
                            >
                              {REACT_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-base px-1 active:scale-125 transition-transform">{emoji}</button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Reaction badges */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className={`flex flex-wrap gap-1 ${isMe ? 'justify-end' : ''}`}>
                            {msg.reactions.map(rx => (
                              <button
                                key={rx.emoji} onClick={() => handleReact(msg.id, rx.emoji)}
                                className="px-2 py-0.5 rounded-full border text-[11px] flex items-center gap-1 bg-black/10"
                                style={{ borderColor: rx.users.includes(currentUser.name) ? 'rgba(var(--primary-rgb),0.4)' : borderCol, color: rx.users.includes(currentUser.name) ? primaryColor : pri }}
                              >
                                <span>{rx.emoji}</span><span className="font-bold">{rx.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}

              {isTyping && (
                <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5 items-end max-w-[80%]">
                  <div className="w-9 h-9 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.1)', border: `1px solid ${borderCol}`, color: pri }}>
                    {activeRoom.initials || activeRoom.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="p-3.5 rounded-2xl" style={{ background: panelFill(isDark), border: `1px solid ${borderCol}`, borderRadius: '4px 16px 16px 16px', boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 12px rgba(15,23,42,0.06)' }}>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatBottomRef} />
          </div>

          {/* Composer */}
          <div className="p-3 border-t flex flex-col gap-2.5 shrink-0 relative" style={{ borderColor: borderCol }}>
            {showFilePicker && (
              <div className="absolute bottom-16 left-3 right-3 p-2 rounded-2xl border shadow-2xl z-50 flex flex-col gap-1" style={{ background: panelFill(isDark), borderColor: borderCol }}>
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-widest border-b mb-1" style={{ borderColor: borderCol, color: mut }}>Attach Safety Doc</div>
                {MOCK_ATTACHMENTS.map(file => (
                  <button key={file.name} onClick={() => handleAttachFile(file)} className="px-2 py-2 rounded-lg text-left text-sm font-semibold flex items-center gap-2.5 truncate" style={{ color: sec }}>
                    <IconFile type={file.type} size={14} />{file.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {QUICK_TEMPLATES.map(text => (
                <button
                  key={text} type="button" onClick={() => sendMessage(text)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border shrink-0 whitespace-nowrap"
                  style={{ background: panelFill(isDark), borderColor: borderCol, color: sec }}
                >
                  {text}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitMessage} className="flex gap-2 items-center">
              <button type="button" onClick={() => setShowFilePicker(p => !p)} className="p-2.5 rounded-xl shrink-0" style={{ color: showFilePicker ? primaryColor : sec }} aria-label="Attach"><IconPaperclip /></button>
              <input
                type="text" value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onFocus={() => setFocusedInput(true)} onBlur={() => setFocusedInput(false)}
                placeholder="Message..."
                className="flex-1 min-w-0 px-4 py-3 rounded-xl text-sm border"
                style={chatInputStyle}
              />
              <GlassButton type="submit" style={{ padding: '0 18px', height: 44, borderRadius: '12px' }}><IconSend /></GlassButton>
            </form>
          </div>
        </div>
      )}

      {/* ─── DETAILS VIEW ──────────────────────────────────────────────── */}
      {view === 'details' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-2 py-3 border-b shrink-0" style={{ borderColor: borderCol }}>
            <button onClick={() => setView('chat')} className="p-1.5 rounded-full" style={{ color: pri }} aria-label="Back"><IconBack /></button>
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: pri }}>Details</h3>
          </div>

          <div className="flex border-b text-sm shrink-0" style={{ borderColor: borderCol }}>
            {(['info', 'files'] as const).map(tab => (
              <button key={tab} onClick={() => setDrawerTab(tab)} className="flex-1 py-3 text-center font-bold capitalize relative" style={{ color: drawerTab === tab ? pri : mut }}>
                {tab}
                {drawerTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: primaryColor }} />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'none' }}>
            {drawerTab === 'info' ? (
              <>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mut }}>Description</span>
                  <p className="text-sm leading-relaxed" style={{ color: sec }}>{activeRoom.description || 'No description logged for this messaging node.'}</p>
                </div>
                {activeRoom.isChannel && (
                  <div className="grid grid-cols-2 gap-3 text-[11px] p-3 rounded-xl border" style={{ borderColor: borderCol, background: surfaceItem(isDark) }}>
                    <div><span style={{ color: mut }} className="block">Creator</span><span className="font-bold" style={{ color: pri }}>{activeRoom.creator}</span></div>
                    <div><span style={{ color: mut }} className="block">Created</span><span className="font-bold" style={{ color: pri }}>{activeRoom.createdDate}</span></div>
                  </div>
                )}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mut }}>Members ({activeRoom.members.length})</span>
                  {activeRoom.members.map(member => {
                    const isSelf = member.name === currentUser.name;
                    const status = isSelf ? currentUser.status : (OPERATOR_PROFILES[member.name]?.status || member.status);
                    return (
                      <button key={member.name} onClick={() => handleColleagueClick(member.name)} className="w-full flex items-center justify-between text-sm p-1.5 rounded-lg">
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--primary-rgb),0.1)', border: `1px solid ${borderCol}`, color: pri }}>{isSelf ? currentUser.initials : member.initials}</span>
                          <span className="min-w-0 text-left">
                            <span className="font-bold truncate block" style={{ color: pri }}>{isSelf ? currentUser.name + ' (You)' : member.name}</span>
                            <span className="text-[10px] truncate block" style={{ color: mut }}>{isSelf ? currentUser.role : member.role}</span>
                          </span>
                        </span>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getStatusColor(status) }} />
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mut }}>Shared Documents ({activeRoom.sharedFiles.length})</span>
                {activeRoom.sharedFiles.length === 0 ? (
                  <p className="text-sm italic" style={{ color: mut }}>No documents uploaded yet.</p>
                ) : (
                  activeRoom.sharedFiles.map((file, idx) => (
                    <div key={idx} className="p-3 rounded-xl border flex items-center gap-2.5" style={{ borderColor: borderCol, background: surfaceItem(isDark) }}>
                      <IconFile type={file.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate" style={{ color: pri }}>{file.name}</p>
                        <p className="text-[9px]" style={{ color: mut }}>{file.size} • {file.date}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Operator profile card modal ───────────────────────────────── */}
      <AnimatePresence>
        {selectedOperator && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOperator(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl p-6 border text-center"
              style={{ ...glassStyle(isDark), background: isDark ? 'rgba(18,18,18,0.97)' : '#ffffff', borderColor: borderCol }}
            >
              <button onClick={() => setSelectedOperator(null)} className="absolute top-4 right-4 p-1" style={{ color: mut }}><IconClose /></button>
              <div className="flex flex-col items-center mt-2">
                <div className="w-16 h-16 rounded-full border-2 text-xl font-bold flex items-center justify-center relative" style={{ borderColor: getStatusColor(selectedOperator.status), background: 'rgba(var(--primary-rgb),0.08)', color: pri }}>
                  {selectedOperator.initials}
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: getStatusColor(selectedOperator.status) }} />
                </div>
                <h3 className="text-base font-extrabold mt-3" style={{ color: pri }}>{selectedOperator.name}</h3>
                <span className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: primaryColor }}>{selectedOperator.role}</span>
                <span className="text-[10px] mt-0.5" style={{ color: mut }}>{selectedOperator.email}</span>
              </div>
              <div className="mt-5 space-y-4 text-left border-t border-b border-dashed py-4" style={{ borderColor: borderCol }}>
                <div className="text-xs">
                  <span className="text-[9px] uppercase tracking-wider block font-bold" style={{ color: mut }}>Assigned Site Zone</span>
                  <span className="font-semibold block mt-0.5" style={{ color: pri }}>{selectedOperator.zone}</span>
                </div>
                <div className="text-xs">
                  <span className="text-[9px] uppercase tracking-wider block font-bold" style={{ color: mut }}>Safety Credentials</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedOperator.credentials.map(cred => (
                      <span key={cred} className="text-[9.5px] font-bold px-2 py-0.5 rounded border" style={{ background: 'rgba(var(--primary-rgb),0.1)', borderColor: borderCol, color: pri }}>{cred}</span>
                    ))}
                  </div>
                </div>
              </div>
              {selectedOperator.name !== currentUser.name && (
                <div className="flex gap-3 mt-5">
                  <GlassButton onClick={() => handleStartDM(selectedOperator.name)} className="flex-1 text-xs" style={{ borderRadius: '10px', padding: '9px 0' }}>Direct Message</GlassButton>
                  <button onClick={() => window.open(`mailto:${selectedOperator.email}`)} className="flex-1 py-2.5 rounded-xl border text-xs font-bold" style={{ borderColor: borderCol, background: 'transparent', color: pri }} onMouseEnter={e => e.currentTarget.style.background = surfaceHover(isDark)} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Email Operator</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
