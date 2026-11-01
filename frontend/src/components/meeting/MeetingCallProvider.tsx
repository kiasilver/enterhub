'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import { MdCall, MdCallEnd } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { usePresence } from '@/hooks/usePresence';
import { glassStyle, hexToRgba, textMuted, textPrimary } from '@/components/SafeDashboard/theme';
import { groupMeetingId, pairMeetingId } from '@/lib/meeting-pair';
import { useMeeting } from '@/components/meeting/useMeeting';
import { MeetingStage } from '@/components/meeting/MeetingStage';

export type CallPartner = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

export type CallKind = 'p2p' | 'group';

type Invite = {
  meetingId: string;
  from: CallPartner;
  kind: CallKind;
  title: string | null;
  roomId: string | null;
};

type MeetingCallContextValue = {
  inCall: boolean;
  kind: CallKind;
  partner: CallPartner | null;
  groupTitle: string | null;
  roomId: string | null;
  declined: boolean;
  startCall: (partner: CallPartner, opts?: { incoming?: boolean; meetingId?: string }) => void;
  startGroupCall: (opts: {
    title: string;
    userIds: string[];
    roomId?: string | null;
    meetingId?: string;
    incoming?: boolean;
  }) => void;
  endCall: () => void;
  stage: ReactNode;
};

const MeetingCallContext = createContext<MeetingCallContextValue | null>(null);

export function useMeetingCall() {
  const ctx = useContext(MeetingCallContext);
  if (!ctx) {
    return {
      inCall: false,
      kind: 'p2p' as const,
      partner: null,
      groupTitle: null,
      roomId: null,
      declined: false,
      startCall: () => undefined,
      startGroupCall: () => undefined,
      endCall: () => undefined,
      stage: null,
    } satisfies MeetingCallContextValue;
  }
  return ctx;
}

export function MeetingCallProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const { setPresence } = usePresence();
  const router = useRouter();
  const isDark = theme === 'dark';
  const myId = session?.user?.id || '';
  const myName = session?.user?.name || session?.user?.email || t('meetingPage.you');
  const myAvatar = (session?.user as { image?: string | null } | undefined)?.image || null;

  const [kind, setKind] = useState<CallKind>('p2p');
  const [partner, setPartner] = useState<CallPartner | null>(null);
  const [groupTitle, setGroupTitle] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [activeMeetingId, setActiveMeetingId] = useState('');
  const [inCall, setInCall] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const joiningRef = useRef(false);
  const meetingIdRef = useRef('');
  const kindRef = useRef<CallKind>('p2p');

  const self = useMemo(
    () => ({ id: myId, name: myName, avatarUrl: myAvatar }),
    [myId, myName, myAvatar],
  );

  const meetingId = inCall ? activeMeetingId : '';
  meetingIdRef.current = meetingId;
  kindRef.current = kind;
  const meeting = useMeeting({
    socket,
    meetingId: meetingId || 'idle',
    self,
    enabled: inCall && !!meetingId,
  });

  useEffect(() => {
    if (!myId) return;
    const s = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = s;
    setSocket(s);
    s.emit('workspace:join', { workspaceId });
    s.on(
      'meeting:invite',
      (p: {
        meetingId?: string;
        toUserId?: string;
        toUserIds?: string[];
        kind?: CallKind;
        title?: string | null;
        roomId?: string | null;
        from?: CallPartner;
      }) => {
        if (!p.meetingId || !p.from?.id) return;
        if (p.from.id === myId) return;
        const targets = p.toUserIds?.length
          ? p.toUserIds
          : p.toUserId
            ? [p.toUserId]
            : [];
        if (!targets.includes(myId)) return;
        setInvite({
          meetingId: p.meetingId,
          from: p.from,
          kind: p.kind === 'group' || p.meetingId.startsWith('grp_') ? 'group' : 'p2p',
          title: p.title || null,
          roomId: p.roomId || null,
        });
      },
    );
    s.on('meeting:invite-cancel', (p: { meetingId?: string }) => {
      setInvite((cur) => (cur && cur.meetingId === p.meetingId ? null : cur));
    });
    s.on('meeting:invite-decline', (p: { meetingId?: string }) => {
      if (p.meetingId && p.meetingId === meetingIdRef.current && kindRef.current === 'p2p') {
        setDeclined(true);
      }
    });
    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [workspaceId, myId]);

  const joinCall = meeting.join;
  const joined = meeting.joined;

  useEffect(() => {
    if (!inCall || !meetingId || joined || joiningRef.current) return;
    joiningRef.current = true;
    // Audio-first — camera on demand (faster accept, fewer permission blocks)
    void joinCall({ audio: true, video: false }).finally(() => {
      joiningRef.current = false;
    });
  }, [inCall, meetingId, joined, joinCall]);

  useEffect(() => {
    if (inCall) void setPresence('meeting');
    return () => {
      if (inCall) void setPresence('available');
    };
  }, [inCall, setPresence]);

  const startCall = useCallback(
    (next: CallPartner, opts?: { incoming?: boolean; meetingId?: string }) => {
      if (!next.id || !myId || !socket || inCall) return;
      const id = opts?.meetingId || pairMeetingId(myId, next.id);
      setDeclined(false);
      setKind('p2p');
      setPartner(next);
      setGroupTitle(null);
      setRoomId(null);
      setActiveMeetingId(id);
      setInCall(true);
      if (!opts?.incoming) {
        socket.emit('meeting:invite', {
          workspaceId,
          toUserId: next.id,
          toUserIds: [next.id],
          meetingId: id,
          kind: 'p2p',
          from: { id: myId, name: myName, avatarUrl: myAvatar },
        });
      }
    },
    [myId, socket, inCall, workspaceId, myName, myAvatar],
  );

  const startGroupCall = useCallback(
    (opts: {
      title: string;
      userIds: string[];
      roomId?: string | null;
      meetingId?: string;
      incoming?: boolean;
    }) => {
      if (!myId || !socket || inCall) return;
      const others = [...new Set(opts.userIds.filter((id) => id && id !== myId))];
      if (!opts.incoming && others.length < 1) return;
      const id = opts.meetingId || groupMeetingId(opts.roomId || myId);
      setDeclined(false);
      setKind('group');
      setPartner(null);
      setGroupTitle(opts.title);
      setRoomId(opts.roomId || null);
      setActiveMeetingId(id);
      setInCall(true);
      if (!opts.incoming) {
        socket.emit('meeting:invite', {
          workspaceId,
          toUserIds: others,
          meetingId: id,
          kind: 'group',
          title: opts.title,
          roomId: opts.roomId || null,
          from: { id: myId, name: myName, avatarUrl: myAvatar },
        });
      }
    },
    [myId, socket, inCall, workspaceId, myName, myAvatar],
  );

  const endCall = useCallback(() => {
    if (socket && meetingId) {
      socket.emit('meeting:invite-cancel', {
        workspaceId,
        meetingId,
      });
    }
    meeting.leave();
    setInCall(false);
    setPartner(null);
    setGroupTitle(null);
    setRoomId(null);
    setActiveMeetingId('');
    setKind('p2p');
    void setPresence('available');
  }, [socket, workspaceId, meetingId, meeting, setPresence]);

  const remotePeer = meeting.peers[0] || null;
  const remoteStream = remotePeer ? meeting.remoteStreams[remotePeer.socketId] || null : null;
  const remoteScreenStream = remotePeer
    ? meeting.remoteScreenStreams[remotePeer.socketId] || null
    : null;
  const remoteTiles = meeting.peers.map((peer) => ({
    peer,
    stream: meeting.remoteStreams[peer.socketId] || null,
    screenStream: meeting.remoteScreenStreams[peer.socketId] || null,
  }));
  const waiting =
    inCall && meeting.joined && (kind === 'group' ? meeting.peers.length === 0 : !remotePeer);

  const stage =
    inCall && (kind === 'group' || partner) ? (
      <MeetingStage
        isDark={isDark}
        accent={primaryColor}
        selfName={myName}
        partnerName={
          kind === 'group'
            ? groupTitle || t('meetingPage.groupMeeting')
            : partner?.name || ''
        }
        partnerAvatar={partner?.avatarUrl || null}
        localStream={meeting.localStream}
        screenStream={meeting.screenStream}
        remoteStream={remoteStream}
        remoteScreenStream={remoteScreenStream}
        remotePeer={remotePeer}
        remoteTiles={remoteTiles}
        mode={kind}
        audioOn={meeting.audioOn}
        videoOn={meeting.videoOn}
        sharing={meeting.sharing}
        waiting={waiting}
        onToggleAudio={() => void meeting.toggleAudio()}
        onToggleVideo={() => void meeting.toggleVideo()}
        onToggleShare={() =>
          meeting.sharing ? meeting.stopScreenShare() : void meeting.startScreenShare()
        }
        onEnd={endCall}
      />
    ) : null;

  const value = useMemo(
    () => ({
      inCall,
      kind,
      partner,
      groupTitle,
      roomId,
      declined,
      startCall,
      startGroupCall,
      endCall,
      stage,
    }),
    [
      inCall,
      kind,
      partner,
      groupTitle,
      roomId,
      declined,
      startCall,
      startGroupCall,
      endCall,
      stage,
    ],
  );

  return (
    <MeetingCallContext.Provider value={value}>
      {children}
      {invite && !inCall && (
        <div className="fixed z-[90] bottom-5 start-5 end-5 sm:end-auto sm:w-[360px]">
          <div className="rounded-3xl p-4 shadow-2xl" style={glassStyle(isDark)}>
            <p className="text-[11px] font-bold tracking-wider mb-2" style={{ color: primaryColor }}>
              {t('meetingPage.incoming')}
            </p>
            <div className="flex items-center gap-3">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
                style={{ background: hexToRgba(primaryColor, 0.85) }}
              >
                {invite.from.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={invite.from.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  invite.from.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate" style={{ color: textPrimary(isDark) }}>
                  {invite.kind === 'group'
                    ? invite.title || t('meetingPage.groupMeeting')
                    : invite.from.name}
                </p>
                <p className="text-xs" style={{ color: textMuted(isDark) }}>
                  {invite.kind === 'group'
                    ? `${invite.from.name} · ${t('meetingPage.incomingGroup')}`
                    : t('meetingPage.incomingFrom')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  socketRef.current?.emit('meeting:invite-decline', {
                    workspaceId,
                    meetingId: invite.meetingId,
                    fromUserId: myId,
                  });
                  setInvite(null);
                }}
                className="flex-1 min-h-[44px] rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-bold text-white"
                style={{ background: '#DC2626' }}
              >
                <MdCallEnd size={18} />
                {t('meetingPage.decline')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const incoming = invite;
                  setInvite(null);
                  if (incoming.kind === 'group') {
                    startGroupCall({
                      title: incoming.title || t('meetingPage.groupMeeting'),
                      userIds: [],
                      roomId: incoming.roomId,
                      meetingId: incoming.meetingId,
                      incoming: true,
                    });
                    // Soft navigate — do not tear meeting socket mid-join
                    if (incoming.roomId) {
                      router.push(`/workspace/${workspaceId}/chat?room=${incoming.roomId}`);
                    }
                    return;
                  }
                  startCall(incoming.from, {
                    incoming: true,
                    meetingId: incoming.meetingId,
                  });
                  router.push(`/workspace/${workspaceId}/chat?meet=${incoming.from.id}`);
                }}
                className="flex-1 min-h-[44px] rounded-xl inline-flex items-center justify-center gap-1.5 text-sm font-bold text-white"
                style={{ background: primaryColor }}
              >
                <MdCall size={18} />
                {t('meetingPage.accept')}
              </button>
            </div>
          </div>
        </div>
      )}
    </MeetingCallContext.Provider>
  );
}
