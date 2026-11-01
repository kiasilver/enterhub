'use client';

import { useEffect, useRef } from 'react';

export function MeetingVideo({
  stream,
  muted,
  mirror,
  contain,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  contain?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) {
      void el.play().catch(() => undefined);
    }
    return () => {
      el.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        objectFit: contain ? 'contain' : 'cover',
        transform: mirror ? 'scaleX(-1)' : undefined,
        background: '#0B1220',
      }}
    />
  );
}
