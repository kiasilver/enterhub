'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import {
  MdAdd,
  MdAttachFile,
  MdBookmark,
  MdBookmarkBorder,
  MdChatBubble,
  MdClose,
  MdDeleteOutline,
  MdFolder,
  MdMail,
  MdPersonOutline,
  MdReply,
  MdSearch,
  MdSend,
  MdTag,
  MdVideocam,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  glassStyle,
  panelFill,
  bubbleFill,
  hexToRgba,
  searchFieldBg,
  selectedFill,
  canvasBg,
} from '@/components/SafeDashboard/theme';
import { MeetingOverlay } from '@/components/meeting/MeetingOverlay';
import {
  ACCENT,
  REACTION_EMOJIS,
  STATUS_COLOR,
  TEAM_ROW_COLORS,
  type ChatMsg,
  type ChatTab,
  type LetterRow,
  type Presence,
  type Room,
  type SavedRow,
  type TeamMember,
} from '@/components/chat/chat-types';
import { isPresenceStatus, toChatPresence } from '@/lib/presence';

function PresenceDot({
  status,
  size = 10,
}: {
  status: Presence;
  size?: number;
}) {
  return (
    <span
      className="absolute bottom-0 right-0 rounded-full ring-2"
      style={{
        width: size,
        height: size,
        background: STATUS_COLOR[status],
        boxShadow: '0 0 0 2px var(--background)',
      }}
    />
  );
}

function Avatar({
  name,
  url,
  presence,
  size = 36,
  accent = ACCENT.team,
}: {
  name: string;
  url?: string | null;
  presence?: Presence;
  size?: number;
  accent?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="relative inline-flex shrink-0 rounded-full overflow-visible items-center justify-center text-xs font-bold text-white"
      style={{
        width: size,
        height: size,
      }}
    >
      <span
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: url ? undefined : accent }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials || '?'
        )}
      </span>
      {presence && <PresenceDot status={presence} size={Math.max(8, size * 0.28)} />}
    </span>
  );
}

function highlightMentions(
  body: string,
  mentions: { name: string }[],
  entities: { kind: string; label: string }[] = [],
) {
  let out = body;
  const labels = [
    ...mentions.map((m) => ({ prefix: '@', label: m.name })),
    ...entities
      .filter((e) => e.kind === 'user')
      .map((e) => ({ prefix: '@', label: e.label })),
    ...entities
      .filter((e) => e.kind === 'board')
      .map((e) => ({ prefix: '#', label: e.label })),
    ...entities
      .filter((e) => e.kind === 'media')
      .map((e) => ({ prefix: '📎', label: e.label })),
  ];
  for (const m of labels) {
    const token = `${m.prefix}${m.label}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(token, 'gi');
    out = out.replace(re, (s) => `⟦${s}⟧`);
  }
  return out;
}

type SuggestItem = {
  kind: 'user' | 'board' | 'media';
  id: string;
  label: string;
  sub?: string;
  url?: string | null;
  avatarUrl?: string | null;
  color?: string | null;
};

type EntityMention = {
  kind: 'user' | 'board' | 'media';
  id: string;
  label: string;
  url?: string | null;
};

export function WorkspaceChatClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const { t: tx, lang, dir } = useLang();
  const isDark = theme === 'dark';
  const { data: session } = useSession();
  const myId = session?.user?.id || '';
  const myName = session?.user?.name || session?.user?.email || 'Me';
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get('room');
  const meetFromUrl = searchParams.get('meet') === '1';

  const [tab, setTab] = useState<ChatTab>('chats');
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activeId, setActiveId] = useState<string | null>(roomFromUrl);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMsg | null>(null);
  const [mentionIds, setMentionIds] = useState<string[]>([]);
  const [entityMentions, setEntityMentions] = useState<EntityMention[]>([]);
  const [pendingFiles, setPendingFiles] = useState<
    { fileName: string; fileUrl: string; mimeType: string; sizeBytes: number }[]
  >([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionTrigger, setMentionTrigger] = useState<'@' | '#' | null>(null);
  const [suggests, setSuggests] = useState<{
    people: SuggestItem[];
    projects: SuggestItem[];
    files: SuggestItem[];
  }>({ people: [], projects: [], files: [] });
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelMembers, setChannelMembers] = useState<string[]>([]);
  const [letters, setLetters] = useState<LetterRow[]>([]);
  const [letterMeta, setLetterMeta] = useState({ canSend: false, canReadAll: false });
  const [letterBox, setLetterBox] = useState<'inbox' | 'sent' | 'all'>('inbox');
  const [activeLetter, setActiveLetter] = useState<LetterRow | null>(null);
  const [composeLetter, setComposeLetter] = useState(false);
  const [letterForm, setLetterForm] = useState({
    type: 'GENERAL' as 'EXCUSE' | 'ADMIN' | 'GENERAL',
    toUserId: '',
    subject: '',
    body: '',
  });
  const [replyLetterBody, setReplyLetterBody] = useState('');
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [livePresence, setLivePresence] = useState<Record<string, Presence>>({});
  const [typingName, setTypingName] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [busy, setBusy] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingAllowed, setMeetingAllowed] = useState<boolean | null>(null);
  const [meetingUpgradeHint, setMeetingUpgradeHint] = useState<string | null>(null);
  const [socketLive, setSocketLive] = useState<Socket | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const glass = glassStyle(isDark);
  const railBg = canvasBg(isDark);

  const loadRooms = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`);
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      setError(json.error || 'Failed to load chats');
      return;
    }
    setRooms(json.data || []);
    setActiveId((prev) => {
      if (roomFromUrl && (json.data || []).some((r: Room) => r.id === roomFromUrl)) {
        return roomFromUrl;
      }
      return prev || json.data?.[0]?.id || null;
    });
  }, [workspaceId, roomFromUrl]);

  const loadTeam = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/chat/team`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) setTeam(json.data || []);
  }, [workspaceId]);

  const loadMessages = useCallback(
    async (roomId: string) => {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${roomId}/messages`,
      );
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setError(json.error || 'Failed to load messages');
        return;
      }
      setMessages(json.data || []);
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r)),
      );
    },
    [workspaceId],
  );

  const loadLetters = useCallback(async () => {
    const res = await fetch(
      `/api/workspaces/${workspaceId}/chat/letters?box=${letterBox}`,
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setLetters(json.data || []);
      if (json.meta) setLetterMeta(json.meta);
    }
  }, [workspaceId, letterBox]);

  const loadSaved = useCallback(async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}/chat/saved`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) setSaved(json.data || []);
  }, [workspaceId]);

  useEffect(() => {
    void loadRooms();
    void loadTeam();
    void fetch(`/api/workspaces/${workspaceId}/chat/letters?box=inbox`)
      .then((r) => r.json())
      .then((j) => {
        if (j.meta) setLetterMeta(j.meta);
      })
      .catch(() => undefined);
  }, [loadRooms, loadTeam, workspaceId]);

  useEffect(() => {
    if (tab === 'letters') void loadLetters();
    if (tab === 'saved') void loadSaved();
  }, [tab, loadLetters, loadSaved]);

  useEffect(() => {
    if (activeId && tab === 'chats') void loadMessages(activeId);
  }, [activeId, tab, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;
    setSocketLive(socket);
    socket.emit('workspace:join', { workspaceId });
    const stored =
      typeof window !== 'undefined'
        ? localStorage.getItem(`enterhub:presence:${workspaceId}`) || 'available'
        : 'available';
    const mapStatus = (s: string): Presence => {
      if (s === 'offline') return 'offline';
      if (isPresenceStatus(s)) return toChatPresence(s);
      if (s === 'away' || s === 'On leave' || s === 'leave') return 'away';
      if (s === 'meeting' || s === 'In a meeting' || s === 'dnd') return 'dnd';
      if (s === 'online' || s === 'available') return 'online';
      return 'online';
    };
    socket.emit('presence:set', {
      workspaceId,
      userId: myId,
      status: isPresenceStatus(stored) ? stored : 'available',
    });
    socket.on(
      'presence:update',
      (p: { userId?: string; status?: string }) => {
        if (!p.userId || !p.status) return;
        setLivePresence((prev) => ({
          ...prev,
          [p.userId!]: mapStatus(p.status!),
        }));
      },
    );
    socket.on('chat:message', (msg: ChatMsg & { roomId?: string }) => {
      if (!msg.roomId || msg.roomId !== activeId) {
        if (msg.roomId) {
          setRooms((prev) =>
            prev.map((r) =>
              r.id === msg.roomId
                ? { ...r, unreadCount: (r.unreadCount || 0) + 1 }
                : r,
            ),
          );
        }
        return;
      }
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id)
          ? prev
          : [
              ...prev,
              {
                ...msg,
                isMine: msg.isMine || (!!myId && msg.author?.id === myId),
              },
            ],
      );
    });
    socket.on(
      'chat:reaction',
      (p: {
        messageId: string;
        roomId: string;
        reactions: ChatMsg['reactions'];
      }) => {
        if (p.roomId !== activeId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === p.messageId
              ? {
                  ...m,
                  reactions: p.reactions.map((r) => ({
                    ...r,
                    reactedByMe: r.userIds.includes(myId),
                  })),
                }
              : m,
          ),
        );
      },
    );
    socket.on('chat:typing', (p: { roomId: string; name?: string; userId?: string }) => {
      if (p.roomId !== activeId || p.userId === myId) return;
      setTypingName(p.name || 'Someone');
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), 2000);
    });
    socket.on('letter:new', () => {
      if (tab === 'letters') void loadLetters();
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketLive(null);
    };
  }, [workspaceId, activeId, myId, tab, loadLetters]);

  useEffect(() => {
    if (!activeId || !socketRef.current) return;
    socketRef.current.emit('chat:join', { roomId: activeId });
    return () => {
      socketRef.current?.emit('chat:leave', { roomId: activeId });
    };
  }, [activeId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/meetings/access`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json.data) {
          setMeetingAllowed(!!json.data.allowed);
          setMeetingUpgradeHint(json.data.upgradeHint || null);
        } else {
          setMeetingAllowed(false);
          setMeetingUpgradeHint(json.error || 'Unable to check meeting access');
        }
      } catch {
        if (!cancelled) {
          setMeetingAllowed(false);
          setMeetingUpgradeHint('Unable to check meeting access');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (meetFromUrl && activeId) {
      setMeetingOpen(true);
      setMobileShowThread(true);
    }
  }, [meetFromUrl, activeId]);

  const openMeeting = useCallback(() => {
    setMeetingOpen(true);
  }, []);

  const teamWithPresence = useMemo(
    () =>
      team.map((t) => ({
        ...t,
        presence: livePresence[t.id] || t.presence,
      })),
    [team, livePresence],
  );

  const roleByUser = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of team) m.set(t.id, t.role);
    return m;
  }, [team]);

  const filteredRooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.lastMessage?.body || '').toLowerCase().includes(q),
    );
  }, [rooms, query]);

  const filteredTeam = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teamWithPresence;
    return teamWithPresence.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.role.toLowerCase().includes(q),
    );
  }, [teamWithPresence, query]);

  const filteredMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || tab !== 'chats') return messages;
    return messages.filter((m) => m.body.toLowerCase().includes(q));
  }, [messages, query, tab]);

  const activeRoom = rooms.find((r) => r.id === activeId) || null;
  const roomAccent =
    activeRoom?.type === 'DIRECT' ? ACCENT.dm : ACCENT.channel;

  async function openDm(userId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DIRECT', memberIds: [userId] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      await loadRooms();
      setActiveId(json.data.id);
      setTab('chats');
      setMobileShowThread(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function createChannel() {
    if (!channelName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CHANNEL',
          name: channelName.trim(),
          memberIds: channelMembers.length ? channelMembers : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setCreateOpen(false);
      setChannelName('');
      setChannelMembers([]);
      await loadRooms();
      setActiveId(json.data.id);
      setTab('chats');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!showMentions) return;
    const t = setTimeout(() => {
      void (async () => {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/chat/mention-suggests?q=${encodeURIComponent(mentionQuery)}`,
        );
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.data) {
          setSuggests({
            people: json.data.people || [],
            projects: json.data.projects || [],
            files: json.data.files || [],
          });
        }
      })();
    }, 120);
    return () => clearTimeout(t);
  }, [showMentions, mentionQuery, workspaceId]);

  function onDraftChange(v: string) {
    setDraft(v);
    const at = v.match(/(^|[\s])@([^\s@#]*)$/);
    const hash = v.match(/(^|[\s])#([^\s@#]*)$/);
    if (at) {
      setShowMentions(true);
      setMentionTrigger('@');
      setMentionQuery(at[2] || '');
    } else if (hash) {
      setShowMentions(true);
      setMentionTrigger('#');
      setMentionQuery(hash[2] || '');
    } else {
      setShowMentions(false);
      setMentionTrigger(null);
      setMentionQuery('');
    }
    if (activeId && socketRef.current) {
      socketRef.current.emit('chat:typing', {
        roomId: activeId,
        userId: myId,
        name: myName,
      });
    }
  }

  function insertEntityMention(item: SuggestItem) {
    const token =
      item.kind === 'board'
        ? `#${item.label}`
        : item.kind === 'media'
          ? `📎${item.label}`
          : `@${item.label}`;
    setDraft((d) => {
      if (mentionTrigger === '#') {
        return d.replace(/(^|[\s])#[^\s@#]*$/, `$1${token} `);
      }
      return d.replace(/(^|[\s])@[^\s@#]*$/, `$1${token} `);
    });
    setEntityMentions((prev) => {
      if (prev.some((e) => e.kind === item.kind && e.id === item.id)) return prev;
      return [
        ...prev,
        {
          kind: item.kind,
          id: item.id,
          label: item.label,
          url: item.url || (item.kind === 'board' ? `/board/${item.id}` : null),
        },
      ];
    });
    if (item.kind === 'user') {
      setMentionIds((ids) => [...new Set([...ids, item.id])]);
    }
    setShowMentions(false);
    setMentionTrigger(null);
    setMentionQuery('');
  }

  async function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).slice(0, 5);
    e.target.value = '';
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read failed'));
        reader.readAsDataURL(file);
      });
      setPendingFiles((prev) => [
        ...prev,
        {
          fileName: file.name,
          fileUrl: dataUrl,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      ]);
    }
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    if (!activeId || (!draft.trim() && !pendingFiles.length) || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/chat/rooms/${activeId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: draft.trim() || (pendingFiles.length ? '📎 Attachment' : ''),
            replyToId: replyTo?.id || null,
            mentionIds,
            entityMentions,
            attachments: pendingFiles,
          }),
        },
      );
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(json.error || 'Send failed');
      setMessages((prev) =>
        prev.some((m) => m.id === json.data.id) ? prev : [...prev, json.data],
      );
      setDraft('');
      setReplyTo(null);
      setMentionIds([]);
      setEntityMentions([]);
      setPendingFiles([]);
      setShowEmoji(false);
      setShowMentions(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!activeId) return;
    await fetch(
      `/api/workspaces/${workspaceId}/chat/rooms/${activeId}/messages/${messageId}/reactions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      },
    );
  }

  async function toggleSave(msg: ChatMsg) {
    if (!activeId) return;
    const method = msg.isSaved ? 'DELETE' : 'POST';
    await fetch(
      `/api/workspaces/${workspaceId}/chat/rooms/${activeId}/messages/${msg.id}/save`,
      { method },
    );
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, isSaved: !msg.isSaved } : m,
      ),
    );
  }

  async function deleteMessage(messageId: string) {
    if (!activeId) return;
    if (!confirm('Delete this message? It can be recovered for 6 days.')) return;
    const res = await fetch(
      `/api/workspaces/${workspaceId}/chat/rooms/${activeId}/messages/${messageId}`,
      { method: 'DELETE' },
    );
    if (!res.ok) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), body: '' } : m,
      ),
    );
  }

  async function sendLetter() {
    if (!letterForm.toUserId || !letterForm.subject.trim() || !letterForm.body.trim()) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(letterForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setComposeLetter(false);
      setLetterForm({ type: 'GENERAL', toUserId: '', subject: '', body: '' });
      await loadLetters();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function replyLetter() {
    if (!activeLetter || !replyLetterBody.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/letters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeLetter.type,
          toUserId: activeLetter.from.id,
          subject: `Re: ${activeLetter.subject}`,
          body: replyLetterBody.trim(),
          parentId: activeLetter.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setReplyLetterBody('');
      await loadLetters();
      const refreshed = await fetch(
        `/api/workspaces/${workspaceId}/chat/letters/${activeLetter.id}`,
      );
      const j = await refreshed.json();
      if (refreshed.ok) {
        setActiveLetter({
          ...activeLetter,
          replies: (j.data.replies || []).map(
            (r: {
              id: string;
              subject: string;
              body: string;
              createdAt: string;
              fromUser: { id: string; name: string | null; avatarUrl: string | null };
            }) => ({
              id: r.id,
              subject: r.subject,
              body: r.body,
              createdAt: r.createdAt,
              from: {
                id: r.fromUser.id,
                name: r.fromUser.name || '',
                avatarUrl: r.fromUser.avatarUrl,
              },
            }),
          ),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  function onComposerKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  const channels = filteredRooms.filter((r) => r.type === 'CHANNEL');
  const dms = filteredRooms.filter((r) => r.type === 'DIRECT');

  return (
    <div
      className="h-full min-h-0 w-full flex-1 flex overflow-hidden"
      dir={dir}
      style={{
        background: canvasBg(isDark),
        borderTop: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      {/* Left rail */}
      <aside
        className={`w-full sm:w-[320px] lg:w-[340px] flex flex-col border-e shrink-0 min-h-0 ${
          mobileShowThread && tab === 'chats' ? 'hidden sm:flex' : 'flex'
        }`}
        style={{
          background: railBg,
          borderColor: borderSubtle(isDark),
        }}
      >
        <div className="p-4 space-y-3.5">
          <div className="flex gap-1.5 p-1.5 rounded-xl" style={{ background: isDark ? 'transparent' : surfaceItem(isDark) }}>
            {(
              [
                { id: 'chats' as const, label: tx('chat.chats'), color: ACCENT.channel, icon: MdChatBubble },
                { id: 'letters' as const, label: tx('chat.letters'), color: ACCENT.letter, icon: MdMail },
                { id: 'saved' as const, label: tx('chat.saved'), color: ACCENT.saved, icon: MdBookmark },
              ] as const
            ).map((tabItem) => {
              const Icon = tabItem.icon;
              const on = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => {
                    setTab(tabItem.id);
                    setMobileShowThread(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 rounded-lg text-[10px] xs:text-[11px] font-bold transition-colors min-w-0"
                  style={{
                    background: on ? selectedFill(isDark) : 'transparent',
                    color: on ? (isDark ? textPrimary(isDark) : tabItem.color) : textMuted(isDark),
                    border: on ? `1px solid ${borderSubtle(isDark)}` : '1px solid transparent',
                  }}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  <span className="truncate">{tabItem.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <MdSearch
              size={16}
              className={`absolute top-1/2 -translate-y-1/2 ${lang === 'fa' ? 'right-3' : 'left-3'}`}
              style={{ color: textMuted(isDark) }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx('chat.search')}
              className={`w-full rounded-xl py-2.5 text-xs outline-none ${lang === 'fa' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              style={{
                background: searchFieldBg(isDark),
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textPrimary(isDark),
              }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3 pb-4 space-y-5">
          {tab === 'chats' && (
            <>
              <div>
                <div className="flex items-center justify-between px-1.5 mb-2">
                  <p
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: ACCENT.channel }}
                  >
                    {tx('chat.channels')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="p-1.5 rounded-lg"
                    style={{ color: ACCENT.channel }}
                    title={tx('chat.newChannel')}
                  >
                    <MdAdd size={18} />
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {channels.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveId(r.id);
                          setMobileShowThread(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm"
                        style={{
                          background:
                            activeId === r.id
                              ? selectedFill(isDark)
                              : 'transparent',
                          color: textPrimary(isDark),
                          border: activeId === r.id ? `1px solid ${borderSubtle(isDark)}` : '1px solid transparent',
                        }}
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: hexToRgba(ACCENT.channel, 0.25),
                            color: ACCENT.channel,
                          }}
                        >
                          <MdTag size={16} />
                        </span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-xs">
                          {r.title}
                        </span>
                        {(r.unreadCount || 0) > 0 && (
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                            style={{ background: ACCENT.channel }}
                          >
                            {r.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 mb-2"
                  style={{ color: ACCENT.dm }}
                >
                  {tx('chat.direct')}
                </p>
                <ul className="space-y-1.5">
                  {dms.map((r) => {
                    const other = r.members.find((m) => m.userId !== myId);
                    const presence =
                      (other && livePresence[other.userId]) ||
                      teamWithPresence.find((t) => t.id === other?.userId)?.presence ||
                      'offline';
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(r.id);
                            setMobileShowThread(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left"
                          style={{
                            background:
                              activeId === r.id
                                ? selectedFill(isDark)
                                : 'transparent',
                            border: activeId === r.id ? `1px solid ${borderSubtle(isDark)}` : '1px solid transparent',
                          }}
                        >
                          <Avatar
                            name={r.title}
                            url={other?.avatarUrl}
                            presence={presence}
                            size={32}
                            accent={ACCENT.dm}
                          />
                          <span
                            className="min-w-0 flex-1 truncate text-xs font-semibold"
                            style={{ color: textPrimary(isDark) }}
                          >
                            {r.title}
                          </span>
                          {(r.unreadCount || 0) > 0 && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: ACCENT.dm }}
                            >
                              {r.unreadCount}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider px-1.5 mb-2.5"
                  style={{ color: ACCENT.team }}
                >
                  {tx('chat.teamMembers')}
                </p>
                <ul className="space-y-3">
                  {filteredTeam.map((t, idx) => {
                    const accent =
                      TEAM_ROW_COLORS[idx % TEAM_ROW_COLORS.length] || ACCENT.team;
                    return (
                    <li key={t.id} style={{ opacity: t.presence === 'offline' ? 0.78 : 1 }}>
                      <button
                        type="button"
                        onClick={() => void openDm(t.id)}
                        disabled={busy || t.id === myId}
                        className="w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-left disabled:opacity-40 transition-all duration-200"
                        style={{
                          color: textPrimary(isDark),
                          border: `1px solid ${borderSubtle(isDark)}`,
                          background: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = selectedFill(isDark);
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Avatar
                          name={t.name}
                          url={t.avatarUrl}
                          presence={t.presence}
                          size={36}
                          accent={accent}
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: textPrimary(isDark) }}
                          >
                            {t.name}
                          </p>
                          <p
                            className="text-[10px] truncate font-medium"
                            style={{ color: accent }}
                          >
                            {t.role}
                            {t.deptRoles[0] ? ` · ${t.deptRoles[0]}` : ''}
                          </p>
                          {t.activeTasks > 0 && (
                            <span
                              className="inline-flex mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{
                                background: hexToRgba('#22c55e', 0.18),
                                color: '#22c55e',
                              }}
                            >
                              {t.activeTasks === 1
                                ? tx('chat.workingTasks', { n: t.activeTasks })
                                : tx('chat.workingTasksPlural', { n: t.activeTasks })}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}

          {tab === 'letters' && (
            <div className="space-y-3 px-1">
              <div className="flex flex-wrap gap-1.5">
                {(['inbox', 'sent', ...(letterMeta.canReadAll ? (['all'] as const) : [])] as const).map(
                  (b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setLetterBox(b)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize"
                      style={{
                        background:
                          letterBox === b
                            ? selectedFill(isDark)
                            : 'transparent',
                        color: letterBox === b ? textPrimary(isDark) : textMuted(isDark),
                        border: `1px solid ${letterBox === b ? borderSubtle(isDark) : 'transparent'}`,
                      }}
                    >
                      {b}
                    </button>
                  ),
                )}
                {letterMeta.canSend && (
                  <button
                    type="button"
                    onClick={() => setComposeLetter(true)}
                    className="ml-auto px-2.5 py-1 rounded-lg text-[10px] font-bold text-white"
                    style={{ background: ACCENT.letter }}
                  >
                    + New letter
                  </button>
                )}
              </div>
              <ul className="space-y-2">
                {letters
                  .filter((l) => {
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      l.subject.toLowerCase().includes(q) ||
                      l.body.toLowerCase().includes(q) ||
                      l.from.name.toLowerCase().includes(q)
                    );
                  })
                  .map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setActiveLetter(l)}
                        className="w-full text-left rounded-xl px-3 py-3"
                        style={{
                          background:
                            activeLetter?.id === l.id
                              ? selectedFill(isDark)
                              : 'transparent',
                          border: `1px solid ${borderSubtle(isDark)}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                            style={{
                              background: hexToRgba(ACCENT.letter, 0.2),
                              color: ACCENT.letter,
                            }}
                          >
                            {l.type}
                          </span>
                          {!l.readAt && letterBox === 'inbox' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          )}
                        </div>
                        <p
                          className="text-xs font-bold truncate"
                          style={{ color: textPrimary(isDark) }}
                        >
                          {l.subject}
                        </p>
                        <p
                          className="text-[10px] truncate"
                          style={{ color: textMuted(isDark) }}
                        >
                          {l.from.name} → {l.to.name}
                        </p>
                      </button>
                    </li>
                  ))}
                {letters.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: textMuted(isDark) }}>
                    No letters yet
                  </p>
                )}
              </ul>
            </div>
          )}

          {tab === 'saved' && (
            <ul className="space-y-2 px-1">
              {saved.map((s) => (
                <li key={s.message.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('chats');
                      setActiveId(s.room.id);
                      setMobileShowThread(true);
                    }}
                    className="w-full text-left rounded-xl px-3 py-3"
                    style={{
                      background: panelFill(isDark),
                      border: `1px solid ${borderSubtle(isDark)}`,
                    }}
                  >
                    <p
                      className="text-[10px] font-bold mb-1"
                      style={{ color: ACCENT.saved }}
                    >
                      {s.room.type === 'CHANNEL'
                        ? `# ${s.room.name || 'channel'}`
                        : tx('chat.direct')}
                    </p>
                    <p
                      className="text-xs line-clamp-2"
                      style={{ color: textPrimary(isDark) }}
                    >
                      {s.message.body}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: textMuted(isDark) }}>
                      {s.message.author.name}
                    </p>
                  </button>
                </li>
              ))}
              {saved.length === 0 && (
                <p className="text-xs text-center py-8" style={{ color: textMuted(isDark) }}>
                  {tx('chat.noSaved')}
                </p>
              )}
            </ul>
          )}
        </div>
      </aside>

      {/* Main pane */}
      <section
        className={`flex-1 min-w-0 min-h-0 flex flex-col ${
          !mobileShowThread && tab === 'chats' ? 'hidden sm:flex' : 'flex'
        }`}
        style={{ background: canvasBg(isDark) }}
      >
        {tab === 'chats' && activeRoom && (
          <>
            <header
              className="flex items-center gap-3 px-5 py-3.5 border-b shrink-0"
              style={{
                borderColor: borderSubtle(isDark),
                background: `linear-gradient(90deg, ${hexToRgba(roomAccent, 0.18)}, transparent)`,
              }}
            >
              <button
                type="button"
                className="sm:hidden p-1.5 rounded-lg"
                style={{ color: textSecondary(isDark) }}
                onClick={() => setMobileShowThread(false)}
              >
                <MdClose size={18} />
              </button>
              <span
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: hexToRgba(roomAccent, 0.25),
                  color: roomAccent,
                }}
              >
                {activeRoom.type === 'CHANNEL' ? (
                  <MdTag size={20} />
                ) : (
                  <MdPersonOutline size={20} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  className="text-sm font-bold truncate"
                  style={{ color: textPrimary(isDark) }}
                >
                  {activeRoom.title}
                </h2>
                <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                  {activeRoom.members.length} members
                  {typingName ? ` · ${typingName} is typing…` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={openMeeting}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-opacity hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg,#2563EB,#7C3AED)',
                  color: '#fff',
                  minHeight: 40,
                }}
                title="Start HD meeting"
              >
                <MdVideocam size={18} />
                <span className="hidden sm:inline">Meet</span>
              </button>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-5 py-5 space-y-5" dir="ltr">
              {filteredMessages.map((m) => {
                const isMine = !!(m.isMine || (myId && m.author?.id === myId));
                const role = roleByUser.get(m.author.id);
                const parts = highlightMentions(
                  m.body,
                  m.mentions,
                  m.entityMentions || [],
                ).split(/⟦|⟧/);
                const entityByLabel = new Map(
                  (m.entityMentions || []).map((e) => [
                    e.kind === 'board'
                      ? `#${e.label}`.toLowerCase()
                      : e.kind === 'media'
                        ? `📎${e.label}`.toLowerCase()
                        : `@${e.label}`.toLowerCase(),
                    e,
                  ]),
                );
                return (
                  <div
                    key={m.id}
                    className={`flex w-full gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <Avatar
                        name={m.author.name}
                        url={m.author.avatarUrl}
                        size={34}
                        accent={roomAccent}
                      />
                    )}
                    <div
                      className={`max-w-[min(100%,28rem)] flex flex-col gap-1.5 ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`flex items-center gap-2 px-1 ${isMine ? 'flex-row-reverse' : ''}`}
                      >
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: textSecondary(isDark) }}
                        >
                          {isMine ? (lang === 'fa' ? 'شما' : 'You') : m.author.name}
                        </span>
                        {role && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{
                              background: hexToRgba(roomAccent, 0.2),
                              color: roomAccent,
                            }}
                          >
                            {role}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: textMuted(isDark) }}>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {m.replyTo && (
                        <div
                          className="text-[10px] px-2.5 py-1.5 rounded-lg border-l-2 w-full"
                          style={{
                            borderColor: roomAccent,
                            background: surfaceItem(isDark),
                            color: textMuted(isDark),
                          }}
                          dir="auto"
                        >
                          <span className="font-semibold">{m.replyTo.authorName}</span>
                          : {m.replyTo.body}
                        </div>
                      )}
                      <div
                        className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                        style={{
                          background: isMine
                            ? hexToRgba(roomAccent, isDark ? 0.45 : 0.85)
                            : bubbleFill(isDark, false),
                          color: isMine ? '#fff' : textPrimary(isDark),
                        }}
                        dir="auto"
                      >
                        {m.deletedAt ? (
                          <em style={{ opacity: 0.6 }}>Message deleted</em>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">
                            {parts.map((p, i) => {
                              if (i % 2 !== 1) return <span key={i}>{p}</span>;
                              const ent = entityByLabel.get(p.toLowerCase());
                              const href =
                                ent?.kind === 'board'
                                  ? ent.url || `/board/${ent.id}`
                                  : ent?.kind === 'media'
                                    ? ent.url || undefined
                                    : undefined;
                              const color = isMine
                                ? '#fef08a'
                                : ent?.kind === 'board'
                                  ? ACCENT.channel
                                  : ent?.kind === 'media'
                                    ? ACCENT.letter
                                    : ACCENT.dm;
                              if (href) {
                                return (
                                  <a
                                    key={i}
                                    href={href}
                                    target={ent?.kind === 'media' ? '_blank' : undefined}
                                    rel="noreferrer"
                                    className="font-bold underline underline-offset-2"
                                    style={{ color }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {p}
                                  </a>
                                );
                              }
                              return (
                                <span key={i} className="font-bold" style={{ color }}>
                                  {p}
                                </span>
                              );
                            })}
                          </p>
                        )}
                        {(m.entityMentions || []).filter((e) => e.kind !== 'user').length >
                          0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(m.entityMentions || [])
                              .filter((e) => e.kind === 'board' || e.kind === 'media')
                              .map((e) => (
                                <a
                                  key={`${e.kind}-${e.id}`}
                                  href={
                                    e.kind === 'board'
                                      ? e.url || `/board/${e.id}`
                                      : e.url || '#'
                                  }
                                  target={e.kind === 'media' ? '_blank' : undefined}
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                                  style={{
                                    background: isMine
                                      ? 'rgba(255,255,255,0.18)'
                                      : hexToRgba(
                                          e.kind === 'board' ? ACCENT.channel : ACCENT.letter,
                                          0.18,
                                        ),
                                    color: isMine
                                      ? '#fff'
                                      : e.kind === 'board'
                                        ? ACCENT.channel
                                        : ACCENT.letter,
                                  }}
                                  onClick={(ev) => ev.stopPropagation()}
                                >
                                  {e.kind === 'board' ? (
                                    <MdFolder size={12} />
                                  ) : (
                                    <MdAttachFile size={12} />
                                  )}
                                  {e.label}
                                </a>
                              ))}
                          </div>
                        )}
                        {m.attachments?.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {m.attachments.map((a, i) => (
                              <li key={a.id || i}>
                                <a
                                  href={a.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold underline"
                                >
                                  <MdAttachFile size={12} />
                                  {a.fileName}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div
                        className={`flex flex-wrap items-center gap-1.5 mt-0.5 px-0.5 ${isMine ? 'justify-end' : ''}`}
                      >
                        {m.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            onClick={() => void toggleReaction(m.id, r.emoji)}
                            className="text-[11px] px-2 py-1 rounded-full"
                            style={{
                              background: r.reactedByMe
                                ? hexToRgba(roomAccent, 0.25)
                                : surfaceItem(isDark),
                              border: `1px solid ${borderSubtle(isDark)}`,
                            }}
                          >
                            {r.emoji} {r.count}
                          </button>
                        ))}
                        <div className="flex gap-1 opacity-70 hover:opacity-100">
                          {REACTION_EMOJIS.slice(0, 4).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="text-[11px] px-1.5 py-0.5 rounded"
                              onClick={() => void toggleReaction(m.id, emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="p-1 rounded"
                            style={{ color: textMuted(isDark) }}
                            title="Reply"
                            onClick={() => setReplyTo(m)}
                          >
                            <MdReply size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded"
                            style={{ color: m.isSaved ? ACCENT.saved : textMuted(isDark) }}
                            title="Save"
                            onClick={() => void toggleSave(m)}
                          >
                            {m.isSaved ? (
                              <MdBookmark size={14} />
                            ) : (
                              <MdBookmarkBorder size={14} />
                            )}
                          </button>
                          {isMine && !m.deletedAt && (
                            <button
                              type="button"
                              className="p-1 rounded"
                              style={{ color: textMuted(isDark) }}
                              title="Delete"
                              onClick={() => void deleteMessage(m.id)}
                            >
                              <MdDeleteOutline size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <footer
              className="border-t p-4 space-y-2.5 shrink-0"
              style={{
                borderColor: borderSubtle(isDark),
                background: canvasBg(isDark),
              }}
            >
              {replyTo && (
                <div
                  className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded-lg"
                  style={{
                    background: hexToRgba(roomAccent, 0.12),
                    color: textSecondary(isDark),
                  }}
                >
                  <MdReply size={14} />
                  Replying to {replyTo.author.name}
                  <button type="button" className="ml-auto" onClick={() => setReplyTo(null)}>
                    <MdClose size={14} />
                  </button>
                </div>
              )}
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pendingFiles.map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-1 rounded-lg inline-flex items-center gap-1"
                      style={{ background: surfaceItem(isDark), color: textSecondary(isDark) }}
                    >
                      <MdAttachFile size={12} />
                      {f.fileName}
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                        }
                      >
                        <MdClose size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {showMentions && (
                <div
                  className="max-h-56 overflow-auto rounded-xl border p-2 space-y-2"
                  style={{
                    borderColor: borderSubtle(isDark),
                    background: railBg,
                  }}
                >
                  {(mentionTrigger !== '#' ? suggests.people : []).length > 0 && (
                    <div>
                      <p
                        className="text-[9px] font-bold uppercase px-1 mb-1"
                        style={{ color: ACCENT.dm }}
                      >
                        People
                      </p>
                      <ul>
                        {suggests.people.map((t) => (
                          <li key={`u-${t.id}`}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2"
                              style={{ color: textPrimary(isDark) }}
                              onClick={() => insertEntityMention(t)}
                            >
                              <MdPersonOutline size={14} style={{ color: ACCENT.dm }} />
                              @{t.label}
                              <span style={{ color: textMuted(isDark) }}>· {t.sub}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p
                      className="text-[9px] font-bold uppercase px-1 mb-1"
                      style={{ color: ACCENT.channel }}
                    >
                      Projects
                    </p>
                    <ul>
                      {suggests.projects.length === 0 ? (
                        <li
                          className="px-2 py-1 text-[11px]"
                          style={{ color: textMuted(isDark) }}
                        >
                          No projects
                        </li>
                      ) : (
                        suggests.projects.map((t) => (
                          <li key={`b-${t.id}`}>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2"
                              style={{ color: textPrimary(isDark) }}
                              onClick={() => insertEntityMention(t)}
                            >
                              <MdFolder size={14} style={{ color: ACCENT.channel }} />
                              #{t.label}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  {mentionTrigger !== '#' && (
                    <div>
                      <p
                        className="text-[9px] font-bold uppercase px-1 mb-1"
                        style={{ color: ACCENT.letter }}
                      >
                        Files
                      </p>
                      <ul>
                        {suggests.files.length === 0 ? (
                          <li
                            className="px-2 py-1 text-[11px]"
                            style={{ color: textMuted(isDark) }}
                          >
                            No files in gallery
                          </li>
                        ) : (
                          suggests.files.map((t) => (
                            <li key={`f-${t.id}`}>
                              <button
                                type="button"
                                className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2"
                                style={{ color: textPrimary(isDark) }}
                                onClick={() => insertEntityMention(t)}
                              >
                                <MdAttachFile size={14} style={{ color: ACCENT.letter }} />
                                {t.label}
                                <span
                                  className="truncate"
                                  style={{ color: textMuted(isDark) }}
                                >
                                  · {t.sub}
                                </span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {showEmoji && (
                <div className="flex flex-wrap gap-1">
                  {['😀', '🔥', '👏', '🙏', '💡', '🚀', '✅', '❤️', ...REACTION_EMOJIS].map(
                    (e) => (
                      <button
                        key={e}
                        type="button"
                        className="text-lg p-1"
                        onClick={() => {
                          setDraft((d) => d + e);
                          setShowEmoji(false);
                        }}
                      >
                        {e}
                      </button>
                    ),
                  )}
                </div>
              )}
              <form onSubmit={(e) => void sendMessage(e)} className="flex items-end gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => void onPickFiles(e)}
                />
                <button
                  type="button"
                  className="p-2.5 rounded-xl"
                  style={{
                    background: surfaceItem(isDark),
                    color: textSecondary(isDark),
                  }}
                  onClick={() => fileRef.current?.click()}
                  title="Attach file"
                >
                  <MdAttachFile size={18} />
                </button>
                <button
                  type="button"
                  className="p-2.5 rounded-xl text-base"
                  style={{ background: surfaceItem(isDark) }}
                  onClick={() => setShowEmoji((v) => !v)}
                >
                  😊
                </button>
                <textarea
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onKeyDown={onComposerKey}
                  rows={1}
                  placeholder={lang === 'fa' ? 'پیام…  @ افراد/فایل · # پروژه' : 'Message…  @ people/files · # projects'}
                  className="flex-1 resize-none rounded-xl px-3 py-2.5 text-sm outline-none max-h-28"
                  style={{
                    background: searchFieldBg(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textPrimary(isDark),
                  }}
                />
                <button
                  type="submit"
                  disabled={busy || (!draft.trim() && !pendingFiles.length)}
                  className="p-2.5 rounded-xl text-white disabled:opacity-40"
                  style={{ background: roomAccent }}
                >
                  <MdSend size={18} />
                </button>
              </form>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </footer>
          </>
        )}

        {tab === 'chats' && !activeRoom && (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: textMuted(isDark) }}>
            {tx('chat.emptyThread')}
          </div>
        )}

        {tab === 'letters' && (
          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar p-5">
            {composeLetter ? (
              <div
                className="max-w-lg mx-auto rounded-2xl p-5 space-y-3"
                style={{
                  background: panelFill(isDark),
                  border: `1px solid ${borderSubtle(isDark)}`,
                }}
              >
                <h3 className="font-bold" style={{ color: textPrimary(isDark) }}>
                  New letter
                </h3>
                <select
                  value={letterForm.type}
                  onChange={(e) =>
                    setLetterForm((f) => ({
                      ...f,
                      type: e.target.value as typeof f.type,
                    }))
                  }
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: surfaceItem(isDark),
                    color: textPrimary(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  <option value="GENERAL">General</option>
                  <option value="ADMIN">Administrative</option>
                  <option value="EXCUSE">Excuse / leave</option>
                </select>
                <select
                  value={letterForm.toUserId}
                  onChange={(e) =>
                    setLetterForm((f) => ({ ...f, toUserId: e.target.value }))
                  }
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: surfaceItem(isDark),
                    color: textPrimary(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  <option value="">To…</option>
                  {team.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
                <input
                  value={letterForm.subject}
                  onChange={(e) =>
                    setLetterForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="Subject"
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{
                    background: surfaceItem(isDark),
                    color: textPrimary(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                />
                <textarea
                  value={letterForm.body}
                  onChange={(e) =>
                    setLetterForm((f) => ({ ...f, body: e.target.value }))
                  }
                  rows={6}
                  placeholder="Body"
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                  style={{
                    background: surfaceItem(isDark),
                    color: textPrimary(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setComposeLetter(false)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ color: textSecondary(isDark) }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void sendLetter()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: ACCENT.letter }}
                  >
                    Send letter
                  </button>
                </div>
              </div>
            ) : activeLetter ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <div
                  className="rounded-2xl p-5 space-y-3"
                  style={{
                    background: panelFill(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                    style={{
                      background: hexToRgba(ACCENT.letter, 0.2),
                      color: ACCENT.letter,
                    }}
                  >
                    {activeLetter.type}
                  </span>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: textPrimary(isDark) }}
                  >
                    {activeLetter.subject}
                  </h2>
                  <p className="text-xs" style={{ color: textMuted(isDark) }}>
                    {activeLetter.from.name} → {activeLetter.to.name} ·{' '}
                    {new Date(activeLetter.createdAt).toLocaleString()}
                  </p>
                  <p
                    className="text-sm whitespace-pre-wrap leading-relaxed"
                    style={{ color: textSecondary(isDark) }}
                  >
                    {activeLetter.body}
                  </p>
                </div>
                {activeLetter.replies.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl p-4 ml-4"
                    style={{
                      background: hexToRgba(ACCENT.letter, 0.08),
                      border: `1px solid ${borderSubtle(isDark)}`,
                    }}
                  >
                    <p className="text-xs font-bold" style={{ color: textPrimary(isDark) }}>
                      {r.from.name}
                    </p>
                    <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
                      {r.body}
                    </p>
                  </div>
                ))}
                <div className="space-y-2">
                  <textarea
                    value={replyLetterBody}
                    onChange={(e) => setReplyLetterBody(e.target.value)}
                    rows={3}
                    placeholder="Reply to this letter…"
                    className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                    style={{
                      background: surfaceItem(isDark),
                      color: textPrimary(isDark),
                      border: `1px solid ${borderSubtle(isDark)}`,
                    }}
                  />
                  <button
                    type="button"
                    disabled={busy || !replyLetterBody.trim()}
                    onClick={() => void replyLetter()}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40"
                    style={{ background: ACCENT.letter }}
                  >
                    Send reply
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="text-sm text-center py-20"
                style={{ color: textMuted(isDark) }}
              >
                Select a letter or compose a new one
              </p>
            )}
          </div>
        )}

        {tab === 'saved' && (
          <div
            className="flex-1 flex items-center justify-center text-sm"
            style={{ color: textMuted(isDark) }}
          >
            Open a saved message from the left list
          </div>
        )}
      </section>

      {/* Create channel dialog */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setCreateOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-3"
            style={glass}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold" style={{ color: textPrimary(isDark) }}>
              {tx('chat.newChannel')}
            </h3>
            <input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder={tx('chat.channelName')}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                background: surfaceItem(isDark),
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textPrimary(isDark),
              }}
            />
            <p className="text-xs" style={{ color: textMuted(isDark) }}>
              Members (optional — empty = everyone)
            </p>
            <ul className="max-h-40 overflow-auto space-y-1">
              {team.map((t) => {
                const on = channelMembers.includes(t.id);
                return (
                  <li key={t.id}>
                    <label
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer"
                      style={{ background: on ? hexToRgba(ACCENT.channel, 0.15) : undefined }}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setChannelMembers((prev) =>
                            on ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                          )
                        }
                      />
                      <span style={{ color: textPrimary(isDark) }}>{t.name}</span>
                      <span style={{ color: textMuted(isDark) }}>{t.role}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ color: textSecondary(isDark) }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || channelName.trim().length < 1}
                onClick={() => void createChannel()}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: ACCENT.channel }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {activeRoom && (
        <MeetingOverlay
          open={meetingOpen}
          onClose={() => setMeetingOpen(false)}
          isDark={isDark}
          workspaceId={workspaceId}
          chatRoomId={activeRoom.id}
          roomTitle={activeRoom.title}
          socket={socketLive}
          self={{
            id: myId,
            name: myName,
            avatarUrl: (session?.user as { image?: string | null } | undefined)?.image || null,
          }}
          allowed={meetingAllowed}
          upgradeHint={meetingUpgradeHint}
        />
      )}
    </div>
  );
}
