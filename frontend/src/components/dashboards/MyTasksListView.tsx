'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  MdErrorOutline,
  MdExpandLess,
  MdExpandMore,
  MdFlag,
  MdMoreVert,
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
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

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
  const [reviewFlashId, setReviewFlashId] = useState<string | null>(null);

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
    if (!reviewFlashId) return;
    const t = window.setTimeout(() => setReviewFlashId(null), 1600);
    return () => window.clearTimeout(t);
  }, [reviewFlashId]);

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
      let to = destination.droppableId as KanbanColumnId;
      const droppedOnDone = to === 'done';
      if (droppedOnDone) to = 'review';

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

      const destList = from === to ? srcList : [...snapshot[to]];
      destList.splice(destination.index, 0, {
        ...moved,
        status: to === 'todo' ? 'todo' : to,
      });

      setLocal({
        ...snapshot,
        [from]: from === to ? destList : srcList,
        [to]: destList,
      });
      setError(null);

      if (droppedOnDone) {
        setReviewFlashId(moved.id);
        setHint(t('myTasksPage.sentToReview'));
        setCollapsed((c) => ({ ...c, review: false, done: false }));
      }

      if (from === to && !droppedOnDone) return;

      try {
        await onMoved(moved, droppedOnDone ? 'review' : to);
      } catch (e) {
        setLocal(null);
        setReviewFlashId(null);
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
              background: 'rgba(244,63,94,0.12)',
              color: '#FB7185',
              border: '1px solid rgba(244,63,94,0.3)',
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
                                <ListRow
                                  task={task}
                                  index={index}
                                  isDark={isDark}
                                  accent={sec.accent}
                                  dragging={dragSnap.isDragging}
                                  highlight={
                                    reviewFlashId === task.id &&
                                    sec.id === 'review'
                                  }
                                  onOpen={() => {
                                    if (!dragSnap.isDragging) onOpen(task);
                                  }}
                                  onToggleMilestone={
                                    onToggleMilestone
                                      ? (itemId) =>
                                          onToggleMilestone(task, itemId)
                                      : undefined
                                  }
                                />
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
  highlight,
  onOpen,
  onToggleMilestone,
}: {
  task: MyTaskItem;
  index: number;
  isDark: boolean;
  accent: string;
  dragging: boolean;
  highlight?: boolean;
  onOpen: () => void;
  onToggleMilestone?: (itemId: string) => void;
}) {
  const { t } = useLang();
  const { formatDate } = useCalendar();
  const prio =
    PRIORITY_META[(task.priority || 'NONE').toUpperCase()] || PRIORITY_META.NONE;
  const priorityLabel = localizePriorityShort(task.priority || 'NONE', t);
  const desc = stripHtml(task.description);
  const assignees = task.assignees || [];
  const milestones = milestonesOf(task);
  const mDone = milestones.filter((m) => m.isDone).length;
  const mTotal = milestones.length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!dragging) onOpen();
      }}
      onKeyDown={(e) => {
        if (dragging) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`relative w-full text-start px-3 py-3 transition-shadow duration-200 border-b last:border-b-0 select-none ${GRID} max-lg:flex max-lg:flex-col max-lg:items-stretch max-lg:gap-2`}
      style={{
        background: highlight
          ? hexToRgba('#F43F5E', isDark ? 0.12 : 0.08)
          : tableRowBg(isDark, index),
        borderColor: borderSubtle(isDark),
        boxShadow: dragging
          ? `0 12px 32px ${hexToRgba(accent, 0.28)}`
          : highlight
            ? `inset 0 0 0 1px ${hexToRgba('#F43F5E', 0.45)}`
            : undefined,
      }}
    >
      {/* Task name */}
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-5 h-5 rounded-full inline-flex items-center justify-center shrink-0"
          style={{
            background: hexToRgba(accent, isDark ? 0.3 : 0.15),
            color: accent,
          }}
        >
          <MdRadioButtonUnchecked size={14} />
        </span>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: textPrimary(isDark) }}
        >
          {task.title}
        </span>
      </div>

      {/* Description */}
      <p
        className="text-xs truncate max-lg:pl-7"
        style={{ color: textSecondary(isDark) }}
        title={desc || undefined}
      >
        {desc || (
          <span style={{ color: textMuted(isDark) }}>
            {task.board.name}
          </span>
        )}
      </p>

      {/* Assignees */}
      <div className="flex -space-x-2 max-lg:pl-7">
        {assignees.length === 0 && (
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

      {/* Menu */}
      <span
        className="inline-flex justify-end max-lg:absolute max-lg:end-3 max-lg:top-3"
        style={{ color: textMuted(isDark) }}
        aria-hidden
      >
        <MdMoreVert size={18} />
      </span>
    </div>
  );
}
