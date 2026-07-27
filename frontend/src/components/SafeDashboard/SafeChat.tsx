'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GlassButton from './GlassButton';
import CustomSelect from './CustomSelect';
import { textPrimary, textSecondary, textMuted, borderSubtle, surfaceItem, glassStyle, surfaceHover, panelFill, bubbleFill } from './theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useIsMobile } from './useIsMobile';
import SafeChatMobile from './SafeChatMobile';

interface Props {
  isDark: boolean;
}

// ─── Interfaces ────────────────────────────────────────────────────────────
export interface SharedFile {
  name: string;
  size: string;
  type: 'pdf' | 'csv' | 'image' | 'word' | 'excel';
  date: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface Message {
  id: string;
  senderName: string;
  senderInitials: string;
  body: string;
  time: string;
  isCurrentUser: boolean;
  isSystem?: boolean;
  isAlert?: boolean;
  isPinned?: boolean;
  fileAttachment?: SharedFile;
  reactions?: Reaction[];
}

export interface Member {
  name: string;
  initials: string;
  role: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  email?: string;
  zone?: string;
  credentials?: string[];
}

export interface ChatRoom {
  id: string;
  name: string;
  isChannel: boolean;
  status?: 'online' | 'away' | 'dnd' | 'offline';
  unreadCount: number;
  initials?: string;
  description?: string;
  creator?: string;
  createdDate?: string;
  members: Member[];
  messages: Message[];
  sharedFiles: SharedFile[];
}

export interface UserProfile {
  name: string;
  initials: string;
  role: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  email: string;
  zone: string;
  credentials: string[];
}

// ─── Operator Profile Database ──────────────────────────────────────────────
export const OPERATOR_PROFILES: Record<string, UserProfile> = {
  'Hassan Alavi': {
    name: 'Hassan Alavi',
    initials: 'HA',
    role: 'Warehouse Supervisor',
    status: 'online',
    email: 'h.alavi@enterhub.io',
    zone: 'Zone C - Logistics Rack 14',
    credentials: ['OSHA-10 Certified', 'LOTO System Auditor', 'Warehouse Forklift Instructor']
  },
  'Sara Nouri': {
    name: 'Sara Nouri',
    initials: 'SN',
    role: 'Chemical Specialist',
    status: 'online',
    email: 's.nouri@enterhub.io',
    zone: 'Zone B - Chemical Storage Cabinet 4',
    credentials: ['Hazmat Chemical Auditor', 'Emergency Spill Responder', 'MS Chemical Engineering']
  },
  'Mohammad Reza': {
    name: 'Mohammad Reza',
    initials: 'MR',
    role: 'Maintenance Lead',
    status: 'away',
    email: 'm.reza@enterhub.io',
    zone: 'Zone A - Power Room',
    credentials: ['Certified Electrician', 'Infrared Thermographer', 'High Voltage Isolation Lead']
  },
  'SYSTEM BOT': {
    name: 'SYSTEM BOT',
    initials: 'SB',
    role: 'Automated Telemetry Dispatcher',
    status: 'online',
    email: 'telemetry-bot@enterhub.io',
    zone: 'Plant-wide Sensors',
    credentials: ['Real-time Monitoring', 'Automated Alarm Logging']
  },
  'SYSTEM COMMAND': {
    name: 'SYSTEM COMMAND',
    initials: 'SC',
    role: 'Plant System Automation Control',
    status: 'online',
    email: 'command@enterhub.io',
    zone: 'Control Server Loop',
    credentials: ['Automatic Routing Engine']
  }
};

// ─── Vector SVG Icons ────────────────────────────────────────────────────────
const IconHash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSend = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconPaperclip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const IconClose = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── File Type Vector SVG Renderer ──────────────────────────────────────────
export function IconFile({ type, size = 18 }: { type: SharedFile['type']; size?: number }) {
  const isExcel = type === 'excel' || type === 'csv';
  const color = type === 'pdf' ? '#ef4444' : isExcel ? '#10b981' : type === 'image' ? '#3b82f6' : 'var(--primary)';
  const bg = type === 'pdf' ? 'rgba(239,68,68,0.12)' : isExcel ? 'rgba(16,185,129,0.12)' : type === 'image' ? 'rgba(59,130,246,0.12)' : 'rgba(var(--primary-rgb),0.12)';
  
  return (
    <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: size + 12, height: size + 12, background: bg, color: color }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        {isExcel ? (
          <>
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </>
        ) : type === 'pdf' ? (
          <line x1="9" y1="15" x2="15" y2="15" />
        ) : type === 'image' ? (
          <circle cx="9" cy="13" r="1.5" />
        ) : (
          <line x1="8" y1="13" x2="16" y2="13" />
        )}
      </svg>
    </div>
  );
}

// ─── Initial Mock Chat Rooms Data ──────────────────────────────────────────
export const INITIAL_MEMBERS: Member[] = [
  { name: 'Ali Mohammadi (You)', initials: 'AM', role: 'Safety Manager', status: 'online' },
  { name: 'Hassan Alavi', initials: 'HA', role: 'Warehouse Supervisor', status: 'online' },
  { name: 'Sara Nouri', initials: 'SN', role: 'Chemical Specialist', status: 'online' },
  { name: 'Mohammad Reza', initials: 'MR', role: 'Maintenance Lead', status: 'away' },
];

export const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: 'c1',
    name: 'general-safety',
    isChannel: true,
    unreadCount: 0,
    description: 'Main safety operations chatroom for daily audits, checklist sign-offs, and Zone sweeps.',
    creator: 'Ali Mohammadi',
    createdDate: '2026-06-01',
    members: INITIAL_MEMBERS,
    messages: [
      { id: 'm1', senderName: 'Hassan Alavi', senderInitials: 'HA', body: 'Daily safety sweep of Zone C Warehouse completed. All floor clearance tags are signed and updated.', time: '10:14 AM', isCurrentUser: false, reactions: [{ emoji: '👍', users: ['Ali Mohammadi'] }] },
      { id: 'm2', senderName: 'Sara Nouri', senderInitials: 'SN', body: 'Great. Hassan, did you check the solvent chemical lockers as well?', time: '10:30 AM', isCurrentUser: false },
      { id: 'm3', senderName: 'Mohammad Reza', senderInitials: 'MR', body: 'I scheduled the chemical cabinet check for 14:30 during the shift crossover.', time: '11:15 AM', isCurrentUser: false, reactions: [{ emoji: '🔥', users: ['Hassan Alavi'] }] },
      { id: 'm4', senderName: 'Hassan Alavi', senderInitials: 'HA', body: 'Perfect, let me know if you need absorbent socks. We just stocked some in Cabinets 4.', time: '11:20 AM', isCurrentUser: false },
    ],
    sharedFiles: [
      { name: 'ZoneC_Warehouse_Sweep.pdf', size: '1.2 MB', type: 'pdf', date: 'Yesterday' },
      { name: 'Chemical_Absorbent_Specs.docx', size: '350 KB', type: 'word', date: 'Yesterday' }
    ]
  },
  {
    id: 'c2',
    name: 'emergency-response',
    isChannel: true,
    unreadCount: 2,
    description: 'Critical sensor alerts, power isolations, emergency evacuation, and incident responses.',
    creator: 'SYSTEM COMMAND',
    createdDate: '2026-05-18',
    members: INITIAL_MEMBERS,
    messages: [
      { id: 'm5', senderName: 'SYSTEM BOT', senderInitials: 'SB', body: 'ALERT: Thermal sensor A4 detected a temperature spike in Breaker Panel 3, reaching 84°C.', time: '18:42 PM', isCurrentUser: false, isSystem: true, isAlert: true },
      { id: 'm6', senderName: 'Mohammad Reza', senderInitials: 'MR', body: 'Responding to Zone A now. I have thermal imaging cameras ready.', time: '18:45 PM', isCurrentUser: false, reactions: [{ emoji: '👍', users: ['Ali Mohammadi', 'Sara Nouri'] }] },
      { id: 'm7', senderName: 'Mohammad Reza', senderInitials: 'MR', body: 'Cabinet isolation complete. Replaced overloaded fuse. Temperature is returning to normal at 65°C.', time: '19:10 PM', isCurrentUser: false },
    ],
    sharedFiles: [
      { name: 'Thermal_Sensor_Calibration.csv', size: '42 KB', type: 'csv', date: '2 days ago' },
      { name: 'Power_Grid_Layout_ZoneA.pdf', size: '4.8 MB', type: 'pdf', date: 'Yesterday' }
    ]
  },
  {
    id: 'c3',
    name: 'equipment-maintenance',
    isChannel: true,
    unreadCount: 0,
    description: 'Weekly diagnostics, logistics forklifts, tools checklists, and calibration logs.',
    creator: 'Mohammad Reza',
    createdDate: '2026-06-10',
    members: INITIAL_MEMBERS,
    messages: [
      { id: 'm8', senderName: 'Sara Nouri', senderInitials: 'SN', body: 'Forklift battery charger in Zone B was reported sparking. Maintenance ticket #903 created.', time: 'Yesterday', isCurrentUser: false },
      { id: 'm9', senderName: 'Mohammad Reza', senderInitials: 'MR', body: 'Inspected cabinet. Terminal leads were loose. Fixed and tested. Charger operational.', time: 'Yesterday', isCurrentUser: false },
    ],
    sharedFiles: [
      { name: 'Forklift_Safety_Manual.pdf', size: '2.5 MB', type: 'pdf', date: '3 days ago' }
    ]
  },
  {
    id: 'd1',
    name: 'Hassan Alavi',
    isChannel: false,
    initials: 'HA',
    status: 'online',
    unreadCount: 0,
    members: [
      { name: 'Ali Mohammadi (You)', initials: 'AM', role: 'Safety Manager', status: 'online' },
      { name: 'Hassan Alavi', initials: 'HA', role: 'Warehouse Supervisor', status: 'online' }
    ],
    messages: [
      { id: 'm10', senderName: 'Hassan Alavi', senderInitials: 'HA', body: 'Hi Ali, did you get a chance to sign off the scaffolding checklist for Zone C?', time: '09:00 AM', isCurrentUser: false },
      { id: 'm11', senderName: 'Ali Mohammadi', senderInitials: 'AM', body: 'Just reviewed it. Scaffolding is fully approved. Safe to operate.', time: '09:12 AM', isCurrentUser: true },
      { id: 'm12', senderName: 'Hassan Alavi', senderInitials: 'HA', body: 'Excellent, thanks! Moving team to staging area now.', time: '09:15 AM', isCurrentUser: false },
    ],
    sharedFiles: [
      { name: 'Scaffold_ZoneC_Approved.pdf', size: '820 KB', type: 'pdf', date: 'Today' }
    ]
  },
  {
    id: 'd2',
    name: 'Sara Nouri',
    isChannel: false,
    initials: 'SN',
    status: 'online',
    unreadCount: 0,
    members: [
      { name: 'Ali Mohammadi (You)', initials: 'AM', role: 'Safety Manager', status: 'online' },
      { name: 'Sara Nouri', initials: 'SN', role: 'Chemical Specialist', status: 'online' }
    ],
    messages: [
      { id: 'm13', senderName: 'Sara Nouri', senderInitials: 'SN', body: 'Ali, the OSHA inspector draft schedule was emailed. They will review certification tags.', time: 'Yesterday', isCurrentUser: false },
      { id: 'm14', senderName: 'Ali Mohammadi', senderInitials: 'AM', body: 'Thanks, Sara. I will coordinate briefing materials for main office.', time: 'Yesterday', isCurrentUser: true },
    ],
    sharedFiles: [
      { name: 'OSHA_Inspector_Draft.xlsx', size: '180 KB', type: 'excel', date: 'Yesterday' }
    ]
  },
  {
    id: 'd3',
    name: 'Mohammad Reza',
    isChannel: false,
    initials: 'MR',
    status: 'away',
    unreadCount: 0,
    members: [
      { name: 'Ali Mohammadi (You)', initials: 'AM', role: 'Safety Manager', status: 'online' },
      { name: 'Mohammad Reza', initials: 'MR', role: 'Maintenance Lead', status: 'away' }
    ],
    messages: [
      { id: 'm15', senderName: 'Ali Mohammadi', senderInitials: 'AM', body: 'Mohammad, is the chemical cabinet vent in Zone B operational?', time: '11:00 AM', isCurrentUser: true },
      { id: 'm16', senderName: 'Mohammad Reza', senderInitials: 'MR', body: 'Just completed checking. Air flow sensor is green.', time: '11:08 AM', isCurrentUser: false },
    ],
    sharedFiles: []
  },
];

export const QUICK_TEMPLATES = [
  'All systems normal',
  'Acknowledged, checking now',
  'On my way to Zone A',
  'Dispatching safety team',
  'Incident resolved',
];

export const MOCK_ATTACHMENTS: SharedFile[] = [
  { name: 'Zone_B_Gas_Specs.pdf', size: '1.4 MB', type: 'pdf', date: 'Just now' },
  { name: 'Thermal_Spike_Incident.csv', size: '56 KB', type: 'csv', date: 'Just now' },
  { name: 'Calibration_Index_2026.xlsx', size: '115 KB', type: 'excel', date: 'Just now' },
  { name: 'ZoneC_Scaffolding_Tag.png', size: '780 KB', type: 'image', date: 'Just now' }
];

export default function SafeChat({ isDark }: Props) {
  // Below the lg breakpoint, render the dedicated mobile chat screen.
  const isMobile = useIsMobile();
  if (isMobile) return <SafeChatMobile isDark={isDark} />;
  return <SafeChatDesktop isDark={isDark} />;
}

function SafeChatDesktop({ isDark }: Props) {
  const { primaryColor } = useTheme();
  // Theme helpers
  const pri = textPrimary(isDark);
  const sec = textSecondary(isDark);
  const mut = textMuted(isDark);
  const bg = panelFill(isDark);
  const inputBg = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)';
  const borderCol = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // States
  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>('c1');
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedInput, setFocusedInput] = useState(false);

  // Search inside room messages state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchKeyword, setChatSearchKeyword] = useState('');

  // Details drawer states
  const [showDrawer, setShowDrawer] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'info' | 'files'>('info');

  // On mobile the Details drawer is a full-screen overlay, so start it closed
  // (otherwise it would cover the chat on load). On desktop it stays open as a side panel.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setShowDrawer(false);
  }, []);

  // Modal Profile Configuration States
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    name: 'Ali Mohammadi',
    initials: 'AM',
    role: 'Safety Manager',
    status: 'online',
    email: 'a.mohammadi@enterhub.io',
    zone: 'Control Center Terminal',
    credentials: ['OSHA-30 Certified', 'Hazmat Specialist', 'Plant Safety Director']
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileFormName, setProfileFormName] = useState(currentUser.name);
  const [profileFormInitials, setProfileFormInitials] = useState(currentUser.initials);
  const [profileFormRole, setProfileFormRole] = useState(currentUser.role);
  const [profileFormStatus, setProfileFormStatus] = useState<UserProfile['status']>(currentUser.status);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Selected Operator Detail Modal (Click to View Profile)
  const [selectedOperator, setSelectedOperator] = useState<UserProfile | null>(null);

  // File Picker simulator state
  const [showFilePicker, setShowFilePicker] = useState(false);

  // Auto-scroll ref
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Filtered rooms in sidebar
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [rooms, searchQuery]);

  // Selected active room details
  const activeRoom = useMemo(() => {
    return rooms.find(r => r.id === activeRoomId) || rooms[0];
  }, [rooms, activeRoomId]);

  // Messages filtered inside the room by search keyword
  const filteredMessages = useMemo(() => {
    if (!chatSearchKeyword.trim()) return activeRoom.messages;
    return activeRoom.messages.filter(m => 
      m.body.toLowerCase().includes(chatSearchKeyword.toLowerCase()) ||
      m.senderName.toLowerCase().includes(chatSearchKeyword.toLowerCase())
    );
  }, [activeRoom.messages, chatSearchKeyword]);

  // Typing simulation states
  const [isTyping, setIsTyping] = useState(false);
  const [typingName, setTypingName] = useState('');

  // Scroll to bottom on room change or new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom.messages, isTyping]);

  // Simulated live typing session when switching rooms (DMs only)
  useEffect(() => {
    setIsTyping(false);
    if (!activeRoom.isChannel) {
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
        setTypingName(activeRoom.name);

        const replyTimer = setTimeout(() => {
          setIsTyping(false);
          const roomMsgs = activeRoom.messages;
          const lastMsg = roomMsgs[roomMsgs.length - 1];
          // Check if last message was from current user to respond dynamically
          if (lastMsg && lastMsg.isCurrentUser) {
            const replies = [
              "Acknowledged. I will update the inspection status.",
              "I am monitoring the current metrics. All green.",
              "On my way to check now. Will ping you soon.",
              "Copy that. I have updated the safety checklists.",
            ];
            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            const simMsg: Message = {
              id: `sim-${Date.now()}`,
              senderName: activeRoom.name,
              senderInitials: activeRoom.initials || activeRoom.name.substring(0, 2).toUpperCase(),
              body: randomReply,
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
  }, [activeRoomId]);

  // Clear unread badge on selecting room
  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, unreadCount: 0 } : r));
  };

  // Send message helper
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

    setRooms(prev => prev.map(r => {
      if (r.id === activeRoom.id) {
        const updatedFiles = fileAttach ? [fileAttach, ...r.sharedFiles] : r.sharedFiles;
        return { 
          ...r, 
          messages: [...r.messages, newMessage],
          sharedFiles: updatedFiles
        };
      }
      return r;
    }));

    setMessageText('');
  };

  // Submit via text input
  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(messageText);
  };



  // Attach File simulation Handler
  const handleAttachFile = (file: SharedFile) => {
    sendMessage(`Shared a file document: ${file.name}`, file);
    setShowFilePicker(false);
  };

  // Toggle Message Reaction
  const handleReact = (msgId: string, emoji: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === activeRoom.id) {
        return {
          ...r,
          messages: r.messages.map(m => {
            if (m.id !== msgId) return m;
            const rx = m.reactions || [];
            const existing = rx.find(item => item.emoji === emoji);
            let nextRx;

            if (existing) {
              if (existing.users.includes(currentUser.name)) {
                // Remove reaction
                const nextUsers = existing.users.filter(u => u !== currentUser.name);
                if (nextUsers.length === 0) {
                  nextRx = rx.filter(item => item.emoji !== emoji);
                } else {
                  nextRx = rx.map(item => item.emoji === emoji ? { ...item, users: nextUsers } : item);
                }
              } else {
                // Add user to existing reaction
                nextRx = rx.map(item => item.emoji === emoji ? { ...item, users: [...item.users, currentUser.name] } : item);
              }
            } else {
              // Create new reaction
              nextRx = [...rx, { emoji, users: [currentUser.name] }];
            }

            return { ...m, reactions: nextRx };
          })
        };
      }
      return r;
    }));
  };

  // Save profile settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser({
      ...currentUser,
      name: profileFormName,
      initials: profileFormInitials.toUpperCase().slice(0, 3),
      role: profileFormRole,
      status: profileFormStatus
    });
    setIsProfileModalOpen(false);
  };

  // Route to DM room when clicking profile "Direct Message" action
  const handleStartDM = (opName: string) => {
    const targetRoom = rooms.find(r => !r.isChannel && r.name === opName);
    if (targetRoom) {
      handleSelectRoom(targetRoom.id);
    }
    setSelectedOperator(null);
  };

  const getChatInputStyle = () => ({
    borderColor: focusedInput ? primaryColor : borderSubtle(isDark),
    background: inputBg,
    color: pri,
    boxShadow: focusedInput
      ? (isDark ? '0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)' : '0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)')
      : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
  });

  const getModalInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    return {
      borderColor: isFocused ? primaryColor : borderCol,
      background: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.8)',
      color: pri,
      boxShadow: isFocused
        ? (isDark ? '0 0 0 3px rgba(var(--primary-rgb), 0.25), 0 4px 12px rgba(var(--primary-rgb), 0.1)' : '0 0 0 3px rgba(var(--primary-rgb), 0.15), 0 4px 12px rgba(var(--primary-rgb), 0.05)')
        : 'none',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      outline: 'none',
    };
  };

  const getStatusColor = (status: UserProfile['status']) => {
    if (status === 'online') return '#10b981';
    if (status === 'away') return '#f59e0b';
    if (status === 'dnd') return '#ef4444';
    return '#9ca3af';
  };



  // Click on colleague profile initials/names helper
  const handleColleagueClick = (name: string) => {
    const cleanedName = name.replace(' (You)', '').trim();
    if (cleanedName === currentUser.name) {
      // Edit own profile
      setProfileFormName(currentUser.name);
      setProfileFormInitials(currentUser.initials);
      setProfileFormRole(currentUser.role);
      setProfileFormStatus(currentUser.status);
      setIsProfileModalOpen(true);
    } else {
      // Find operator profile
      const prof = OPERATOR_PROFILES[cleanedName];
      if (prof) {
        setSelectedOperator(prof);
      } else {
        // Look in active room's members or general initial list
        const foundMember = activeRoom.members.find(
          m => m.name.replace(' (You)', '').trim() === cleanedName
        );
        if (foundMember) {
          setSelectedOperator({
            name: foundMember.name,
            initials: foundMember.initials,
            role: foundMember.role,
            status: foundMember.status,
            email: `${foundMember.name.toLowerCase().replace(/\s+/g, '.')}@enterhub.io`,
            zone: 'Assigned Site Zone',
            credentials: ['Safety Certified', 'On-Duty Operator']
          });
        } else {
          // Dynamic fallback safety card construction
          setSelectedOperator({
            name: cleanedName,
            initials: cleanedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3),
            role: 'Safety Operations Colleague',
            status: 'online',
            email: `${cleanedName.toLowerCase().replace(/\s+/g, '.')}@enterhub.io`,
            zone: 'General Plant Site',
            credentials: ['Safety Certified']
          });
        }
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative h-full">
      
      {/* ─── Sidebar Panel (Channels + Users) ──────────────────────────────── */}
      <div
        className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col p-4 space-y-4 transition-colors max-h-[38vh] lg:max-h-none"
        style={{ borderColor: borderCol }}
      >
        {/* User profile header widget - clickable to edit */}
        <div 
          onClick={() => {
            setProfileFormName(currentUser.name);
            setProfileFormInitials(currentUser.initials);
            setProfileFormRole(currentUser.role);
            setProfileFormStatus(currentUser.status);
            setIsProfileModalOpen(true);
          }}
          className="flex items-center gap-3 pb-3 border-b cursor-pointer hover:bg-gray-500/5 p-1 rounded-xl transition-colors" 
          style={{ borderColor: borderCol }}
          title="Edit My Profile Settings"
        >
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-[rgba(var(--primary-rgb),0.1)] border border-[rgba(var(--primary-rgb),0.2)] flex items-center justify-center text-sm font-bold" style={{ color: primaryColor }}>
              {currentUser.initials}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: getStatusColor(currentUser.status) }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate leading-none" style={{ color: pri }}>{currentUser.name}</p>
            <p className="text-[10px] mt-2 capitalize font-semibold leading-none" style={{ color: mut }}>
              {currentUser.role}
            </p>
          </div>
        </div>

        {/* Room search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: sec }}>
            <IconSearch />
          </span>
          <input
            type="text"
            placeholder="Search channels & staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border outline-none transition-all duration-200"
            style={{
              borderColor: borderSubtle(isDark),
              background: inputBg,
              color: pri,
            }}
          />
        </div>

        {/* Channels/Users Lists */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1" style={{ scrollbarWidth: 'none' }}>
          
          {/* Channels list */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5 px-2" style={{ color: mut }}>CHANNELS</p>
            {filteredRooms.filter(r => r.isChannel).map(channel => {
              const isActive = channel.id === activeRoom.id;
              return (
                <motion.button
                  key={channel.id}
                  onClick={() => handleSelectRoom(channel.id)}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-colors"
                  style={{
                    color: isActive ? 'var(--primary)' : sec,
                    background: isActive ? (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <IconHash />
                    {channel.name}
                  </span>
                  {channel.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ background: primaryColor }}>
                      {channel.unreadCount}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* DMs list */}
          <div className="space-y-1">
            <p className="text-[9px] font-bold tracking-widest uppercase mb-1.5 px-2" style={{ color: mut }}>DIRECT MESSAGES</p>
            {filteredRooms.filter(r => !r.isChannel).map(dm => {
              const isActive = dm.id === activeRoom.id;
              
              // Resolve DM online status directly from operator database
              const dmProfile = OPERATOR_PROFILES[dm.name];
              const displayStatus = dmProfile ? dmProfile.status : 'offline';

              return (
                <motion.button
                  key={dm.id}
                  onClick={() => handleSelectRoom(dm.id)}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold select-none cursor-pointer transition-colors"
                  style={{
                    color: isActive ? 'var(--primary)' : sec,
                    background: isActive ? (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)') : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {/* Status avatar */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColleagueClick(dm.name);
                      }}
                      className="relative shrink-0 hover:scale-110 transition-transform duration-200 cursor-pointer"
                      title={`View ${dm.name}'s safety card`}
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 border text-[9px] font-bold flex items-center justify-center" style={{ borderColor: borderCol }}>
                        {dm.initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-black" style={{ backgroundColor: getStatusColor(displayStatus) }} />
                    </div>
                    {dm.name}
                  </span>
                  {dm.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white" style={{ background: primaryColor }}>
                      {dm.unreadCount}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

        </div>

      </div>

      {/* ─── Chat Area (Feed + Inputs) ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        {/* Chat Room Header */}
        <div
          className="px-4 sm:px-6 py-4 border-b flex items-center justify-between gap-3 transition-colors shrink-0"
          style={{ borderColor: borderCol }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div 
              onClick={() => {
                if (!activeRoom.isChannel) {
                  handleColleagueClick(activeRoom.name);
                }
              }}
              className={`flex items-center gap-3.5 min-w-0 ${!activeRoom.isChannel ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
              title={!activeRoom.isChannel ? `View ${activeRoom.name}'s safety card` : undefined}
            >
              <span style={{ color: pri }} className="scale-125 shrink-0">
                {activeRoom.isChannel ? <IconHash /> : <IconUser />}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-none truncate" style={{ color: pri }}>
                  {activeRoom.isChannel ? '#' + activeRoom.name : activeRoom.name}
                </h3>
                
                {/* Dynamic keyword filtering indicator */}
                {chatSearchKeyword.trim() ? (
                  <span className="text-[10px] text-amber-500 font-bold block mt-1.5">
                    Filtering logs by: "{chatSearchKeyword}"
                  </span>
                ) : (
                  <p className="text-xs mt-2 leading-none truncate" style={{ color: mut }}>
                    {activeRoom.isChannel ? activeRoom.description : `Direct communication • ${OPERATOR_PROFILES[activeRoom.name]?.status || 'online'}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Inline Keyword message history search expander */}
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 160, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      placeholder="Find in logs..."
                      value={chatSearchKeyword}
                      onChange={e => setChatSearchKeyword(e.target.value)}
                      className="w-full pl-3 pr-6 py-1 rounded-lg text-xs border outline-none"
                      style={{
                        borderColor: borderCol,
                        background: inputBg,
                        color: pri
                      }}
                    />
                    {chatSearchKeyword && (
                      <button 
                        type="button"
                        onClick={() => setChatSearchKeyword('')} 
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] hover:text-red-500 p-0.5 cursor-pointer"
                        style={{ color: mut }}
                      >
                        ✕
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={() => { setIsSearchOpen(p => !p); setChatSearchKeyword(''); }}
                className="p-1.5 rounded-lg border cursor-pointer hover:bg-primary/10 transition-colors"
                style={{ borderColor: borderCol, color: isSearchOpen ? primaryColor : pri }}
                title="Search Messages History"
              >
                <IconSearch />
              </button>
            </div>

            <span className="hidden sm:inline-block px-3 py-1 rounded text-xs font-bold bg-[rgba(var(--primary-rgb),0.08)] border border-[rgba(var(--primary-rgb),0.15)]" style={{ color: primaryColor }}>
              {filteredMessages.length} logs
            </span>

            {/* Info toggle button */}
            <button 
              onClick={() => setShowDrawer(p => !p)}
              className="p-1.5 rounded-lg border cursor-pointer hover:bg-primary/10 transition-colors"
              style={{ borderColor: borderCol, color: showDrawer ? primaryColor : pri }}
              title="Toggle Conversation Details"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Message Feed grid */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6"
          style={{ scrollbarWidth: 'none' }}
        >
          <AnimatePresence mode="popLayout">
            {filteredMessages.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-2.5 h-full opacity-65">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: mut }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-xs font-bold mt-1.5" style={{ color: sec }}>No messages found</p>
                <p className="text-[10px] max-w-[200px]" style={{ color: mut }}>Modify search filters or keywords to scan active channel timeline.</p>
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const isMe = msg.isCurrentUser;
                
                if (msg.isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex justify-center p-4 rounded-xl border max-w-lg mx-auto text-center flex-col gap-2 transition-all relative group"
                      style={{
                        background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.05)',
                        borderColor: 'rgba(239, 68, 68, 0.35)',
                        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.06)',
                      }}
                    >
                      <span className="text-[11px] font-black text-red-500 uppercase tracking-widest">SYSTEM ALERT</span>
                      <p className="text-sm leading-relaxed font-semibold" style={{ color: pri }}>{msg.body}</p>
                      <span className="text-[10px]" style={{ color: mut }}>{msg.time}</span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                    className={`flex gap-3 max-w-[88%] sm:max-w-[75%] ${isMe ? 'ml-auto flex-row-reverse' : ''} relative group`}
                  >
                    {/* Pin overlay indicator status icon */}


                    {/* Hover Emoji Reaction Menu (Wow design) */}
                    <div className={`absolute -top-6 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 z-20 px-2 py-1 rounded-lg border shadow-xl bg-black/85 backdrop-blur-md ${isMe ? 'left-0' : 'right-0'}`} style={{ borderColor: borderCol }}>
                      {['👍', '❤️', '🔥', '👏', '⚠️'].map(emoji => (
                        <button 
                          key={emoji}
                          type="button"
                          onClick={() => handleReact(msg.id, emoji)}
                          className="hover:scale-135 transition-transform px-1 cursor-pointer text-xs"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Avatar - Clickable to View Profile */}
                    {!isMe && (
                      <div 
                        onClick={() => handleColleagueClick(msg.senderName)}
                        className="w-10 h-10 rounded-full bg-primary/10 border text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer hover:border-primary transition-colors"
                        style={{ borderColor: borderCol, color: pri }}
                        title={`View ${msg.senderName}'s safety card`}
                      >
                        {msg.senderInitials}
                      </div>
                    )}

                    {/* Bubble wrapper */}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className={`flex items-center gap-2 px-1 ${isMe ? 'justify-end' : ''}`}>
                        <span 
                          onClick={() => handleColleagueClick(msg.senderName)}
                          className="text-xs font-extrabold cursor-pointer hover:text-primary transition-colors"
                          style={{ color: pri }}
                        >
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[10px]" style={{ color: mut }}>{msg.time}</span>
                      </div>

                      <div
                        className="p-3.5 px-4 sm:p-4 sm:px-5 rounded-2xl text-[15px] leading-relaxed transition-all font-medium flex flex-col gap-2.5 relative"
                        style={{
                          background: bubbleFill(isDark, isMe),
                          border: `1px solid ${isMe ? 'rgba(var(--primary-rgb), 0.4)' : borderCol}`,
                          color: pri,
                          borderRadius: isMe ? '18px 2px 18px 18px' : '2px 18px 18px 18px',
                          boxShadow: isDark
                            ? '0 4px 16px rgba(0,0,0,0.35)'
                            : '0 4px 14px rgba(15,23,42,0.06)',
                        }}
                      >
                        <span className="break-words">{msg.body}</span>

                        {/* File attachment preview with Vector SVG Icons */}
                        {msg.fileAttachment && (
                          <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-black/15 hover:bg-black/25 transition-colors w-full sm:w-[230px] max-w-full" style={{ borderColor: borderCol }}>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconFile type={msg.fileAttachment.type} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate" style={{ color: pri }}>{msg.fileAttachment.name}</p>
                                <span className="text-[9px]" style={{ color: mut }}>{msg.fileAttachment.size}</span>
                              </div>
                            </div>
                            <button type="button" className="text-[9.5px] font-black border px-1.5 py-0.5 rounded cursor-pointer transition-colors" style={{ borderColor: borderCol, color: pri }} onMouseEnter={e => e.currentTarget.style.color = primaryColor} onMouseLeave={e => e.currentTarget.style.color = pri}>
                              Open
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Display Emoji Reaction Badges under bubble */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                          {msg.reactions.map(rx => (
                            <button
                              key={rx.emoji}
                              type="button"
                              onClick={() => handleReact(msg.id, rx.emoji)}
                              className="px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 cursor-pointer transition-all hover:border-primary/50 bg-black/10"
                              style={{ 
                                borderColor: rx.users.includes(currentUser.name) ? 'rgba(var(--primary-rgb),0.4)' : borderCol,
                                color: rx.users.includes(currentUser.name) ? primaryColor : pri
                              }}
                              title={`Reacted by: ${rx.users.join(', ')}`}
                            >
                              <span>{rx.emoji}</span>
                              <span className="font-bold">{rx.users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-3 items-end max-w-[70%]"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border text-xs font-bold flex items-center justify-center shrink-0" style={{ borderColor: borderCol, color: pri }}>
                  {activeRoom.initials || activeRoom.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-bold" style={{ color: pri }}>{typingName}</span>
                  <div
                    className="p-3.5 px-4.5 rounded-2xl text-[15px] leading-relaxed"
                    style={{
                      background: panelFill(isDark),
                      border: `1px solid ${borderCol}`,
                      color: sec,
                      borderRadius: '2px 18px 18px 18px',
                      boxShadow: isDark
                        ? '0 4px 16px rgba(0,0,0,0.35)'
                        : '0 4px 14px rgba(15,23,42,0.06)',
                    }}
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      Typing
                      <span className="flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
          {/* Scroll Anchor */}
          <div ref={chatBottomRef} />
        </div>

        {/* Templates and Inputs Panel */}
        <div
          className="p-4 border-t flex flex-col gap-3.5 transition-colors shrink-0 relative"
          style={{ borderColor: borderCol }}
        >
          {/* Mock File picker submenu dropdown */}
          {showFilePicker && (
            <div 
              className="absolute bottom-16 left-6 p-2 rounded-2xl border shadow-2xl z-50 w-56 flex flex-col gap-1 backdrop-blur-xl transition-all"
              style={{
                background: panelFill(isDark),
                borderColor: borderCol,
              }}
            >
              <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest border-b mb-1" style={{ borderColor: borderCol, color: mut }}>Attach Safety Doc</div>
              {MOCK_ATTACHMENTS.map(file => (
                <button
                  key={file.name}
                  type="button"
                  onClick={() => handleAttachFile(file)}
                  className="px-2 py-1.5 rounded-lg text-left text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2.5 truncate cursor-pointer w-full text-ellipsis"
                  style={{ color: sec }}
                >
                  <IconFile type={file.type} size={14} />
                  {file.name}
                </button>
              ))}
            </div>
          )}

          {/* Quick template response chips */}
          <div className="flex flex-wrap gap-2 select-none items-center">
            <span className="text-xs font-bold uppercase tracking-wider mr-1.5" style={{ color: mut }}>Templates:</span>
            {QUICK_TEMPLATES.map(text => (
              <motion.button
                key={text}
                type="button"
                onClick={() => sendMessage(text)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors border"
                style={{
                  background: panelFill(isDark),
                  borderColor: borderCol,
                  color: sec,
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(15,23,42,0.05)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = primaryColor; (e.currentTarget as HTMLElement).style.color = pri; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderCol; (e.currentTarget as HTMLElement).style.color = sec; }}
              >
                {text}
              </motion.button>
            ))}
          </div>

          {/* Typing Form */}
          <form onSubmit={handleSubmitMessage} className="flex gap-3">
            <div className="flex-1 relative min-w-0">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder={`Send message to ${activeRoom.isChannel ? '#' + activeRoom.name : activeRoom.name}...`}
                className="w-full pl-5 pr-12 py-3.5 rounded-xl text-base border"
                style={getChatInputStyle()}
              />
              <button
                type="button"
                onClick={() => setShowFilePicker(p => !p)}
                className="absolute right-4 transition-colors cursor-pointer flex items-center justify-center scale-125 hover:text-[var(--primary)]"
                style={{ color: sec, top: '50%', transform: 'translateY(-50%)' }}
                title="Attach Document File"
              >
                <IconPaperclip />
              </button>
            </div>
            
            <GlassButton type="submit" style={{ padding: '0 24px', fontSize: '14px', borderRadius: '12px' }}>
              <IconSend /> Send
            </GlassButton>
          </form>

        </div>

      </div>

      {/* ─── RIGHT DRAWER: Conversation Details ───────────────────────────── */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="border-t lg:border-t-0 lg:border-l flex flex-col shrink-0 overflow-y-auto max-lg:absolute max-lg:inset-0 max-lg:z-40 max-lg:!w-full max-lg:max-h-none"
            style={{
              borderColor: borderCol,
              background: panelFill(isDark)
            }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b flex justify-between items-center shrink-0" style={{ borderColor: borderCol }}>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: pri }}>Details</h3>
              <button 
                onClick={() => setShowDrawer(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center border text-[10px] cursor-pointer hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/35 transition-colors"
                style={{ borderColor: borderCol, color: sec }}
              >
                ✕
              </button>
            </div>

            {/* Tab navigation buttons */}
            <div className="flex border-b text-xs shrink-0" style={{ borderColor: borderCol }}>
              {[
                { id: 'info', label: 'Info' },
                { id: 'files', label: 'Files' }
              ].map(tab => {
                const isActive = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id as 'info' | 'files')}
                    className="flex-1 py-3 text-center font-bold tracking-wide relative cursor-pointer"
                    style={{ color: isActive ? pri : mut }}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_-2px_6px_rgba(var(--primary-rgb),0.8)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Tab Content wrapper */}
            <div className="flex-1 p-4 space-y-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              
              {/* TAB 1: INFO & MEMBERS */}
              {drawerTab === 'info' && (
                <>
                  {/* Bio Description */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mut }}>Description</span>
                    <p className="text-xs leading-relaxed" style={{ color: sec }}>
                      {activeRoom.description || 'No description logged for this messaging node.'}
                    </p>
                  </div>

                  {activeRoom.isChannel && (
                    <div className="grid grid-cols-2 gap-3 text-[10px] p-3 rounded-xl border" style={{ borderColor: borderCol, background: surfaceItem(isDark) }}>
                      <div>
                        <span style={{ color: mut }} className="block">Creator</span>
                        <span className="font-bold font-mono text-primary" style={{ color: pri }}>{activeRoom.creator}</span>
                      </div>
                      <div>
                        <span style={{ color: mut }} className="block">Created</span>
                        <span className="font-bold" style={{ color: pri }}>{activeRoom.createdDate}</span>
                      </div>
                    </div>
                  )}

                  {/* Members list */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mut }}>Members ({activeRoom.members.length})</span>
                    <div className="space-y-3">
                      {activeRoom.members.map(member => {
                        // Dynamically look up status/role changes
                        const isSelf = member.name === currentUser.name;
                        const status = isSelf ? currentUser.status : (OPERATOR_PROFILES[member.name]?.status || member.status);
                        const role = isSelf ? currentUser.role : member.role;

                        return (
                          <div 
                            key={member.name} 
                            onClick={() => handleColleagueClick(member.name)}
                            className="flex items-center justify-between text-xs cursor-pointer hover:bg-gray-500/5 p-1 rounded-lg transition-colors"
                            title={`View profile details`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-primary/10 border text-[9px] font-bold flex items-center justify-center shrink-0" style={{ borderColor: borderCol, color: pri }}>
                                {isSelf ? currentUser.initials : member.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold truncate" style={{ color: pri }}>{isSelf ? currentUser.name + ' (You)' : member.name}</p>
                                <span className="text-[9.5px] truncate block" style={{ color: mut }}>{role}</span>
                              </div>
                            </div>
                            <span 
                              className="w-2 h-2 rounded-full shrink-0 animate-pulse" 
                              style={{ backgroundColor: getStatusColor(status) }} 
                              title={status}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: SHARED FILES */}
              {drawerTab === 'files' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider block" style={{ color: mut }}>Shared Documents ({activeRoom.sharedFiles.length})</span>
                  {activeRoom.sharedFiles.length === 0 ? (
                    <p className="text-xs italic" style={{ color: mut }}>No documents uploaded in this channel yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {activeRoom.sharedFiles.map((file, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 rounded-xl border flex items-center justify-between gap-3"
                          style={{ borderColor: borderCol, background: surfaceItem(isDark) }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconFile type={file.type} />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold truncate" style={{ color: pri }}>{file.name}</p>
                              <p className="text-[9px] mt-0.5" style={{ color: mut }}>{file.size} • {file.date}</p>
                            </div>
                          </div>
                          <button type="button" className="text-[9px] font-extrabold text-primary hover:text-primary cursor-pointer">
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}



            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 1: MY PROFILE CONFIGURATION ───────────────────────────── */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-sm rounded-3xl p-6 overflow-visible shadow-2xl border transition-colors"
              style={{
                ...glassStyle(isDark),
                background: isDark ? 'rgba(18,18,18,0.96)' : '#ffffff',
                borderColor: borderCol,
                boxShadow: isDark 
                  ? '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08)' 
                  : '0 25px 60px -15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.4)',
              }}
            >
              <div className="flex justify-between items-center mb-6 pb-3.5 border-b" style={{ borderColor: borderCol }}>
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: pri }}>Edit Profile & Status</h3>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-1 hover:text-red-500 cursor-pointer transition-colors"
                  style={{ color: mut }}
                >
                  <IconClose />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-2 transition-colors duration-200" style={{ color: focusedField === 'name' ? primaryColor : sec }}>Display Name</label>
                  <input
                    type="text"
                    required
                    value={profileFormName}
                    onChange={e => setProfileFormName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none"
                    style={getModalInputStyle('name')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-2 transition-colors duration-200" style={{ color: focusedField === 'initials' ? primaryColor : sec }}>Initials (Max 3)</label>
                    <input
                      type="text"
                      required
                      maxLength={3}
                      value={profileFormInitials}
                      onChange={e => setProfileFormInitials(e.target.value)}
                      onFocus={() => setFocusedField('initials')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none font-mono"
                      style={getModalInputStyle('initials')}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider mb-2 transition-colors duration-200" style={{ color: sec }}>Status</label>
                    <CustomSelect
                      value={profileFormStatus}
                      onChange={setProfileFormStatus}
                      options={[
                        { value: 'online', label: 'Online' },
                        { value: 'away', label: 'Away' },
                        { value: 'dnd', label: 'Do Not Disturb' },
                        { value: 'offline', label: 'Offline' }
                      ]}
                      isDark={isDark}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider mb-2 transition-colors duration-200" style={{ color: focusedField === 'role' ? primaryColor : sec }}>Safety Role</label>
                  <input
                    type="text"
                    required
                    value={profileFormRole}
                    onChange={e => setProfileFormRole(e.target.value)}
                    onFocus={() => setFocusedField('role')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none"
                    style={getModalInputStyle('role')}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4.5 border-t" style={{ borderColor: borderCol }}>
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-4.5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ 
                      borderColor: borderCol, 
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', 
                      color: pri 
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
                  >
                    Cancel
                  </button>
                  <GlassButton 
                    type="submit" 
                    style={{ 
                      padding: '10px 20px', 
                      fontSize: '12px', 
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Save Changes
                  </GlassButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: COLLEAGUE PROFILE VIEW (Operator Safety Card) ─────── */}
      <AnimatePresence>
        {selectedOperator && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOperator(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm rounded-3xl p-6 overflow-visible shadow-2xl border transition-colors text-center"
              style={{
                ...glassStyle(isDark),
                background: isDark ? 'rgba(18,18,18,0.97)' : '#ffffff',
                borderColor: borderCol,
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedOperator(null)}
                className="absolute top-4 right-4 p-1 hover:text-red-500 cursor-pointer"
                style={{ color: mut }}
              >
                <IconClose />
              </button>

              {/* Large Avatar with status ring */}
              <div className="flex flex-col items-center mt-3">
                <div 
                  className="w-16 h-16 rounded-full border-2 text-xl font-bold flex items-center justify-center relative shadow-lg"
                  style={{ 
                    borderColor: getStatusColor(selectedOperator.status), 
                    background: 'rgba(var(--primary-rgb),0.08)',
                    color: pri
                  }}
                >
                  {selectedOperator.initials}
                  <span 
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black" 
                    style={{ backgroundColor: getStatusColor(selectedOperator.status) }} 
                  />
                </div>
                
                <h3 className="text-base font-extrabold mt-3" style={{ color: pri }}>{selectedOperator.name}</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-primary mt-1">{selectedOperator.role}</span>
                <span className="text-[10px] mt-0.5 block" style={{ color: mut }}>{selectedOperator.email}</span>
              </div>

              {/* Operations detail grid */}
              <div className="mt-5 space-y-4 text-left border-t border-b border-dashed py-4" style={{ borderColor: borderCol }}>
                <div className="text-xs">
                  <span className="text-[9px] uppercase tracking-wider block font-bold" style={{ color: mut }}>Assigned Site Zone</span>
                  <span className="font-semibold block mt-0.5" style={{ color: pri }}>{selectedOperator.zone}</span>
                </div>

                <div className="text-xs">
                  <span className="text-[9px] uppercase tracking-wider block font-bold" style={{ color: mut }}>Safety Credentials</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedOperator.credentials.map(cred => (
                      <span 
                        key={cred} 
                        className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-primary/10 border"
                        style={{ borderColor: borderCol, color: pri }}
                      >
                        {cred}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions (Shortcut DM Routing!) */}
              <div className="flex gap-3 mt-5">
                <GlassButton 
                  onClick={() => handleStartDM(selectedOperator.name)} 
                  className="flex-1 text-xs" 
                  style={{ borderRadius: '10px', padding: '9px 0' }}
                >
                  Direct Message
                </GlassButton>
                
                <button 
                  onClick={() => window.open(`mailto:${selectedOperator.email}`)}
                  className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors"
                  style={{ borderColor: borderCol, background: 'transparent', color: pri }}
                  onMouseEnter={e => e.currentTarget.style.background = surfaceHover(isDark)}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Email Operator
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
