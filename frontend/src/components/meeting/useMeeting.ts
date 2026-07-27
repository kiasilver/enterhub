'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import {
  SCREEN_SHARE_CONSTRAINTS,
  type ScreenShareQuality,
} from '@/lib/meeting-access';

export type MeetingPeerMeta = {
  socketId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  audio?: boolean;
  video?: boolean;
  screen?: boolean;
};

type SignalPayload =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice'; candidate: RTCIceCandidateInit };

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useMeeting({
  socket,
  meetingId,
  self,
  enabled,
}: {
  socket: Socket | null;
  meetingId: string;
  self: { id: string; name: string; avatarUrl: string | null };
  enabled: boolean;
}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<MeetingPeerMeta[]>([]);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(false); // default video OFF
  const [sharing, setSharing] = useState(false);
  const [quality, setQuality] = useState<ScreenShareQuality>('1080p');
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const upsertRemote = useCallback((socketId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => ({ ...prev, [socketId]: stream }));
  }, []);

  const removePeer = useCallback((socketId: string) => {
    const pc = pcs.current.get(socketId);
    if (pc) {
      pc.close();
      pcs.current.delete(socketId);
    }
    setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[socketId];
      return next;
    });
  }, []);

  const createPeer = useCallback(
    async (remoteId: string, polite: boolean) => {
      if (!socket || pcs.current.has(remoteId)) return;
      const pc = new RTCPeerConnection(ICE);
      pcs.current.set(remoteId, pc);

      const stream = localStreamRef.current;
      if (stream) {
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }
      }
      if (screenRef.current) {
        for (const track of screenRef.current.getTracks()) {
          pc.addTrack(track, screenRef.current);
        }
      }

      pc.ontrack = (ev) => {
        const [streamIn] = ev.streams;
        if (streamIn) upsertRemote(remoteId, streamIn);
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          socket.emit('meeting:signal', {
            meetingId,
            to: remoteId,
            signal: { type: 'ice', candidate: ev.candidate.toJSON() } satisfies SignalPayload,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed' ||
          pc.connectionState === 'disconnected'
        ) {
          // keep for brief disconnect; hard-remove on peer-left
        }
      };

      if (polite) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('meeting:signal', {
          meetingId,
          to: remoteId,
          signal: { type: 'offer', sdp: offer } satisfies SignalPayload,
        });
      }
    },
    [meetingId, socket, upsertRemote],
  );

  const broadcastState = useCallback(() => {
    if (!socket || !joined) return;
    socket.emit('meeting:state', {
      meetingId,
      audio: audioOn,
      video: videoOn,
      screen: sharing,
      screenQuality: sharing ? quality : null,
    });
  }, [socket, joined, meetingId, audioOn, videoOn, sharing, quality]);

  useEffect(() => {
    broadcastState();
  }, [broadcastState]);

  const ensureLocalMedia = useCallback(async (wantAudio: boolean, wantVideo: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: wantAudio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: wantVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            }
          : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setError(null);
      return stream;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Could not access microphone/camera';
      setError(msg);
      throw e;
    }
  }, []);

  const renegotiate = useCallback(
    async (remoteId?: string) => {
      if (!socket) return;
      const targets = remoteId
        ? [[remoteId, pcs.current.get(remoteId)] as const]
        : [...pcs.current.entries()];
      for (const [id, pc] of targets) {
        if (!pc) continue;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('meeting:signal', {
            meetingId,
            to: id,
            signal: { type: 'offer', sdp: offer } satisfies SignalPayload,
          });
        } catch {
          /* ignore */
        }
      }
    },
    [socket, meetingId],
  );

  const join = useCallback(
    async (opts?: { audio?: boolean; video?: boolean }) => {
      if (!socket || !enabled) return;
      const wantAudio = opts?.audio !== false;
      const wantVideo = !!opts?.video;
      if (wantAudio || wantVideo) {
        await ensureLocalMedia(wantAudio, wantVideo);
        if (!wantAudio && localStreamRef.current) {
          for (const t of localStreamRef.current.getAudioTracks()) t.enabled = false;
        }
      }
      setAudioOn(wantAudio);
      setVideoOn(wantVideo);
      setJoined(true);
      socket.emit('meeting:join', {
        meetingId,
        user: { id: self.id, name: self.name, avatarUrl: self.avatarUrl },
      });
    },
    [socket, enabled, ensureLocalMedia, meetingId, self],
  );

  const leave = useCallback(() => {
    socket?.emit('meeting:leave', { meetingId });
    for (const [, pc] of pcs.current) pc.close();
    pcs.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenRef.current = null;
    setLocalStream(null);
    setScreenStream(null);
    setPeers([]);
    setRemoteStreams({});
    setSharing(false);
    setJoined(false);
  }, [socket, meetingId]);

  useEffect(() => {
    if (!socket || !enabled || !joined) return;

    const onPeers = (payload: { peers: MeetingPeerMeta[] }) => {
      setPeers(payload.peers || []);
      for (const p of payload.peers || []) {
        void createPeer(p.socketId, true);
      }
    };

    const onJoined = (payload: { peer: MeetingPeerMeta }) => {
      setPeers((prev) =>
        prev.some((x) => x.socketId === payload.peer.socketId)
          ? prev
          : [...prev, payload.peer],
      );
      void createPeer(payload.peer.socketId, false);
    };

    const onLeft = (payload: { socketId: string }) => {
      removePeer(payload.socketId);
    };

    const onSignal = async (payload: {
      from: string;
      signal: SignalPayload;
      user?: { userId: string | null; name: string; avatarUrl: string | null } | null;
    }) => {
      let pc = pcs.current.get(payload.from);
      if (!pc) {
        if (payload.user) {
          setPeers((prev) =>
            prev.some((x) => x.socketId === payload.from)
              ? prev
              : [
                  ...prev,
                  {
                    socketId: payload.from,
                    userId: payload.user!.userId,
                    name: payload.user!.name,
                    avatarUrl: payload.user!.avatarUrl,
                  },
                ],
          );
        }
        await createPeer(payload.from, false);
        pc = pcs.current.get(payload.from);
      }
      if (!pc) return;

      if (payload.signal.type === 'offer') {
        await pc.setRemoteDescription(payload.signal.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('meeting:signal', {
          meetingId,
          to: payload.from,
          signal: { type: 'answer', sdp: answer } satisfies SignalPayload,
        });
      } else if (payload.signal.type === 'answer') {
        await pc.setRemoteDescription(payload.signal.sdp);
      } else if (payload.signal.type === 'ice' && payload.signal.candidate) {
        try {
          await pc.addIceCandidate(payload.signal.candidate);
        } catch {
          /* ignore */
        }
      }
    };

    const onState = (payload: {
      socketId: string;
      audio: boolean;
      video: boolean;
      screen: boolean;
    }) => {
      setPeers((prev) =>
        prev.map((p) =>
          p.socketId === payload.socketId
            ? {
                ...p,
                audio: payload.audio,
                video: payload.video,
                screen: payload.screen,
              }
            : p,
        ),
      );
    };

    socket.on('meeting:peers', onPeers);
    socket.on('meeting:peer-joined', onJoined);
    socket.on('meeting:peer-left', onLeft);
    socket.on('meeting:signal', onSignal);
    socket.on('meeting:state', onState);

    return () => {
      socket.off('meeting:peers', onPeers);
      socket.off('meeting:peer-joined', onJoined);
      socket.off('meeting:peer-left', onLeft);
      socket.off('meeting:signal', onSignal);
      socket.off('meeting:state', onState);
    };
  }, [socket, enabled, joined, createPeer, removePeer, meetingId]);

  const toggleAudio = useCallback(async () => {
    let stream = localStreamRef.current;
    if (!stream) {
      try {
        stream = await ensureLocalMedia(true, videoOn);
      } catch {
        return;
      }
    }
    const next = !audioOn;
    const audioTracks = stream.getAudioTracks();
    if (next && audioTracks.length === 0) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const track = mic.getAudioTracks()[0];
        if (track) {
          stream.addTrack(track);
          for (const [, pc] of pcs.current) {
            pc.addTrack(track, stream);
          }
          await renegotiate();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Microphone unavailable');
        return;
      }
    } else {
      for (const t of audioTracks) t.enabled = next;
    }
    setLocalStream(new MediaStream(stream.getTracks()));
    setAudioOn(next);
  }, [audioOn, videoOn, ensureLocalMedia, renegotiate]);

  const toggleVideo = useCallback(async () => {
    let stream = localStreamRef.current;
    if (!stream) {
      try {
        stream = await ensureLocalMedia(audioOn, false);
      } catch {
        return;
      }
    }
    const next = !videoOn;
    const existing = stream.getVideoTracks()[0];
    if (next && !existing) {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const track = cam.getVideoTracks()[0];
        if (track) {
          stream.addTrack(track);
          for (const [, pc] of pcs.current) {
            pc.addTrack(track, stream);
          }
          await renegotiate();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Camera unavailable');
        return;
      }
    } else if (existing) {
      existing.enabled = next;
      if (!next) {
        existing.stop();
        stream.removeTrack(existing);
        for (const [, pc] of pcs.current) {
          for (const sender of pc.getSenders()) {
            if (sender.track?.id === existing.id) {
              try {
                pc.removeTrack(sender);
              } catch {
                /* ignore */
              }
            }
          }
        }
        await renegotiate();
      }
    }
    setLocalStream(new MediaStream(stream.getTracks()));
    setVideoOn(next);
  }, [videoOn, audioOn, ensureLocalMedia, renegotiate]);

  const stopScreenShare = useCallback(() => {
    const ss = screenRef.current;
    const hadShare = !!ss;
    if (ss) {
      for (const track of ss.getTracks()) {
        track.stop();
        for (const [, pc] of pcs.current) {
          for (const sender of pc.getSenders()) {
            if (sender.track?.id === track.id) {
              try {
                pc.removeTrack(sender);
              } catch {
                /* ignore */
              }
            }
          }
        }
      }
    }
    screenRef.current = null;
    setScreenStream(null);
    setSharing(false);
    if (hadShare) void renegotiate();
  }, [renegotiate]);

  const startScreenShare = useCallback(
    async (q: ScreenShareQuality = quality) => {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: SCREEN_SHARE_CONSTRAINTS[q],
          audio: true,
        });
        stopScreenShare();
        screenRef.current = display;
        setScreenStream(display);
        setSharing(true);
        setQuality(q);
        for (const track of display.getTracks()) {
          for (const [, pc] of pcs.current) {
            pc.addTrack(track, display);
          }
          track.onended = () => stopScreenShare();
        }
        await renegotiate();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Screen share cancelled');
      }
    },
    [quality, stopScreenShare, renegotiate],
  );

  const changeQuality = useCallback(
    async (q: ScreenShareQuality) => {
      setQuality(q);
      if (sharing) {
        await startScreenShare(q);
      }
    },
    [sharing, startScreenShare],
  );

  useEffect(() => {
    return () => {
      if (joined) leave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    screenStream,
    peers,
    remoteStreams,
    audioOn,
    videoOn,
    sharing,
    quality,
    error,
    joined,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    changeQuality,
    setError,
  };
}
