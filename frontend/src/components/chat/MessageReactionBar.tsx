'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  borderSubtle,
  surfaceItem,
  textMuted,
  textPrimary,
  hexToRgba,
} from '@/components/SafeDashboard/theme';

const RECENT_KEY = 'enterhub-recent-reactions';
const GRID = [
  '👍', '👎', '❤️', '🔥', '😂', '😮', '😢', '🙏', '👏', '🎉',
  '✅', '👀', '💯', '😍', '🤔', '😅', '😎', '😭', '😡', '🤝',
  '💪', '✨', '⭐', '🚀', '💡', '📌', '👌', '😘', '😴', '🤗',
] as const;

function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
}

function pushRecent(emoji: string) {
  const next = [emoji, ...readRecent().filter((e) => e !== emoji)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function rememberReaction(emoji: string) {
  try {
    pushRecent(emoji);
  } catch {
    /* ignore */
  }
}

type Reaction = { emoji: string; count: number; reactedByMe?: boolean };

export function MessageReactionBar({
  reactions,
  isDark,
  accent,
  onReact,
}: {
  reactions: Reaction[];
  isDark: boolean;
  accent: string;
  onReact: (emoji: string) => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const used = useMemo(() => new Set(reactions.map((r) => r.emoji)), [reactions]);

  function pick(emoji: string) {
    rememberReaction(emoji);
    onReact(emoji);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative inline-flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => pick(r.emoji)}
          className="text-[12px] px-2 py-0.5 rounded-full"
          style={{
            background: r.reactedByMe ? hexToRgba(accent, 0.28) : surfaceItem(isDark),
            border: `1px solid ${borderSubtle(isDark)}`,
            color: textPrimary(isDark),
          }}
        >
          {r.emoji} {r.count}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="px-1.5 py-0.5 rounded-lg text-[13px] font-bold leading-none"
        style={{ color: textMuted(isDark) }}
        title={t('chat.moreEmojis')}
        aria-label={t('chat.moreEmojis')}
      >
        +
      </button>
      {open && (
        <div
          className="absolute z-40 bottom-full mb-2 start-0 w-[260px] rounded-2xl p-2.5 shadow-xl"
          style={{
            background: isDark ? '#1E293B' : '#fff',
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
        >
          {recent.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold mb-1 px-0.5" style={{ color: textMuted(isDark) }}>
                {t('chat.recent')}
              </p>
              <div className="flex flex-wrap gap-1">
                {recent.map((e) => (
                  <button
                    key={`r-${e}`}
                    type="button"
                    className="text-lg w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => pick(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] font-semibold mb-1 px-0.5" style={{ color: textMuted(isDark) }}>
            {t('chat.moreEmojis')}
          </p>
          <div className="grid grid-cols-8 gap-0.5">
            {GRID.map((e) => (
              <button
                key={e}
                type="button"
                className="text-lg w-7 h-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => pick(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
