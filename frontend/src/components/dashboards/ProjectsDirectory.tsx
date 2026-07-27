'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  MdAdd,
  MdArchive,
  MdExpandLess,
  MdExpandMore,
  MdLock,
  MdPublic,
  MdPushPin,
  MdSearch,
  MdSettings,
  MdStar,
  MdStarBorder,
  MdTableRows,
  MdViewKanban,
  MdWorkspaces,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  surfaceHover,
  hexToRgba,
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import BoardSettingsDialog from '@/components/board/BoardSettingsDialog';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import { ProjectsOverview } from '@/components/dashboards/ProjectsOverview';

const STARRED_KEY = 'enterhub-starred-boards';

export type ProjectBoard = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  background: string | null;
  coverColor: string;
  coverImage: string | null;
  icon: string;
  departmentId?: string | null;
  departmentKey: string | null;
  departmentLabel: string;
  departmentColor?: string | null;
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
  if (raw === 'table') return 'table';
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || '?').toUpperCase();
}

function FacePile({
  members,
  total,
  isDark,
}: {
  members: ProjectBoard['members'];
  total: number;
  isDark: boolean;
}) {
  const shown = members.slice(0, 3);
  const extra = Math.max(0, total - shown.length);
  return (
    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
      {shown.map((m) => (
        <div
          key={m.id}
          title={m.name}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold overflow-hidden"
          style={{
            borderColor: isDark ? 'var(--background)' : '#fff',
            background: isDark ? 'var(--chip)' : '#e5e7eb',
            color: textPrimary(isDark),
          }}
        >
          {m.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(m.name)
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
          style={{
            borderColor: isDark ? 'var(--background)' : '#fff',
            background: isDark ? 'rgba(59,130,246,0.35)' : 'rgba(37,99,235,0.15)',
            color: isDark ? '#93c5fd' : '#2563eb',
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

function KanbanProjectCard({
  board,
  isDark,
  accent,
}: {
  board: ProjectBoard;
  isDark: boolean;
  accent: string;
}) {
  const { t } = useLang();
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
      className="rounded-lg p-3 pointer-events-none"
      style={{
        background: isDark ? surfaceItem(isDark) : '#F9FAFB',
        border: `1px solid ${isDark ? 'var(--chip)' : '#E5E7EB'}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
          style={{ background: accent }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-semibold leading-snug line-clamp-2"
            style={{ color: textPrimary(isDark) }}
          >
            {board.name}
          </div>
          {board.manager?.name && (
            <p className="text-[11px] mt-1 truncate" style={{ color: textMuted(isDark) }}>
              {board.manager.name}
            </p>
          )}
        </div>
      </div>

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

function ProjectCard({
  board,
  isDark,
  starred,
  onToggleStar,
  onSettings,
  workspaceId,
}: {
  board: ProjectBoard;
  isDark: boolean;
  starred: boolean;
  onToggleStar: () => void;
  onSettings: () => void;
  workspaceId: string;
}) {
  const { t } = useLang();
  const { formatDate } = useCalendar();
  const health = healthMeta(t)[board.health];
  const cardBg = 'transparent';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const from = `/workspace/${workspaceId}/boards?view=list&mode=kanban`;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <Link href={`/board/${board.id}?from=${encodeURIComponent(from)}`} className="block">
        <div
          className="relative h-24 px-4 flex items-end pb-3"
          style={{
            background: board.coverImage
              ? `center/cover no-repeat url(${board.coverImage})`
              : `linear-gradient(135deg, ${board.coverColor}, ${hexToRgba(board.coverColor, 0.55)})`,
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)'
                : 'linear-gradient(to top, rgba(0,0,0,0.25), transparent 55%)',
            }}
          />
          <span className="relative drop-shadow-sm" aria-hidden>
            <DepartmentIcon
              name={board.icon}
              deptKey={board.departmentKey}
              size={36}
              style={{ color: '#fff' }}
            />
          </span>
          <span
            className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: hexToRgba(health.color, isDark ? 0.35 : 0.92),
              color: isDark ? health.color : '#111',
              border: `1px solid ${hexToRgba(health.color, 0.5)}`,
            }}
          >
            ● {health.label}
          </span>
        </div>

        <div className="p-4 pt-3">
          <h3 className="text-base font-bold truncate" style={{ color: textPrimary(isDark) }}>
            {board.name}
          </h3>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: textMuted(isDark) }}>
            {localizedDepartmentLabel(t, board.departmentKey, board.departmentLabel)}
            <span className="mx-1 opacity-40">›</span>
            {board.name}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xs font-bold tabular-nums" style={{ color: textPrimary(isDark) }}>
              {board.completionPct}%
            </span>
            <FacePile members={board.members} total={board.memberCount} isDark={isDark} />
          </div>

          <div
            className="h-1.5 rounded-full mt-2 overflow-hidden"
            style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, board.completionPct)}%`,
                background:
                  board.health === 'off_track'
                    ? 'linear-gradient(90deg,#f97316,#ef4444)'
                    : board.health === 'at_risk'
                      ? 'linear-gradient(90deg,#fbbf24,#f59e0b)'
                      : 'linear-gradient(90deg,#22c55e,#06b6d4)',
              }}
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px]" style={{ color: textMuted(isDark) }}>
            <span>{t('projectsPage.open', { n: board.open })}</span>
            {board.overdue > 0 && (
              <span style={{ color: '#ef4444' }}>{t('projectsPage.overdue', { n: board.overdue })}</span>
            )}
            {board.visibility === 'PRIVATE' ? (
              <MdLock size={12} className="ml-auto" />
            ) : (
              <MdPublic size={12} className="ml-auto opacity-60" />
            )}
          </div>
        </div>
      </Link>

      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={starred ? t('projectsPage.unstar') : t('projectsPage.star')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleStar();
              }}
              className="p-1.5 rounded-lg backdrop-blur-md"
              style={{
                background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)',
                color: starred ? '#eab308' : textSecondary(isDark),
                minWidth: 36,
                minHeight: 36,
              }}
            >
              {starred ? <MdStar size={18} /> : <MdStarBorder size={18} />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {starred ? t('projectsPage.unpinProject') : t('projectsPage.pinProject')}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSettings();
              }}
              className="p-1.5 rounded-lg backdrop-blur-md inline-flex items-center justify-center"
              style={{
                background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)',
                color: textSecondary(isDark),
                minWidth: 36,
                minHeight: 36,
              }}
              aria-label={t('projectsPage.boardSettings')}
            >
              <MdSettings size={18} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('projectsPage.editProject')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="px-2 py-1.5 rounded-lg backdrop-blur-md text-[10px] font-semibold cursor-default"
              style={{
                background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)',
                color: textPrimary(isDark),
              }}
            >
              📊
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="font-semibold mb-1">{board.name}</p>
            <p>{t('projectsPage.openTasksLine', { n: board.open })}</p>
            <p>
              {t('projectsPage.deadline')}{' '}
              {board.latestDue ? formatDate(board.latestDue) : '—'}
            </p>
            <p>
              {t('projectsPage.healthLine')} {health.label}
            </p>
          </TooltipContent>
        </Tooltip>
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [settingsBoard, setSettingsBoard] = useState<ProjectBoard | null>(null);
  const createNameRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`);
      if (res.status === 403) {
        setError('403 — No access to boards');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('projectsPage.failed'));
      setBoards(json.data || []);
      setDepartments(json.meta?.departments || []);
      setManagers(json.meta?.managers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('projectsPage.failed'));
    } finally {
      setLoading(false);
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
    requestAnimationFrame(() => {
      createNameRef.current?.focus();
      createNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, [searchParams, pathname, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boards.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q) && !b.departmentLabel.toLowerCase().includes(q)) {
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

  const pinned = useMemo(
    () => filtered.filter((b) => starredIds.includes(b.id)),
    [filtered, starredIds],
  );

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
      const deptBoards = byDept.get(key) || [];
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

  const sections = useMemo(() => {
    const pinnedIds = new Set(pinned.map((b) => b.id));
    const rest = filtered.filter((b) => !pinnedIds.has(b.id));
    const byDept = new Map<string, ProjectBoard[]>();
    for (const b of rest) {
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

    return orderedKeys
      .map((key) => {
        const meta = departments.find((d) => d.key === key);
        return {
          key,
          id: meta?.id ?? null,
          label: localizedDepartmentLabel(t, key, meta?.label),
          icon: meta?.icon || 'business',
          color: meta?.color,
          boards: byDept.get(key) || [],
        };
      })
      .filter((s) => s.boards.length > 0);
  }, [filtered, pinned, departments, t, lang]);

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

  function toggleStar(id: string) {
    setStarredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeStarred(next);
      return next;
    });
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

  async function createBoard(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('projectsPage.createFailed'));
      setName('');
      await load();
      if (json.data?.id) window.location.href = `/board/${json.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projectsPage.createFailed'));
    } finally {
      setBusy(false);
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
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            {pageView === 'overview'
              ? t('projectsPage.subtitleOverview')
              : t('projectsPage.subtitleList')}
          </p>
        </div>
        {pageView === 'list' && (
          <div
            className="inline-flex p-1 rounded-2xl self-start sm:self-end shrink-0"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${borderSubtle(isDark)}`,
            }}
            role="tablist"
            aria-label={t('projectsPage.listViews')}
          >
            {(
              [
                { id: 'kanban' as const, label: t('projectsPage.kanban'), icon: MdViewKanban },
                { id: 'table' as const, label: t('projectsPage.table'), icon: MdTableRows },
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
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

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

      {/* Command center */}
      <div
        className="rounded-2xl p-3 sm:p-4 flex flex-col gap-3"
        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <div className="flex flex-col lg:flex-row gap-3">
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

        <form onSubmit={createBoard} className="flex flex-col sm:flex-row gap-2">
          <input
            ref={createNameRef}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('projectsPage.newBoardPlaceholder')}
            className="flex-1 px-4 py-2.5 rounded-xl outline-none text-sm"
            style={fieldStyle}
          />
          <GlassButton
            type="submit"
            variant="primary"
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold"
          >
            <MdAdd size={18} /> {t('projectsPage.createProject')}
          </GlassButton>
        </form>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
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
        <ProjectsTable
          boards={filtered}
          isDark={isDark}
          starredIds={starredIds}
          onToggleStar={toggleStar}
          onSettings={(b) => setSettingsBoard(b)}
          cardBg={cardBg}
          cardBorder={cardBorder}
          workspaceId={workspaceId}
        />
      ) : (
        <div
          className="rounded-2xl p-3 md:p-4 pt-4 md:pt-5"
          style={{
            background: isDark ? 'var(--background)' : '#F3F4F6',
            border: `1px solid ${cardBorder}`,
          }}
        >
          <p className="text-xs mb-3 px-1" style={{ color: textMuted(isDark) }}>
            {t('projectsPage.kanbanHint')}
          </p>
          <div className="flex gap-3 items-start overflow-x-auto pt-2 pb-3 px-1">
            {kanbanColumns.map((col) => {
              const boardsReturn = `/workspace/${workspaceId}/boards?view=list&mode=kanban`;
              const deptColor = col.color;

              const columnBody = (
                <>
                  <header
                    className="px-3 pt-3 pb-2.5"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                        style={{
                          background: hexToRgba(col.color, 0.18),
                          color: col.color,
                        }}
                      >
                        <DepartmentIcon
                          name={col.icon}
                          deptKey={col.key}
                          size={20}
                        />
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
                            {col.boards.length}
                          </span>
                        </div>
                        <p
                          className="text-[11px] mt-0.5 tabular-nums"
                          style={{ color: textMuted(isDark) }}
                        >
                          {t('projectsPage.columnTasks', { n: col.totalTasks })}
                          {col.openTasks > 0 ? ` · ${t('projectsPage.columnOpen', { n: col.openTasks })}` : ''}
                          {col.overdueTasks > 0 ? (
                            <span style={{ color: '#ef4444' }}>
                              {' '}
                              · {t('projectsPage.columnOverdue', { n: col.overdueTasks })}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="p-2 space-y-2">
                    {col.boards.length === 0 ? (
                      <p
                        className="text-xs text-center py-8 px-3"
                        style={{ color: textMuted(isDark) }}
                      >
                        {t('projectsPage.noProjectsInDept')}
                      </p>
                    ) : (
                      col.boards.map((b) => (
                        <KanbanProjectCard
                          key={b.id}
                          board={b}
                          isDark={isDark}
                          accent={col.color}
                        />
                      ))
                    )}
                  </div>
                </>
              );

              const columnClass =
                'flex-shrink-0 w-[280px] sm:w-[300px] rounded-xl block transition-[border-color,box-shadow] duration-200';
              const columnStyleBase = {
                background: 'transparent' as const,
                border: `1px solid ${cardBorder}`,
              };

              return (
                <section
                  key={col.key}
                  className={columnClass}
                  style={columnStyleBase}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = deptColor;
                    el.style.boxShadow = `0 0 0 1px ${hexToRgba(deptColor, 0.45)}, 0 0 20px ${hexToRgba(deptColor, 0.28)}`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = cardBorder;
                    el.style.boxShadow = 'none';
                  }}
                >
                  {columnBody}
                </section>
              );
            })}
          </div>
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
                  <li key={b.id}>
                    <Link
                      href={`/board/${b.id}?from=${encodeURIComponent(`/workspace/${workspaceId}/boards?view=list&mode=kanban`)}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: surfaceItem(isDark), color: textPrimary(isDark) }}
                    >
                      <span className="font-medium truncate inline-flex items-center gap-2">
                        <DepartmentIcon name={b.icon} deptKey={b.departmentKey} size={18} />
                        {b.name}
                      </span>
                      <span className="text-[11px] shrink-0" style={{ color: textMuted(isDark) }}>
                        {localizedDepartmentLabel(t, b.departmentKey, b.departmentLabel)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {settingsBoard && (
        <BoardSettingsDialog
          open
          boardId={settingsBoard.id}
          initial={{
            name: settingsBoard.name,
            description: settingsBoard.description,
            visibility: settingsBoard.visibility,
            background: settingsBoard.background || settingsBoard.coverColor,
            departmentId: settingsBoard.departmentId,
          }}
          departments={departments.map((d) => ({
            id: d.id || '',
            key: d.key,
            label: d.label,
            color: d.color,
          }))}
          onClose={() => setSettingsBoard(null)}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}

function ProjectsTable({
  boards,
  isDark,
  starredIds,
  onToggleStar,
  onSettings,
  cardBg,
  cardBorder,
  workspaceId,
}: {
  boards: ProjectBoard[];
  isDark: boolean;
  starredIds: string[];
  onToggleStar: (id: string) => void;
  onSettings: (b: ProjectBoard) => void;
  cardBg: string;
  cardBorder: string;
  workspaceId: string;
}) {
  const { t } = useLang();
  const { formatDate } = useCalendar();
  const healthLabels = healthMeta(t);
  const from = `/workspace/${workspaceId}/boards?view=list&mode=table`;
  const headers = [
    t('projectsPage.colProject'),
    t('projectsPage.colDepartment'),
    t('projectsPage.colHealth'),
    t('projectsPage.colProgress'),
    t('projectsPage.colOpen'),
    t('projectsPage.colDue'),
    t('projectsPage.colAccess'),
    '',
  ];
  return (
    <div
      className="rounded-2xl overflow-x-auto"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
            {headers.map((h) => (
              <th
                key={h || 'actions'}
                className="text-start text-[10px] font-bold uppercase tracking-wider px-4 py-3"
                style={{ color: textMuted(isDark) }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {boards.map((b, i) => {
            const health = healthLabels[b.health];
            const starred = starredIds.includes(b.id);
            return (
              <tr
                key={b.id}
                className="transition-colors"
                style={{
                  borderBottom: `1px solid ${borderSubtle(isDark)}`,
                  background: tableRowBg(isDark, i),
                }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/board/${b.id}?from=${encodeURIComponent(from)}`}
                    className="flex items-center gap-2 font-semibold"
                    style={{ color: textPrimary(isDark) }}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: hexToRgba(b.coverColor, 0.25),
                        color: b.coverColor,
                      }}
                    >
                      <DepartmentIcon name={b.icon} deptKey={b.departmentKey} size={18} />
                    </span>
                    <span className="truncate max-w-[200px]">{b.name}</span>
                  </Link>
                </td>
                <td className="px-4 py-3" style={{ color: textSecondary(isDark) }}>
                  {localizedDepartmentLabel(t, b.departmentKey, b.departmentLabel)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: hexToRgba(health.color, 0.15),
                      color: health.color,
                    }}
                  >
                    {health.label}
                  </span>
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${b.completionPct}%`,
                          background: health.color,
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums font-medium w-8" style={{ color: textPrimary(isDark) }}>
                      {b.completionPct}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums" style={{ color: textSecondary(isDark) }}>
                  {b.open}
                  {b.overdue > 0 && (
                    <span className="text-[10px] ms-1" style={{ color: '#ef4444' }}>
                      ({t('projectsPage.overdueShort', { n: b.overdue })})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums" style={{ color: textMuted(isDark) }}>
                  {b.latestDue ? formatDate(b.latestDue) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold uppercase" style={{ color: textMuted(isDark) }}>
                    {visibilityLabel(t, b.visibility)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
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
                      aria-label={t('projectsPage.boardSettings')}
                    >
                      <MdSettings size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {boards.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.noMatchFilters')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
