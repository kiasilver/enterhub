import {
  THEME_COLOR_HEXES,
  themeColorHex,
} from '@/components/SafeDashboard/theme';

export type Presence = 'online' | 'away' | 'dnd' | 'offline';

export type ChatTab = 'chats' | 'letters' | 'saved';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  deptRoles: string[];
  presence: Presence;
  activeTasks: number;
  workStatus: 'working' | 'idle';
};

export type Room = {
  id: string;
  type: string;
  title: string;
  name?: string | null;
  unreadCount?: number;
  members: {
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string | null;
  }[];
  lastMessage: { body: string; createdAt: string; authorName: string } | null;
};

export type ChatMsg = {
  id: string;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  replyToId?: string | null;
  replyTo?: { id: string; body: string; authorName: string } | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role?: string;
  };
  reactions: {
    emoji: string;
    userIds: string[];
    count: number;
    reactedByMe?: boolean;
  }[];
  attachments: {
    id?: string;
    fileName: string;
    fileUrl: string;
    mimeType?: string | null;
    sizeBytes?: number;
  }[];
  mentions: { userId: string; name: string }[];
  entityMentions?: {
    kind: 'user' | 'board' | 'media';
    id: string;
    label: string;
    url?: string | null;
  }[];
  isMine?: boolean;
  isSaved?: boolean;
};

export type LetterRow = {
  id: string;
  type: 'EXCUSE' | 'ADMIN' | 'GENERAL';
  status: string;
  subject: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  from: { id: string; name: string; email?: string; avatarUrl?: string | null };
  to: { id: string; name: string; email?: string; avatarUrl?: string | null };
  replies: {
    id: string;
    subject: string;
    body: string;
    createdAt: string;
    from: { id: string; name: string; avatarUrl?: string | null };
  }[];
};

export type SavedRow = {
  savedAt: string;
  room: { id: string; name: string | null; type: string };
  message: ChatMsg;
};

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '👀', '✅'] as const;

export const STATUS_COLOR: Record<Presence, string> = {
  online: themeColorHex('emerald'),
  away: themeColorHex('amber'),
  dnd: themeColorHex('rose'),
  offline: themeColorHex('slate'),
};

export const ACCENT = {
  channel: themeColorHex('violet'),
  dm: themeColorHex('cyan'),
  letter: themeColorHex('amber'),
  saved: themeColorHex('pink'),
  team: themeColorHex('blue'),
} as const;

/** Rotating accent colors for team member rows — full 12-colour system */
export const TEAM_ROW_COLORS = THEME_COLOR_HEXES;
