'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, MessageSquare, Mail, ClipboardCheck } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
} from '@/components/SafeDashboard/theme';

type SharedBoard = {
  boardId: string;
  name: string;
  description: string | null;
  accessLevel: string;
  inviterWorkspaceName: string;
  progressPercent: number;
  pendingReview: { id: string; title: string; boardId: string; boardName: string }[];
  recentComments: {
    id: string;
    body: string;
    createdAt: string;
    cardTitle: string;
    boardId: string;
    author?: { name: string | null; email: string };
  }[];
  recentAttachments: {
    id: string;
    fileName: string;
    createdAt: string;
    cardTitle: string;
    boardId: string;
  }[];
};

type GuestData = {
  sharedBoards: SharedBoard[];
  contactLead: { name: string | null; email: string } | null;
};

export function GuestDashboardClient() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<GuestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch('/api/guest/dashboard');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load');
        setLoading(false);
        return;
      }
      setData(json.data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <p className="text-sm" style={{ color: textMuted(isDark) }}>Loading…</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || 'No data'}</p>;
  }

  const pendingReview = data.sharedBoards.flatMap((b) => b.pendingReview);
  const recentComments = data.sharedBoards.flatMap((b) => b.recentComments).slice(0, 12);
  const recentFiles = data.sharedBoards.flatMap((b) => b.recentAttachments).slice(0, 12);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          Shared with you
        </h2>
        <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
          Board links only — no workspace shell
        </p>
      </div>

      <WidgetFrame title="Shared boards" isDark={isDark}>
        <ul className="space-y-3 text-sm">
          {data.sharedBoards.map((b) => (
            <li
              key={b.boardId}
              className="px-3 py-3 rounded-xl space-y-2"
              style={{ border: `1px solid ${borderSubtle(isDark)}` }}
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/board/${b.boardId}`}
                  className="font-medium"
                  style={{ color: textPrimary(isDark) }}
                >
                  {b.name}
                </Link>
                <span className="text-xs tabular-nums" style={{ color: textMuted(isDark) }}>
                  {b.progressPercent}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${b.progressPercent}%`,
                    background: isDark ? '#fff' : '#0a0a0a',
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: textMuted(isDark) }}>
                {b.inviterWorkspaceName} · {b.accessLevel}
              </p>
            </li>
          ))}
          {data.sharedBoards.length === 0 && (
            <li style={{ color: textMuted(isDark) }}>No shared boards</li>
          )}
        </ul>
      </WidgetFrame>

      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetFrame
          title="Pending review"
          isDark={isDark}
          action={<ClipboardCheck size={16} style={{ color: textMuted(isDark) }} />}
        >
          <ul className="space-y-2 text-sm">
            {pendingReview.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/board/${c.boardId}`}
                  className="block px-3 py-2 rounded-xl"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textPrimary(isDark),
                  }}
                >
                  {c.title}
                  <span className="block text-xs" style={{ color: textMuted(isDark) }}>
                    {c.boardName}
                  </span>
                </Link>
              </li>
            ))}
            {pendingReview.length === 0 && (
              <li style={{ color: textMuted(isDark) }}>Nothing in review</li>
            )}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          title="Contact lead"
          isDark={isDark}
          action={<Mail size={16} style={{ color: textMuted(isDark) }} />}
        >
          {data.contactLead ? (
            <a
              href={`mailto:${data.contactLead.email}`}
              className="block text-sm"
              style={{ color: textPrimary(isDark) }}
            >
              {data.contactLead.name || data.contactLead.email}
              <span className="block text-xs mt-1" style={{ color: textMuted(isDark) }}>
                {data.contactLead.email}
              </span>
            </a>
          ) : (
            <p className="text-sm" style={{ color: textMuted(isDark) }}>
              No contact available
            </p>
          )}
        </WidgetFrame>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WidgetFrame
          title="Recent comments"
          isDark={isDark}
          action={<MessageSquare size={16} style={{ color: textMuted(isDark) }} />}
        >
          <ul className="space-y-2 text-sm max-h-64 overflow-auto">
            {recentComments.map((c) => (
              <li
                key={c.id}
                className="px-3 py-2 rounded-xl"
                style={{ border: `1px solid ${borderSubtle(isDark)}` }}
              >
                <Link href={`/board/${c.boardId}`} style={{ color: textPrimary(isDark) }}>
                  {c.cardTitle}
                </Link>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: textSecondary(isDark) }}>
                  {c.body}
                </p>
              </li>
            ))}
            {recentComments.length === 0 && (
              <li style={{ color: textMuted(isDark) }}>No comments</li>
            )}
          </ul>
        </WidgetFrame>

        <WidgetFrame
          title="Recent files"
          isDark={isDark}
          action={<FileText size={16} style={{ color: textMuted(isDark) }} />}
        >
          <ul className="space-y-2 text-sm max-h-64 overflow-auto">
            {recentFiles.map((f) => (
              <li
                key={f.id}
                className="px-3 py-2 rounded-xl"
                style={{ border: `1px solid ${borderSubtle(isDark)}` }}
              >
                <Link href={`/board/${f.boardId}`} style={{ color: textPrimary(isDark) }}>
                  {f.fileName}
                </Link>
                <p className="text-xs mt-1" style={{ color: textMuted(isDark) }}>
                  {f.cardTitle}
                </p>
              </li>
            ))}
            {recentFiles.length === 0 && (
              <li style={{ color: textMuted(isDark) }}>No files</li>
            )}
          </ul>
        </WidgetFrame>
      </div>
    </div>
  );
}
