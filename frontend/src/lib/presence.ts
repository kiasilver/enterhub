/** Canonical presence statuses (header ↔ team ↔ chat). */
export const PRESENCE_STATUSES = ['available', 'meeting', 'away', 'leave'] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

/** UI labels: translate at call sites via t(`presence.${status}`). */
export const PRESENCE_META: Record<PresenceStatus, { color: string }> = {
  available: { color: '#22c55e' },
  meeting: { color: '#f59e0b' },
  away: { color: '#94a3b8' },
  leave: { color: '#ef4444' },
};

const STALE_MS = 5 * 60 * 1000;

export function isPresenceStatus(v: string): v is PresenceStatus {
  return (PRESENCE_STATUSES as readonly string[]).includes(v);
}

/** Resolve stored status; mark offline if never set or stale without live override. */
export function resolvePresence(
  status: string | null | undefined,
  updatedAt: Date | null | undefined,
  opts?: { forceLive?: boolean },
): PresenceStatus | 'offline' {
  if (!status || !isPresenceStatus(status)) {
    if (!updatedAt) return 'offline';
  }
  const raw = status || '';
  const s: PresenceStatus = isPresenceStatus(raw) ? raw : 'available';
  if (opts?.forceLive) return s;
  if (!updatedAt) return 'offline';
  if (Date.now() - updatedAt.getTime() > STALE_MS) return 'offline';
  return s;
}

/** Map canonical status to chat avatar vocabulary. */
export function toChatPresence(
  status: PresenceStatus | 'offline',
): 'online' | 'away' | 'dnd' | 'offline' {
  switch (status) {
    case 'available':
      return 'online';
    case 'meeting':
      return 'dnd';
    case 'away':
    case 'leave':
      return 'away';
    default:
      return 'offline';
  }
}

export function presenceStorageKey(workspaceId: string) {
  return `enterhub:presence:${workspaceId}`;
}
