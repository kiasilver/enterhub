'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { MdAdd, MdDelete, MdEdit, MdGroups } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import { CreateTaskModal } from '@/components/board/CreateTaskModal';
import { CreateProjectModal } from '@/components/board/CreateProjectModal';
import { RichTaskCard } from '@/components/board/RichTaskCard';
import BoardSettingsDialog from '@/components/board/BoardSettingsDialog';
import { ProjectMark } from '@/components/board/ProjectMark';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import type { DeptData } from '@/components/departments/department-types';
import { isGeneralBoardName } from '@/lib/board-lists';
import { useBoardsLive } from '@/hooks/useBoardsLive';
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
  const [localData, setLocalData] = useState<DeptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!dataProp);
  const [detail, setDetail] = useState<{ boardId: string; cardId: string } | null>(null);
  const [createForBoardId, setCreateForBoardId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [settingsProject, setSettingsProject] = useState<DeptData['projects'][number] | null>(null);
  const ignoreClickUntil = useRef(0);
  const liveReloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = dataProp ?? localData;
  const canCreateBoard = !!data?.canCreateBoard;
  const canCreateTask = !!data?.canCreateTask;
  const [projects, setProjects] = useState(data?.projects ?? []);
  const [checklistBusyId, setChecklistBusyId] = useState<string | null>(null);

  async function toggleChecklistOnCard(
    boardId: string,
    cardId: string,
    itemId: string,
    nextDone: boolean,
  ) {
    setChecklistBusyId(itemId);
    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== boardId) return p;
        return {
          ...p,
          cards: p.cards.map((c) => {
            if (c.id !== cardId) return c;
            const items = c.checklist.items.map((it) =>
              it.id === itemId ? { ...it, isDone: nextDone } : it,
            );
            const done = items.filter((it) => it.isDone).length;
            return {
              ...c,
              checklist: {
                ...c.checklist,
                items,
                done,
                total: items.length,
                progressPct: items.length
                  ? Math.round((done / items.length) * 100)
                  : 0,
              },
            };
          }),
        };
      }),
    );
    try {
      const res = await fetch(`/api/boards/${boardId}/cards/${cardId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isDone: nextDone }),
      });
      if (!res.ok) {
        await load({ silent: true });
      }
    } catch {
      await load({ silent: true });
    } finally {
      setChecklistBusyId(null);
    }
  }

  useEffect(() => {
    setProjects(data?.projects ?? []);
  }, [data?.projects]);

  const departmentBoards = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        name: p.name,
        isGeneral: p.isGeneral,
      })) ?? [],
    [projects],
  );

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (onReload) {
      await onReload();
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/departments/${deptId}`,
      );
      const text = await res.text();
      let json: { error?: string; data?: DeptData } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(t('common.loadFailed'));
      }
      if (!res.ok) throw new Error(json.error || t('common.loadFailed'));
      setLocalData(json.data ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
      setLocalData(null);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [workspaceId, deptId, onReload, t]);

  const projectLabel = useCallback(
    (project: { name: string; isGeneral?: boolean }) => {
      if (project.isGeneral || isGeneralBoardName(project.name)) {
        return t('departments.general');
      }
      return project.name;
    },
    [t],
  );

  async function handleDragEnd(result: DropResult) {
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
    const sourceProject = projects.find((p) => p.id === fromId);
    const card = sourceProject?.cards[source.index];
    if (!card) return;

    setProjects((prev) => {
      const next = prev.map((p) => ({ ...p, cards: [...p.cards] }));
      const from = next.find((p) => p.id === fromId);
      const to = next.find((p) => p.id === toId);
      if (!from || !to) return prev;
      const [moved] = from.cards.splice(source.index, 1);
      if (!moved) return prev;
      if (fromId === toId) {
        from.cards.splice(destination.index, 0, moved);
        from.cardCount = from.cards.length;
        return next;
      }
      to.cards.splice(destination.index, 0, moved);
      from.cardCount = from.cards.length;
      to.cardCount = to.cards.length;
      return next;
    });

    if (fromId === toId) return;

    try {
      const res = await fetch(`/api/boards/${fromId}/cards/${card.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toBoardId: toId }),
      });
      if (!res.ok) {
        await load({ silent: true });
        return;
      }
    } catch {
      await load({ silent: true });
    }
  }

  function dropProject(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setSettingsProject((cur) => (cur?.id === projectId ? null : cur));
    setDetail((cur) => (cur?.boardId === projectId ? null : cur));
    setCreateForBoardId((cur) => (cur === projectId ? null : cur));
  }

  function dropCard(boardId: string, cardId: string) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== boardId) return p;
        const cards = p.cards.filter((c) => c.id !== cardId);
        return { ...p, cards, cardCount: cards.length };
      }),
    );
    setDetail((cur) => (cur?.cardId === cardId ? null : cur));
  }

  useBoardsLive(workspaceId, (ev) => {
    if (ev.type === 'board.archived') {
      dropProject(ev.boardId);
      return;
    }
    if (ev.type === 'card.deleted') {
      dropCard(ev.boardId, ev.cardId);
      return;
    }
    if (
      ev.type === 'board.changed' ||
      ev.type === 'card.changed' ||
      ev.type === 'department.changed' ||
      ev.type === 'workspace.invalidate'
    ) {
      const evDept =
        'departmentId' in ev ? (ev.departmentId as string | null | undefined) : undefined;
      if (
        evDept &&
        deptId !== 'general' &&
        evDept !== deptId &&
        ev.type !== 'workspace.invalidate'
      ) {
        return;
      }
      if (liveReloadTimer.current) clearTimeout(liveReloadTimer.current);
      liveReloadTimer.current = setTimeout(() => {
        void load({ silent: true });
      }, 120);
    }
  });

  async function deleteProject(projectId: string) {
    if (!window.confirm(t('projectsPage.deleteProjectConfirm'))) return;
    const snapshot = projects;
    dropProject(projectId);
    const res = await fetch(`/api/boards/${projectId}`, { method: 'DELETE' });
    if (!res.ok) {
      setProjects(snapshot);
      const json = await res.json().catch(() => ({}));
      setError(
        json.error === 'Cannot delete the default General project'
          ? t('projectsPage.cannotDeleteGeneral')
          : json.error || t('projectsPage.failed'),
      );
    }
  }

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
        <p className="text-[11px] px-1 pb-2" style={{ color: textMuted(isDark) }}>
          {t('projectsPage.dragTaskHint')}
        </p>
        <DragDropContext
          onDragStart={() => {
            ignoreClickUntil.current = Date.now() + 800;
          }}
          onDragEnd={(r) => {
            ignoreClickUntil.current = Date.now() + 300;
            void handleDragEnd(r);
          }}
        >
        <div className="flex gap-3 items-start overflow-x-auto pt-1 pb-2">
          <AnimatePresence initial={false}>
          {projects.map((project) => (
            <motion.section
              key={project.id}
              layout
              initial={{ opacity: 0, x: 28, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: -36,
                scale: 0.92,
                filter: 'blur(8px)',
              }}
              transition={{
                layout: { type: 'spring', stiffness: 340, damping: 32 },
                opacity: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                x: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.34, ease: [0.16, 1, 0.3, 1] },
              }}
              className="group/project shrink-0 w-[min(300px,calc(100vw-3rem))] sm:w-[320px] rounded-2xl overflow-hidden origin-top"
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
                  <div
                    className="font-semibold text-sm min-w-0 leading-snug inline-flex items-center gap-2"
                    style={{ color: textPrimary(isDark) }}
                  >
                    <ProjectMark
                      name={projectLabel(project)}
                      color={project.coverColor}
                      icon={project.icon}
                      size={28}
                      isDark={isDark}
                    />
                    <span className="min-w-0">
                      {projectLabel(project)}{' '}
                      <span style={{ color: textMuted(isDark) }}>
                        ({project.cardCount})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSettingsProject(project)}
                      className="opacity-0 group-hover/project:opacity-100 focus:opacity-100 p-1.5 rounded-lg inline-flex items-center gap-1 transition-opacity"
                      style={{
                        color: textSecondary(isDark),
                        background: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      }}
                      title={t('projectsPage.editProject')}
                      aria-label={t('projectsPage.editProject')}
                    >
                      <MdEdit size={15} />
                      <span className="text-[10px] font-semibold">{t('common.edit')}</span>
                    </button>
                    {project.canDelete && (
                      <button
                        type="button"
                        onClick={() => void deleteProject(project.id)}
                        className="opacity-0 group-hover/project:opacity-100 focus:opacity-100 p-1.5 rounded-lg inline-flex items-center gap-1 transition-opacity"
                        style={{
                          color: '#ef4444',
                          background: isDark
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(239,68,68,0.08)',
                        }}
                        title={t('projectsPage.deleteProject')}
                        aria-label={t('projectsPage.deleteProject')}
                      >
                        <MdDelete size={15} />
                      </button>
                    )}
                  </div>
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

              <Droppable droppableId={project.id}>
                {(provided, snapshot) => (
                  <ul
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="px-2.5 pb-3 space-y-2 min-h-[96px] rounded-xl mx-1 mb-1"
                    style={{
                      background: snapshot.isDraggingOver
                        ? hexToRgba(project.coverColor, isDark ? 0.22 : 0.14)
                        : 'transparent',
                    }}
                  >
                    {project.cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(drag, snap) => (
                          <li
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            style={drag.draggableProps.style}
                          >
                            <RichTaskCard
                              card={{
                                ...card,
                                checklistItems: card.checklist.items,
                              }}
                              cardBg={isDark ? surfaceItem(isDark) : '#F9FAFB'}
                              isDark={isDark}
                              workspaceId={workspaceId}
                              departmentId={deptId === 'general' ? undefined : deptId}
                              onOpen={() => {
                                if (snap.isDragging || Date.now() < ignoreClickUntil.current) return;
                                setDetail({ boardId: project.id, cardId: card.id });
                              }}
                              checklistBusyId={checklistBusyId}
                              onToggleChecklist={(itemId, nextDone) =>
                                void toggleChecklistOnCard(
                                  project.id,
                                  card.id,
                                  itemId,
                                  nextDone,
                                )
                              }
                            />
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {project.cards.length === 0 && !snapshot.isDraggingOver && (
                      <li
                        className="text-xs text-center py-8"
                        style={{ color: textMuted(isDark) }}
                      >
                        {t('common.noResults')}
                      </li>
                    )}
                  </ul>
                )}
              </Droppable>
            </motion.section>
          ))}
          </AnimatePresence>
          {canCreateBoard && (
            <button
              type="button"
              onClick={() => setCreateProjectOpen(true)}
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
            </button>
          )}

          {projects.length === 0 && !canCreateBoard && (
            <p className="text-sm py-8" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.noProjectsInDept')}
            </p>
          )}
        </div>
        </DragDropContext>
      </div>

      {detail && (
        <CardDetailsModal
          boardId={detail.boardId}
          cardId={detail.cardId}
          open
          onClose={() => setDetail(null)}
          onChanged={() => void load({ silent: true })}
          onDeleted={() => {
            const { boardId, cardId } = detail;
            setDetail(null);
            dropCard(boardId, cardId);
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
          onCreated={() => void load({ silent: true })}
        />
      )}

      <CreateProjectModal
        workspaceId={workspaceId}
        isDark={isDark}
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        lockDepartment
        defaultDepartmentId={deptId === 'general' ? null : deptId}
        departments={[
          {
            id: deptId === 'general' ? null : deptId,
            key: data.key,
            label: data.name,
          },
        ]}
        onCreated={() => void load({ silent: true })}
      />

      {settingsProject && (
        <BoardSettingsDialog
          open
          boardId={settingsProject.id}
          workspaceId={workspaceId}
          initial={{
            name: settingsProject.name,
            description: settingsProject.description ?? null,
            visibility: settingsProject.visibility || 'WORKSPACE',
            background: settingsProject.coverColor,
            color: settingsProject.color ?? null,
            icon: settingsProject.icon ?? null,
            departmentId: deptId === 'general' ? null : deptId,
          }}
          departments={
            deptId === 'general'
              ? []
              : [{ id: deptId, key: data.key, label: data.name }]
          }
          onClose={() => setSettingsProject(null)}
          onSaved={() => {
            setSettingsProject(null);
            void load({ silent: true });
          }}
          isGeneral={Boolean(settingsProject.isGeneral)}
          canDelete={Boolean(settingsProject.canDelete)}
          onDeleted={() => {
            const id = settingsProject.id;
            setSettingsProject(null);
            dropProject(id);
          }}
        />
      )}
    </div>
  );
}
