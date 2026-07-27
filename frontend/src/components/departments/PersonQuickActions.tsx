'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MdBarChart, MdChatBubbleOutline, MdPersonOutline } from 'react-icons/md';
import { textPrimary,
  textMuted,
  borderSubtle,
  surfaceItem, panelFill } from '@/components/SafeDashboard/theme';
import type { DeptPerson } from '@/components/departments/department-types';

export function PersonAvatar({
  person,
  size = 24,
  borderColor,
  className = '',
  isDark = false,
}: {
  person: DeptPerson;
  size?: number;
  borderColor?: string;
  className?: string;
  isDark?: boolean;
}) {
  const label = person.name || person.email;
  return (
    <span
      className={`rounded-full overflow-hidden flex-shrink-0 inline-flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        border: borderColor ? `2px solid ${borderColor}` : undefined,
        background: person.avatarUrl
          ? undefined
          : isDark
            ? 'var(--chip)'
            : '#E5E7EB',
        color: textMuted(isDark),
      }}
      title={label}
    >
      {person.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.avatarUrl}
          alt={label}
          className="w-full h-full object-cover"
        />
      ) : (
        <MdPersonOutline size={Math.max(12, Math.round(size * 0.62))} />
      )}
    </span>
  );
}

type Props = {
  person: DeptPerson;
  workspaceId: string;
  departmentId?: string;
  isDark: boolean;
  children: ReactNode;
  className?: string;
};

export function PersonQuickActions({
  person,
  workspaceId,
  isDark,
  children,
  className = '',
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function openChat() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DIRECT', memberIds: [person.id] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not open chat');
      const roomId = json.data?.id as string;
      setOpen(false);
      router.push(`/workspace/${workspaceId}/chat?room=${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setBusy(false);
    }
  }

  function openAnalytics() {
    setOpen(false);
    router.push(`/workspace/${workspaceId}/people/${person.id}`);
  }

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          setError(null);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${person.name || person.email} actions`}
      >
        {children}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-40 left-0 top-full mt-1 min-w-[190px] rounded-xl p-1 shadow-lg"
          style={{
            background: panelFill(isDark),
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void openChat()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left disabled:opacity-50"
            style={{ color: textPrimary(isDark) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = surfaceItem(isDark);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <MdChatBubbleOutline size={16} />
            {busy ? 'Opening…' : 'Open chat'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openAnalytics}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left"
            style={{ color: textPrimary(isDark) }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = surfaceItem(isDark);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <MdBarChart size={16} />
            People analytics
          </button>
          {error && (
            <p className="px-3 py-1.5 text-[10px] text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
