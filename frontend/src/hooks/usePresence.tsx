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
import { io, type Socket } from 'socket.io-client';
import {
  isPresenceStatus,
  presenceStorageKey,
  type PresenceStatus,
} from '@/lib/presence';

type PresenceContextValue = {
  status: PresenceStatus;
  setPresence: (next: PresenceStatus) => Promise<void>;
  liveMap: Record<string, PresenceStatus | 'offline'>;
};

const PresenceContext = createContext<PresenceContextValue | null>(null);

const HEARTBEAT_MS = 2 * 60 * 1000;

export function PresenceProvider({
  workspaceId,
  userId,
  children,
}: {
  workspaceId: string;
  userId?: string | null;
  children: ReactNode;
}) {
  const [status, setStatus] = useState<PresenceStatus>('available');
  const [liveMap, setLiveMap] = useState<Record<string, PresenceStatus | 'offline'>>({});
  const socketRef = useRef<Socket | null>(null);
  const statusRef = useRef<PresenceStatus>('available');
  const patchingRef = useRef(false);

  statusRef.current = status;

  const persist = useCallback(
    async (next: PresenceStatus, opts?: { broadcast?: boolean; quiet?: boolean }) => {
      try {
        localStorage.setItem(presenceStorageKey(workspaceId), next);
      } catch {
        /* ignore */
      }
      if (opts?.broadcast !== false && !opts?.quiet && socketRef.current?.connected && userId) {
        socketRef.current.emit('presence:set', {
          workspaceId,
          userId,
          status: next,
        });
      }
      if (patchingRef.current) return;
      patchingRef.current = true;
      try {
        await fetch('/api/account/presence', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: next,
            workspaceId,
            quiet: opts?.quiet === true,
          }),
        });
      } catch {
        /* keep optimistic UI */
      } finally {
        patchingRef.current = false;
      }
    },
    [workspaceId, userId],
  );

  const setPresence = useCallback(
    async (next: PresenceStatus) => {
      if (!isPresenceStatus(next)) return;
      if (next === statusRef.current) return;
      setStatus(next);
      statusRef.current = next;
      if (userId) {
        setLiveMap((m) => ({ ...m, [userId]: next }));
      }
      await persist(next);
    },
    [persist, userId],
  );

  // Load initial status once per workspace
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = localStorage.getItem(presenceStorageKey(workspaceId));
        if (cached && isPresenceStatus(cached) && !cancelled) {
          setStatus(cached);
          statusRef.current = cached;
        }
      } catch {
        /* ignore */
      }
      try {
        const res = await fetch('/api/account/presence');
        const json = await res.json();
        if (!cancelled && res.ok && isPresenceStatus(json.data?.status)) {
          setStatus(json.data.status);
          statusRef.current = json.data.status;
          try {
            localStorage.setItem(
              presenceStorageKey(workspaceId),
              json.data.status,
            );
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Single socket for the workspace shell
  useEffect(() => {
    const sock = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = sock;

    sock.on('connect', () => {
      sock.emit('workspace:join', { workspaceId });
      if (userId) {
        sock.emit('presence:set', {
          workspaceId,
          userId,
          status: statusRef.current,
        });
      }
    });

    sock.on(
      'presence:update',
      (payload: { userId?: string; status?: string }) => {
        if (!payload?.userId || !payload.status) return;
        const s = payload.status;
        const mapped: PresenceStatus | 'offline' =
          s === 'offline'
            ? 'offline'
            : isPresenceStatus(s)
              ? s
              : 'available';

        setLiveMap((m) => {
          if (m[payload.userId!] === mapped) return m;
          return { ...m, [payload.userId!]: mapped };
        });

        // Don't echo our own updates back into React state (avoids PATCH loops)
        if (
          payload.userId === userId &&
          isPresenceStatus(s) &&
          s !== statusRef.current
        ) {
          setStatus(s);
          statusRef.current = s;
        }
      },
    );

    sock.on(
      'workspace:branding',
      (payload: {
        id?: string;
        name?: string;
        logoUrl?: string | null;
        logoUrlDark?: string | null;
        logoColor?: string | null;
        showCompanyName?: boolean;
      }) => {
        if (!payload?.id || payload.id !== workspaceId) return;
        window.dispatchEvent(
          new CustomEvent('enterhub:branding', { detail: payload }),
        );
      },
    );

    const onStorage = (e: StorageEvent) => {
      if (
        e.key === presenceStorageKey(workspaceId) &&
        e.newValue &&
        isPresenceStatus(e.newValue) &&
        e.newValue !== statusRef.current
      ) {
        setStatus(e.newValue);
        statusRef.current = e.newValue;
        if (sock.connected && userId) {
          sock.emit('presence:set', {
            workspaceId,
            userId,
            status: e.newValue,
          });
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      sock.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, userId]);

  // Quiet heartbeat — refresh DB timestamp only (no socket spam)
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => {
      void persist(statusRef.current, { quiet: true, broadcast: false });
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [userId, persist]);

  const value = useMemo(
    () => ({ status, setPresence, liveMap }),
    [status, setPresence, liveMap],
  );

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export function usePresence(
  _workspaceId?: string,
  _myUserId?: string | null,
): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    // Safe fallback when used outside provider (should not happen in workspace)
    return {
      status: 'available',
      setPresence: async () => undefined,
      liveMap: {},
    };
  }
  return ctx;
}
