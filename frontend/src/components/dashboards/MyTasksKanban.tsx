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
  MdAccessTime,
  MdAttachFile,
  MdChatBubbleOutline,
  MdCheckCircle,
  MdEdit,
  MdErrorOutline,
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
} from '@/components/SafeDashboard/theme';
import type { MyTaskItem } from '@/components/dashboards/MyTasksViews';
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

export type KanbanColumnId = 'todo' | 'progress' | 'review' | 'done';

const COLUMN_TITLE_KEYS: Record<KanbanColumnId, string> = {
  todo: 'myTasksPage.todo',
  progress: 'myTasksPage.onProcess',
  review: 'myTasksPage.onReview',
  done: 'myTasksPage.completed',
};

const COLUMNS: {
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

const MILESTONE_MAX_H = 88; // ~4 rows before scroll

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function milestoneItems(task: MyTaskItem) {
  return (task.checklistItems || []).filter((i) => !isChecklistBookend(i.title));
}

type ColumnsState = Record<KanbanColumnId, MyTaskItem[]>;

type Props = {
  columns: ColumnsState;
  isDark: boolean;
  onOpen: (task: MyTaskItem) => void;
  onMoved: (task: MyTaskItem, to: KanbanColumnId) => Promise<void>;
  onToggleMilestone?: (task: MyTaskItem, itemId: string) => void;
};

export function MyTasksKanban({
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
  const [error, setError] = useState<string | null>(null);
  const [completeFlashId, setCompleteFlashId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const board = local ?? columns;

  useEffect(() => {
    setReady(true);
  }, []);

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
      if (!moved || moved.id !== draggableId) return;

      const effectiveTo: KanbanColumnId =
        to === 'done' && moved.supervisor?.id ? 'review' : to;
      const landedReview = effectiveTo === 'review' && to === 'done';

      const destList =
        from === effectiveTo ? srcList : [...snapshot[effectiveTo]];
      const insertAt =
        droppedOnDone && from !== 'review'
          ? Math.min(destination.index, destList.length)
          : destination.index;
      destList.splice(insertAt, 0, applyColumnMove(moved, effectiveTo));

      const next: ColumnsState = {
        ...snapshot,
        [from]: from === effectiveTo ? destList : srcList,
        [effectiveTo]: destList,
      };
      setLocal(next);
      setError(null);

      if (landedReview) {
        setCompleteFlashId(moved.id);
        setHint(t('myTasksPage.sentToReview'));
      } else if (droppedOnDone) {
        setCompleteFlashId(moved.id);
        setHint(t('myTasksPage.movedToCompleted'));
      } else if (effectiveTo === 'review') {
        setHint(t('myTasksPage.sentToReview'));
      } else if (from === 'done' && effectiveTo === 'todo') {
        setHint(t('myTasksPage.resetToTodo'));
      } else if (from === 'done') {
        setHint(t('myTasksPage.leftCompleted'));
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
    <div className="space-y-3">
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
        <p className="text-xs py-8 text-center" style={{ color: textMuted(isDark) }}>
          {t('common.loading')}
        </p>
      ) : (
      <DragDropContext
        onDragStart={(s) => setDraggingId(s.draggableId)}
        onDragEnd={(r) => void handleDragEnd(r)}
      >
        <LayoutGroup>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const tasks = board[col.id] || [];
            const headerBg = isDark
              ? hexToRgba(col.accent, 0.18)
              : col.soft;
            return (
              <div key={col.id} className="min-w-0 flex flex-col gap-3">
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                  style={{ background: headerBg }}
                >
                  <span
                    className="w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0"
                    style={{
                      background: hexToRgba(col.accent, isDark ? 0.35 : 0.2),
                      color: col.accent,
                    }}
                  >
                    <col.Icon size={16} />
                  </span>
                  <span
                    className="text-sm font-bold truncate flex-1"
                    style={{ color: isDark ? textPrimary(isDark) : '#0F172A' }}
                  >
                    {t(COLUMN_TITLE_KEYS[col.id])}
                  </span>
                  <span
                    className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{
                      background: hexToRgba(col.accent, isDark ? 0.28 : 0.18),
                      color: col.accent,
                    }}
                  >
                    {tasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col gap-3 min-h-[120px] rounded-2xl p-1 transition-colors duration-200"
                      style={{
                        background: snapshot.isDraggingOver
                          ? hexToRgba(col.accent, isDark ? 0.1 : 0.08)
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
                              <KanbanCard
                                task={task}
                                isDark={isDark}
                                accent={col.accent}
                                dragging={dragSnap.isDragging}
                                completed={col.id === 'done'}
                                highlight={completeFlashId === task.id}
                                onOpen={() => {
                                  if (!dragSnap.isDragging) onOpen(task);
                                }}
                                onFinish={() => void finishTask(task)}
                                onToggleMilestone={
                                  onToggleMilestone
                                    ? (itemId) => onToggleMilestone(task, itemId)
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
                        <div
                          className="text-[11px] text-center py-8 rounded-2xl border border-dashed"
                          style={{
                            color: textMuted(isDark),
                            borderColor: borderSubtle(isDark),
                          }}
                        >
                          {col.id === 'done'
                            ? t('myTasksPage.emptyApproved')
                            : t('common.noResults')}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
        </LayoutGroup>
      </DragDropContext>
      )}
    </div>
  );
}

function KanbanCard({
  task,
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
  isDark: boolean;
  accent: string;
  dragging: boolean;
  completed?: boolean;
  highlight?: boolean;
  onOpen: () => void;
  onFinish: () => void;
  onToggleMilestone?: (itemId: string) => void;
}) {
  const { formatDue } = useCalendar();
  const { t } = useLang();
  const due = formatDue(task.dueDate);
  const prio =
    PRIORITY_META[(task.priority || 'NONE').toUpperCase()] || PRIORITY_META.NONE;
  const priorityLabel = localizePriorityShort(task.priority || 'NONE', t);
  const milestones = milestoneItems(task);
  const done = milestones.filter((i) => i.isDone).length;
  const total = milestones.length;
  const showMilestone = total > 0;
  const assignees = task.assignees || [];
  const supervisor = task.supervisor;
  const desc = (task.description || '').replace(/\s+/g, ' ').trim();
  const finished = completed || taskLooksCompleted(task);
  const finishBlocked = finishBlockReason(task);
  const placeColor = task.board.color || task.board.department?.color || accent;

  return (
    <div
      className="group/task relative w-full text-start rounded-2xl p-3.5 ps-4 transition-shadow duration-200 select-none overflow-hidden"
      style={{
        background: finished
          ? hexToRgba('#22C55E', isDark ? 0.12 : 0.07)
          : isDark
            ? surfaceItem(isDark)
            : '#FFFFFF',
        border: `1px solid ${
          highlight
            ? hexToRgba('#22C55E', 0.7)
            : finished
              ? hexToRgba('#22C55E', 0.4)
              : borderSubtle(isDark)
        }`,
        boxShadow: dragging
          ? `0 16px 40px ${hexToRgba(accent, 0.35)}`
          : highlight
            ? `0 8px 28px ${hexToRgba('#22C55E', 0.4)}`
            : isDark
              ? '0 4px 18px rgba(0,0,0,0.35)'
              : '0 4px 16px rgba(15,23,42,0.08)',
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
        className="absolute top-2.5 end-2.5 z-10 inline-flex items-center justify-center w-8 h-8 rounded-lg opacity-0 group-hover/task:opacity-100 group-focus-within/task:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
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
        className="absolute inset-y-0 start-0 w-1.5 rounded-s-2xl"
        style={{ background: placeColor }}
        aria-hidden
      />
      {highlight && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0, y: -6 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="absolute -top-2 end-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold z-10"
          style={{ background: '#16A34A', color: '#fff' }}
        >
          <MdCheckCircle size={12} />
          {t('myTasksPage.taskCompleted')}
        </motion.span>
      )}
      <div className="flex items-start justify-between gap-2 mb-2 pe-9">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-medium"
          style={{ color: textMuted(isDark) }}
        >
          <MdAccessTime size={13} />
          {due || t('myTasksPage.noDueDate')}
        </span>
        {finished ? (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{
              background: hexToRgba('#22C55E', isDark ? 0.28 : 0.16),
              color: '#16A34A',
            }}
          >
            <MdCheckCircle size={12} />
            {t('myTasksPage.taskCompleted')}
          </span>
        ) : null}
      </div>

      <p
        className="text-[13px] font-bold leading-snug line-clamp-2"
        style={{
          color: finished ? textMuted(isDark) : textPrimary(isDark),
          textDecoration: finished ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>
      <div className="mt-1.5">
        <TaskPlaceChips task={task} isDark={isDark} />
      </div>
      {desc ? (
        <p
          className="text-[11px] mt-1 line-clamp-2 leading-relaxed"
          style={{ color: textSecondary(isDark) }}
        >
          {desc}
        </p>
      ) : null}

      {showMilestone && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className="text-[11px] font-semibold inline-flex items-center gap-1"
              style={{ color: textSecondary(isDark) }}
            >
              <MdCheckCircle size={13} style={{ color: accent }} />
              {t('myTasksPage.colChecklist')}
            </span>
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{ color: textPrimary(isDark) }}
            >
              {done}/{total}
            </span>
          </div>
          <ul
            className="space-y-1 overflow-y-auto overscroll-contain pr-0.5"
            style={{ maxHeight: MILESTONE_MAX_H }}
          >
            {milestones.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={!onToggleMilestone}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onToggleMilestone?.(item.id);
                  }}
                  className="w-full flex items-start gap-1.5 text-[11px] leading-snug text-start rounded-md px-0.5 py-0.5 hover:opacity-90 transition-opacity disabled:cursor-default"
                  style={{
                    color: item.isDone ? textMuted(isDark) : textSecondary(isDark),
                    textDecoration: item.isDone ? 'line-through' : 'none',
                    opacity: item.isDone ? 0.75 : 1,
                  }}
                  title={item.isDone ? t('myTasksPage.markIncomplete') : t('myTasksPage.markDone')}
                >
                  <span
                    className="mt-0.5 h-3.5 w-3.5 rounded-full border flex-shrink-0 inline-flex items-center justify-center"
                    style={{
                      borderColor: item.isDone ? '#22c55e' : borderSubtle(isDark),
                      background: item.isDone ? '#22c55e' : 'transparent',
                      color: '#fff',
                    }}
                  >
                    {item.isDone ? (
                      <MdCheckCircle size={12} style={{ color: '#fff' }} />
                    ) : null}
                  </span>
                  <span className="line-clamp-1">{localizeChecklistTitle(item.title, t)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(supervisor || assignees.length > 0) && (
        <div className="mt-3 space-y-1.5">
          {supervisor && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium" style={{ color: textMuted(isDark) }}>
                {t('boardTask.supervisor')}
              </span>
              <span
                title={supervisor.name}
                className="w-6 h-6 rounded-full text-[9px] font-bold inline-flex items-center justify-center overflow-hidden"
                style={{
                  background: isDark ? '#1E293B' : '#E2E8F0',
                  color: textPrimary(isDark),
                  border: `2px solid ${isDark ? '#131B2B' : '#fff'}`,
                }}
              >
                {supervisor.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={supervisor.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(supervisor.name)
                )}
              </span>
              <span className="text-[11px] font-medium truncate" style={{ color: textSecondary(isDark) }}>
                {supervisor.name}
              </span>
            </div>
          )}
          {assignees.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium" style={{ color: textMuted(isDark) }}>
                {t('myTasksPage.assigned')}
              </span>
              <div className="flex -space-x-2">
                {assignees.slice(0, 4).map((a) => (
                  <span
                    key={a.id}
                    title={a.name}
                    className="w-6 h-6 rounded-full text-[9px] font-bold inline-flex items-center justify-center overflow-hidden -ml-1 first:ml-0"
                    style={{
                      background: isDark ? '#1E293B' : '#E2E8F0',
                      color: textPrimary(isDark),
                      border: `2px solid ${isDark ? '#131B2B' : '#fff'}`,
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
                {assignees.length > 4 && (
                  <span
                    className="w-6 h-6 rounded-full text-[9px] font-bold inline-flex items-center justify-center -ml-1"
                    style={{
                      background: hexToRgba(accent, 0.2),
                      color: accent,
                      border: `2px solid ${isDark ? '#131B2B' : '#fff'}`,
                    }}
                  >
                    +{assignees.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
          style={{ background: prio.bg, color: prio.color }}
        >
          <MdFlag size={12} />
          {priorityLabel}
        </span>
        <div className="flex items-center gap-2.5" style={{ color: textMuted(isDark) }}>
          <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums">
            <MdAttachFile size={13} />
            {task.attachmentCount ?? 0}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums">
            <MdChatBubbleOutline size={13} />
            {task.commentCount ?? 0}
          </span>
        </div>
      </div>
      {!finished && (
        <div className="mt-3">
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
