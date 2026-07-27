/** Format milliseconds as HH:MM:SS (always shows hours). */
export function formatElapsedMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function msSince(iso: string | Date | null | undefined): number {
  if (!iso) return 0;
  const t = typeof iso === 'string' ? Date.parse(iso) : iso.getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Date.now() - t);
}

export function isWorkTimerActive(
  workflowStatus?: string | null,
  startedAt?: string | Date | null,
): boolean {
  return Boolean(startedAt) && workflowStatus === 'IN_PROGRESS';
}
