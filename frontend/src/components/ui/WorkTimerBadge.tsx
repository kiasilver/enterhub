'use client';

import { MdAccessTime } from 'react-icons/md';
import { useLiveElapsed } from '@/hooks/useLiveElapsed';
import { isWorkTimerActive } from '@/lib/elapsed';

type Props = {
  startedAt?: string | null;
  workflowStatus?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Always render when active; hide otherwise */
  hideWhenInactive?: boolean;
};

/**
 * Live seconds counter for tasks in IN_PROGRESS (from server startedAt).
 */
export function WorkTimerBadge({
  startedAt,
  workflowStatus,
  size = 'sm',
  className = '',
  hideWhenInactive = true,
}: Props) {
  const active = isWorkTimerActive(workflowStatus, startedAt);
  const label = useLiveElapsed(startedAt, active);

  if (!active && hideWhenInactive) return null;

  const pad =
    size === 'lg' ? 'px-3 py-1.5 text-sm' : size === 'md' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]';
  const icon = size === 'lg' ? 16 : size === 'md' ? 14 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-mono font-semibold tabular-nums ${pad} ${className}`}
      style={{
        background: 'rgba(37,99,235,0.2)',
        color: '#60a5fa',
        border: '1px solid rgba(37,99,235,0.35)',
      }}
      title="Work timer (running since Start)"
    >
      <MdAccessTime size={icon} className="shrink-0 opacity-90" />
      {label}
    </span>
  );
}
