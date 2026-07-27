'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { WorkspaceUsageStrip } from '@/components/workspace/WorkspaceUsageStrip';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import {
  borderSubtle,
  hexToRgba,
  surfaceHover,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizeListTitle } from '@/lib/list-i18n';

type HomeData = {
  workspace: { id: string; name: string; logoColor?: string | null; departments: string[] };
  me: { id: string; name: string | null; email: string; title: string; roleName: string };
  isManager: boolean;
  welcome: { greeting: string; firstName: string; tasksWaiting: number; message: string };
  upNext: {
    id: string;
    title: string;
    dueDate: string | null;
    overdue: boolean;
    boardId: string;
    boardName: string;
    listTitle: string;
    checklist: { done: number; total: number };
  }[];
  recentBoards: {
    id: string;
    name: string;
    cardCount: number;
    updatedAt: string;
    visibility: string;
  }[];
  folders: { key: string; label: string; boards: { id: string; name: string; cardCount: number }[] }[];
  activity: {
    id: string;
    action: string;
    createdAt: string;
    actor: { name: string; email: string } | null;
    board: { id: string; name: string } | null;
  }[];
  exec: { overdueCompany: number; inFlow: number; done: number; boardCount: number } | null;
};

const GRADIENTS = [
  'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
  'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
  'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 100%)',
];

function starredKey(wsId: string) {
  return `enterhub:starred-boards:${wsId}`;
}
function recentKey(wsId: string) {
  return `enterhub:recent-boards:${wsId}`;
}

function formatAction(action: string) {
  return action.replace(/\./g, ' · ').replace(/_/g, ' ');
}

function relativeTime(iso: string, t: (key: string, params?: Record<string, string | number>) => string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('workspaceHomePage.justNow');
  if (m < 60) return t('workspaceHomePage.minutesAgo', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('workspaceHomePage.hoursAgo', { n: h });
  return t('workspaceHomePage.daysAgo', { n: Math.floor(h / 24) });
}

export function WorkspaceHomeClient({ workspaceId }: { workspaceId: string }) {
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/workspaces/${workspaceId}/home`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || t('workspaceHomePage.loadFailed'));
      setLoading(false);
      return;
    }
    setData(json.data);
    setError(null);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
    try {
      setStarred(JSON.parse(localStorage.getItem(starredKey(workspaceId)) || '[]'));
      setRecentIds(JSON.parse(localStorage.getItem(recentKey(workspaceId)) || '[]'));
    } catch {
      /* ignore */
    }
  }, [workspaceId, load]);

  const toggleStar = (boardId: string) => {
    setStarred((prev) => {
      const next = prev.includes(boardId) ? prev.filter((id) => id !== boardId) : [...prev, boardId].slice(0, 12);
      try {
        localStorage.setItem(starredKey(workspaceId), JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const quickAccess = useMemo(() => {
    if (!data) return [];
    const byId = new Map(data.recentBoards.map((b) => [b.id, b]));
    const picked: typeof data.recentBoards = [];
    for (const id of [...starred, ...recentIds]) {
      const b = byId.get(id);
      if (b && !picked.find((x) => x.id === b.id)) picked.push(b);
    }
    for (const b of data.recentBoards) {
      if (picked.length >= 4) break;
      if (!picked.find((x) => x.id === b.id)) picked.push(b);
    }
    return picked.slice(0, 4);
  }, [data, starred, recentIds]);

  async function completeTask(boardId: string, cardId: string) {
    setCompleting(cardId);
    const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/workflow/submit`, {
      method: 'POST',
    });
    setCompleting(null);
    if (res.ok) {
      setData((prev) =>
        prev ? { ...prev, upNext: prev.upNext.filter((t) => t.id !== cardId) } : prev
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${primaryColor}55`, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-red-500">{error || t('workspaceHomePage.noData')}</p>;
  }

  const dueSoon = data.welcome.tasksWaiting;

  return (
    <div className="space-y-6 pb-8">
      <WorkspaceUsageStrip workspaceId={workspaceId} />

      {/* Welcome banner */}
      <section
        className="rounded-[20px] p-4 sm:p-6 md:p-8 relative overflow-hidden"
        style={{
          background: isDark
            ? `linear-gradient(120deg, ${hexToRgba(primaryColor, 0.35)} 0%, color-mix(in srgb, var(--background) 95%, transparent) 55%)`
            : `linear-gradient(120deg, ${hexToRgba(primaryColor, 0.18)} 0%, #fff 60%)`,
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: textMuted(isDark) }}>
          {t('workspaceHomePage.homeEyebrow')} · {data.workspace.name}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: textPrimary(isDark) }}>
          {data.welcome.greeting}, {data.welcome.firstName}
        </h1>
        <p className="mt-2 text-sm sm:text-base max-w-xl" style={{ color: textSecondary(isDark) }}>
          {t('workspaceHomePage.atWorkspace')}{' '}
          <strong style={{ color: textPrimary(isDark) }}>{data.workspace.name}</strong>
          {dueSoon > 0
            ? dueSoon === 1
              ? t('workspaceHomePage.tasksDueSoon', { n: dueSoon })
              : t('workspaceHomePage.tasksDueSoonPlural', { n: dueSoon })
            : t('workspaceHomePage.queueClear')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/workspace/${workspaceId}/my-tasks`}
            className="text-xs font-semibold px-3 py-2 rounded-xl text-white"
            style={{ background: '#2563eb' }}
          >
            {t('workspaceHomePage.myTasks')}
          </Link>
          <Link
            href={`/workspace/${workspaceId}/boards`}
            className="text-xs font-semibold px-3 py-2 rounded-xl"
            style={{
              background: surfaceItem(isDark),
              color: textPrimary(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
          >
            {t('workspaceHomePage.allProjects')}
          </Link>
        </div>
      </section>

      {/* Exec widgets */}
      {data.exec && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl 4xl:max-w-7xl">
          {[
            { label: t('workspaceHomePage.kpiProjects'), value: data.exec.boardCount, color: '#3b82f6' },
            { label: t('workspaceHomePage.kpiInFlow'), value: data.exec.inFlow, color: '#8b5cf6' },
            { label: t('workspaceHomePage.kpiDone'), value: data.exec.done, color: '#22c55e' },
            { label: t('workspaceHomePage.kpiOverdue'), value: data.exec.overdueCompany, color: '#ef4444' },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{
                background: surfaceItem(isDark),
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: textMuted(isDark) }}>
                {k.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick access */}
      <WidgetFrame title={t('workspaceHomePage.quickAccess')} isDark={isDark} elevated>
        {quickAccess.length === 0 ? (
          <p className="text-sm" style={{ color: textMuted(isDark) }}>
            {t('workspaceHomePage.noProjectsYet')}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {quickAccess.map((b, i) => (
              <div key={b.id} className="relative group">
                <Link
                  href={`/board/${b.id}`}
                  onClick={() => {
                    try {
                      const prev: string[] = JSON.parse(localStorage.getItem(recentKey(workspaceId)) || '[]');
                      const next = [b.id, ...prev.filter((id) => id !== b.id)].slice(0, 8);
                      localStorage.setItem(recentKey(workspaceId), JSON.stringify(next));
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="block rounded-2xl p-4 min-h-[110px] transition-transform hover:scale-[1.02]"
                  style={{ background: GRADIENTS[i % GRADIENTS.length], color: '#fff' }}
                >
                  <p className="font-semibold text-sm line-clamp-2">{b.name}</p>
                  <p className="text-[11px] mt-2 opacity-80">{t('workspaceHomePage.cardsCount', { n: b.cardCount })}</p>
                </Link>
                <button
                  type="button"
                  aria-label={t('workspaceHomePage.starBoard')}
                  className="absolute top-2 end-2 w-8 h-8 rounded-lg text-sm"
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    color: starred.includes(b.id) ? '#fbbf24' : 'rgba(255,255,255,0.7)',
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleStar(b.id);
                  }}
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        )}
      </WidgetFrame>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Up next */}
        <div className="xl:col-span-3">
          <WidgetFrame
            title={t('workspaceHomePage.upNext')}
            isDark={isDark}
            elevated
            action={
              <Link
                href={`/workspace/${workspaceId}/my-tasks`}
                className="text-xs font-medium"
                style={{ color: primaryColor }}
              >
                {t('workspaceHomePage.viewAll')}
              </Link>
            }
          >
            {data.upNext.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: textMuted(isDark) }}>
                {t('workspaceHomePage.nothingDue')}
              </p>
            ) : (
              <ul className="space-y-2">
                {data.upNext.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: surfaceItem(isDark) }}
                  >
                    <button
                      type="button"
                      disabled={completing === task.id}
                      aria-label={t('workspaceHomePage.markComplete')}
                      className="mt-0.5 w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center"
                      style={{
                        borderColor: task.overdue ? '#ef4444' : borderSubtle(isDark),
                        background: completing === task.id ? primaryColor : 'transparent',
                      }}
                      onClick={() => void completeTask(task.boardId, task.id)}
                    >
                      {completing === task.id ? (
                        <span className="text-[10px] text-white">…</span>
                      ) : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/board/${task.boardId}?card=${task.id}`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: textPrimary(isDark) }}
                      >
                        {task.title}
                      </Link>
                      <p className="text-[11px] mt-0.5" style={{ color: textMuted(isDark) }}>
                        {task.boardName} · {localizeListTitle(task.listTitle, t)}
                        {task.dueDate
                          ? ` · ${task.overdue ? t('workspaceHomePage.overdue') : t('workspaceHomePage.due')} ${new Date(task.dueDate).toLocaleDateString()}`
                          : ` · ${t('workspaceHomePage.noDueDate')}`}
                        {task.checklist.total > 0
                          ? ` · ${t('workspaceHomePage.checklistProgress', { done: task.checklist.done, total: task.checklist.total })}`
                          : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </WidgetFrame>
        </div>

        {/* Activity */}
        <div className="xl:col-span-2">
          <WidgetFrame
            title={t('workspaceHomePage.companyActivity')}
            isDark={isDark}
            elevated
            action={
              <Link
                href={`/workspace/${workspaceId}/inbox`}
                className="text-xs font-medium"
                style={{ color: primaryColor }}
              >
                {t('workspaceHomePage.inbox')}
              </Link>
            }
          >
            {data.activity.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: textMuted(isDark) }}>
                {t('workspaceHomePage.noActivity')}
              </p>
            ) : (
              <ul className="space-y-3">
                {data.activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: surfaceHover(isDark), color: textPrimary(isDark) }}
                    >
                      {(a.actor?.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: textSecondary(isDark) }}>
                        <span className="font-semibold" style={{ color: textPrimary(isDark) }}>
                          {a.actor?.name || t('workspaceHomePage.someone')}
                        </span>{' '}
                        {formatAction(a.action)}
                        {a.board ? (
                          <>
                            {' '}
                            {t('workspaceHomePage.activityOn')}{' '}
                            <Link href={`/board/${a.board.id}`} className="underline underline-offset-2">
                              {a.board.name}
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: textMuted(isDark) }}>
                        {relativeTime(a.createdAt, t)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </WidgetFrame>
        </div>
      </div>

      {/* Department folders preview for employees */}
      {data.folders.some((f) => f.boards.length > 0) && (
        <WidgetFrame title={t('workspaceHomePage.boardsByDept')} isDark={isDark} elevated>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.folders
              .filter((f) => f.boards.length > 0)
              .map((f) => (
                <div key={f.key}>
                  <p className="text-xs font-semibold mb-2" style={{ color: textPrimary(isDark) }}>
                    {f.label}
                  </p>
                  <ul className="space-y-1">
                    {f.boards.map((b) => (
                      <li key={b.id}>
                        <Link
                          href={`/board/${b.id}`}
                          className="text-sm hover:underline"
                          style={{ color: textSecondary(isDark) }}
                        >
                          {b.name}
                          <span className="text-[11px] ms-2" style={{ color: textMuted(isDark) }}>
                            {b.cardCount}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </WidgetFrame>
      )}
    </div>
  );
}
