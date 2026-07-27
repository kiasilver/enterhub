'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  MdAdd,
  MdAttachFile,
  MdChatBubbleOutline,
  MdGroups,
  MdOpenInNew,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import { CreateTaskModal } from '@/components/board/CreateTaskModal';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import {
  PersonAvatar,
  PersonQuickActions,
} from '@/components/departments/PersonQuickActions';
import type { DeptRichCard, DeptData } from '@/components/departments/department-types';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isChecklistBookend } from '@/lib/checklist-defaults';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  hexToRgba,
} from '@/components/SafeDashboard/theme';

/** Progress bar color by completion — low % should not look “done” (green). */
function progressColor(pct: number) {
  if (pct <= 0) return '#9CA3AF';
  if (pct >= 100) return '#22c55e';
  if (pct >= 70) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function stripHtml(html: string | null | undefined) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function TaskCard({
  card,
  cardBg,
  isDark,
  workspaceId,
  departmentId,
  onOpen,
}: {
  card: DeptRichCard;
  coverColor?: string;
  cardBg: string;
  isDark: boolean;
  workspaceId: string;
  departmentId: string;
  onOpen: () => void;
}) {
  const { t } = useLang();
  const checklistItems = (card.checklist.items || []).filter(
    (i) => !isChecklistBookend(i.title),
  );
  const checklistDone = checklistItems.filter((i) => i.isDone).length;
  const description = stripHtml(card.description);
  const creator = card.createdBy;
  const doers = card.assignees;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="w-full text-start rounded-xl p-3 space-y-2.5 transition-colors duration-200 cursor-pointer"
      style={{
        background: cardBg,
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      {/* Title */}
      <div className="min-w-0">
        <p
          className="text-sm font-semibold leading-snug"
          style={{ color: textPrimary(isDark) }}
        >
          {card.title}
        </p>
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {card.labels.slice(0, 4).map((l) => (
              <span
                key={l.id}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
                style={{ background: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          className="text-[11px] leading-relaxed line-clamp-3"
          style={{ color: textSecondary(isDark) }}
        >
          {description}
        </p>
      )}

      {/* Checklist items — hide Start / End bookends */}
      {checklistItems.length > 0 && (
        <ul className="space-y-1">
          {checklistItems.slice(0, 6).map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-1.5 text-[11px] leading-snug"
              style={{
                color: item.isDone ? textMuted(isDark) : textSecondary(isDark),
                textDecoration: item.isDone ? 'line-through' : 'none',
                opacity: item.isDone ? 0.75 : 1,
              }}
            >
              <span
                className="mt-0.5 h-3 w-3 rounded-full border flex-shrink-0"
                style={{
                  borderColor: item.isDone ? '#22c55e' : borderSubtle(isDark),
                  background: item.isDone ? '#22c55e' : 'transparent',
                }}
              />
              <span className="line-clamp-2">{item.title}</span>
            </li>
          ))}
          {checklistItems.length > 6 && (
            <li className="text-[10px] pl-4" style={{ color: textMuted(isDark) }}>
              +{checklistItems.length - 6} more · {checklistDone}/{checklistItems.length}
            </li>
          )}
        </ul>
      )}

      {/* Creator / Doer with photos */}
      <div
        className="space-y-1.5 pt-1 border-t"
        style={{ borderColor: borderSubtle(isDark) }}
      >
        {creator && (
          <PersonQuickActions
            person={creator}
            workspaceId={workspaceId}
            departmentId={departmentId}
            isDark={isDark}
            className="w-full"
          >
            <span
              className="flex items-center gap-1.5 text-[10px] min-w-0"
              style={{ color: textMuted(isDark) }}
            >
              <PersonAvatar person={creator} size={18} isDark={isDark} />
              <span className="opacity-70 shrink-0">{t('common.create')}</span>
              <span
                className="font-medium truncate"
                style={{ color: textSecondary(isDark) }}
              >
                {creator.name || creator.email}
              </span>
            </span>
          </PersonQuickActions>
        )}
        <div className="flex items-center gap-1.5 text-[10px] min-w-0 flex-wrap">
          <span className="opacity-70 shrink-0" style={{ color: textMuted(isDark) }}>
            {t('myTasksPage.onProcess')}
          </span>
          {doers.length > 0 ? (
            doers.map((a) => (
              <PersonQuickActions
                key={a.id}
                person={a}
                workspaceId={workspaceId}
                departmentId={departmentId}
                isDark={isDark}
              >
                <span
                  className="inline-flex items-center gap-1 rounded-full pl-0.5 pr-1.5 py-0.5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: textSecondary(isDark),
                  }}
                >
                  <PersonAvatar person={a} size={16} isDark={isDark} />
                  <span className="font-medium max-w-[7rem] truncate">
                    {a.name || a.email}
                  </span>
                </span>
              </PersonQuickActions>
            ))
          ) : (
            <span className="font-medium" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.unassigned')}
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px]" style={{ color: textMuted(isDark) }}>
          {card.listTitle && (
            <span
              className="px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}
            >
              {card.listTitle}
            </span>
          )}
          {(card.commentCount || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MdChatBubbleOutline size={11} />
              {card.commentCount}
            </span>
          )}
          {(card.attachmentCount || 0) > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MdAttachFile size={11} />
              {card.attachmentCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <WorkTimerBadge
            startedAt={card.startedAt}
            workflowStatus={card.workflowStatus}
            size="sm"
          />
          {card.dueDate && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                background: isDark ? 'rgba(180,83,9,0.35)' : 'rgba(180,83,9,0.15)',
                color: '#f59e0b',
              }}
            >
              {new Date(card.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DepartmentKanban({
  workspaceId,
  deptId,
  data: dataProp,
  onReload,
  hideChrome = false,
}: {
  workspaceId: string;
  deptId: string;
  data?: DeptData | null;
  onReload?: () => void | Promise<void>;
  hideChrome?: boolean;
}) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const boardFrom = useMemo(() => {
    const q = new URLSearchParams(searchParams.toString());
    if (!q.get('tab')) q.set('tab', 'kanban');
    const s = q.toString();
    return s ? `${pathname}?${s}` : `${pathname}?tab=kanban`;
  }, [pathname, searchParams]);
  const boardHref = (projectId: string) =>
    `/board/${projectId}?from=${encodeURIComponent(boardFrom)}`;
  const [localData, setLocalData] = useState<DeptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!dataProp);
  const [detail, setDetail] = useState<{ boardId: string; cardId: string } | null>(null);
  const [createForBoardId, setCreateForBoardId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectBusy, setProjectBusy] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  const data = dataProp ?? localData;
  const canCreateBoard = !!data?.canCreateBoard;
  const canCreateTask = !!data?.canCreateTask;

  const departmentBoards = useMemo(
    () => data?.projects.map((p) => ({ id: p.id, name: p.name })) ?? [],
    [data?.projects],
  );

  async function createProject() {
    if (!projectName.trim() || !canCreateBoard) return;
    setProjectBusy(true);
    setProjectError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          description: projectDesc.trim() || undefined,
          visibility: 'WORKSPACE',
          departmentId: deptId,
        }),
      });
      const text = await res.text();
      let json: { error?: string; data?: { id: string } } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          res.ok
            ? 'Invalid server response'
            : `Create failed (${res.status})`,
        );
      }
      if (!res.ok) throw new Error(json.error || 'Failed to create project');
      setCreateProjectOpen(false);
      setProjectName('');
      setProjectDesc('');
      await load();
    } catch (e) {
      setProjectError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setProjectBusy(false);
    }
  }

  const load = useCallback(async () => {
    if (onReload) {
      await onReload();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/departments/${deptId}`,
      );
      const text = await res.text();
      let json: { error?: string; data?: DeptData } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Failed to load (${res.status})`);
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setLocalData(json.data ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setLocalData(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, deptId, onReload]);

  useEffect(() => {
    if (!dataProp) void load();
  }, [dataProp, load]);

  if (loading && !data) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: textMuted(isDark) }}>
        {t('departmentsPage.loading')}
      </p>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || t('common.noResults')}</p>;
  }

  const colBg = 'transparent';
  const boardBg = isDark ? 'var(--background)' : '#F3F4F6';

  return (
    <div className="space-y-4">
      {!hideChrome && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
              {t('workspace.departments')}
            </p>
            <h1
              className="text-xl sm:text-2xl font-bold flex items-center gap-2"
              style={{ color: textPrimary(isDark) }}
            >
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: `${data.color}22`, color: data.color }}
              >
                <DepartmentIcon name={data.icon} deptKey={data.key} size={22} />
              </span>
              {data.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
              {t('projectsPage.kanbanHint')}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
            }}
          >
            <MdGroups size={16} />
            {data.members.length} {t('departmentsPage.people')} ·{' '}
            {data.members.filter((m) => m.role === 'SUPERVISOR').length}{' '}
            {t('rolesPage.roleNames.Supervisor')}
          </div>
        </div>
      )}

      <div
        className="rounded-2xl pt-4 pb-3 px-3 md:px-4"
        style={{
          background: boardBg,
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
      >
        <div className="flex gap-3 items-start overflow-x-auto pt-1 pb-2">
          {data.projects.map((project) => (
            <section
              key={project.id}
              className="shrink-0 w-[min(300px,calc(100vw-3rem))] sm:w-[320px] rounded-2xl overflow-hidden"
              style={{
                background: colBg,
                border: `1px solid ${borderSubtle(isDark)}`,
                boxShadow: isDark
                  ? '0 4px 16px rgba(0,0,0,0.25)'
                  : '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              <div
                className="h-1.5 w-full"
                style={{ background: project.coverColor }}
              />
              <header className="px-3 pt-3 pb-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={boardHref(project.id)}
                    className="font-semibold text-sm hover:underline min-w-0 leading-snug"
                    style={{ color: textPrimary(isDark) }}
                  >
                    {project.name}{' '}
                    <span style={{ color: textMuted(isDark) }}>
                      ({project.cardCount})
                    </span>
                  </Link>
                  <Link
                    href={boardHref(project.id)}
                    className="shrink-0 p-1.5 rounded-lg"
                    style={{
                      color: textMuted(isDark),
                      background: isDark
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(0,0,0,0.04)',
                    }}
                    title={t('common.open')}
                  >
                    <MdOpenInNew size={15} />
                  </Link>
                </div>
                <div
                  className="mt-2.5 h-1.5 rounded-full overflow-hidden"
                  style={{ background: hexToRgba(progressColor(project.completionPct), 0.18) }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${project.completionPct}%`,
                      background: progressColor(project.completionPct),
                    }}
                  />
                </div>
                <p
                  className="text-[10px] mt-1 tabular-nums"
                  style={{ color: progressColor(project.completionPct) }}
                >
                  {t('projectsPage.completePct', { n: project.completionPct })}
                </p>
                {canCreateTask && (
                  <button
                    type="button"
                    onClick={() => setCreateForBoardId(project.id)}
                    className="mt-2.5 w-full inline-flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl"
                    style={{
                      background: isDark ? 'rgba(37,99,235,0.95)' : '#2563eb',
                      color: '#ffffff',
                    }}
                  >
                    <MdAdd size={15} /> {t('kanban.newTask')}
                  </button>
                )}
              </header>

              <ul className="px-2.5 pb-3 space-y-2">
                {project.cards.map((card) => (
                  <li key={card.id}>
                    <TaskCard
                      card={card}
                      coverColor={project.coverColor}
                      cardBg={isDark ? surfaceItem(isDark) : '#F9FAFB'}
                      isDark={isDark}
                      workspaceId={workspaceId}
                      departmentId={deptId}
                      onOpen={() =>
                        setDetail({ boardId: project.id, cardId: card.id })
                      }
                    />
                  </li>
                ))}
                {project.cards.length === 0 && (
                  <li
                    className="text-xs text-center py-8"
                    style={{ color: textMuted(isDark) }}
                  >
                    {t('common.noResults')}
                  </li>
                )}
              </ul>
            </section>
          ))}
          {canCreateBoard && (
            <button
              type="button"
              onClick={() => {
                setProjectError(null);
                setCreateProjectOpen(true);
              }}
              className="shrink-0 w-[280px] sm:w-[300px] min-h-[180px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors"
              style={{
                borderColor: isDark ? 'rgba(59,130,246,0.55)' : 'rgba(37,99,235,0.4)',
                color: '#60A5FA',
                background: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)',
              }}
            >
              <span
                className="w-10 h-10 rounded-xl inline-flex items-center justify-center"
                style={{
                  background: isDark ? 'rgba(37,99,235,0.95)' : '#2563eb',
                  color: '#fff',
                }}
              >
                <MdAdd size={22} />
              </span>
              <span className="text-sm font-semibold" style={{ color: isDark ? '#93C5FD' : '#2563EB' }}>
                {t('projectsPage.createProject')}
              </span>
              <span className="text-[11px] px-4 text-center">
                {t('projectsPage.kanbanHint')}
              </span>
            </button>
          )}

          {data.projects.length === 0 && !canCreateBoard && (
            <p className="text-sm py-8" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.noProjectsInDept')}
            </p>
          )}
        </div>
      </div>

      {detail && (
        <CardDetailsModal
          boardId={detail.boardId}
          cardId={detail.cardId}
          open
          onClose={() => {
            setDetail(null);
            void load();
          }}
          onChanged={() => {
            void load();
          }}
        />
      )}

      {canCreateTask && (
        <CreateTaskModal
          workspaceId={workspaceId}
          isDark={isDark}
          open={!!createForBoardId}
          initialBoardId={createForBoardId}
          lockBoard
          boardOptions={departmentBoards}
          onClose={() => setCreateForBoardId(null)}
          onCreated={() => void load()}
        />
      )}

      <Dialog
        open={createProjectOpen}
        onOpenChange={(v) => {
          if (!v) {
            setCreateProjectOpen(false);
            setProjectError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('projectsPage.createProject')}</DialogTitle>
            <DialogDescription>
              {t('projectsPage.kanbanHint')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
                {t('boardTask.project')}
              </span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t('projectsPage.newBoardPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  border: `1px solid ${borderSubtle(isDark)}`,
                  background: surfaceItem(isDark),
                  color: textPrimary(isDark),
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && projectName.trim()) void createProject();
                }}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
                {t('boardTask.description')}
              </span>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{
                  border: `1px solid ${borderSubtle(isDark)}`,
                  background: surfaceItem(isDark),
                  color: textPrimary(isDark),
                }}
              />
            </label>
            {projectError && (
              <p className="text-sm text-red-500">{projectError}</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setCreateProjectOpen(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textSecondary(isDark),
              }}
            >
              {t('kanban.cancel')}
            </button>
            <button
              type="button"
              disabled={projectBusy || projectName.trim().length < 1}
              onClick={() => void createProject()}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: data.color || '#2563eb' }}
            >
              {projectBusy ? t('kanban.creating') : t('projectsPage.createProject')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
