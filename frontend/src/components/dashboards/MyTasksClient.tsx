'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MdAdd,
  MdFilterList,
  MdFolderOpen,
  MdList,
  MdSearch,
  MdTrendingUp,
  MdViewKanban,
} from 'react-icons/md';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import { MyTasksViews, type MyTaskItem, type MyTasksViewData } from '@/components/dashboards/MyTasksViews';
import { CreateTaskModal } from '@/components/board/CreateTaskModal';
import { localizeProjectName } from '@/lib/list-i18n';
import { useBoardsLive } from '@/hooks/useBoardsLive';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  searchFieldBg,
  selectedFill,
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
} from '@/components/SafeDashboard/theme';

type MyData = MyTasksViewData & {
  myProjects: {
    id: string;
    name: string;
    isGeneral?: boolean;
    updatedAt: string;
    open: number;
    done: number;
    overdue: number;
  }[];
  progress: Record<string, number>;
  summary: MyTasksViewData['summary'] & {
    total: number;
    open: number;
    done: number;
    overdue: number;
    completionPct: number;
  };
};

const CHART_COLORS = ['#94a3b8', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];

function normalizeDashboard(raw: MyData): MyData {
  const empty: MyTaskItem[] = [];
  const buckets = {
    overdue: raw.buckets?.overdue ?? empty,
    today: raw.buckets?.today ?? empty,
    tomorrow: raw.buckets?.tomorrow ?? empty,
    week: raw.buckets?.week ?? empty,
    later: raw.buckets?.later ?? empty,
    nodate: raw.buckets?.nodate ?? empty,
  };
  const boardColumns = {
    todo: raw.boardColumns?.todo ?? empty,
    progress: raw.boardColumns?.progress ?? empty,
    review: raw.boardColumns?.review ?? empty,
    done: raw.boardColumns?.done ?? empty,
  };
  return { ...raw, buckets, boardColumns };
}

function patchTaskChecklist(
  data: MyData,
  cardId: string,
  itemId: string,
  isDone: boolean,
): MyData {
  const patchItems = (tasks: MyTaskItem[]) =>
    tasks.map((t) => {
      if (t.id !== cardId || !t.checklistItems) return t;
      const checklistItems = t.checklistItems.map((i) =>
        i.id === itemId ? { ...i, isDone } : i,
      );
      const milestones = checklistItems.filter(
        (i) =>
          i.title.trim().toLowerCase() !== 'start task' &&
          i.title.trim().toLowerCase() !== 'end of task',
      );
      return {
        ...t,
        checklistItems,
        checklist: {
          done: milestones.filter((i) => i.isDone).length,
          total: milestones.length,
        },
      };
    });

  return {
    ...data,
    tasks: patchItems(data.tasks),
    buckets: {
      overdue: patchItems(data.buckets.overdue),
      today: patchItems(data.buckets.today),
      tomorrow: patchItems(data.buckets.tomorrow),
      week: patchItems(data.buckets.week),
      later: patchItems(data.buckets.later),
      nodate: patchItems(data.buckets.nodate),
    },
    boardColumns: {
      todo: patchItems(data.boardColumns.todo),
      progress: patchItems(data.boardColumns.progress),
      review: patchItems(data.boardColumns.review),
      done: patchItems(data.boardColumns.done),
    },
  };
}

function removeTaskFromDashboard(data: MyData, cardId: string): MyData {
  const drop = (tasks: MyTaskItem[]) => tasks.filter((t) => t.id !== cardId);
  return {
    ...data,
    tasks: drop(data.tasks),
    buckets: {
      overdue: drop(data.buckets.overdue),
      today: drop(data.buckets.today),
      tomorrow: drop(data.buckets.tomorrow),
      week: drop(data.buckets.week),
      later: drop(data.buckets.later),
      nodate: drop(data.buckets.nodate),
    },
    boardColumns: {
      todo: drop(data.boardColumns.todo),
      progress: drop(data.boardColumns.progress),
      review: drop(data.boardColumns.review),
      done: drop(data.boardColumns.done),
    },
  };
}

/** Personal view: my projects, my tasks, my task progress */
export function MyTasksClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useLang();
  const [data, setData] = useState<MyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const searchParams = useSearchParams();
  const pageTab: 'overview' | 'list' =
    searchParams.get('tab') === 'overview' ? 'overview' : 'list';
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [listView, setListView] = useState<'list' | 'board'>('board');
  const [taskQuery, setTaskQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done' | 'overdue' | 'today'>(
    'all',
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadDashboard = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/my-dashboard`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t('common.loadFailed'));
        if (!opts?.silent) setData(null);
        return;
      }
      setData(normalizeDashboard(json.data));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
      if (!opts?.silent) setData(null);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;
    try {
      es = new EventSource(`/api/workspaces/${workspaceId}/my-tasks/stream`);
      es.addEventListener('checklist', (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as {
            cardId: string;
            itemId: string;
            isDone: boolean;
          };
          if (closed || !data.cardId || !data.itemId) return;
          setData((prev) =>
            prev
              ? patchTaskChecklist(prev, data.cardId, data.itemId, data.isDone)
              : prev,
          );
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

  useBoardsLive(workspaceId, (ev) => {
    if (ev.type === 'card.deleted') {
      setData((prev) => (prev ? removeTaskFromDashboard(prev, ev.cardId) : prev));
      return;
    }
    if (
      ev.type === 'card.changed' ||
      ev.type === 'board.changed' ||
      ev.type === 'board.archived' ||
      ev.type === 'workspace.invalidate'
    ) {
      // Silent — avoid full-page flash when checklist toggles emit card.changed
      void loadDashboard({ silent: true });
    }
  });

  const applyChecklistPatch = useCallback(
    (cardId: string, itemId: string, isDone: boolean) => {
      setData((prev) =>
        prev ? patchTaskChecklist(prev, cardId, itemId, isDone) : prev,
      );
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') !== '1') return;
    setCreateOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    // Ensure list tab so the create modal is meaningful
    if (url.searchParams.get('tab') !== 'list') {
      url.searchParams.set('tab', 'list');
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [pageTab]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const p = data.progress;
    return [
      { name: t('myTasksPage.todo'), count: p.todo ?? 0 },
      { name: t('myTasksPage.onProcess'), count: p.progress ?? 0 },
      { name: t('myTasksPage.onReview'), count: p.review ?? 0 },
      { name: t('myTasksPage.completed'), count: p.done ?? 0 },
      { name: t('myTasksPage.overdue'), count: p.overdue ?? 0 },
    ];
  }, [data, t]);

  const projectOptions = useMemo(() => {
    if (!data) return [] as [string, string][];
    const map = new Map<string, string>();
    for (const item of data.tasks) {
      map.set(
        item.board.id,
        localizeProjectName(item.board.name, t, item.board.isGeneral),
      );
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data, t]);

  if (loading) {
    return (
      <p className="text-sm" style={{ color: textMuted(isDark) }}>
        {t('myTasksPage.loading')}
      </p>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || t('myTasksPage.noData')}</p>;
  }

  const cardBg = surfaceItem(isDark);
  const cardBorder = borderSubtle(isDark);
  const s = data.summary;
  const fieldStyle = {
    background: searchFieldBg(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  return (
    <div className="space-y-5 w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
              {t('myTasksPage.breadcrumb')}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
              {t('myTasksPage.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
              {pageTab === 'overview'
                ? t('myTasksPage.subtitleOverview')
                : t('myTasksPage.subtitleList')}
            </p>
          </div>
        </div>

        {pageTab === 'list' && (
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div
              className="inline-flex items-stretch gap-1 border-b self-start"
              style={{ borderColor: borderSubtle(isDark) }}
              role="tablist"
              aria-label={t('myTasksPage.listViews')}
            >
              {(
                [
                  { id: 'board' as const, label: t('myTasksPage.kanban'), icon: MdViewKanban },
                  { id: 'list' as const, label: t('myTasksPage.list'), icon: MdList },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = listView === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setListView(tab.id)}
                    className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-semibold transition-colors relative"
                    style={{
                      color: active ? '#3B82F6' : textSecondary(isDark),
                    }}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {active && (
                      <span
                        className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full"
                        style={{ background: '#3B82F6' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 xl:flex-initial xl:max-w-2xl xl:ms-auto">
              <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
                <MdSearch
                  size={18}
                  className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: textMuted(isDark) }}
                />
                <input
                  value={taskQuery}
                  onChange={(e) => setTaskQuery(e.target.value)}
                  placeholder={t('myTasksPage.searchPlaceholder')}
                  className="w-full rounded-xl ps-10 pe-14 py-2.5 text-sm outline-none"
                  style={fieldStyle}
                />
                <kbd
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline"
                  style={{
                    color: textMuted(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  ⌘K
                </kbd>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold shrink-0"
                style={{
                  background: filtersOpen ? selectedFill(isDark) : surfaceItem(isDark),
                  border: `1px solid ${borderSubtle(isDark)}`,
                  color: textSecondary(isDark),
                }}
              >
                <MdFilterList size={18} />
                {t('myTasksPage.filter')}
              </button>
              <GlassButton
                type="button"
                variant="primary"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold shrink-0 !rounded-xl"
              >
                <MdAdd size={18} /> {t('myTasksPage.createTask')}
              </GlassButton>
            </div>
          </div>
        )}

        {pageTab === 'list' && filtersOpen && (
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="rounded-xl px-3 py-2.5 text-sm outline-none w-full sm:w-auto sm:min-w-[140px]"
              style={fieldStyle}
              aria-label="Status filter"
            >
              <option value="all">{t('myTasksPage.allStatuses')}</option>
              <option value="open">{t('myTasksPage.open')}</option>
              <option value="today">{t('myTasksPage.dueToday')}</option>
              <option value="overdue">{t('myTasksPage.overdue')}</option>
              <option value="done">{t('myTasksPage.done')}</option>
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-xl px-3 py-2.5 text-sm outline-none w-full sm:w-auto sm:min-w-[160px]"
              style={fieldStyle}
              aria-label={t('myTasksPage.filterProject')}
            >
              <option value="all">{t('myTasksPage.allProjects')}</option>
              {projectOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {pageTab === 'list' && listView === 'list' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl 4xl:max-w-7xl">
          {[
            { label: t('myTasksPage.assigned'), value: s.total, color: '#06b6d4' },
            { label: t('myTasksPage.openTasks'), value: s.open, color: '#3b82f6' },
            { label: t('myTasksPage.done'), value: s.done, color: '#22c55e' },
            { label: t('myTasksPage.overall'), value: `${s.completionPct}%`, color: '#8b5cf6' },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: textMuted(isDark) }}
              >
                {k.label}
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: k.color }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <CreateTaskModal
        workspaceId={workspaceId}
        isDark={isDark}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void loadDashboard()}
      />

      {pageTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl 4xl:max-w-7xl">
            {[
              { label: t('myTasksPage.assigned'), value: s.total, color: '#8b5cf6' },
              { label: t('myTasksPage.open'), value: s.open, color: '#3b82f6' },
              { label: t('myTasksPage.done'), value: s.done, color: '#22c55e' },
              { label: t('myTasksPage.overdue'), value: s.overdue, color: '#ef4444' },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-2xl p-4"
                style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
              >
                <p
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: textMuted(isDark) }}
                >
                  {k.label}
                </p>
                <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: k.color }}>
                  {k.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-5">
            <WidgetFrame
              title={t('myTasksPage.myTaskProgress')}
              isDark={isDark}
              elevated
              action={<MdTrendingUp size={16} style={{ color: textMuted(isDark) }} />}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm" style={{ color: textSecondary(isDark) }}>
                  Completion
                </p>
                <p className="text-sm font-bold tabular-nums" style={{ color: textPrimary(isDark) }}>
                  {s.completionPct}%
                </p>
              </div>
              <div
                className="h-2 rounded-full mb-4 overflow-hidden"
                style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, s.completionPct)}%`,
                    background: 'linear-gradient(90deg,#8b5cf6,#22c55e)',
                  }}
                />
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: textMuted(isDark), fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: textMuted(isDark), fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle(isDark)}
                      labelStyle={chartTooltipLabelStyle(isDark)}
                      itemStyle={chartTooltipItemStyle(isDark)}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </WidgetFrame>

            <WidgetFrame
              title={t('myTasksPage.myProjects')}
              isDark={isDark}
              elevated
              action={<MdFolderOpen size={16} style={{ color: textMuted(isDark) }} />}
            >
              <ul className="space-y-2 text-sm max-h-72 overflow-auto">
                {data.myProjects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/board/${p.id}`}
                      className="block px-3 py-2.5 rounded-xl"
                      style={{
                        border: `1px solid ${borderSubtle(isDark)}`,
                        background: surfaceItem(isDark),
                        color: textPrimary(isDark),
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">
                          {localizeProjectName(p.name, t, p.isGeneral)}
                        </span>
                        <span
                          className="text-[10px] tabular-nums shrink-0"
                          style={{ color: textMuted(isDark) }}
                        >
                          {p.done}/{p.open + p.done}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1 text-[10px]" style={{ color: textMuted(isDark) }}>
                        <span>{t('projectsPage.open', { n: p.open })}</span>
                        {p.overdue > 0 && (
                          <span style={{ color: '#ef4444' }}>
                            {t('projectsPage.overdue', { n: p.overdue })}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
                {data.myProjects.length === 0 && (
                  <li style={{ color: textMuted(isDark) }}>{t('myTasksPage.emptyProjects')}</li>
                )}
              </ul>
            </WidgetFrame>
          </div>
        </>
      )}

      {pageTab === 'list' && (
        <div>
          <MyTasksViews
            data={data}
            isDark={isDark}
            projectFilter={projectFilter}
            onProjectFilterChange={setProjectFilter}
            searchQuery={taskQuery}
            statusFilter={statusFilter}
            listOnly
            hideHeader
            hideFilters
            view={listView}
            onViewChange={(v) => {
              if (v === 'list' || v === 'board') setListView(v);
            }}
            onCreateTask={() => setCreateOpen(true)}
            onChecklistPatch={applyChecklistPatch}
            onRefresh={async () => {
              const res = await fetch(`/api/workspaces/${workspaceId}/my-dashboard`);
              const json = await res.json();
              if (res.ok) setData(normalizeDashboard(json.data));
            }}
          />
        </div>
      )}
    </div>
  );
}
