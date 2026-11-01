'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  MdAttachFile,
  MdChatBubbleOutline,
  MdCheckCircle,
  MdEdit,
  MdErrorOutline,
  MdExpandLess,
  MdExpandMore,
  MdFlag,
  MdRadioButtonUnchecked,
  MdTimelapse,
} from 'react-icons/md';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba,
  surfaceItem,
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import type { MyTaskItem } from '@/components/dashboards/MyTasksViews';
import type { KanbanColumnId } from '@/components/dashboards/MyTasksKanban';
import { isChecklistBookend } from '@/lib/checklist-defaults';
import { localizeChecklistTitle, localizePriorityShort } from '@/lib/list-i18n';
import { TaskPlaceChips } from '@/components/dashboards/TaskPlaceChips';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { MyTasksEndOfTask } from '@/components/dashboards/MyTasksEndOfTask';
import {
  finishBlockReason,
  applyColumnMove,
  finishDestination,
  relocateTaskToColumn,
  taskLooksCompleted,
} from '@/components/dashboards/my-tasks-finish';

const SECTION_TITLE_KEYS: Record<KanbanColumnId, string> = {
  todo: 'myTasksPage.todo',
  progress: 'myTasksPage.onProcess',
  review: 'myTasksPage.onReview',
  done: 'myTasksPage.completed',
};

const SECTIONS: {
  id: KanbanColumnId;
  accent: string;
  soft: string;
  Icon: typeof MdRadioButtonUnchecked;
}[] = [
  {
    id: 'todo',
    accent: '#3B82F6',
    soft: '#DBEAFE',
    Icon: MdRadioButtonUnchecked,
  },
  {
    id: 'progress',
    accent: '#F59E0B',
    soft: '#FEF3C7',
    Icon: MdTimelapse,
  },
  {
    id: 'review',
    accent: '#F43F5E',
    soft: '#FFE4E6',
    Icon: MdErrorOutline,
  },
  {
    id: 'done',
    accent: '#22C55E',
    soft: '#DCFCE7',
    Icon: MdCheckCircle,
  },
];

const PRIORITY_META: Record<string, { color: string; bg: string }> = {
  URGENT: { color: '#DC2626', bg: 'rgba(220,38,38,0.12)' },
  HIGH: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.14)' },
  LOW: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  NONE: { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

const GRID =
  'grid grid-cols-[minmax(140px,1.4fr)_minmax(120px,1.2fr)_88px_100px_88px_88px_100px_56px_56px_36px] gap-2 items-center';

type ColumnsState = Record<KanbanColumnId, MyTaskItem[]>;

type Props = {
  columns: ColumnsState;
  isDark: boolean;
  onOpen: (task: MyTaskItem) => void;
  onMoved: (task: MyTaskItem, to: KanbanColumnId) => Promise<void>;
  onToggleMilestone?: (task: MyTaskItem, itemId: string) => void;
};

function stripHtml(html: string | null | undefined) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function milestonesOf(task: MyTaskItem) {
  return (task.checklistItems || []).filter((i) => !isChecklistBookend(i.title));
}

export function MyTasksListView({
  columns,
  isDark,
  onOpen,
  onMoved,
  onToggleMilestone,
}: Props) {
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [local, setLocal] = useState<ColumnsState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [completeFlashId, setCompleteFlashId] = useState<string | null>(null);

  const board = local ?? columns;

  useEffect(() => {
    setReady(true);
  }, []);

  // Sync from server only when not dragging (keeps optimistic move until refresh)
  useEffect(() => {
    if (draggingId) return;
    setLocal(null);
  }, [columns, draggingId]);

  useEffect(() => {
    if (!completeFlashId) return;
    const t = window.setTimeout(() => setCompleteFlashId(null), 2200);
    return () => window.clearTimeout(t);
  }, [completeFlashId]);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 3200);
    return () => window.clearTimeout(t);
  }, [hint]);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      setDraggingId(null);

      if (!destination) {
        setLocal(null);
        return;
      }
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const from = source.droppableId as KanbanColumnId;
      const to = destination.droppableId as KanbanColumnId;
      const droppedOnDone = to === 'done';

      const snapshot: ColumnsState = {
        todo: [...board.todo],
        progress: [...board.progress],
        review: [...board.review],
        done: [...board.done],
      };

      const srcList = [...snapshot[from]];
      const [moved] = srcList.splice(source.index, 1);
      if (!moved || moved.id !== draggableId) {
        setLocal(null);
        return;
      }

      const effectiveTo: KanbanColumnId =
        to === 'done' && moved.supervisor?.id ? 'review' : to;
      const landedReview = effectiveTo === 'review' && to === 'done';

      const destList =
        from === effectiveTo ? srcList : [...snapshot[effectiveTo]];
      destList.splice(
        destination.index,
        0,
        applyColumnMove(moved, effectiveTo),
      );

      setLocal({
        ...snapshot,
        [from]: from === effectiveTo ? destList : srcList,
        [effectiveTo]: destList,
      });
      setError(null);

      if (landedReview) {
        setCompleteFlashId(moved.id);
        setHint(t('myTasksPage.sentToReview'));
        setCollapsed((c) => ({ ...c, review: false }));
      } else if (droppedOnDone) {
        setCompleteFlashId(moved.id);
        setHint(t('myTasksPage.movedToCompleted'));
        setCollapsed((c) => ({ ...c, done: false }));
      } else if (effectiveTo === 'review') {
        setHint(t('myTasksPage.sentToReview'));
        setCollapsed((c) => ({ ...c, review: false }));
      } else if (from === 'done' && effectiveTo === 'todo') {
        setHint(t('myTasksPage.resetToTodo'));
        setCollapsed((c) => ({ ...c, [effectiveTo]: false }));
      } else if (from === 'done') {
        setHint(t('myTasksPage.leftCompleted'));
        setCollapsed((c) => ({ ...c, [effectiveTo]: false }));
      }

      if (from === effectiveTo && !droppedOnDone) return;

      try {
        await onMoved(moved, effectiveTo);
      } catch (e) {
        setLocal(null);
        setCompleteFlashId(null);
        setError(e instanceof Error ? e.message : t('common.failed'));
      }
    },
    [board, onMoved, t],
  );

  const finishTask = useCallback(
    async (task: MyTaskItem) => {
      const blocked = finishBlockReason(task);
      if (blocked === 'done') return;
      if (blocked) {
        setError(
          t(
            blocked === 'notStarted'
              ? 'myTasksPage.finishNeedStart'
              : 'myTasksPage.finishNeedMilestones',
          ),
        );
        return;
      }
      const dest = finishDestination(task);
      setLocal(relocateTaskToColumn(board, task.id, dest));
      setCompleteFlashId(task.id);
      setHint(
        dest === 'review'
          ? t('myTasksPage.sentToReview')
          : t('myTasksPage.movedToCompleted'),
      );
      setCollapsed((c) => ({
        ...c,
        [dest]: false,
      }));
      setError(null);
      try {
        await onMoved(task, dest);
      } catch (e) {
        setLocal(null);
        setCompleteFlashId(null);
        setError(e instanceof Error ? e.message : t('common.failed'));
      }
    },
    [board, onMoved, t],
  );

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#F87171',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs font-medium px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(34,197,94,0.12)',
              color: '#4ADE80',
              border: '1px solid rgba(34,197,94,0.35)',
            }}
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>

      {!ready ? (
        <p className="text-xs py-6 text-center" style={{ color: textMuted(isDark) }}>
          {t('common.loading')}
        </p>
      ) : (
      <DragDropContext
        onDragStart={(s) => {
          setDraggingId(s.draggableId);
          // Ensure every drop target is visible while dragging
          setCollapsed({});
        }}
        onDragEnd={(r) => void handleDragEnd(r)}
      >
        <LayoutGroup>
        {SECTIONS.map((sec) => {
          const tasks = board[sec.id] || [];
          const isCollapsed = !!collapsed[sec.id];
          const headerBg = isDark
            ? hexToRgba(sec.accent, 0.16)
            : sec.soft;

          return (
            <section key={sec.id} className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setCollapsed((prev) => ({
                    ...prev,
                    [sec.id]: !prev[sec.id],
                  }))
                }
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-start transition-colors duration-200"
                style={{ background: headerBg }}
              >
                {isCollapsed ? (
                  <MdExpandMore size={20} style={{ color: sec.accent }} />
                ) : (
                  <MdExpandLess size={20} style={{ color: sec.accent }} />
                )}
                <span
                  className="w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0"
                  style={{
                    background: hexToRgba(sec.accent, isDark ? 0.35 : 0.22),
                    color: sec.accent,
                  }}
                >
                  <sec.Icon size={16} />
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: isDark ? textPrimary(isDark) : '#0F172A' }}
                >
                  {t(SECTION_TITLE_KEYS[sec.id])}
                </span>
                <span
                  className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-md"
                  style={{
                    background: hexToRgba(sec.accent, isDark ? 0.28 : 0.18),
                    color: sec.accent,
                  }}
                >
                  {tasks.length}
                </span>
              </button>

              {!isCollapsed && (
                <div
                  className="rounded-2xl"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    background: isDark ? 'transparent' : '#fff',
                  }}
                >
                  <div
                    className={`${GRID} px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide hidden lg:grid`}
                    style={{
                      color: textMuted(isDark),
                      borderBottom: `1px solid ${borderSubtle(isDark)}`,
                      background: isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(15,23,42,0.02)',
                    }}
                  >
                    <span>{t('myTasksPage.colTaskName')}</span>
                    <span>{t('myTasksPage.colDescription')}</span>
                    <span>{t('myTasksPage.colAssignee')}</span>
                    <span>{t('myTasksPage.colChecklist')}</span>
                    <span>{t('myTasksPage.colStart')}</span>
                    <span>{t('myTasksPage.colDue')}</span>
                    <span>{t('myTasksPage.colPriority')}</span>
                    <span>{t('myTasksPage.colAttach')}</span>
                    <span>{t('myTasksPage.colChat')}</span>
                    <span />
                  </div>

                  <Droppable droppableId={sec.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-[72px] transition-colors duration-200"
                        style={{
                          background: snapshot.isDraggingOver
                            ? hexToRgba(sec.accent, isDark ? 0.08 : 0.06)
                            : 'transparent',
                        }}
                      >
                        {tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(drag, dragSnap) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                style={{
                                  ...(drag.draggableProps.style as CSSProperties),
                                  cursor: dragSnap.isDragging
                                    ? 'grabbing'
                                    : 'grab',
                                }}
                              >
                                <motion.div
                                  layoutId={
                                    dragSnap.isDragging
                                      ? undefined
                                      : `my-task-${task.id}`
                                  }
                                  layout={!dragSnap.isDragging}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 380,
                                    damping: 34,
                                  }}
                                >
                                <ListRow
                                  task={task}
                                  index={index}
                                  isDark={isDark}
                                  accent={sec.accent}
                                  dragging={dragSnap.isDragging}
                                  completed={sec.id === 'done'}
                                  highlight={completeFlashId === task.id}
                                  onOpen={() => {
                                    if (!dragSnap.isDragging) onOpen(task);
                                  }}
                                  onFinish={() => void finishTask(task)}
                                  onToggleMilestone={
                                    onToggleMilestone
                                      ? (itemId) =>
                                          onToggleMilestone(task, itemId)
                                      : undefined
                                  }
                                />
                                </motion.div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {tasks.length === 0 && !snapshot.isDraggingOver && (
                          <p
                            className="text-[11px] text-center py-6"
                            style={{ color: textMuted(isDark) }}
                          >
                            {sec.id === 'done'
                              ? t('myTasksPage.emptyApproved')
                              : t('common.noResults')}
                          </p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )}
            </section>
          );
        })}
        </LayoutGroup>
      </DragDropContext>
      )}
    </div>
  );
}

function ListRow({
  task,
  index,
  isDark,
  accent,
  dragging,
  completed,
  highlight,
  onOpen,
  onFinish,
  onToggleMilestone,
}: {
  task: MyTaskItem;
  index: number;
  isDark: boolean;
  accent: string;
  dragging: boolean;
  completed?: boolean;
  highlight?: boolean;
  onOpen: () => void;
  onFinish: () => void;
  onToggleMilestone?: (itemId: string) => void;
}) {
  const { t } = useLang();
  const { formatDate } = useCalendar();
  const prio =
    PRIORITY_META[(task.priority || 'NONE').toUpperCase()] || PRIORITY_META.NONE;
  const priorityLabel = localizePriorityShort(task.priority || 'NONE', t);
  const desc = stripHtml(task.description);
  const assignees = task.assignees || [];
  const supervisor = task.supervisor;
  const milestones = milestonesOf(task);
  const mDone = milestones.filter((m) => m.isDone).length;
  const mTotal = milestones.length;
  const finished = completed || taskLooksCompleted(task);
  const finishBlocked = finishBlockReason(task);
  const placeColor = task.board.color || task.board.department?.color || accent;

  return (
    <div
      className="group/task relative w-full text-start px-3 py-3 ps-4 transition-shadow duration-200 border-b last:border-b-0 select-none overflow-hidden"
      style={{
        background: highlight
          ? hexToRgba('#22C55E', isDark ? 0.2 : 0.14)
          : finished
            ? hexToRgba('#22C55E', isDark ? 0.1 : 0.06)
            : tableRowBg(isDark, index),
        borderColor: finished
          ? hexToRgba('#22C55E', isDark ? 0.35 : 0.22)
          : borderSubtle(isDark),
        boxShadow: dragging
          ? `0 12px 32px ${hexToRgba(accent, 0.28)}`
          : highlight
            ? `inset 0 0 0 2px ${hexToRgba('#22C55E', 0.55)}`
            : undefined,
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!dragging) onOpen();
        }}
        className="absolute top-2.5 end-2.5 z-10 inline-flex items-center justify-center w-8 h-8 rounded-lg opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100 focus:opacity-100 transition-opacity cursor-pointer max-lg:opacity-100"
        style={{
          background: isDark ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.95)',
          color: textSecondary(isDark),
          border: `1px solid ${borderSubtle(isDark)}`,
          boxShadow: isDark
            ? '0 4px 14px rgba(0,0,0,0.35)'
            : '0 4px 12px rgba(15,23,42,0.08)',
        }}
        title={t('board.editTask')}
        aria-label={t('board.editTask')}
      >
        <MdEdit size={15} />
      </button>
      <span
        className="absolute inset-y-0 start-0 w-1"
        style={{ background: placeColor }}
        aria-hidden
      />
      {highlight && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1.5 end-12 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: '#16A34A', color: '#fff' }}
        >
          <MdCheckCircle size={12} />
          {t('myTasksPage.taskCompleted')}
        </motion.span>
      )}
      <div
        className={`${GRID} max-lg:flex max-lg:flex-col max-lg:items-stretch max-lg:gap-2`}
      >
      {/* Task name */}
      <div className="flex items-start gap-2 min-w-0 pe-8">
        <span
          className="w-5 h-5 rounded-full inline-flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: hexToRgba(
              finished ? '#22C55E' : accent,
              isDark ? 0.3 : 0.15,
            ),
            color: finished ? '#22C55E' : accent,
          }}
        >
          {finished ? (
            <MdCheckCircle size={14} />
          ) : (
            <MdRadioButtonUnchecked size={14} />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-sm font-semibold truncate"
              style={{
                color: finished ? textMuted(isDark) : textPrimary(isDark),
                textDecoration: finished ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </span>
            {finished && (
              <span
                className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: hexToRgba('#22C55E', isDark ? 0.28 : 0.16),
                  color: '#16A34A',
                }}
              >
                {t('myTasksPage.taskCompleted')}
              </span>
            )}
          </div>
          <TaskPlaceChips task={task} isDark={isDark} />
        </div>
      </div>

      {/* Description */}
      <p
        className="text-xs truncate max-lg:pl-7"
        style={{ color: textSecondary(isDark) }}
        title={desc || undefined}
      >
        {desc || (
          <span style={{ color: textMuted(isDark) }}>—</span>
        )}
      </p>

      {/* Assignees + supervisor */}
      <div className="flex items-center gap-1.5 -space-x-0 max-lg:pl-7">
        {supervisor && (
          <span
            title={`${t('boardTask.supervisor')}: ${supervisor.name}`}
            className="w-7 h-7 rounded-full text-[9px] font-bold inline-flex items-center justify-center overflow-hidden me-1"
            style={{
              background: isDark ? '#1E293B' : '#E2E8F0',
              color: textPrimary(isDark),
              border: `2px solid ${isDark ? '#14b8a6' : '#14b8a6'}`,
            }}
          >
            {supervisor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={supervisor.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(supervisor.name)
            )}
          </span>
        )}
        {assignees.length === 0 && !supervisor && (
          <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
            —
          </span>
        )}
        {assignees.slice(0, 3).map((a) => (
          <span
            key={a.id}
            title={a.name}
            className="w-7 h-7 rounded-full text-[9px] font-bold inline-flex items-center justify-center overflow-hidden"
            style={{
              background: isDark ? '#1E293B' : '#E2E8F0',
              color: textPrimary(isDark),
              border: `2px solid ${isDark ? surfaceItem(isDark) : '#fff'}`,
            }}
          >
            {a.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(a.name)
            )}
          </span>
        ))}
        {assignees.length > 3 && (
          <span
            className="w-7 h-7 rounded-full text-[9px] font-bold inline-flex items-center justify-center"
            style={{
              background: hexToRgba(accent, 0.2),
              color: accent,
              border: `2px solid ${isDark ? surfaceItem(isDark) : '#fff'}`,
            }}
          >
            +{assignees.length - 3}
          </span>
        )}
      </div>

      {/* Milestone — max 4 visible + scroll */}
      <div className="min-w-0 max-lg:pl-7">
        {mTotal === 0 ? (
          <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
            —
          </span>
        ) : (
          <div className="space-y-0.5">
            <span
              className="text-[10px] font-bold tabular-nums"
              style={{ color: textPrimary(isDark) }}
            >
              {mDone}/{mTotal}
            </span>
            <ul
              className="space-y-0.5 overflow-y-auto overscroll-contain"
              style={{ maxHeight: 52 }}
            >
              {milestones.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    disabled={!onToggleMilestone}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onToggleMilestone?.(m.id);
                    }}
                    className="w-full flex items-center gap-1 text-[10px] leading-tight text-start rounded hover:opacity-90 disabled:cursor-default"
                    style={{
                      color: m.isDone ? textMuted(isDark) : textSecondary(isDark),
                      textDecoration: m.isDone ? 'line-through' : 'none',
                    }}
                    title={m.isDone ? t('myTasksPage.markIncomplete') : t('myTasksPage.markDone')}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border shrink-0"
                      style={{
                        borderColor: m.isDone ? '#22c55e' : borderSubtle(isDark),
                        background: m.isDone ? '#22c55e' : 'transparent',
                      }}
                    />
                    <span className="truncate">{localizeChecklistTitle(m.title, t)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Start */}
      <span
        className="text-xs tabular-nums max-lg:pl-7"
        style={{ color: textSecondary(isDark) }}
      >
        <span className="lg:hidden text-[10px] mr-1" style={{ color: textMuted(isDark) }}>
          {t('myTasksPage.colStart')}
        </span>
        {formatDate(task.startDate)}
      </span>

      {/* Due */}
      <span
        className="text-xs tabular-nums max-lg:pl-7"
        style={{ color: textSecondary(isDark) }}
      >
        <span className="lg:hidden text-[10px] mr-1" style={{ color: textMuted(isDark) }}>
          {t('myTasksPage.colDue')}
        </span>
        {formatDate(task.dueDate)}
      </span>

      {/* Priority */}
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg w-fit max-lg:ml-7"
        style={{ background: prio.bg, color: prio.color }}
      >
        <MdFlag size={12} />
        {priorityLabel}
      </span>

      {/* Attach */}
      <span
        className="inline-flex items-center gap-1 text-xs tabular-nums max-lg:pl-7"
        style={{ color: textMuted(isDark) }}
      >
        <MdAttachFile size={14} />
        {task.attachmentCount ?? 0}
      </span>

      {/* Chat */}
      <span
        className="inline-flex items-center gap-1 text-xs tabular-nums max-lg:pl-7"
        style={{ color: textMuted(isDark) }}
      >
        <MdChatBubbleOutline size={14} />
        {task.commentCount ?? 0}
      </span>

      {/* Edit column spacer (button is absolute) */}
      <span className="hidden lg:block" aria-hidden />
      </div>
      {!finished && (
        <div className="mt-2 max-lg:pl-7 lg:max-w-[220px]">
          <MyTasksEndOfTask
            isDark={isDark}
            blocked={finishBlocked}
            onFinish={onFinish}
          />
        </div>
      )}
    </div>
  );
}
