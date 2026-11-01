'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MdCallEnd,
  MdMic,
  MdMicOff,
  MdScreenShare,
  MdStopScreenShare,
  MdVideocam,
  MdVideocamOff,
} from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  borderSubtle,
  hexToRgba,
  textMuted,
} from '@/components/SafeDashboard/theme';
import { formatCallClock } from '@/lib/meeting-pair';
import { MeetingVideo } from '@/components/meeting/MeetingVideo';
import type { MeetingPeerMeta } from '@/components/meeting/useMeeting';

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function DockButton({
  label,
  onClick,
  active,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="w-12 h-12 rounded-full inline-flex items-center justify-center transition-transform active:scale-95"
      style={{
        background: danger
          ? '#DC2626'
          : active
            ? '#fff'
            : 'rgba(255,255,255,0.1)',
        color: danger ? '#fff' : active ? '#0F172A' : '#fff',
        border: danger ? 'none' : '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {children}
    </button>
  );
}

function liveVideo(stream: MediaStream | null) {
  return !!stream?.getVideoTracks().some((tr) => tr.readyState === 'live' && tr.enabled);
}

function PeerTile({
  name,
  stream,
  avatar,
  accent,
  you,
  youLabel,
  mirror,
}: {
  name: string;
  stream: MediaStream | null;
  avatar?: string | null;
  accent: string;
  you?: boolean;
  youLabel: string;
  mirror?: boolean;
}) {
  return (
    <div
      className="relative min-h-0 rounded-2xl overflow-hidden"
      style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {stream ? (
        <MeetingVideo stream={stream} muted={!!you} mirror={!!mirror} />
      ) : (
        <div className="h-full w-full flex flex-col items-center justify-center gap-2">
          <span
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold text-white"
            style={{ background: hexToRgba(accent, 0.35), color: accent }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(name)
            )}
          </span>
          <p className="text-xs font-semibold text-white truncate px-2">{name}</p>
        </div>
      )}
      <span
        className="absolute bottom-1.5 start-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        {you ? youLabel : name}
      </span>
    </div>
  );
}

export type MeetingRemoteTile = {
  peer: MeetingPeerMeta;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
};

export function MeetingStage({
  isDark,
  accent,
  selfName,
  partnerName,
  partnerAvatar,
  localStream,
  screenStream,
  remoteStream,
  remoteScreenStream,
  remotePeer,
  remoteTiles,
  mode = 'p2p',
  audioOn,
  videoOn,
  sharing,
  waiting,
  onToggleAudio,
  onToggleVideo,
  onToggleShare,
  onEnd,
}: {
  isDark: boolean;
  accent: string;
  selfName: string;
  partnerName: string;
  partnerAvatar: string | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteScreenStream: MediaStream | null;
  remotePeer: MeetingPeerMeta | null;
  remoteTiles?: MeetingRemoteTile[];
  mode?: 'p2p' | 'group';
  audioOn: boolean;
  videoOn: boolean;
  sharing: boolean;
  waiting: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleShare: () => void;
  onEnd: () => void;
}) {
  const { t } = useLang();
  const [seconds, setSeconds] = useState(0);
  const connected =
    mode === 'group' ? (remoteTiles?.length || 0) > 0 : !!remotePeer;

  useEffect(() => {
    if (!connected) {
      setSeconds(0);
      return;
    }
    const id = window.setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [connected]);

  const remoteScreen = !!(remotePeer?.screen && (liveVideo(remoteScreenStream) || liveVideo(remoteStream)));
  const localScreen = sharing && liveVideo(screenStream);
  const remoteHasVideo = liveVideo(remoteStream);
  const localHasVideo = liveVideo(localStream);

  const main = useMemo(() => {
    if (mode === 'group') {
      const shareTile = (remoteTiles || []).find(
        (tile) =>
          tile.peer.screen && (liveVideo(tile.screenStream) || liveVideo(tile.stream)),
      );
      if (shareTile) {
        return {
          stream: liveVideo(shareTile.screenStream)
            ? shareTile.screenStream
            : shareTile.stream,
          contain: true,
          mirror: false,
        };
      }
      if (localScreen) {
        return { stream: screenStream, contain: true, mirror: false };
      }
      return null;
    }
    if (remoteScreen) {
      return {
        stream: liveVideo(remoteScreenStream) ? remoteScreenStream : remoteStream,
        contain: true,
        mirror: false,
      };
    }
    if (localScreen) {
      return { stream: screenStream, contain: true, mirror: false };
    }
    if (remoteHasVideo) {
      return { stream: remoteStream, contain: false, mirror: false };
    }
    return null;
  }, [
    mode,
    remoteTiles,
    remoteScreen,
    localScreen,
    remoteHasVideo,
    remoteScreenStream,
    remoteStream,
    screenStream,
  ]);

  const shareLabel = remoteScreen
    ? t('meetingPage.theyAreSharing', { name: partnerName })
    : localScreen
      ? t('meetingPage.youAreSharing')
      : null;

  const tiles = remoteTiles?.length
    ? remoteTiles
    : remotePeer
      ? [{ peer: remotePeer, stream: remoteStream, screenStream: remoteScreenStream }]
      : [];
  const isGroup = mode === 'group';
  const groupCount = tiles.length + 1;
  const sharer = tiles.find(
    (tile) => tile.peer.screen && (liveVideo(tile.screenStream) || liveVideo(tile.stream)),
  );
  const groupCols =
    groupCount <= 1 ? 1 : groupCount <= 4 ? 2 : groupCount <= 9 ? 3 : 4;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden" style={{ background: isDark ? '#0B1220' : '#0F172A' }}>
      <div className="absolute inset-0 p-3 sm:p-5">
        <div
          className="relative h-full rounded-[28px] overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#070B14' }}
        >
          {isGroup && !sharer && !localScreen ? (
            <div
              className="h-full w-full grid gap-2 p-2"
              style={{
                gridTemplateColumns: `repeat(${groupCols}, minmax(0, 1fr))`,
              }}
            >
              <PeerTile
                name={selfName}
                stream={localHasVideo ? localStream : null}
                accent={accent}
                you
                youLabel={t('meetingPage.you')}
                mirror
              />
              {tiles.map((tile) => (
                <PeerTile
                  key={tile.peer.socketId}
                  name={tile.peer.name}
                  stream={liveVideo(tile.stream) ? tile.stream : null}
                  avatar={tile.peer.avatarUrl}
                  accent={accent}
                  youLabel={t('meetingPage.you')}
                />
              ))}
            </div>
          ) : main?.stream ? (
            <MeetingVideo stream={main.stream} contain={main.contain} mirror={main.mirror} />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4">
              <span
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
                style={{ background: hexToRgba(accent, 0.35), color: accent }}
              >
                {partnerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={partnerAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(partnerName)
                )}
              </span>
              <div className="text-center px-4">
                <p className="text-xl font-bold text-white">{partnerName}</p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {waiting ? t('meetingPage.ringing') : connected ? t('meetingPage.cameraOff') : t('meetingPage.connecting')}
                </p>
              </div>
            </div>
          )}

          <div className="absolute top-4 inset-x-4 flex items-start justify-between gap-3 pointer-events-none">
            <div
              className="rounded-2xl px-3 py-2 pointer-events-none"
              style={{ background: 'rgba(7,11,20,0.62)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="text-[11px] font-bold tracking-wide" style={{ color: accent }}>
                {isGroup ? t('meetingPage.groupMeeting') : t('meetingPage.privateOneToOne')}
              </p>
              <p className="text-sm font-semibold text-white">
                {isGroup
                  ? t('meetingPage.groupWithCount', { n: groupCount })
                  : partnerName}
              </p>
              {shareLabel && (
                <p className="text-[11px] mt-1 font-semibold" style={{ color: '#FCD34D' }}>
                  {shareLabel}
                </p>
              )}
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-xs font-bold text-white tabular-nums"
              style={{ background: 'rgba(7,11,20,0.62)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {connected ? formatCallClock(seconds) : '00:00'}
            </div>
          </div>

          {(!isGroup || !!sharer || localScreen) && (
          <div
            className="absolute bottom-24 sm:bottom-6 end-4 w-[132px] sm:w-[168px] aspect-[4/3] rounded-2xl overflow-hidden shadow-xl"
            style={{ border: `2px solid ${hexToRgba(accent, 0.55)}` }}
          >
            {localHasVideo && localStream ? (
              <MeetingVideo stream={localStream} muted mirror />
            ) : (
              <div className="h-full w-full flex items-center justify-center" style={{ background: '#111827' }}>
                <span className="text-xs font-bold" style={{ color: textMuted(false) }}>
                  {selfName}
                </span>
              </div>
            )}
            <span className="absolute bottom-1.5 start-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {t('meetingPage.you')}
            </span>
          </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-5 inset-x-0 flex justify-center z-10">
        <div
          className="flex items-center gap-2.5 sm:gap-3 px-4 py-3 rounded-full"
          style={{
            background: 'rgba(15,23,42,0.88)',
            border: `1px solid ${borderSubtle(true)}`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          }}
        >
          <DockButton
            label={audioOn ? t('meetingPage.micOn') : t('meetingPage.micOff')}
            onClick={onToggleAudio}
            active={audioOn}
          >
            {audioOn ? <MdMic size={22} /> : <MdMicOff size={22} />}
          </DockButton>
          <DockButton
            label={videoOn ? t('meetingPage.cameraOn') : t('meetingPage.cameraOff')}
            onClick={onToggleVideo}
            active={videoOn}
          >
            {videoOn ? <MdVideocam size={22} /> : <MdVideocamOff size={22} />}
          </DockButton>
          <DockButton
            label={sharing ? t('meetingPage.stopShare') : t('meetingPage.shareScreen')}
            onClick={onToggleShare}
            active={sharing}
          >
            {sharing ? <MdStopScreenShare size={22} /> : <MdScreenShare size={22} />}
          </DockButton>
          <DockButton label={t('meetingPage.endCall')} onClick={onEnd} danger>
            <MdCallEnd size={22} />
          </DockButton>
        </div>
      </div>
    </div>
  );
}
