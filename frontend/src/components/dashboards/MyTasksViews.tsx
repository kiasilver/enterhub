'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  MdAccessTime,
  MdCalendarMonth,
  MdChevronLeft,
  MdChevronRight,
  MdList,
  MdViewKanban,
} from 'react-icons/md';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceHover,
} from '@/components/SafeDashboard/theme';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import { isWorkTimerActive } from '@/lib/elapsed';
import {
  MyTasksKanban,
  type KanbanColumnId,
} from '@/components/dashboards/MyTasksKanban';
import { MyTasksListView } from '@/components/dashboards/MyTasksListView';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { getJalaliParts } from '@/lib/app-date';

export type MyTaskItem = {
  id: string;
  title: string;
  description?: string | null;
  dueDate: string | null;
  startDate?: string | null;
  priority?: string;
  bucket: string;
  status: string;
  workflowStatus?: string;
  startedAt?: string | null;
  estimatedHours?: number | null;
  list: { id: string; title: string };
  board: { id: string; name: string };
  labels?: { id: string; name: string; color: string }[];
  checklist?: { done: number; total: number };
  checklistItems?: { id: string; title: string; isDone: boolean }[];
  assignees?: { id: string; name: string; avatarUrl?: string | null }[];
  commentCount?: number;
  attachmentCount?: number;
  delayStatus?: 'OPEN' | 'CHARGED' | 'WAIVED' | null;
  delayIncidentId?: string | null;
  hasPendingExtension?: boolean;
};

export type MyTasksViewData = {
  tasks: MyTaskItem[];
  buckets: {
    overdue: MyTaskItem[];
    today: MyTaskItem[];
    tomorrow: MyTaskItem[];
    week: MyTaskItem[];
    later: MyTaskItem[];
    nodate: MyTaskItem[];
  };
  boardColumns: {
    todo: MyTaskItem[];
    progress: MyTaskItem[];
    review: MyTaskItem[];
    done: MyTaskItem[];
  };
  summary: {
    inboxZeroToday?: boolean;
    todayOpen?: number;
  };
  calendar: {
    cardId: string;
    title: string;
    dueDate: string;
    boardId: string;
    boardName: string;
    status?: string;
    priority?: string;
    labels?: { id: string; name: string; color: string }[];
  }[];
};

type ViewMode = 'list' | 'board' | 'calendar';

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Props = {
  data: MyTasksViewData;
  isDark: boolean;
  onRefresh: () => Promise<void>;
  listOnly?: boolean;
  projectFilter?: string;
  onProjectFilterChange?: (boardId: string) => void;
  searchQuery?: string;
  statusFilter?: string;
  /** Controlled view (for page-level header tabs like Projects) */
  view?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  /** Hide duplicate title/tabs — page header already shows them */
  hideHeader?: boolean;
  /** Hide inline filter toolbar (filters live in page command center) */
  hideFilters?: boolean;
  /** Open create-task flow (column + or Create Task) */
  onCreateTask?: () => void;
  /** Optimistic checklist patch (My Tasks SSE / local toggle) */
  onChecklistPatch?: (cardId: string, itemId: string, isDone: boolean) => void;
};

export function MyTasksViews({
  data,
  isDark,
  onRefresh,
  listOnly,
  projectFilter = 'all',
  onProjectFilterChange,
  searchQuery = '',
  statusFilter = 'all',
  view: viewProp,
  onViewChange,
  hideHeader = false,
  hideFilters = false,
  onCreateTask,
  onChecklistPatch,
}: Props) {
  const { t } = useLang();
  const [viewLocal, setViewLocal] = useState<ViewMode>('list');
  const view = viewProp ?? viewLocal;
  const setView = (v: ViewMode) => {
    onViewChange?.(v);
    if (viewProp === undefined) setViewLocal(v);
  };
  const [detail, setDetail] = useState<{ boardId: string; cardId: string } | null>(
    null,
  );
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [calMode, setCalMode] = useState<'month' | 'week'>('month');

  const cardBg = 'transparent';
  const cardBorder = borderSubtle(isDark);

  const filterTask = useCallback(
    (t: MyTaskItem) => {
      if (projectFilter !== 'all' && t.board.id !== projectFilter) return false;
      if (statusFilter === 'overdue' && t.bucket !== 'overdue') return false;
      if (statusFilter === 'today' && t.bucket !== 'today') return false;
      if (statusFilter === 'done' && t.status !== 'done') return false;
      if (statusFilter === 'open' && t.status === 'done') return false;
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const hay = `${t.title} ${t.board.name} ${t.list.title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    },
    [projectFilter, statusFilter, searchQuery],
  );

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of data.tasks) map.set(t.board.id, t.board.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data.tasks]);

  const moveTaskToColumn = useCallback(
    async (task: MyTaskItem, to: KanbanColumnId) => {
      const base = `/api/boards/${task.board.id}/cards/${task.id}`;
      let res: Response;
      if (to === 'progress') {
        // Marks Start task checklist + moves to In Progress
        res = await fetch(`${base}/workflow/start`, { method: 'POST' });
      } else if (to === 'review' || to === 'done') {
        // Done drop → submit for creator approval (Review). Marks End of task.
        res = await fetch(`${base}/workflow/submit`, { method: 'POST' });
      } else {
        throw new Error(t('myTasksPage.moveBackHint'));
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t('common.failed'));
      await onRefresh();
    },
    [onRefresh, t],
  );

  const toggleMilestone = useCallback(
    async (task: MyTaskItem, itemId: string) => {
      const item = task.checklistItems?.find((i) => i.id === itemId);
      if (!item) return;
      const next = !item.isDone;
      onChecklistPatch?.(task.id, itemId, next);
      try {
        const res = await fetch(
          `/api/boards/${task.board.id}/cards/${task.id}/checklist`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, isDone: next }),
          },
        );
        if (!res.ok) {
          onChecklistPatch?.(task.id, itemId, item.isDone);
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || 'Could not update milestone');
        }
      } catch (e) {
        onChecklistPatch?.(task.id, itemId, item.isDone);
        alert(e instanceof Error ? e.message : 'Could not update milestone');
      }
    },
    [onChecklistPatch],
  );

  const runningTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          filterTask(t) && isWorkTimerActive(t.workflowStatus, t.startedAt),
      ),
    [data.tasks, filterTask],
  );

  const views: { id: ViewMode; label: string; icon: typeof MdList }[] = listOnly
    ? [
        { id: 'list', label: t('myTasksPage.list'), icon: MdList },
        { id: 'board', label: t('myTasksPage.kanban'), icon: MdViewKanban },
      ]
    : [
        { id: 'list', label: t('myTasksPage.list'), icon: MdList },
        { id: 'board', label: t('myTasksPage.kanban'), icon: MdViewKanban },
        { id: 'calendar', label: t('workspace.calendar'), icon: MdCalendarMonth },
      ];

  return (
    <div className="space-y-4">
      {!hideFilters && (
      <div
        className={`flex flex-col sm:flex-row gap-3 ${
          hideHeader ? 'sm:items-center justify-end' : 'sm:items-end justify-between'
        }`}
      >
        {!hideHeader && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
              {t('workspace.myTasks')}
            </p>
            <h2
              className="text-xl sm:text-2xl font-bold"
              style={{ color: textPrimary(isDark) }}
            >
              {t('workspace.myTasks')}
              <span
                className="ms-2 text-sm font-semibold capitalize"
                style={{ color: textMuted(isDark) }}
              >
                ·{' '}
                {view === 'board'
                  ? t('myTasksPage.kanban')
                  : view === 'list'
                    ? t('myTasksPage.list')
                    : t('workspace.calendar')}
              </span>
            </h2>
          </div>
        )}
        <div
          className={`flex flex-wrap items-center gap-2 ${
            hideHeader ? '' : 'self-start sm:self-end'
          }`}
        >
          <select
            value={projectFilter}
            onChange={(e) => onProjectFilterChange?.(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-transparent outline-none"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
            }}
            aria-label={t('projectsPage.allProjects')}
          >
            <option value="all">{t('projectsPage.allProjects')}</option>
            {projectOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          {!hideHeader && (
            <div
              className="inline-flex p-1 rounded-2xl"
              style={{
                background: 'transparent',
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
              role="tablist"
              aria-label="Task view"
            >
              {views.map((v) => {
                const Icon = v.icon;
                const active = view === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setView(v.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                    style={{
                      background: active
                        ? isDark
                          ? 'rgba(37,99,235,0.35)'
                          : 'rgba(37,99,235,0.12)'
                        : 'transparent',
                      color: active
                        ? isDark
                          ? '#93c5fd'
                          : '#2563eb'
                        : textSecondary(isDark),
                    }}
                  >
                    <Icon size={16} />
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {runningTasks.length > 0 && (
        <div className="space-y-2">
          {runningTasks.map((t) => (
            <RunningTimerBar
              key={t.id}
              task={t}
              isDark={isDark}
              onOpen={() => setDetail({ boardId: t.board.id, cardId: t.id })}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <MyTasksListView
              columns={{
                todo: data.boardColumns.todo.filter(filterTask),
                progress: data.boardColumns.progress.filter(filterTask),
                review: data.boardColumns.review.filter(filterTask),
                done: data.boardColumns.done.filter(filterTask),
              }}
              isDark={isDark}
              onOpen={(task) =>
                setDetail({ boardId: task.board.id, cardId: task.id })
              }
              onMoved={moveTaskToColumn}
              onToggleMilestone={toggleMilestone}
            />
          </motion.div>
        )}

        {view === 'board' && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <MyTasksKanban
              columns={{
                todo: data.boardColumns.todo.filter(filterTask),
                progress: data.boardColumns.progress.filter(filterTask),
                review: data.boardColumns.review.filter(filterTask),
                done: data.boardColumns.done.filter(filterTask),
              }}
              isDark={isDark}
              onOpen={(task) => setDetail({ boardId: task.board.id, cardId: task.id })}
              onMoved={moveTaskToColumn}
              onToggleMilestone={toggleMilestone}
            />
          </motion.div>
        )}

        {view === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <PersonalCalendar
              events={data.calendar.filter(
                (e) => projectFilter === 'all' || e.boardId === projectFilter,
              )}
              isDark={isDark}
              cardBg={cardBg}
              cardBorder={cardBorder}
              month={calMonth}
              mode={calMode}
              onModeChange={setCalMode}
              onMonthChange={setCalMonth}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {detail && (
        <CardDetailsModal
          boardId={detail.boardId}
          cardId={detail.cardId}
          open
          onClose={() => {
            setDetail(null);
            void onRefresh();
          }}
          onChanged={() => {
            void onRefresh();
          }}
        />
      )}
    </div>
  );
}

function RunningTimerBar({
  task,
  isDark,
  onOpen,
}: {
  task: MyTaskItem;
  isDark: boolean;
  onOpen: () => void;
}) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl text-sm text-start"
      style={{
        background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.25)'}`,
        color: textPrimary(isDark),
      }}
    >
      <span className="inline-flex items-center gap-2 font-medium min-w-0">
        <MdAccessTime size={18} className="text-blue-500 shrink-0" />
        <span className="truncate">{task.title}</span>
        <span className="text-xs font-normal shrink-0" style={{ color: textMuted(isDark) }}>
          {t('myTasksPage.onProcess')}
        </span>
      </span>
      <WorkTimerBadge
        startedAt={task.startedAt}
        workflowStatus={task.workflowStatus}
        size="md"
        hideWhenInactive={false}
      />
    </button>
  );
}

function PersonalCalendar({
  events,
  isDark,
  cardBg,
  cardBorder,
  month,
  mode,
  onModeChange,
  onMonthChange,
}: {
  events: MyTasksViewData['calendar'];
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  month: Date;
  mode: 'month' | 'week';
  onModeChange: (m: 'month' | 'week') => void;
  onMonthChange: (d: Date) => void;
}) {
  const { formatDate, calendar } = useCalendar();
  const { lang } = useLang();
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const year = month.getFullYear();
  const m = month.getMonth();

  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startWeekday = new Date(year, m, 1).getDay();

  const byDay = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events) {
      const d = new Date(e.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  function dayKey(d: Date) {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  const monthLabel = formatDate(month, 'monthYear');
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${formatDate(weekStart, 'short')} – ${formatDate(weekEnd, 'short')}`;

  const cells: { date: Date | null; inMonth: boolean }[] = [];
  if (mode === 'month') {
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, inMonth: false });
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(year, m, day), inMonth: true });
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      cells.push({ date: d, inMonth: true });
    }
  }

  const weekdayLabels =
    lang === 'fa'
      ? ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous"
            className="p-2 rounded-xl"
            style={{ background: surfaceHover(isDark), color: textSecondary(isDark) }}
            onClick={() => {
              if (mode === 'month') {
                onMonthChange(new Date(year, m - 1, 1));
              } else {
                const d = new Date(weekStart);
                d.setDate(d.getDate() - 7);
                setWeekStart(d);
              }
            }}
          >
            <MdChevronLeft size={20} />
          </button>
          <h3 className="text-sm font-bold min-w-0 flex-1 text-center truncate px-1" style={{ color: textPrimary(isDark) }}>
            {mode === 'month' ? monthLabel : weekLabel}
          </h3>
          <button
            type="button"
            aria-label="Next"
            className="p-2 rounded-xl"
            style={{ background: surfaceHover(isDark), color: textSecondary(isDark) }}
            onClick={() => {
              if (mode === 'month') {
                onMonthChange(new Date(year, m + 1, 1));
              } else {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + 7);
                setWeekStart(d);
              }
            }}
          >
            <MdChevronRight size={20} />
          </button>
        </div>
        <div
          className="inline-flex p-0.5 rounded-xl"
          style={{ background: surfaceHover(isDark) }}
        >
          {(['month', 'week'] as const).map((modeOpt) => (
            <button
              key={modeOpt}
              type="button"
              onClick={() => onModeChange(modeOpt)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize"
              style={{
                background: mode === modeOpt ? (isDark ? 'rgba(37,99,235,0.4)' : '#2563eb') : 'transparent',
                color: mode === modeOpt ? (isDark ? '#93c5fd' : '#fff') : textSecondary(isDark),
              }}
            >
              {modeOpt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map((w) => (
          <div
            key={w}
            className="text-[10px] font-bold text-center py-1 uppercase tracking-wide"
            style={{ color: textMuted(isDark) }}
          >
            {w}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${mode === 'week' ? 'min-h-[180px]' : ''}`}>
        {cells.map((cell, idx) => {
          if (!cell.date) {
            return <div key={`e-${idx}`} className="min-h-[72px] rounded-lg opacity-30" />;
          }
          const key = dayKey(cell.date);
          const dayEvents = byDay.get(key) || [];
          const isToday = sameDay(cell.date, today);
          return (
            <div
              key={key + idx}
              className="min-h-[72px] rounded-xl p-1.5 transition-colors"
              style={{
                background: isToday
                  ? isDark
                    ? 'rgba(37,99,235,0.18)'
                    : 'rgba(37,99,235,0.08)'
                  : isDark
                    ? 'rgba(255,255,255,0.03)'
                    : 'rgba(0,0,0,0.02)',
                border: `1px solid ${
                  isToday
                    ? isDark
                      ? 'rgba(59,130,246,0.45)'
                      : 'rgba(37,99,235,0.35)'
                    : borderSubtle(isDark)
                }`,
              }}
            >
              <p
                className="text-[11px] font-bold mb-1 tabular-nums"
                style={{ color: isToday ? '#3b82f6' : textSecondary(isDark) }}
              >
                {calendar === 'jalali'
                  ? getJalaliParts(cell.date).jd
                  : cell.date.getDate()}
              </p>
              <ul className="space-y-0.5">
                {dayEvents.slice(0, mode === 'week' ? 6 : 3).map((e) => (
                  <li key={e.cardId}>
                    <Link
                      href={`/board/${e.boardId}`}
                      className="block text-[9px] font-medium truncate px-1 py-0.5 rounded"
                      style={{
                        background:
                          e.status === 'done'
                            ? 'rgba(34,197,94,0.2)'
                            : isDark
                              ? 'rgba(139,92,246,0.25)'
                              : 'rgba(139,92,246,0.15)',
                        color: textPrimary(isDark),
                      }}
                      title={`${e.title} — ${e.boardName}`}
                    >
                      {e.title}
                    </Link>
                  </li>
                ))}
                {dayEvents.length > (mode === 'week' ? 6 : 3) && (
                  <li className="text-[9px] px-1" style={{ color: textMuted(isDark) }}>
                    +{dayEvents.length - (mode === 'week' ? 6 : 3)}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
