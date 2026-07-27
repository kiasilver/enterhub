'use client';

import { useEffect, useState } from 'react';
import { formatElapsedMs, msSince } from '@/lib/elapsed';

/** Live HH:MM:SS from a server `startedAt` while `active` is true. */
export function useLiveElapsed(
  startedAt: string | null | undefined,
  active: boolean,
): string {
  const [label, setLabel] = useState(() =>
    active && startedAt ? formatElapsedMs(msSince(startedAt)) : '00:00:00',
  );

  useEffect(() => {
    if (!active || !startedAt) {
      setLabel('00:00:00');
      return;
    }
    const tick = () => setLabel(formatElapsedMs(msSince(startedAt)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, active]);

  return label;
}
