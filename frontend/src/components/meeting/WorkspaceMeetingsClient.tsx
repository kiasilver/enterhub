'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { io, type Socket } from 'socket.io-client';
import { MdSearch, MdVideocam } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { usePresence } from '@/hooks/usePresence';
import {
  borderSubtle,
  canvasBg,
  hexToRgba,
  searchFieldBg,
  selectedFill,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';
import { pairMeetingId } from '@/lib/meeting-pair';
import { useMeeting } from '@/components/meeting/useMeeting';
import { MeetingStage } from '@/components/meeting/MeetingStage';
import type { Presence } from '@/components/chat/chat-types';
import { isPresenceStatus, toChatPresence } from '@/lib/presence';

type Person = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  presence: Presence;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(
  name: string,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const key = `rolesPage.roleNames.${name}`;
  const translated = t(key);
  return translated === key ? name : translated;
}

export function WorkspaceMeetingsClient({ workspaceId }: { workspaceId: string }) {
  const { theme, primaryColor } = useTheme();
  const { t, lang } = useLang();
  const { data: session } = useSession();
  const { setPresence, liveMap } = usePresence();
  const router = useRouter();
  const params = useSearchParams();
  const isDark = theme === 'dark';
  const myId = session?.user?.id || '';
  const myName = session?.user?.name || session?.user?.email || t('meetingPage.you');
  const myAvatar = (session?.user as { image?: string | null } | undefined)?.image || null;

  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState('');
  const [partnerId, setPartnerId] = useState<string | null>(params.get('with'));
  const [inCall, setInCall] = useState(false);
  const [declined, setDeclined] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const self = useMemo(
    () => ({ id: myId, name: myName, avatarUrl: myAvatar }),
    [myId, myName, myAvatar],
  );

  const partner =
    people.find((p) => p.id === partnerId) ||
    (partnerId
      ? {
          id: partnerId,
          name: t('meetingPage.connecting'),
          email: '',
          avatarUrl: null,
          role: '',
          presence: 'offline' as Presence,
        }
      : null);
  const meetingId = myId && partnerId ? pairMeetingId(myId, partnerId) : '';

  const meeting = useMeeting({
    socket,
    meetingId: meetingId || 'idle',
    self,
    enabled: inCall && !!meetingId,
  });

  useEffect(() => {
    void fetch(`/api/workspaces/${workspaceId}/chat/team`)
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setPeople(j.data);
      })
      .catch(() => undefined);
  }, [workspaceId]);

  useEffect(() => {
    const s = io({ path: '/socket.io' });
    socketRef.current = s;
    setSocket(s);
    s.emit('workspace:join', { workspaceId });
    s.on('meeting:invite-decline', (p: { meetingId?: string }) => {
      if (p.meetingId && p.meetingId === meetingId) setDeclined(true);
    });
    s.on('meeting:invite-cancel', () => undefined);
    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [workspaceId, meetingId]);

  useEffect(() => {
    const withId = params.get('with');
    if (withId) setPartnerId(withId);
    if (params.get('join') === '1' && withId && myId && !inCall) {
      setInCall(true);
    }
  }, [params, myId, inCall]);

  const joinCall = meeting.join;
  const joined = meeting.joined;
  const meetingEnabled = meeting.enabled;

  useEffect(() => {
    if (!inCall || !meetingEnabled || joined) return;
    void joinCall({ audio: true, video: false });
  }, [inCall, meetingEnabled, joined, joinCall]);

  useEffect(() => {
    if (inCall) void setPresence('meeting');
    return () => {
      if (inCall) void setPresence('available');
    };
  }, [inCall, setPresence]);

  const startCall = useCallback(() => {
    if (!partner || !myId || !socket) return;
    setDeclined(false);
    setInCall(true);
    socket.emit('meeting:invite', {
      workspaceId,
      toUserId: partner.id,
      meetingId: pairMeetingId(myId, partner.id),
      from: { id: myId, name: myName, avatarUrl: myAvatar },
    });
    router.replace(`/workspace/${workspaceId}/meetings?with=${partner.id}`);
  }, [partner, myId, socket, workspaceId, myName, myAvatar, router]);

  const endCall = useCallback(() => {
    if (partner && socket) {
      socket.emit('meeting:invite-cancel', {
        workspaceId,
        toUserId: partner.id,
        meetingId,
      });
    }
    meeting.leave();
    setInCall(false);
    void setPresence('available');
  }, [partner, socket, workspaceId, meetingId, meeting, setPresence]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      if (p.id === myId) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
      );
    });
  }, [people, query, myId]);

  const remotePeer = meeting.peers[0] || null;
  const remoteStream = remotePeer ? meeting.remoteStreams[remotePeer.socketId] || null : null;
  const waiting = inCall && meeting.joined && !remotePeer;

  const errorText =
    meeting.error === 'MEETING_FULL' ? t('meetingPage.full') : meeting.error;

  return (
    <div
      className="h-full min-h-0 w-full flex-1 flex overflow-hidden"
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      style={{ background: canvasBg(isDark) }}
    >
      <aside
        className={`w-full sm:w-[320px] lg:w-[340px] flex flex-col border-e shrink-0 min-h-0 ${
          inCall ? 'hidden sm:flex' : 'flex'
        }`}
        style={{ borderColor: borderSubtle(isDark), background: isDark ? 'var(--background)' : '#F8F8FA' }}
      >
        <div className="p-4 space-y-3.5">
          <div>
            <p className="text-[11px] font-bold tracking-wider" style={{ color: primaryColor }}>
              {t('meetingPage.eyebrow')}
            </p>
            <h1 className="text-lg font-bold mt-0.5" style={{ color: textPrimary(isDark) }}>
              {t('meetingPage.title')}
            </h1>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: textMuted(isDark) }}>
              {t('meetingPage.subtitle')}
            </p>
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
              placeholder={t('meetingPage.search')}
              className={`w-full rounded-xl py-2.5 text-xs outline-none ${lang === 'fa' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
              style={{
                background: searchFieldBg(isDark),
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textPrimary(isDark),
              }}
            />
          </div>
        </div>
        <ul className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-3 pb-4 space-y-1.5">
          {filtered.map((p) => {
            const on = p.id === partnerId;
            const live = liveMap[p.id];
            const presence = live
              ? toChatPresence(isPresenceStatus(live) ? live : 'available')
              : p.presence;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (inCall) return;
                    setPartnerId(p.id);
                    setDeclined(false);
                    router.replace(`/workspace/${workspaceId}/meetings?with=${p.id}`);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-start"
                  style={{
                    background: on ? selectedFill(isDark) : 'transparent',
                    border: `1px solid ${on ? borderSubtle(isDark) : 'transparent'}`,
                  }}
                >
                  <span className="relative">
                    <span
                      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: hexToRgba(primaryColor, 0.85) }}
                    >
                      {p.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials(p.name)
                      )}
                    </span>
                    <span
                      className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full"
                      style={{
                        background:
                          presence === 'online'
                            ? '#22c55e'
                            : presence === 'dnd'
                              ? '#f59e0b'
                              : '#94a3b8',
                        boxShadow: `0 0 0 2px ${isDark ? '#0F172A' : '#F8F8FA'}`,
                      }}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                      {p.name}
                    </span>
                    <span className="block text-[11px] truncate" style={{ color: textMuted(isDark) }}>
                      {roleLabel(p.role, t)}
                    </span>
                  </span>
                  <MdVideocam size={18} style={{ color: on ? primaryColor : textMuted(isDark) }} />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex-1 min-w-0 min-h-0 flex flex-col">
        {inCall && partner ? (
          <MeetingStage
            isDark={isDark}
            accent={primaryColor}
            selfName={myName}
            partnerName={partner.name}
            partnerAvatar={partner.avatarUrl}
            localStream={meeting.localStream}
            screenStream={meeting.screenStream}
            remoteStream={remoteStream}
            remoteScreenStream={
              remotePeer ? meeting.remoteScreenStreams[remotePeer.socketId] || null : null
            }
            remotePeer={remotePeer}
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
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-5">
              <span
                className="inline-flex w-16 h-16 rounded-2xl items-center justify-center"
                style={{ background: hexToRgba(primaryColor, 0.14), color: primaryColor }}
              >
                <MdVideocam size={30} />
              </span>
              <div>
                <h2 className="text-xl font-bold" style={{ color: textPrimary(isDark) }}>
                  {partner ? t('meetingPage.startWith', { name: partner.name }) : t('meetingPage.selectPerson')}
                </h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: textSecondary(isDark) }}>
                  {t('meetingPage.emptyHint')}
                </p>
              </div>
              {declined && (
                <p className="text-sm" style={{ color: '#DC2626' }}>
                  {t('meetingPage.declined')}
                </p>
              )}
              {errorText && (
                <p className="text-sm" style={{ color: '#DC2626' }}>
                  {errorText}
                </p>
              )}
              {partner && (
                <button
                  type="button"
                  onClick={startCall}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-2xl text-sm font-bold text-white"
                  style={{ background: primaryColor }}
                >
                  <MdVideocam size={20} />
                  {t('meetingPage.startWith', { name: partner.name })}
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
