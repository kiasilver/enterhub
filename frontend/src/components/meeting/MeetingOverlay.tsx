'use client';

import { useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  MdCallEnd,
  MdClose,
  MdContentCopy,
  MdGridView,
  MdMic,
  MdMicOff,
  MdMonitor,
  MdPeople,
  MdScreenShare,
  MdStopScreenShare,
  MdVideocam,
  MdVideocamOff,
  MdWorkspacePremium,
} from 'react-icons/md';
import Link from 'next/link';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  hexToRgba,
  canvasBg,
} from '@/components/SafeDashboard/theme';
import { meetingRoomId, type ScreenShareQuality } from '@/lib/meeting-access';
import { useMeeting } from '@/components/meeting/useMeeting';

function VideoTile({
  stream,
  muted,
  label,
  isDark,
  mirror,
  large,
  badge,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  isDark: boolean;
  mirror?: boolean;
  large?: boolean;
  badge?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${large ? 'min-h-[280px] h-full' : 'aspect-video'}`}
      style={{
        background: isDark ? '#0B1220' : '#E5E7EB',
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      {stream ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
            style={{
              background: surfaceItem(isDark),
              color: textPrimary(isDark),
            }}
          >
            {label.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
        <span
          className="text-[11px] font-semibold px-2 py-1 rounded-lg truncate"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
          }}
        >
          {label}
        </span>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-lg"
            style={{ background: 'rgba(37,99,235,0.85)', color: '#fff' }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  isDark: boolean;
  workspaceId: string;
  chatRoomId: string;
  roomTitle: string;
  socket: Socket | null;
  self: { id: string; name: string; avatarUrl: string | null };
  allowed: boolean | null;
  upgradeHint: string | null;
};

export function MeetingOverlay({
  open,
  onClose,
  isDark,
  workspaceId,
  chatRoomId,
  roomTitle,
  socket,
  self,
  allowed,
  upgradeHint,
}: Props) {
  const meetingId = meetingRoomId(workspaceId, chatRoomId);
  const meet = useMeeting({
    socket,
    meetingId,
    self,
    enabled: open && !!allowed,
  });
  const [showPeople, setShowPeople] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lobbyReady, setLobbyReady] = useState(false);
  const [lobbyMic, setLobbyMic] = useState(true);
  const [lobbyCam, setLobbyCam] = useState(false);
  const [layout, setLayout] = useState<'spotlight' | 'grid'>('spotlight');

  useEffect(() => {
    if (!open) {
      meet.leave();
      setLobbyReady(false);
      setShowPeople(false);
      setLobbyMic(true);
      setLobbyCam(false);
      setLayout('spotlight');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const copyLink = async () => {
    const url = `${window.location.origin}/workspace/${workspaceId}/chat?room=${chatRoomId}&meet=1`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const leaveAll = () => {
    meet.leave();
    onClose();
  };

  // Upgrade gate
  if (allowed === false) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          aria-label="Close"
          onClick={onClose}
        />
        <div
          className="relative w-full max-w-md rounded-3xl p-8 space-y-5 shadow-2xl"
          style={{
            background: isDark ? '#131B2B' : '#fff',
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: hexToRgba('#2563EB', 0.2), color: '#60A5FA' }}
            >
              <MdWorkspacePremium size={26} />
            </span>
            <div>
              <h2 className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>
                HD Meetings
              </h2>
              <p className="text-sm" style={{ color: textMuted(isDark) }}>
                Professional plan feature
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: textSecondary(isDark) }}>
            {upgradeHint ||
              'Start Google Meet–style calls with screen share at 720p / 1080p on Base and Advanced plans.'}
          </p>
          <ul className="space-y-2 text-sm" style={{ color: textSecondary(isDark) }}>
            {[
              'Audio & video (camera off by default)',
              'Screen share · 720p & 1080p',
              'Noise suppression & echo cancellation',
              'Invite from any chat room',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Link
              href={`/workspace/${workspaceId}/settings?tab=billing`}
              className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#2563EB' }}
            >
              Upgrade plan
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textSecondary(isDark),
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (allowed === null) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
        <p className="text-sm text-white">Checking meeting access…</p>
      </div>
    );
  }

  // Lobby
  if (!meet.joined) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          aria-label="Close"
          onClick={onClose}
        />
        <div
          className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: isDark ? '#0F172A' : '#fff',
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderColor: borderSubtle(isDark) }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
                Ready to join
              </p>
              <h2 className="text-base font-bold" style={{ color: textPrimary(isDark) }}>
                {roomTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl"
              style={{ color: textMuted(isDark) }}
            >
              <MdClose size={20} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div
              className="relative aspect-video rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: isDark ? '#0B1220' : '#F3F4F6' }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: surfaceItem(isDark), color: textPrimary(isDark) }}
              >
                {self.name.slice(0, 2).toUpperCase()}
              </div>
              <span
                className="absolute bottom-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              >
                {lobbyCam ? 'Camera will start on join' : 'Camera off by default'}
                {lobbyMic ? '' : ' · Mic muted'}
              </span>
            </div>

            {meet.error && (
              <p className="text-sm text-red-400">{meet.error}</p>
            )}

            <div className="flex items-center justify-center gap-3">
              <LobbyBtn
                active={lobbyMic}
                label={lobbyMic ? 'Mic on' : 'Mic off'}
                onClick={() => setLobbyMic((v) => !v)}
                icon={lobbyMic ? <MdMic size={22} /> : <MdMicOff size={22} />}
                isDark={isDark}
              />
              <LobbyBtn
                active={lobbyCam}
                label={lobbyCam ? 'Cam on' : 'Cam off'}
                onClick={() => setLobbyCam((v) => !v)}
                icon={lobbyCam ? <MdVideocam size={22} /> : <MdVideocamOff size={22} />}
                isDark={isDark}
              />
            </div>

            <p className="text-center text-xs" style={{ color: textMuted(isDark) }}>
              Camera stays off by default. Screen share supports 720p and 1080p on professional plans.
            </p>

            <button
              type="button"
              disabled={lobbyReady}
              onClick={async () => {
                setLobbyReady(true);
                try {
                  await meet.join({ audio: lobbyMic, video: lobbyCam });
                } finally {
                  setLobbyReady(false);
                }
              }}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
            >
              {lobbyReady ? 'Joining…' : 'Join meeting'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // In-call
  const peerCount = meet.peers.length + 1;
  const stageStream = meet.screenStream || (meet.videoOn ? meet.localStream : null);
  const stageLabel = meet.sharing ? `${self.name} · Screen` : `${self.name} (You)`;
  const remoteList = meet.peers.map((p) => ({
    id: p.socketId,
    stream: meet.remoteStreams[p.socketId] || null,
    label: p.name,
    badge: p.screen ? 'Sharing' : undefined,
  }));

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col"
      style={{ background: canvasBg(isDark) }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b shrink-0"
        style={{ borderColor: borderSubtle(isDark), background: isDark ? '#0B1220' : '#fff' }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
            Enterhub Meet · HD
          </p>
          <h1 className="text-sm font-bold truncate" style={{ color: textPrimary(isDark) }}>
            {roomTitle}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
            }}
          >
            <MdContentCopy size={14} />
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <span
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: surfaceItem(isDark), color: textMuted(isDark) }}
          >
            <MdPeople size={14} />
            {peerCount}
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 p-3 sm:p-5 flex flex-col gap-3">
          {layout === 'spotlight' ? (
            <>
              <div className="flex-1 min-h-0">
                <VideoTile
                  stream={stageStream}
                  muted
                  label={stageLabel}
                  isDark={isDark}
                  mirror={!meet.sharing && meet.videoOn}
                  large
                  badge={meet.sharing ? meet.quality : undefined}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 shrink-0 max-h-[28vh] overflow-y-auto thin-scrollbar">
                <VideoTile
                  stream={meet.videoOn ? meet.localStream : null}
                  muted
                  label={`${self.name} (You)`}
                  isDark={isDark}
                  mirror
                />
                {remoteList.map((p) => (
                  <VideoTile
                    key={p.id}
                    stream={p.stream}
                    label={p.label}
                    isDark={isDark}
                    badge={p.badge}
                  />
                ))}
              </div>
            </>
          ) : (
            <div
              className={`flex-1 min-h-0 grid gap-2 ${
                peerCount <= 1
                  ? 'grid-cols-1'
                  : peerCount <= 4
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-2 lg:grid-cols-3'
              }`}
            >
              <VideoTile
                stream={meet.sharing ? meet.screenStream : meet.videoOn ? meet.localStream : null}
                muted
                label={stageLabel}
                isDark={isDark}
                mirror={!meet.sharing && meet.videoOn}
                large
                badge={meet.sharing ? meet.quality : undefined}
              />
              {remoteList.map((p) => (
                <VideoTile
                  key={p.id}
                  stream={p.stream}
                  label={p.label}
                  isDark={isDark}
                  large
                  badge={p.badge}
                />
              ))}
            </div>
          )}
        </div>

        {showPeople && (
          <aside
            className="w-72 shrink-0 border-l p-4 space-y-3 overflow-y-auto thin-scrollbar hidden md:block"
            style={{ borderColor: borderSubtle(isDark), background: isDark ? '#0B1220' : '#F9FAFB' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold" style={{ color: textPrimary(isDark) }}>
                People ({peerCount})
              </h3>
              <button type="button" onClick={() => setShowPeople(false)} style={{ color: textMuted(isDark) }}>
                <MdClose size={18} />
              </button>
            </div>
            <PeopleRow name={`${self.name} (You)`} mic={meet.audioOn} cam={meet.videoOn} isDark={isDark} />
            {meet.peers.map((p) => (
              <PeopleRow
                key={p.socketId}
                name={p.name}
                mic={p.audio !== false}
                cam={!!p.video}
                isDark={isDark}
              />
            ))}
          </aside>
        )}
      </div>

      {/* Control bar */}
      <footer
        className="shrink-0 px-4 py-4 border-t"
        style={{ borderColor: borderSubtle(isDark), background: isDark ? '#0B1220' : '#fff' }}
      >
        {meet.error && (
          <p className="text-center text-xs text-red-400 mb-2">{meet.error}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Ctrl
            onClick={() => void meet.toggleAudio()}
            active={meet.audioOn}
            danger={!meet.audioOn}
            label={meet.audioOn ? 'Mute' : 'Unmute'}
            isDark={isDark}
          >
            {meet.audioOn ? <MdMic size={22} /> : <MdMicOff size={22} />}
          </Ctrl>
          <Ctrl
            onClick={() => void meet.toggleVideo()}
            active={meet.videoOn}
            danger={!meet.videoOn}
            label={meet.videoOn ? 'Stop video' : 'Start video'}
            isDark={isDark}
          >
            {meet.videoOn ? <MdVideocam size={22} /> : <MdVideocamOff size={22} />}
          </Ctrl>
          <Ctrl
            onClick={() =>
              meet.sharing ? meet.stopScreenShare() : void meet.startScreenShare(meet.quality)
            }
            active={meet.sharing}
            label={meet.sharing ? 'Stop share' : 'Share screen'}
            isDark={isDark}
          >
            {meet.sharing ? <MdStopScreenShare size={22} /> : <MdScreenShare size={22} />}
          </Ctrl>

          <div
            className="inline-flex items-center gap-1 p-1 rounded-2xl"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
            title="Screen share quality"
          >
            <MdMonitor size={16} style={{ color: textMuted(isDark), marginLeft: 6 }} />
            {(['720p', '1080p'] as ScreenShareQuality[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void meet.changeQuality(q)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold"
                style={{
                  background: meet.quality === q ? '#2563EB' : 'transparent',
                  color: meet.quality === q ? '#fff' : textSecondary(isDark),
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <Ctrl
            onClick={() => setShowPeople((v) => !v)}
            active={showPeople}
            label="People"
            isDark={isDark}
          >
            <MdPeople size={22} />
          </Ctrl>
          <Ctrl
            onClick={() => setLayout((v) => (v === 'spotlight' ? 'grid' : 'spotlight'))}
            active={layout === 'grid'}
            label={layout === 'grid' ? 'Grid view' : 'Spotlight'}
            isDark={isDark}
          >
            <MdGridView size={22} />
          </Ctrl>

          <button
            type="button"
            onClick={leaveAll}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white ml-1 sm:ml-3"
            style={{ background: '#DC2626' }}
            aria-label="Leave call"
          >
            <MdCallEnd size={20} />
            Leave
          </button>
        </div>
      </footer>
    </div>
  );
}

function LobbyBtn({
  active,
  label,
  onClick,
  icon,
  isDark,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5"
      aria-label={label}
    >
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: active ? surfaceItem(isDark) : 'rgba(239,68,68,0.2)',
          color: active ? textPrimary(isDark) : '#F87171',
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
      >
        {icon}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: textMuted(isDark) }}>
        {label}
      </span>
    </button>
  );
}

function Ctrl({
  children,
  onClick,
  active,
  danger,
  label,
  isDark,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  label: string;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-105"
      style={{
        background: danger
          ? 'rgba(239,68,68,0.25)'
          : active
            ? surfaceItem(isDark)
            : isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(0,0,0,0.06)',
        color: danger ? '#FCA5A5' : textPrimary(isDark),
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      {children}
    </button>
  );
}

function PeopleRow({
  name,
  mic,
  cam,
  isDark,
}: {
  name: string;
  mic: boolean;
  cam: boolean;
  isDark: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: surfaceItem(isDark) }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: isDark ? '#1E293B' : '#E5E7EB', color: textPrimary(isDark) }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold truncate" style={{ color: textPrimary(isDark) }}>
          {name}
        </p>
        <p className="text-[10px]" style={{ color: textMuted(isDark) }}>
          {mic ? 'Mic on' : 'Muted'} · {cam ? 'Cam on' : 'Cam off'}
        </p>
      </div>
    </div>
  );
}
