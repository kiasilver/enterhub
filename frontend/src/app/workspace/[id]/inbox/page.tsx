'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import {
  borderSubtle,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

type NotifRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  boardId: string | null;
  createdAt: string;
  readAt: string | null;
  actor: { name: string | null; email: string } | null;
  href?: string;
};

export default function WorkspaceInboxPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications`);
      const json = await res.json();
      if (res.ok) setItems(json.data?.items || []);
      await fetch(`/api/workspaces/${workspaceId}/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setLoading(false);
    })();
  }, [workspaceId]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold" style={{ color: textPrimary(isDark) }}>
          Inbox
        </h1>
        <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
          Mentions, assignments, and activity aimed at you.
        </p>
      </div>

      <WidgetFrame title="Your notifications" isDark={isDark} loading={loading}>
        {items.length === 0 && !loading ? (
          <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
            Inbox is empty — you&apos;re all caught up.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((a) => (
              <li
                key={a.id}
                className="flex gap-3 p-3 rounded-xl"
                style={{
                  background: surfaceItem(isDark),
                  border: `1px solid ${borderSubtle(isDark)}`,
                  opacity: a.readAt ? 0.75 : 1,
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    color: textPrimary(isDark),
                  }}
                >
                  {(a.actor?.name || a.type || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
                    {a.title}
                  </p>
                  {a.body && (
                    <p className="text-sm mt-0.5" style={{ color: textSecondary(isDark) }}>
                      {a.body}
                    </p>
                  )}
                  <p className="text-[11px] mt-1" style={{ color: textMuted(isDark) }}>
                    {a.type} · {new Date(a.createdAt).toLocaleString()}
                    {a.href && (
                      <>
                        {' · '}
                        <Link href={a.href} className="underline-offset-2 hover:underline">
                          Open board
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </WidgetFrame>
    </div>
  );
}
