'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  MdAdd,
  MdArchive,
  MdDelete,
  MdEdit,
  MdExpandLess,
  MdExpandMore,
  MdFilterList,
  MdList,
  MdSearch,
  MdStar,
  MdStarBorder,
  MdViewKanban,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { localizeProjectName } from '@/lib/list-i18n';
import { isGeneralBoardName } from '@/lib/board-lists';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  surfaceHover,
  hexToRgba,
  selectedFill,
} from '@/components/SafeDashboard/theme';
import BoardSettingsDialog from '@/components/board/BoardSettingsDialog';
import { CreateProjectModal } from '@/components/board/CreateProjectModal';
import { CreateTaskModal } from '@/components/board/CreateTaskModal';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import { RichTaskCard, type RichTaskCardData } from '@/components/board/RichTaskCard';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import { ProjectMark } from '@/components/board/ProjectMark';
import { ProjectsOverview } from '@/components/dashboards/ProjectsOverview';
import { useBoardsLive } from '@/hooks/useBoardsLive';
import { hrefWithFrom } from '@/lib/nav-from';

const STARRED_KEY = 'enterhub-starred-boards';

function departmentPageHref(
  workspaceId: string,
  deptId: string | null | undefined,
  from: string,
) {
  return hrefWithFrom(
    `/workspace/${workspaceId}/departments/${deptId || 'general'}`,
    from,
  );
}

export type ProjectBoard = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  background: string | null;
  coverColor: string;
  coverImage: string | null;
  color?: string | null;
  icon: string | null;
  departmentId?: string | null;
  departmentKey: string | null;
  departmentLabel: string;
  departmentColor?: string | null;
  isGeneral?: boolean;
  canDelete?: boolean;
  updatedAt: string;
  archivedAt?: string | null;
  cardCount: number;
  open: number;
  done: number;
  overdue: number;
  completionPct: number;
  status: string;
  health: 'on_track' | 'at_risk' | 'off_track';
  latestDue: string | null;
  manager: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  members: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
  memberCount: number;
  cards?: RichTaskCardData[];
};

type DeptMeta = {
  id?: string | null;
  key: string;
  label: string;
  icon?: string;
  color?: string;
};
type ManagerOpt = { id: string; name: string; email: string; avatarUrl: string | null };

type PageView = 'overview' | 'list';
type ListMode = 'kanban' | 'table';
type StatusFilter = 'all' | 'active' | 'completed' | 'at_risk';
type AccessFilter = 'all' | 'PUBLIC' | 'WORKSPACE' | 'PRIVATE';

function parsePageView(raw: string | null): PageView {
  if (raw === 'overview') return 'overview';
  // legacy table/kanban/grid → list section
  return 'list';
}

function parseListMode(raw: string | null): ListMode {
  if (raw === 'table' || raw === 'list') return 'table';
  return 'kanban';
}

const HEALTH: Record<
  ProjectBoard['health'],
  { label: string; color: string }
> = {
  on_track: { label: 'On Track', color: '#22c55e' },
  at_risk: { label: 'At Risk', color: '#eab308' },
  off_track: { label: 'Off Track', color: '#ef4444' },
};

function healthMeta(
  t: (key: string, params?: Record<string, string | number>) => string,
): Record<ProjectBoard['health'], { label: string; color: string }> {
  return {
    on_track: { label: t('projectsPage.healthOnTrack'), color: HEALTH.on_track.color },
    at_risk: { label: t('projectsPage.healthAtRisk'), color: HEALTH.at_risk.color },
    off_track: { label: t('projectsPage.healthOffTrack'), color: HEALTH.off_track.color },
  };
}

function visibilityLabel(
  t: (key: string) => string,
  visibility: string,
): string {
  if (visibility === 'PUBLIC') return t('projectsPage.accessPublic');
  if (visibility === 'WORKSPACE') return t('projectsPage.accessWorkspace');
  if (visibility === 'PRIVATE') return t('projectsPage.accessPrivate');
  return visibility;
}

function readStarred(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeStarred(ids: string[]) {
  localStorage.setItem(STARRED_KEY, JSON.stringify(ids));
}

function KanbanProjectCard({
  board,
  isDark,
  accent,
  onEdit,
  onAddTask,
  onDelete,
}: {
  board: ProjectBoard;
  isDark: boolean;
  accent: string;
  onEdit?: () => void;
  onAddTask?: () => void;
  onDelete?: () => void;
}) {
  const { t } = useLang();
  const displayName = localizeProjectName(board.name, t, board.isGeneral);
  const total = (board.open || 0) + (board.done || 0);
  const pct = board.completionPct ?? (total ? Math.round((board.done / total) * 100) : 0);
  const barColor =
    pct <= 0
      ? '#9CA3AF'
      : pct >= 100
        ? '#22c55e'
        : pct >= 70
          ? '#3b82f6'
          : pct >= 40
            ? '#f59e0b'
            : '#ef4444';

  return (
    <div
      className="group/proj rounded-lg p-3"
      style={{
        background: isDark ? surfaceItem(isDark) : '#F9FAFB',
        border: `1px solid ${isDark ? 'var(--chip)' : '#E5E7EB'}`,
      }}
    >
      <div className="flex items-start gap-2">
        <ProjectMark
          name={displayName}
          color={board.coverColor || accent}
          icon={board.icon}
          size={28}
          isDark={isDark}
        />
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: textPrimary(isDark) }}
          >
            {displayName}
          </div>
          {board.manager?.name && (
            <p className="text-[11px] mt-1 truncate" style={{ color: textMuted(isDark) }}>
              {board.manager.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="opacity-0 group-hover/proj:opacity-100 focus:opacity-100 p-1.5 rounded-lg"
              style={{ color: textSecondary(isDark) }}
              title={t('projectsPage.editProject')}
              aria-label={t('projectsPage.editProject')}
            >
              <MdEdit size={15} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="opacity-0 group-hover/proj:opacity-100 focus:opacity-100 p-1.5 rounded-lg"
              style={{ color: '#ef4444' }}
              title={t('projectsPage.deleteProject')}
              aria-label={t('projectsPage.deleteProject')}
            >
              <MdDelete size={15} />
            </button>
          )}
        </div>
      </div>

      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          className="mt-2.5 w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl"
          style={{
            background: isDark ? 'rgba(37,99,235,0.95)' : '#2563eb',
            color: '#ffffff',
          }}
        >
          <MdAdd size={15} /> {t('kanban.newTask')}
        </button>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tabular-nums">
        <span style={{ color: textSecondary(isDark) }}>
          {t(total === 1 ? 'projectsPage.task' : 'projectsPage.tasks', { n: total })}
        </span>
        <span style={{ color: textMuted(isDark) }}>·</span>
        <span style={{ color: '#3b82f6' }}>{t('projectsPage.open', { n: board.open })}</span>
        <span style={{ color: textMuted(isDark) }}>·</span>
        <span style={{ color: '#22c55e' }}>{t('projectsPage.done', { n: board.done })}</span>
        {board.overdue > 0 && (
          <>
            <span style={{ color: textMuted(isDark) }}>·</span>
            <span style={{ color: '#ef4444' }}>{t('projectsPage.overdue', { n: board.overdue })}</span>
          </>
        )}
      </div>

      <div
        className="mt-2.5 h-1.5 rounded-full overflow-hidden"
        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: barColor,
          }}
        />
      </div>
      <div
        className="mt-1 text-[10px] font-medium tabular-nums"
        style={{ color: barColor }}
      >
        {t('projectsPage.completePct', { n: pct })}
      </div>
    </div>
  );
}

export function ProjectsDirectory({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const { t, lang } = useLang();
  const isDark = theme === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageView = parsePageView(searchParams.get('view'));
  const listMode = parseListMode(searchParams.get('mode'));
  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  function setListMode(mode: ListMode) {
    const q = new URLSearchParams(searchParams.toString());
    q.set('view', 'list');
    q.set('mode', mode);
    router.replace(`${pathname}?${q.toString()}`);
  }

  const [boards, setBoards] = useState<ProjectBoard[]>([]);
  const [archived, setArchived] = useState<ProjectBoard[]>([]);
  const [departments, setDepartments] = useState<DeptMeta[]>([]);
  const [managers, setManagers] = useState<ManagerOpt[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [settingsBoard, setSettingsBoard] = useState<ProjectBoard | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detail, setDetail] = useState<{ boardId: string; cardId: string } | null>(null);
  const [createTaskBoardId, setCreateTaskBoardId] = useState<string | null>(null);
  const [canCreateTask, setCanCreateTask] = useState(false);
  const ignoreClickUntil = useRef(0);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`);
      if (res.status === 403) {
        setError(t('projectsPage.noAccess'));
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('projectsPage.failed'));
      setBoards(json.data || []);
      setDepartments(json.meta?.departments || []);
      setManagers(json.meta?.managers || []);
      setCanCreateTask(Boolean(json.meta?.canCreateTask));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('projectsPage.failed'));
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [workspaceId, t]);

  useEffect(() => {
    void load();
    setStarredIds(readStarred());
  }, [load]);

  // Keep URL in sync: default List + Kanban mode
  useEffect(() => {
    const view = searchParams.get('view');
    const mode = searchParams.get('mode');
    if (!view || (view !== 'overview' && view !== 'list')) {
      const q = new URLSearchParams(searchParams.toString());
      q.set('view', 'list');
      if (!mode) q.set('mode', 'kanban');
      router.replace(`${pathname}?${q.toString()}`);
      return;
    }
    if (view === 'list' && mode !== 'kanban' && mode !== 'table') {
      const q = new URLSearchParams(searchParams.toString());
      q.set('mode', 'kanban');
      router.replace(`${pathname}?${q.toString()}`);
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    const q = new URLSearchParams(searchParams.toString());
    q.delete('new');
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    setCreateOpen(true);
  }, [searchParams, pathname, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boards.filter((b) => {
      if (
        q &&
        !b.name.toLowerCase().includes(q) &&
        !b.departmentLabel.toLowerCase().includes(q) &&
        !(b.cards || []).some((c) => c.title.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (statusFilter === 'active' && (b.status === 'completed' || b.completionPct >= 100)) {
        return false;
      }
      if (statusFilter === 'completed' && b.status !== 'completed' && b.completionPct < 100) {
        return false;
      }
      if (statusFilter === 'at_risk' && b.health === 'on_track') return false;
      if (managerFilter !== 'all' && b.manager?.id !== managerFilter) return false;
      if (accessFilter !== 'all' && b.visibility !== accessFilter) return false;
      return true;
    });
  }, [boards, query, statusFilter, managerFilter, accessFilter]);

  const kanbanColumns = useMemo(() => {
    const byDept = new Map<string, ProjectBoard[]>();
    for (const b of filtered) {
      const key = b.departmentKey || 'general';
      const list = byDept.get(key) || [];
      list.push(b);
      byDept.set(key, list);
    }

    const orderedKeys = [
      ...departments.map((d) => d.key).filter((k) => k !== 'general'),
      'general',
    ];
    for (const k of byDept.keys()) {
      if (!orderedKeys.includes(k)) orderedKeys.push(k);
    }

    return orderedKeys.map((key) => {
      const meta = departments.find((d) => d.key === key);
      const deptBoards = [...(byDept.get(key) || [])].sort((a, b) => {
        const aGen = Boolean(a.isGeneral) || isGeneralBoardName(a.name);
        const bGen = Boolean(b.isGeneral) || isGeneralBoardName(b.name);
        if (aGen !== bGen) return aGen ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      const openTasks = deptBoards.reduce((n, b) => n + (b.open || 0), 0);
      const doneTasks = deptBoards.reduce((n, b) => n + (b.done || 0), 0);
      const overdueTasks = deptBoards.reduce((n, b) => n + (b.overdue || 0), 0);
      return {
        key,
        id: meta?.id ?? null,
        label: localizedDepartmentLabel(t, key, meta?.label),
        icon: meta?.icon || 'business',
        color: meta?.color || '#3B82F6',
        boards: deptBoards,
        openTasks,
        doneTasks,
        overdueTasks,
        totalTasks: openTasks + doneTasks,
      };
    });
  }, [filtered, departments, t, lang]);

  const sections = useMemo(
    () =>
      kanbanColumns
        .filter((col) => col.boards.length > 0)
        .map((col) => ({
          key: col.key,
          id: col.id,
          label: col.label,
          icon: col.icon,
          color: col.color,
          boards: col.boards,
        })),
    [kanbanColumns],
  );

  const totals = useMemo(() => {
    const open = filtered.reduce((n, b) => n + (b.open || 0), 0);
    const done = filtered.reduce((n, b) => n + (b.done || 0), 0);
    const overdue = filtered.reduce((n, b) => n + (b.overdue || 0), 0);
    const total = open + done;
    return {
      projects: filtered.length,
      open,
      done,
      overdue,
      completionPct: total ? Math.round((done / total) * 100) : 0,
    };
  }, [filtered]);

  const filtersActive =
    query.trim() !== '' ||
    statusFilter !== 'all' ||
    managerFilter !== 'all' ||
    accessFilter !== 'all';

  function dropBoard(boardId: string) {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    setSettingsBoard((cur) => (cur?.id === boardId ? null : cur));
    setDetail((cur) => (cur?.boardId === boardId ? null : cur));
    setCreateTaskBoardId((cur) => (cur === boardId ? null : cur));
  }

  function dropCard(boardId: string, cardId: string) {
    setBoards((prev) =>
      prev.map((b) => {
        if (b.id !== boardId) return b;
        const cards = (b.cards || []).filter((c) => c.id !== cardId);
        return { ...b, cards, cardCount: cards.length };
      }),
    );
    setDetail((cur) => (cur?.cardId === cardId ? null : cur));
  }

  useBoardsLive(workspaceId, (ev) => {
    if (ev.type === 'board.archived') dropBoard(ev.boardId);
    if (ev.type === 'card.deleted') dropCard(ev.boardId, ev.cardId);
    if (
      ev.type === 'board.changed' ||
      ev.type === 'card.changed' ||
      ev.type === 'department.changed' ||
      ev.type === 'workspace.invalidate'
    ) {
      void load({ silent: true });
    }
  });

  function toggleStar(id: string) {
    setStarredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeStarred(next);
      return next;
    });
  }

  async function deleteProject(boardId: string) {
    if (!window.confirm(t('projectsPage.deleteProjectConfirm'))) return;
    const snapshot = boards;
    dropBoard(boardId);
    const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
    if (!res.ok) {
      setBoards(snapshot);
      const json = await res.json().catch(() => ({}));
      setError(
        json.error === 'Cannot delete the default General project'
          ? t('projectsPage.cannotDeleteGeneral')
          : json.error || t('projectsPage.failed'),
      );
    }
  }

  async function handleCardDragEnd(result: DropResult) {
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    const fromId = source.droppableId;
    const toId = destination.droppableId;
    const sourceBoard = boards.find((b) => b.id === fromId);
    const card = sourceBoard?.cards?.[source.index];
    if (!card) return;

    setBoards((prev) => {
      const next = prev.map((b) => ({ ...b, cards: [...(b.cards || [])] }));
      const from = next.find((b) => b.id === fromId);
      const to = next.find((b) => b.id === toId);
      if (!from || !to) return prev;
      const [moved] = (from.cards || []).splice(source.index, 1);
      if (!moved) return prev;
      if (fromId === toId) {
        from.cards!.splice(destination.index, 0, moved);
        return next;
      }
      to.cards = to.cards || [];
      to.cards.splice(destination.index, 0, moved);
      from.cardCount = Math.max(0, (from.cardCount || 0) - 1);
      to.cardCount = (to.cardCount || 0) + 1;
      return next;
    });

    if (fromId === toId) return;

    try {
      const res = await fetch(`/api/boards/${fromId}/cards/${card.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toBoardId: toId }),
      });
      if (!res.ok) await load({ silent: true });
    } catch {
      await load({ silent: true });
    }
  }

  async function loadArchived() {
    if (showArchived) {
      setShowArchived(false);
      return;
    }
    setArchivedLoading(true);
    setShowArchived(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards?archived=1`);
      const json = await res.json();
      if (res.ok) setArchived(json.data || []);
    } finally {
      setArchivedLoading(false);
    }
  }

  const cardBg = 'transparent';
  const kpiBg = surfaceItem(isDark);
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const fieldStyle = {
    background: surfaceItem(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
            {t('projectsPage.breadcrumb')}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            {t('projectsPage.title')}
            <span
              className="ms-2 text-sm font-semibold capitalize"
              style={{ color: textMuted(isDark) }}
            >
              · {pageView === 'overview' ? t('workspace.overview') : t(`projectsPage.${listMode}`)}
            </span>
          </h1>
        </div>
      </div>

      {pageView === 'list' && (
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div
            className="inline-flex items-stretch gap-1 border-b self-start"
            style={{ borderColor: borderSubtle(isDark) }}
            role="tablist"
            aria-label={t('projectsPage.listViews')}
          >
            {(
              [
                { id: 'kanban' as const, label: t('projectsPage.kanban'), icon: MdViewKanban },
                { id: 'table' as const, label: t('projectsPage.list'), icon: MdList },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = listMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setListMode(tab.id)}
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('projectsPage.searchPlaceholder')}
                className="w-full rounded-xl ps-10 pe-3 py-2.5 text-sm outline-none"
                style={fieldStyle}
              />
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
              <MdAdd size={18} /> {t('projectsPage.createProject')}
            </GlassButton>
          </div>
        </div>
      )}

      {!loading && boards.length > 0 && pageView === 'list' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl 4xl:max-w-7xl">
          {[
            { label: t('projectsPage.kpiProjects'), value: totals.projects, color: '#06b6d4' },
            { label: t('projectsPage.kpiOpenTasks'), value: totals.open, color: '#3b82f6' },
            { label: t('projectsPage.kpiDone'), value: totals.done, color: '#22c55e' },
            { label: t('projectsPage.kpiOverall'), value: `${totals.completionPct}%`, color: '#8b5cf6' },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: kpiBg, border: `1px solid ${cardBorder}` }}
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

      {pageView === 'list' && filtersOpen && (
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none w-full sm:w-auto sm:min-w-[140px]"
            style={fieldStyle}
            aria-label={t('projectsPage.filterStatus')}
          >
            <option value="all">{t('projectsPage.statusAll')}</option>
            <option value="active">{t('projectsPage.statusActive')}</option>
            <option value="completed">{t('projectsPage.statusCompleted')}</option>
            <option value="at_risk">{t('projectsPage.statusAtRisk')}</option>
          </select>
          <select
            value={managerFilter}
            onChange={(e) => setManagerFilter(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none w-full sm:w-auto sm:min-w-[160px]"
            style={fieldStyle}
            aria-label={t('projectsPage.filterManager')}
          >
            <option value="all">{t('projectsPage.managersAll')}</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none w-full sm:w-auto sm:min-w-[140px]"
            style={fieldStyle}
            aria-label={t('projectsPage.filterAccess')}
          >
            <option value="all">{t('projectsPage.accessAll')}</option>
            <option value="PUBLIC">{t('projectsPage.accessPublic')}</option>
            <option value="WORKSPACE">{t('projectsPage.accessWorkspace')}</option>
            <option value="PRIVATE">{t('projectsPage.accessPrivate')}</option>
          </select>
        </div>
      )}

      {pageView === 'overview' && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MdSearch
              size={18}
              className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: textMuted(isDark) }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('projectsPage.searchPlaceholder')}
              className="w-full rounded-xl ps-10 pe-3 py-2.5 text-sm outline-none"
              style={fieldStyle}
            />
          </div>
          <GlassButton
            type="button"
            variant="primary"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold shrink-0 !rounded-xl"
          >
            <MdAdd size={18} /> {t('projectsPage.createProject')}
          </GlassButton>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && boards.length === 0 ? (
        <p style={{ color: textMuted(isDark) }}>{t('common.loading')}</p>
      ) : boards.length === 0 ? (
        <div
          className="rounded-[18px] p-10 text-center"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <MdViewKanban size={28} className="mx-auto mb-3" style={{ color: textMuted(isDark) }} />
          <p style={{ color: textMuted(isDark) }}>{t('projectsPage.emptyNoProjects')}</p>
        </div>
      ) : pageView === 'overview' ? (
        <ProjectsOverview
          boards={filtered}
          isDark={isDark}
          filtersActive={filtersActive}
        />
      ) : listMode === 'table' ? (
        <div>
          <ProjectsTable
            sections={sections}
            isDark={isDark}
            starredIds={starredIds}
            onToggleStar={toggleStar}
            onSettings={(b) => setSettingsBoard(b)}
            onOpenTask={(boardId, cardId) => setDetail({ boardId, cardId })}
            onCreateTask={canCreateTask ? (boardId) => setCreateTaskBoardId(boardId) : undefined}
            onDelete={(b) => void deleteProject(b.id)}
            cardBg={cardBg}
            cardBorder={cardBorder}
            workspaceId={workspaceId}
            fromPath={returnTo}
          />
        </div>
      ) : (
        <div
          className="rounded-2xl p-3 md:p-4 pt-4 md:pt-5"
          style={{
            background: isDark ? 'var(--background)' : '#F3F4F6',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <p className="text-[11px] px-1 pb-2" style={{ color: textMuted(isDark) }}>
            {t('projectsPage.dragTaskHint')}
          </p>
          <DragDropContext
            onDragStart={() => {
              ignoreClickUntil.current = Date.now() + 800;
            }}
            onDragEnd={(r) => {
              ignoreClickUntil.current = Date.now() + 300;
              void handleCardDragEnd(r);
            }}
          >
          <div className="flex gap-3 items-start overflow-x-auto pt-2 pb-3 px-1">
            {kanbanColumns.map((col) => (
              <section
                key={col.key}
                className="flex-shrink-0 w-[min(20rem,calc(100vw-3rem))] sm:w-80 rounded-xl"
                style={{
                  background: 'transparent',
                  border: `1px solid ${cardBorder}`,
                }}
              >
                <header
                  className="px-3 pt-3 pb-2.5"
                  style={{ borderBottom: `1px solid ${cardBorder}` }}
                >
                  <Link
                    href={departmentPageHref(workspaceId, col.id, returnTo)}
                    className="flex items-center gap-2.5 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    title={t('projectsPage.openDept')}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                      style={{
                        background: hexToRgba(col.color, 0.18),
                        color: col.color,
                      }}
                    >
                      <DepartmentIcon name={col.icon} deptKey={col.key} size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-sm font-semibold truncate"
                          style={{ color: textPrimary(isDark) }}
                        >
                          {col.label}
                        </h3>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                          style={{
                            background: surfaceHover(isDark),
                            color: textMuted(isDark),
                          }}
                        >
                          {col.totalTasks}
                        </span>
                      </div>
                      <p
                        className="text-[11px] mt-0.5 tabular-nums"
                        style={{ color: textMuted(isDark) }}
                      >
                        {t('projectsPage.columnTasks', { n: col.totalTasks })}
                        {col.openTasks > 0
                          ? ` · ${t('projectsPage.columnOpen', { n: col.openTasks })}`
                          : ''}
                        {col.overdueTasks > 0 ? (
                          <span style={{ color: '#ef4444' }}>
                            {' '}
                            · {t('projectsPage.columnOverdue', { n: col.overdueTasks })}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-semibold shrink-0"
                      style={{ color: textMuted(isDark) }}
                    >
                      {t('projectsPage.openDept')}
                    </span>
                  </Link>
                </header>

                <div className="p-2 space-y-3">
                  {col.boards.length === 0 ? (
                    <p
                      className="text-xs text-center py-8 px-3"
                      style={{ color: textMuted(isDark) }}
                    >
                      {t('projectsPage.noProjectsInDept')}
                    </p>
                  ) : (
                    <AnimatePresence initial={false}>
                    {col.boards.map((b) => (
                      <motion.div
                        key={b.id}
                        layout
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          y: -18,
                          scale: 0.94,
                          filter: 'blur(6px)',
                        }}
                        transition={{
                          layout: { type: 'spring', stiffness: 380, damping: 34 },
                          opacity: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                          y: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                          scale: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                        }}
                        className="space-y-2 origin-top"
                      >
                        <KanbanProjectCard
                          board={b}
                          isDark={isDark}
                          accent={col.color}
                          onEdit={() => setSettingsBoard(b)}
                          onAddTask={
                            canCreateTask ? () => setCreateTaskBoardId(b.id) : undefined
                          }
                          onDelete={
                            b.canDelete ? () => void deleteProject(b.id) : undefined
                          }
                        />
                        <Droppable droppableId={b.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="space-y-2 min-h-[72px] rounded-xl p-0.5"
                              style={{
                                background: snapshot.isDraggingOver
                                  ? hexToRgba(b.coverColor || col.color, isDark ? 0.2 : 0.12)
                                  : 'transparent',
                              }}
                            >
                              {(b.cards || []).map((card, index) => (
                                <Draggable key={card.id} draggableId={card.id} index={index}>
                                  {(drag, snap) => (
                                    <div
                                      ref={drag.innerRef}
                                      {...drag.draggableProps}
                                      {...drag.dragHandleProps}
                                      style={drag.draggableProps.style}
                                    >
                                      <RichTaskCard
                                        card={card}
                                        cardBg={isDark ? surfaceItem(isDark) : '#F9FAFB'}
                                        isDark={isDark}
                                        workspaceId={workspaceId}
                                        departmentId={b.departmentId || undefined}
                                        onOpen={() => {
                                          if (
                                            snap.isDragging ||
                                            Date.now() < ignoreClickUntil.current
                                          ) {
                                            return;
                                          }
                                          setDetail({ boardId: b.id, cardId: card.id });
                                        }}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {(b.cards || []).length === 0 && !snapshot.isDraggingOver && (
                                <p
                                  className="text-[11px] text-center py-3"
                                  style={{ color: textMuted(isDark) }}
                                >
                                  {t('common.noResults')}
                                </p>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  )}
                </div>
              </section>
            ))}
          </div>
          </DragDropContext>
        </div>
      )}


      {/* Archived */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: `1px solid ${cardBorder}`, background: cardBg }}
      >
        <button
          type="button"
          onClick={() => void loadArchived()}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-start"
        >
          <div className="flex items-center gap-2">
            <MdArchive size={18} style={{ color: textMuted(isDark) }} />
            <span className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
              {t('projectsPage.archive')}
            </span>
            <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.archiveSubtitle')}
            </span>
          </div>
          {showArchived ? (
            <MdExpandLess size={20} style={{ color: textMuted(isDark) }} />
          ) : (
            <MdExpandMore size={20} style={{ color: textMuted(isDark) }} />
          )}
        </button>
        {showArchived && (
          <div className="px-4 pb-4">
            {archivedLoading ? (
              <p className="text-xs py-4" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.loadingArchive')}
              </p>
            ) : archived.length === 0 ? (
              <p className="text-xs py-4" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.archiveEmpty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {archived.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: surfaceItem(isDark), color: textPrimary(isDark) }}
                  >
                    <span className="font-medium truncate inline-flex items-center gap-2">
                      <ProjectMark
                        name={localizeProjectName(b.name, t, b.isGeneral)}
                        color={b.coverColor}
                        icon={b.icon}
                        size={28}
                        isDark={isDark}
                      />
                      {localizeProjectName(b.name, t, b.isGeneral)}
                    </span>
                    <span className="text-[11px] shrink-0" style={{ color: textMuted(isDark) }}>
                      {localizedDepartmentLabel(t, b.departmentKey, b.departmentLabel)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        workspaceId={workspaceId}
        isDark={isDark}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        departments={departments.map((d) => ({
          id: d.id ?? null,
          key: d.key,
          label: d.label,
        }))}
        onCreated={() => {
          void load({ silent: true });
        }}
      />

      {detail && (
        <CardDetailsModal
          boardId={detail.boardId}
          cardId={detail.cardId}
          open
          onClose={() => setDetail(null)}
          onChanged={() => void load({ silent: true })}
          onDeleted={() => {
            const cardId = detail.cardId;
            const boardId = detail.boardId;
            setDetail(null);
            dropCard(boardId, cardId);
          }}
        />
      )}

      {canCreateTask && (
      <CreateTaskModal
        workspaceId={workspaceId}
        isDark={isDark}
        open={Boolean(createTaskBoardId)}
        initialBoardId={createTaskBoardId}
        lockBoard
        boardOptions={boards.map((b) => ({
          id: b.id,
          name: b.name,
          isGeneral: b.isGeneral,
        }))}
        onClose={() => setCreateTaskBoardId(null)}
        onCreated={async () => {
          setCreateTaskBoardId(null);
          await load({ silent: true });
        }}
      />
      )}

      {settingsBoard && (
        <BoardSettingsDialog
          open
          boardId={settingsBoard.id}
          workspaceId={workspaceId}
          initial={{
            name: settingsBoard.name,
            description: settingsBoard.description,
            visibility: settingsBoard.visibility,
            background: settingsBoard.background || settingsBoard.coverColor,
            color: settingsBoard.color ?? null,
            icon: settingsBoard.icon ?? null,
            departmentId: settingsBoard.departmentId,
          }}
          departments={departments.map((d) => ({
            id: d.id || '',
            key: d.key,
            label: d.label,
            color: d.color,
          }))}
          onClose={() => setSettingsBoard(null)}
          onSaved={() => void load({ silent: true })}
          isGeneral={Boolean(settingsBoard.isGeneral)}
          canDelete={Boolean(settingsBoard.canDelete)}
          onDeleted={() => {
            const id = settingsBoard.id;
            setSettingsBoard(null);
            dropBoard(id);
          }}
        />
      )}
    </div>
  );
}

function ProjectsTable({
  sections,
  isDark,
  starredIds,
  onToggleStar,
  onSettings,
  onOpenTask,
  onCreateTask,
  onDelete,
  cardBg,
  cardBorder,
  workspaceId,
  fromPath,
}: {
  sections: {
    key: string;
    id: string | null;
    label: string;
    icon?: string;
    color?: string;
    boards: ProjectBoard[];
  }[];
  isDark: boolean;
  starredIds: string[];
  onToggleStar: (id: string) => void;
  onSettings: (b: ProjectBoard) => void;
  onOpenTask: (boardId: string, cardId: string) => void;
  onCreateTask?: (boardId: string) => void;
  onDelete?: (b: ProjectBoard) => void;
  cardBg: string;
  cardBorder: string;
  workspaceId: string;
  fromPath: string;
}) {
  const { t } = useLang();
  const healthLabels = healthMeta(t);
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  function deptOpen(key: string) {
    return openDepts[key] !== false;
  }
  function projectOpen(id: string) {
    return openProjects[id] !== false;
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const taskCount = section.boards.reduce(
          (n, b) => n + (b.cards?.length || 0),
          0,
        );
        const expanded = deptOpen(section.key);
        return (
          <div
            key={section.key}
            className="rounded-2xl overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <div className="w-full flex items-center gap-2 px-4 py-3.5">
              <button
                type="button"
                onClick={() =>
                  setOpenDepts((prev) => ({ ...prev, [section.key]: !deptOpen(section.key) }))
                }
                className="shrink-0 p-0.5 rounded-md"
                aria-expanded={expanded}
                aria-label={section.label}
              >
                {expanded ? (
                  <MdExpandMore size={20} style={{ color: textMuted(isDark) }} />
                ) : (
                  <MdExpandLess size={20} className="-rotate-90" style={{ color: textMuted(isDark) }} />
                )}
              </button>
              <Link
                href={departmentPageHref(workspaceId, section.id, fromPath)}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-start rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                title={t('projectsPage.openDept')}
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                  style={{
                    background: hexToRgba(section.color || '#3B82F6', 0.16),
                    color: section.color || '#3B82F6',
                  }}
                >
                  <DepartmentIcon name={section.icon} deptKey={section.key} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {section.label}
                  </p>
                  <p className="text-[11px] tabular-nums" style={{ color: textMuted(isDark) }}>
                    {t('projectsPage.columnProjects', { n: section.boards.length })}
                    {' · '}
                    {t('projectsPage.columnTasks', { n: taskCount })}
                  </p>
                </div>
                <span
                  className="ms-auto text-[10px] font-semibold shrink-0"
                  style={{ color: textMuted(isDark) }}
                >
                  {t('projectsPage.openDept')}
                </span>
              </Link>
            </div>

            {expanded && (
              <div
                className="px-3 pb-3 space-y-2"
                style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}
              >
                {section.boards.map((b) => {
                  const health = healthLabels[b.health];
                  const starred = starredIds.includes(b.id);
                  const showTasks = projectOpen(b.id);
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl mt-2"
                      style={{
                        background: surfaceItem(isDark),
                        border: `1px solid ${borderSubtle(isDark)}`,
                      }}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenProjects((prev) => ({
                              ...prev,
                              [b.id]: !projectOpen(b.id),
                            }))
                          }
                          className="p-1 rounded-lg shrink-0"
                          aria-expanded={showTasks}
                          aria-label={t('projectsPage.columnTasks', { n: b.cards?.length || 0 })}
                        >
                          {showTasks ? (
                            <MdExpandMore size={18} style={{ color: textMuted(isDark) }} />
                          ) : (
                            <MdExpandLess
                              size={18}
                              className="-rotate-90"
                              style={{ color: textMuted(isDark) }}
                            />
                          )}
                        </button>
                        <ProjectMark
                          name={localizeProjectName(b.name, t, b.isGeneral)}
                          color={b.coverColor}
                          icon={b.icon}
                          size={28}
                          isDark={isDark}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: textPrimary(isDark) }}
                          >
                            {localizeProjectName(b.name, t, b.isGeneral)}
                          </p>
                          <p className="text-[11px] tabular-nums" style={{ color: textMuted(isDark) }}>
                            {t('projectsPage.columnTasks', { n: b.cards?.length || 0 })}
                            {' · '}
                            {b.completionPct}%
                            <span
                              className="ms-2 text-[10px] font-bold"
                              style={{ color: health.color }}
                            >
                              {health.label}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={starred ? t('projectsPage.unstar') : t('projectsPage.star')}
                          onClick={() => onToggleStar(b.id)}
                          className="p-1.5 rounded-lg"
                          style={{ color: starred ? '#eab308' : textMuted(isDark) }}
                        >
                          {starred ? <MdStar size={18} /> : <MdStarBorder size={18} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSettings(b)}
                          className="p-1.5 rounded-lg"
                          style={{ color: textMuted(isDark) }}
                          aria-label={t('projectsPage.editProject')}
                          title={t('projectsPage.editProject')}
                        >
                          <MdEdit size={16} />
                        </button>
                        {b.canDelete && onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(b)}
                            className="p-1.5 rounded-lg"
                            style={{ color: '#ef4444' }}
                            aria-label={t('projectsPage.deleteProject')}
                            title={t('projectsPage.deleteProject')}
                          >
                            <MdDelete size={16} />
                          </button>
                        )}
                        {onCreateTask && (
                        <button
                          type="button"
                          onClick={() => onCreateTask(b.id)}
                          className="p-1.5 rounded-lg"
                          style={{ color: textSecondary(isDark) }}
                          aria-label={t('kanban.newTask')}
                          title={t('kanban.newTask')}
                        >
                          <MdAdd size={16} />
                        </button>
                        )}
                      </div>
                      {showTasks && (
                        <div className="px-3 pb-3 space-y-2">
                          {(b.cards || []).map((card) => (
                            <RichTaskCard
                              key={card.id}
                              card={card}
                              cardBg={isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB'}
                              isDark={isDark}
                              workspaceId={workspaceId}
                              departmentId={b.departmentId || undefined}
                              onOpen={() => onOpenTask(b.id, card.id)}
                            />
                          ))}
                          {(b.cards || []).length === 0 && (
                            <p
                              className="text-[11px] text-center py-4"
                              style={{ color: textMuted(isDark) }}
                            >
                              {t('common.noResults')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {sections.length === 0 && (
        <div
          className="rounded-2xl px-4 py-10 text-center text-sm"
          style={{ background: cardBg, border: `1px solid ${cardBorder}`, color: textMuted(isDark) }}
        >
          {t('projectsPage.noMatchFilters')}
        </div>
      )}
    </div>
  );
}
