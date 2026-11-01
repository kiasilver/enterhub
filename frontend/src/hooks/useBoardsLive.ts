'use client';

import { useEffect, useRef } from 'react';
import type { BoardLiveEvent } from '@/lib/boards-live-bus';

export function useBoardsLive(
  workspaceId: string | null | undefined,
  onEvent: (event: BoardLiveEvent) => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!workspaceId) return;
    let es: EventSource | null = null;
    let closed = false;
    try {
      es = new EventSource(`/api/workspaces/${workspaceId}/boards/stream`);
      es.addEventListener('board', (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as BoardLiveEvent;
          if (!closed && data?.type) onEventRef.current(data);
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* EventSource unavailable */
    }
    return () => {
      closed = true;
      es?.close();
    };
  }, [workspaceId]);
}
