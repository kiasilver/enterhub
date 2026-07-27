'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  MdAccessTime,
  MdAdd,
  MdAttachFile,
  MdBusiness,
  MdChatBubbleOutline,
  MdCheck,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdCheckCircle,
  MdClose,
  MdCloudDownload,
  MdCloudUpload,
  MdFilterList,
  MdFlag,
  MdErrorOutline,
  MdMoreHoriz,
  MdPeople,
  MdRadioButtonUnchecked,
  MdSearch,
  MdSend,
  MdStar,
  MdStarBorder,
  MdTimelapse,
  MdViewKanban,
  MdViewList,
} from 'react-icons/md';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import type { Locale } from '@/i18n';
import {
  type BoardCard,
  type BoardColId,
  personByInitials,
} from './showcase-seed';
import {
  demoChrome,
  localizedAnalytics,
  localizedBoardMeta,
  localizedChecklist,
  localizedDepartments,
  localizedInitialBoard,
  localizedMail,
  localizedMyTasks,
  localizedPeople,
  localizedPriority,
  localizedRbac,
  localizedSheetsLog,
} from './showcase-locale';
import { demoTone as tone, DemoAvatar, SHOWCASE_SCROLL } from './demo-ui';
import {
  borderSubtle,
  hexToRgba,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';
/* ── shared atoms ─────────────────────────────────────────── */

function Pri({ value }: { value: string }) {
  const { lang } = useLang();
  const meta = localizedPriority(lang);
  const m = meta[value as keyof typeof meta] || meta.MEDIUM;
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

/* ── 1. Projects: interactive Kanban + List toggle + DnD ─── */

export function DemoProjects({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const boardMeta = localizedBoardMeta(lang);
  const people = localizedPeople(lang);
  const prioMeta = localizedPriority(lang);
  const t = tone(isDark);
  const ready = useClientReady();
  const [cols, setCols] = useState(() => localizedInitialBoard(lang));
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filter, setFilter] = useState<'all' | 'URGENT' | 'HIGH'>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setCols(localizedInitialBoard(lang));
  }, [lang]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filterCard = (c: BoardCard) => filter === 'all' || c.priority === filter;

  const onDragEnd = useCallback((result: DropResult) => {
    setDragging(false);
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    setCols((prev) => {
      const from = source.droppableId as BoardColId;
      const to = destination.droppableId as BoardColId;
      const next = {
        todo: [...prev.todo],
        progress: [...prev.progress],
        review: [...prev.review],
        done: [...prev.done],
      };
      const [moved] = next[from].splice(source.index, 1);
      if (!moved) return prev;
      next[to].splice(destination.index, 0, moved);
      return next;
    });
    setToast(ui.cardMoved);
  }, [ui.cardMoved]);

  const addCard = () => {
    const id = `c${Date.now()}`;
    setCols((prev) => ({
      ...prev,
      todo: [
        {
          id,
          title: ui.newCard,
          priority: 'MEDIUM',
          due: 'TBD',
          labels: ['New'],
          assignees: ['SM'],
          checks: { done: 0, total: 2 },
          comments: 0,
          files: 0,
        },
        ...prev.todo,
      ],
    }));
    setToast(ui.cardAdded);
  };

  const flatList = boardMeta.flatMap((m) =>
    cols[m.id].filter(filterCard).map((c) => ({ ...c, col: m.title, accent: m.accent }))
  );

  const renderCardBody = (card: BoardCard, opts?: { dragging?: boolean; dim?: boolean }) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] font-semibold leading-snug" style={{ color: t.primary }}>
          {card.title}
        </p>
        <Pri value={card.priority} />
      </div>
      <div className="flex flex-wrap gap-1">
        {card.labels.map((l) => (
          <span
            key={l}
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{ background: isDark ? 'rgba(37,99,235,0.2)' : 'rgba(37,99,235,0.1)', color: t.accentSoft }}
          >
            {l}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[9px]" style={{ color: t.muted }}>
        <span className="inline-flex items-center gap-0.5">
          <MdAccessTime size={11} /> {card.due}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MdCheckCircle size={11} /> {card.checks.done}/{card.checks.total}
        </span>
        <span className="inline-flex items-center gap-0.5">
          <MdChatBubbleOutline size={11} /> {card.comments}
        </span>
        {card.files > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <MdAttachFile size={11} /> {card.files}
          </span>
        )}
        <span className="ml-auto flex -space-x-1.5">
          {card.assignees.map((a) => (
            <DemoAvatar key={a} initials={a} size={18} />
          ))}
        </span>
      </div>
      {(opts?.dragging || opts?.dim) && null}
    </div>
  );

  return (
    <div
      className="h-full flex flex-col min-h-0"
      style={{ background: t.canvas, overflow: dragging ? 'visible' : undefined }}
    >
      <header
        className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 flex-shrink-0"
        style={{ background: t.elevated, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="min-w-0 mr-auto flex items-center gap-2.5">
          <div className="flex -space-x-2">
            {people.slice(0, 4).map((p) => (
              <DemoAvatar key={p.id} person={p} size={26} online={p.online} />
            ))}
          </div>
          <div>
            <p className="text-sm font-bold truncate" style={{ color: t.primary }}>
              {lang === 'fa' ? 'پلتفرم · اسپرینت ۲۴' : 'Platform · Sprint 24'}
            </p>
            <p className="text-[10px]" style={{ color: t.muted }}>
              {lang === 'fa' ? 'مهندسی · کارت‌ها را داخل برد بکشید' : 'Engineering · drag cards inside the board'}
            </p>
          </div>
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
          <button
            type="button"
            onClick={() => setView('kanban')}
            className="px-2.5 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1 min-h-[36px]"
            style={{ background: view === 'kanban' ? t.accent : 'transparent', color: view === 'kanban' ? '#fff' : t.muted }}
          >
            <MdViewKanban size={14} /> {ui.kanban}
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className="px-2.5 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1 min-h-[36px]"
            style={{ background: view === 'list' ? t.accent : 'transparent', color: view === 'list' ? '#fff' : t.muted }}
          >
            <MdViewList size={14} /> {ui.list}
          </button>
        </div>
        <div className="flex gap-1">
          {(['all', 'URGENT', 'HIGH'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-2 py-1 rounded-md text-[10px] font-bold min-h-[32px]"
              style={{
                background: filter === f ? (isDark ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.12)') : t.soft,
                color: filter === f ? t.accentSoft : t.muted,
              }}
            >
              {f === 'all' ? ui.all : prioMeta[f]?.label ?? f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={addCard}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white min-h-[36px]"
          style={{ background: t.accent }}
        >
          <MdAdd size={16} /> {lang === 'fa' ? 'افزودن کارت' : 'Add card'}
        </button>
      </header>

      {toast && (
        <div className="px-3 py-1.5 text-[11px] font-semibold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>
          {toast}
        </div>
      )}

      {view === 'list' ? (
        <div className={`flex-1 overflow-auto p-2 sm:p-3 ${SHOWCASE_SCROLL}`}>
          <div className="rounded-xl overflow-hidden" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
            <div
              className="grid grid-cols-[1fr_90px_70px_80px_70px] gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: t.muted, borderBottom: `1px solid ${t.border}`, background: t.soft }}
            >
              <span>{lang === 'fa' ? 'وظیفه' : 'Task'}</span>
              <span>{lang === 'fa' ? 'وضعیت' : 'Status'}</span>
              <span>{lang === 'fa' ? 'اولویت' : 'Priority'}</span>
              <span>{lang === 'fa' ? 'سررسید' : 'Due'}</span>
              <span>{ui.people}</span>
            </div>
            {flatList.map((c) => (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_90px_70px_80px_70px] gap-2 px-3 py-2.5 items-center text-[11px]"
                style={{ borderBottom: `1px solid ${t.border}`, color: t.primary }}
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.title}</p>
                  <p className="text-[9px] truncate" style={{ color: t.muted }}>
                    {c.labels.join(' · ')} · {c.checks.done}/{c.checks.total} checks
                  </p>
                </div>
                <span className="text-[10px] font-bold" style={{ color: c.accent }}>
                  {c.col}
                </span>
                <Pri value={c.priority} />
                <span style={{ color: t.muted }}>{c.due}</span>
                <span className="flex -space-x-1.5">
                  {c.assignees.map((a) => (
                    <DemoAvatar key={a} initials={a} size={20} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : !ready ? (
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: t.muted }}>
          Loading board…
        </div>
      ) : (
        <DragDropContext
          onDragStart={() => setDragging(true)}
          onDragEnd={onDragEnd}
        >
          <div
            className={`flex-1 p-2 sm:p-3 ${dragging ? 'overflow-visible' : `overflow-x-auto ${SHOWCASE_SCROLL}`}`}
            style={dragging ? { overflow: 'visible' } : undefined}
          >
            <div className="flex gap-2.5 h-full min-w-max items-start pb-2">
              {boardMeta.map((col) => {
                const cards = cols[col.id];
                const visibleCount = cards.filter(filterCard).length;
                return (
                  <Droppable
                    droppableId={col.id}
                    key={col.id}
                    renderClone={(provided, snapshot, rubric) => {
                      const card = cols[rubric.source.droppableId as BoardColId][rubric.source.index];
                      if (!card) return <div ref={provided.innerRef} />;
                      return (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="rounded-lg p-2.5 w-[200px] sm:w-[210px] cursor-grabbing"
                          style={{
                            ...provided.draggableProps.style,
                            background: t.elevated,
                            border: `1px solid ${t.accent}`,
                            boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
                            zIndex: 9999,
                          }}
                        >
                          {renderCardBody(card, { dragging: snapshot.isDragging })}
                        </div>
                      );
                    }}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="w-[200px] sm:w-[220px] rounded-xl p-2 flex flex-col gap-2 min-h-[280px]"
                        style={{
                          background: snapshot.isDraggingOver
                            ? isDark
                              ? 'rgba(37,99,235,0.18)'
                              : 'rgba(37,99,235,0.08)'
                            : isDark
                              ? 'rgba(15,23,42,0.85)'
                              : 'rgba(255,255,255,0.85)',
                          border: `1px solid ${t.border}`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 px-1 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.accent }} />
                          <span className="text-[11px] font-bold" style={{ color: t.primary }}>
                            {col.title}
                          </span>
                          <span className="text-[10px] ml-auto font-semibold" style={{ color: t.muted }}>
                            {filter === 'all' ? cards.length : `${visibleCount}/${cards.length}`}
                          </span>
                        </div>
                        {cards.map((card, index) => (
                          <Draggable key={card.id} draggableId={card.id} index={index}>
                            {(drag, snap) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className="rounded-lg p-2.5 cursor-grab active:cursor-grabbing"
                                style={{
                                  ...drag.draggableProps.style,
                                  background: t.card,
                                  border: `1px solid ${t.border}`,
                                  boxShadow: snap.isDragging ? 'none' : isDark ? '0 1px 0 rgba(255,255,255,0.04)' : '0 1px 2px rgba(15,23,42,0.06)',
                                  opacity: snap.isDragging ? 0.35 : filterCard(card) ? 1 : 0.28,
                                }}
                              >
                                {renderCardBody(card)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

/* ── 2. My Tasks: same Kanban as product (MyTasksKanban) ── */

type MyColId = 'todo' | 'progress' | 'review' | 'done';

type DemoMyTaskCard = {
  id: string;
  title: string;
  board: string;
  list: string;
  due: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignees: string[];
  attachments: number;
  comments: number;
  milestones: { id: string; label: string; done: boolean }[];
};

const MY_TASK_COLS: {
  id: MyColId;
  title: string;
  accent: string;
  soft: string;
  Icon: typeof MdRadioButtonUnchecked;
}[] = [
  { id: 'todo', title: 'To Do', accent: '#3B82F6', soft: '#DBEAFE', Icon: MdRadioButtonUnchecked },
  { id: 'progress', title: 'On Process', accent: '#F59E0B', soft: '#FEF3C7', Icon: MdTimelapse },
  { id: 'review', title: 'On Review', accent: '#F43F5E', soft: '#FFE4E6', Icon: MdErrorOutline },
  { id: 'done', title: 'Completed', accent: '#22C55E', soft: '#DCFCE7', Icon: MdCheckCircle },
];

const INITIAL_MY_KANBAN: Record<MyColId, DemoMyTaskCard[]> = {
  todo: [
    {
      id: 't1',
      title: 'Review PR #482',
      board: 'Platform',
      list: 'Backend',
      due: '28 Jul 2026',
      priority: 'HIGH',
      assignees: ['SM', 'AR'],
      attachments: 2,
      comments: 4,
      milestones: [
        { id: 'm1', label: 'Read diff', done: false },
        { id: 'm2', label: 'Leave notes', done: false },
        { id: 'm3', label: 'Request changes', done: false },
      ],
    },
    {
      id: 't2',
      title: 'Update billing copy',
      board: 'Growth',
      list: 'Content',
      due: '30 Jul 2026',
      priority: 'MEDIUM',
      assignees: ['LK'],
      attachments: 0,
      comments: 1,
      milestones: [
        { id: 'm1', label: 'Draft', done: false },
        { id: 'm2', label: 'Legal check', done: false },
      ],
    },
  ],
  progress: [
    {
      id: 't3',
      title: 'Seed demo workspace',
      board: 'Enterhub',
      list: 'Landing',
      due: '27 Jul 2026',
      priority: 'URGENT',
      assignees: ['SM', 'NA'],
      attachments: 3,
      comments: 6,
      milestones: [
        { id: 'm1', label: 'Seed boards', done: true },
        { id: 'm2', label: 'Seed analytics', done: true },
        { id: 'm3', label: 'Wire DnD', done: false },
        { id: 'm4', label: 'Polish cards', done: false },
      ],
    },
    {
      id: 't5',
      title: 'Calendar ICS import',
      board: 'Platform',
      list: 'Integrations',
      due: '01 Aug 2026',
      priority: 'MEDIUM',
      assignees: ['AR'],
      attachments: 1,
      comments: 2,
      milestones: [
        { id: 'm1', label: 'Parse ICS', done: true },
        { id: 'm2', label: 'UI polish', done: false },
      ],
    },
  ],
  review: [
    {
      id: 't4',
      title: 'Meeting overlay QA',
      board: 'Realtime',
      list: 'AV',
      due: '26 Jul 2026',
      priority: 'HIGH',
      assignees: ['LK', 'OF'],
      attachments: 0,
      comments: 5,
      milestones: [
        { id: 'm1', label: 'AV test', done: true },
        { id: 'm2', label: 'Share screen', done: true },
        { id: 'm3', label: 'Creator approval', done: false },
      ],
    },
    {
      id: 't8',
      title: 'Fix mention notifications',
      board: 'Chat',
      list: 'Bugs',
      due: '27 Jul 2026',
      priority: 'URGENT',
      assignees: ['NA'],
      attachments: 1,
      comments: 3,
      milestones: [
        { id: 'm1', label: 'Reproduce', done: true },
        { id: 'm2', label: 'Patch', done: true },
      ],
    },
  ],
  done: [
    {
      id: 't7',
      title: 'Dept performance export',
      board: 'Analytics',
      list: 'Reports',
      due: '24 Jul 2026',
      priority: 'MEDIUM',
      assignees: ['SM', 'LK'],
      attachments: 4,
      comments: 2,
      milestones: [
        { id: 'm1', label: 'CSV', done: true },
        { id: 'm2', label: 'Sheets', done: true },
      ],
    },
  ],
};

const MILESTONE_MAX_H = 88;

function localizedMyKanban(lang: Locale): Record<MyColId, DemoMyTaskCard[]> {
  const clone = JSON.parse(JSON.stringify(INITIAL_MY_KANBAN)) as Record<MyColId, DemoMyTaskCard[]>;
  if (lang !== 'fa') return clone;
  const taskMap = Object.fromEntries(localizedMyTasks(lang).map((t) => [t.id, t]));
  for (const col of Object.keys(clone) as MyColId[]) {
    clone[col] = clone[col].map((task) => {
      const loc = taskMap[task.id];
      if (!loc) return task;
      const milestoneMap = Object.fromEntries(loc.milestones.map((m) => [m.id, m.label]));
      return {
        ...task,
        title: loc.title,
        board: loc.board,
        milestones: task.milestones.map((m) => ({ ...m, label: milestoneMap[m.id] || m.label })),
      };
    });
  }
  return clone;
}

function myTaskCols(lang: Locale) {
  const ui = demoChrome(lang);
  return MY_TASK_COLS.map((col) => ({
    ...col,
    title:
      col.id === 'todo'
        ? ui.todo
        : col.id === 'progress'
          ? ui.onProcess
          : col.id === 'review'
            ? ui.onReview
            : ui.completed,
  }));
}

export function DemoMyTasks({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const people = localizedPeople(lang);
  const prioMeta = localizedPriority(lang);
  const taskCols = myTaskCols(lang);
  const ready = useClientReady();
  const [cols, setCols] = useState(() => localizedMyKanban(lang));
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [reviewFlashId, setReviewFlashId] = useState<string | null>(null);

  useEffect(() => {
    setCols(localizedMyKanban(lang));
  }, [lang]);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(null), 3200);
    return () => window.clearTimeout(id);
  }, [hint]);

  useEffect(() => {
    if (!reviewFlashId) return;
    const id = window.setTimeout(() => setReviewFlashId(null), 1600);
    return () => window.clearTimeout(id);
  }, [reviewFlashId]);

  const onDragEnd = useCallback((result: DropResult) => {
    setDragging(false);
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const from = source.droppableId as MyColId;
    let to = destination.droppableId as MyColId;
    const droppedOnDone = to === 'done';
    if (droppedOnDone && from !== 'done') {
      to = 'review';
    }

    setCols((prev) => {
      const next: Record<MyColId, DemoMyTaskCard[]> = {
        todo: [...prev.todo],
        progress: [...prev.progress],
        review: [...prev.review],
        done: [...prev.done],
      };
      const [moved] = next[from].splice(source.index, 1);
      if (!moved) return prev;
      const dest = from === to ? next[from] : next[to];
      const insertAt =
        droppedOnDone && from !== 'review'
          ? Math.min(destination.index, dest.length)
          : destination.index;
      if (from === to) {
        dest.splice(insertAt, 0, moved);
      } else {
        next[to].splice(insertAt, 0, moved);
      }
      return next;
    });

    if (droppedOnDone && from !== 'done') {
      const movedId = cols[from][source.index]?.id;
      if (movedId) setReviewFlashId(movedId);
      setHint(ui.sentToReview);
    }
  }, [cols, ui.sentToReview]);

  const toggleMilestone = (taskId: string, mid: string) => {
    setCols((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next) as MyColId[]) {
        next[key] = next[key].map((task) =>
          task.id !== taskId
            ? task
            : {
                ...task,
                milestones: task.milestones.map((m) =>
                  m.id === mid ? { ...m, done: !m.done } : m
                ),
              }
        );
      }
      return next;
    });
  };

  const renderCard = (
    task: DemoMyTaskCard,
    accent: string,
    opts?: { dragging?: boolean; highlight?: boolean; style?: React.CSSProperties }
  ) => {
    const prio = prioMeta[task.priority] || prioMeta.MEDIUM;
    const done = task.milestones.filter((m) => m.done).length;
    const total = task.milestones.length;

    return (
      <div
        className="w-full text-left rounded-2xl p-3.5 select-none"
        style={{
          background: isDark ? surfaceItem(isDark) : '#FFFFFF',
          border: `1px solid ${
            opts?.highlight ? hexToRgba('#F43F5E', 0.55) : borderSubtle(isDark)
          }`,
          boxShadow: opts?.dragging
            ? `0 16px 40px ${hexToRgba(accent, 0.35)}`
            : opts?.highlight
              ? `0 8px 28px ${hexToRgba('#F43F5E', 0.35)}`
              : isDark
                ? '0 4px 18px rgba(0,0,0,0.35)'
                : '0 4px 16px rgba(15,23,42,0.08)',
          ...opts?.style,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium"
            style={{ color: textMuted(isDark) }}
          >
            <MdAccessTime size={13} />
            Due: {task.due}
          </span>
          <span className="p-0.5 rounded-md" style={{ color: textMuted(isDark) }} aria-hidden>
            <MdMoreHoriz size={16} />
          </span>
        </div>

        <p className="text-[13px] font-bold leading-snug line-clamp-2" style={{ color: textPrimary(isDark) }}>
          {task.title}
        </p>
        <p className="text-[11px] mt-1 truncate" style={{ color: textMuted(isDark) }}>
          {task.board} · {task.list}
        </p>

        {total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className="text-[11px] font-semibold inline-flex items-center gap-1"
                style={{ color: textSecondary(isDark) }}
              >
                <MdCheckCircle size={13} style={{ color: accent }} />
                Milestone
              </span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: textPrimary(isDark) }}>
                {done}/{total}
              </span>
            </div>
            <ul
              className="space-y-1 overflow-y-auto overscroll-contain pr-0.5"
              style={{ maxHeight: MILESTONE_MAX_H }}
            >
              {task.milestones.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleMilestone(task.id, item.id);
                    }}
                    className="w-full flex items-start gap-1.5 text-[11px] leading-snug text-left rounded-md px-0.5 py-0.5 hover:opacity-90"
                    style={{
                      color: item.done ? textMuted(isDark) : textSecondary(isDark),
                      textDecoration: item.done ? 'line-through' : 'none',
                      opacity: item.done ? 0.75 : 1,
                    }}
                  >
                    <span
                      className="mt-0.5 h-3.5 w-3.5 rounded-full border flex-shrink-0 inline-flex items-center justify-center"
                      style={{
                        borderColor: item.done ? '#22c55e' : borderSubtle(isDark),
                        background: item.done ? '#22c55e' : 'transparent',
                        color: '#fff',
                      }}
                    >
                      {item.done ? <MdCheckCircle size={12} style={{ color: '#fff' }} /> : null}
                    </span>
                    <span className="line-clamp-1">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-medium" style={{ color: textMuted(isDark) }}>
            Assigned for
          </span>
          <div className="flex -space-x-2">
            {task.assignees.map((a) => (
              <span
                key={a}
                className="inline-flex rounded-full overflow-hidden"
                style={{ border: `2px solid ${isDark ? '#131B2B' : '#fff'}` }}
              >
                <DemoAvatar initials={a} size={24} />
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg"
            style={{ background: prio.bg, color: prio.color }}
          >
            <MdFlag size={12} />
            {prio.label}
          </span>
          <div className="flex items-center gap-2.5" style={{ color: textMuted(isDark) }}>
            <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums">
              <MdAttachFile size={13} />
              {task.attachments}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums">
              <MdChatBubbleOutline size={13} />
              {task.comments}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full flex flex-col min-h-0 p-3 sm:p-4"
      style={{ background: isDark ? '#0F172A' : '#F1F5F9', overflow: dragging ? 'visible' : undefined }}
      dir="ltr"
    >
      <div className="flex items-center justify-between gap-2 mb-3 flex-shrink-0">
        <div>
          <h3 className="text-sm font-bold" style={{ color: textPrimary(isDark) }}>
            {lang === 'fa' ? 'وظایف من' : 'My Tasks'}
          </h3>
          <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
            {ui.kanban} · {lang === 'fa' ? 'کارت بکشید · نقاط عطف را تغییر دهید' : 'drag cards · toggle milestones'}
          </p>
        </div>
        <div className="flex -space-x-2">
          {people.slice(0, 4).map((p) => (
            <DemoAvatar key={p.id} person={p} size={26} online={p.online} />
          ))}
        </div>
      </div>

      {hint && (
        <p
          className="text-xs font-medium px-3 py-2 rounded-xl mb-3 flex-shrink-0"
          style={{
            background: 'rgba(244,63,94,0.12)',
            color: '#FB7185',
            border: '1px solid rgba(244,63,94,0.3)',
          }}
        >
          {hint}
        </p>
      )}

      {!ready ? (
        <p className="text-xs py-8 text-center" style={{ color: textMuted(isDark) }}>
          Loading board…
        </p>
      ) : (
        <DragDropContext
          onDragStart={() => setDragging(true)}
          onDragEnd={onDragEnd}
        >
          <div
            className={`flex-1 min-h-0 ${dragging ? 'overflow-visible' : `overflow-x-auto ${SHOWCASE_SCROLL}`}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start min-w-[min(720px,100%)] sm:min-w-[720px] xl:min-w-0 pb-2">
              {taskCols.map((col) => {
                const tasks = cols[col.id];
                const headerBg = isDark ? hexToRgba(col.accent, 0.18) : col.soft;
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
                        {col.title}
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

                    <Droppable
                      droppableId={col.id}
                      renderClone={(provided, snapshot, rubric) => {
                        const srcCol = rubric.source.droppableId as MyColId;
                        const task = cols[srcCol][rubric.source.index];
                        const srcMeta = taskCols.find((c) => c.id === srcCol)!;
                        if (!task) return <div ref={provided.innerRef} />;
                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              zIndex: 9999,
                              width: 260,
                            }}
                          >
                            {renderCard(task, srcMeta.accent, {
                              dragging: snapshot.isDragging,
                            })}
                          </div>
                        );
                      }}
                    >
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
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(drag, dragSnap) => (
                                <div
                                  ref={drag.innerRef}
                                  {...drag.draggableProps}
                                  {...drag.dragHandleProps}
                                  style={{
                                    ...drag.draggableProps.style,
                                    cursor: dragSnap.isDragging ? 'grabbing' : 'grab',
                                    opacity: dragSnap.isDragging ? 0.35 : 1,
                                  }}
                                >
                                  {renderCard(task, col.accent, {
                                    highlight: reviewFlashId === task.id && col.id === 'review',
                                  })}
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
                              {col.id === 'done' ? ui.approvedHere : ui.dropHere}
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

/* ── 3. Departments: org cards + detail drawer ── */

export function DemoDepartments({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const t = tone(isDark);
  const [view, setView] = useState<'list' | 'overview'>('list');
  const [depts, setDepts] = useState(() => localizedDepartments(lang));
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setDepts(localizedDepartments(lang));
  }, [lang]);

  const filtered = depts.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()));
  const totals = {
    depts: depts.length,
    people: depts.reduce((s, d) => s + d.members, 0),
    open: depts.reduce((s, d) => s + d.open, 0),
    pct: Math.round(depts.reduce((s, d) => s + d.donePct, 0) / depts.length),
  };

  return (
    <div className={`h-full flex flex-col min-h-0 overflow-hidden ${SHOWCASE_SCROLL}`} style={{ background: t.canvas }}>
      <div className="px-4 pt-3 pb-2 flex flex-wrap items-end justify-between gap-3 flex-shrink-0">
        <div>
          <p className="text-[10px] font-medium mb-0.5" style={{ color: t.muted }}>
            Apps / Departments
          </p>
          <h3 className="text-base font-bold" style={{ color: t.primary }}>
            Departments <span style={{ color: t.muted }}>· {view}</span>
          </h3>
        </div>
        <div className="inline-flex p-1 rounded-2xl" style={{ background: t.soft, border: `1px solid ${t.border}` }}>
          {(['list', 'overview'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize"
              style={{
                background: view === v ? (isDark ? '#1E293B' : '#fff') : 'transparent',
                color: view === v ? t.primary : t.muted,
              }}
            >
              {v === 'list' ? ui.list : ui.overview}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-2 grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
        {[
          { label: ui.departments, value: totals.depts, color: '#06b6d4' },
          { label: ui.people, value: totals.people, color: '#3b82f6' },
          { label: ui.openTasks, value: totals.open, color: '#f59e0b' },
          { label: ui.overall, value: `${totals.pct}%`, color: '#8b5cf6' },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl p-3" style={{ background: surfaceItem(isDark), border: `1px solid ${t.border}` }}>
            <p className="text-[10px]" style={{ color: t.muted }}>
              {k.label}
            </p>
            <p className="text-lg font-bold tabular-nums" style={{ color: k.color }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-2 flex gap-2 flex-shrink-0">
        <div className="relative flex-1">
          <MdSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: t.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={ui.searchDepts}
            className="w-full rounded-xl pl-8 pr-2 py-2 text-[11px] outline-none bg-transparent"
            style={{ border: `1px solid ${t.border}`, color: t.primary }}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const id = `d${Date.now()}`;
            setDepts((prev) => [
              ...prev,
              {
                id,
                name: ui.newDepartment,
                key: 'NEW',
                managers: ['You'],
                supervisors: [],
                members: 1,
                boards: 0,
                open: 0,
                done: 0,
                overdue: 0,
                donePct: 0,
                color: '#64748B',
              },
            ]);
            setSelected(id);
            setView('list');
          }}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold text-white"
          style={{ background: '#2563EB' }}
        >
          <MdAdd size={15} /> {ui.newDepartment}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
        {view === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((d) => {
              const active = selected === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelected(d.id)}
                  className="text-left rounded-2xl p-4 transition-colors"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${active ? d.color : t.border}`,
                    boxShadow: active ? `inset 0 0 0 1px ${hexToRgba(d.color, 0.35)}` : undefined,
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: hexToRgba(d.color, 0.15), color: d.color }}
                    >
                      <MdBusiness size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: t.primary }}>
                            {d.name}
                          </p>
                          <p className="text-[10px]" style={{ color: t.muted }}>
                            {d.members} people · {d.boards} projects
                          </p>
                        </div>
                        <span className="text-sm font-bold tabular-nums" style={{ color: d.donePct >= 70 ? '#22c55e' : d.donePct >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {d.donePct}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: t.soft }}>
                        <div className="h-full rounded-full" style={{ width: `${d.donePct}%`, background: d.color }} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    {[
                      [ui.open, d.open, '#3b82f6'],
                      [ui.done, d.done, '#22c55e'],
                      [ui.overdue, d.overdue, '#ef4444'],
                    ].map(([label, val, col]) => (
                      <div key={String(label)} className="rounded-lg px-2 py-1.5 text-center" style={{ background: surfaceItem(isDark), border: `1px solid ${t.border}` }}>
                        <p className="text-sm font-black tabular-nums" style={{ color: String(col) }}>
                          {val}
                        </p>
                        <p className="text-[9px]" style={{ color: t.muted }}>
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex flex-wrap gap-1.5" style={{ borderTop: `1px solid ${t.border}` }}>
                    {d.managers.map((m) => (
                      <span key={m} className="text-[9px] font-semibold px-2 py-1 rounded-lg" style={{ background: surfaceItem(isDark), color: t.secondary, border: `1px solid ${t.border}` }}>
                        Mgr · {m.split(' ')[0]}
                      </span>
                    ))}
                    {d.supervisors.map((m) => (
                      <span key={m} className="text-[9px] font-semibold px-2 py-1 rounded-lg" style={{ background: surfaceItem(isDark), color: t.secondary, border: `1px solid ${t.border}` }}>
                        Lead · {m.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 min-h-[200px]" style={{ background: 'transparent', border: `1px solid ${t.border}` }}>
              <p className="text-xs font-bold mb-3" style={{ color: t.primary }}>
                Completion %
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={depts.map((d) => ({ name: d.key, pct: d.donePct, fill: d.color }))}>
                  <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                  <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                    {depts.map((d) => (
                      <Cell key={d.id} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl p-4 space-y-2" style={{ background: 'transparent', border: `1px solid ${t.border}` }}>
              <p className="text-xs font-bold mb-2" style={{ color: t.primary }}>
                Department scorecard
              </p>
              {[...depts]
                .sort((a, b) => b.donePct - a.donePct)
                .map((d) => (
                  <div key={d.id} className="rounded-xl px-3 py-2" style={{ background: surfaceItem(isDark), border: `1px solid ${t.border}` }}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span style={{ color: t.primary }}>{d.name}</span>
                      <span style={{ color: d.color }}>{d.donePct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: t.soft }}>
                      <div className="h-full" style={{ width: `${d.donePct}%`, background: d.color }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 4. Analytics: dashboard with lead rebalance ── */

export function DemoAnalytics({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const analytics = localizedAnalytics(lang);
  const people = localizedPeople(lang);
  const t = tone(isDark);
  const [tab, setTab] = useState<'home' | 'lead' | 'people'>('home');
  const [lead, setLead] = useState(analytics.lead);
  const tip = {
    background: t.elevated,
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    fontSize: 11,
    color: t.primary,
  };

  useEffect(() => {
    setLead(localizedAnalytics(lang).lead);
  }, [lang]);

  const rebalance = () => {
    setLead((prev) => {
      const sorted = [...prev].sort((a, b) => b.load - a.load);
      if (sorted.length < 2) return prev;
      const heavy = { ...sorted[0], tasks: Math.max(1, sorted[0].tasks - 1), load: Math.max(40, sorted[0].load - 8) };
      const light = {
        ...sorted[sorted.length - 1],
        tasks: sorted[sorted.length - 1].tasks + 1,
        load: Math.min(95, sorted[sorted.length - 1].load + 8),
      };
      return prev.map((p) => (p.id === heavy.id ? heavy : p.id === light.id ? light : p));
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0" style={{ background: t.canvas }}>
      <div
        className="px-3 py-2.5 flex flex-wrap items-center gap-2 flex-shrink-0"
        style={{ background: t.elevated, borderBottom: `1px solid ${t.border}` }}
      >
        <h3 className="text-sm font-bold mr-auto" style={{ color: t.primary }}>
          Analytics
        </h3>
        {(['home', 'lead', 'people'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize min-h-[36px]"
            style={{ background: tab === id ? t.accent : t.soft, color: tab === id ? '#fff' : t.muted }}
          >
            {id === 'home' ? 'Home' : id === 'lead' ? 'Lead' : 'People'}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto p-3 space-y-3 ${SHOWCASE_SCROLL}`}>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {analytics.kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-3"
              style={{ background: t.elevated, border: `1px solid ${t.border}` }}
            >
              <p className="text-[10px] font-semibold mb-1" style={{ color: t.muted }}>
                {k.label}
              </p>
              <p className="text-xl font-black tracking-tight" style={{ color: t.primary }}>
                {k.value}
              </p>
              <p className="text-[10px] font-bold mt-0.5" style={{ color: k.good ? '#22C55E' : '#F59E0B' }}>
                {k.delta}
              </p>
            </div>
          ))}
        </div>

        {tab === 'home' && (
          <>
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-3">
              <div className="rounded-xl p-3 min-h-[220px]" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-bold" style={{ color: t.primary }}>
                    Weekly throughput
                  </p>
                  <span className="text-[10px]" style={{ color: t.muted }}>
                    Completed vs delayed
                  </span>
                </div>
                <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...analytics.weekly]}>
                      <defs>
                        <linearGradient id="doneFillA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="delayFillA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#F43F5E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={t.border} vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip contentStyle={tip} />
                      <Area type="monotone" dataKey="completed" stroke="#2563EB" fill="url(#doneFillA)" strokeWidth={2} />
                      <Area type="monotone" dataKey="delayed" stroke="#F43F5E" fill="url(#delayFillA)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl p-3 min-h-[220px]" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
                <p className="text-[12px] font-bold mb-2" style={{ color: t.primary }}>
                  Status mix
                </p>
                <div className="h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[...analytics.statusMix]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {analytics.statusMix.map((s) => (
                          <Cell key={s.name} fill={s.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tip} />
                      <Legend
                        verticalAlign="bottom"
                        height={28}
                        wrapperStyle={{ fontSize: 10, color: t.muted }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-3 min-h-[200px]" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
              <p className="text-[12px] font-bold mb-2" style={{ color: t.primary }}>
                Department delivery · done / review / delay
              </p>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[...analytics.bars]} barGap={4}>
                    <CartesianGrid stroke={t.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tip} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="done" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="review" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="delay" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab === 'lead' && (
          <div className="grid lg:grid-cols-[1fr_1fr] gap-3">
            <div className="rounded-xl p-3 space-y-3" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold" style={{ color: t.primary }}>
                  Lead workload
                </p>
                <button
                  type="button"
                  onClick={rebalance}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
                  style={{ background: t.accent }}
                >
                  Rebalance +1
                </button>
              </div>
              {lead.map((l) => {
                const person = people.find((p) => p.id === l.id);
                return (
                  <div key={l.id} className="flex items-center gap-2.5">
                    <DemoAvatar person={person} size={32} online={person?.online} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="font-semibold" style={{ color: t.primary }}>
                          {l.name}
                        </span>
                        <span style={{ color: t.muted }}>
                          {l.tasks} tasks · {l.load}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: t.soft }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${l.load}%`, background: l.load > 85 ? '#EF4444' : t.accent }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl p-3 min-h-[240px]" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
              <p className="text-[12px] font-bold mb-2" style={{ color: t.primary }}>
                Load trend (demo)
              </p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lead.map((l, i) => ({
                      name: l.name.split(' ')[0],
                      load: l.load,
                      tasks: l.tasks * 6,
                      idx: i,
                    }))}
                  >
                    <CartesianGrid stroke={t.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: t.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={tip} />
                    <Line type="monotone" dataKey="load" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: '#2563EB' }} />
                    <Line type="monotone" dataKey="tasks" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {tab === 'people' && (
          <div className="rounded-xl overflow-hidden" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
            <div
              className="grid grid-cols-[1.4fr_80px_80px_70px] gap-2 px-3 py-2 text-[10px] font-bold uppercase"
              style={{ color: t.muted, background: t.soft, borderBottom: `1px solid ${t.border}` }}
            >
              <span>Employee</span>
              <span>On-time</span>
              <span>Delay %</span>
              <span>Score</span>
            </div>
            {analytics.employees.map((e) => {
              const person = personByInitials(e.initials) || people.find((p) => p.id === e.id);
              return (
                <div
                  key={e.id}
                  className="grid grid-cols-[1.4fr_80px_80px_70px] gap-2 px-3 py-2.5 items-center text-[11px]"
                  style={{ borderBottom: `1px solid ${t.border}`, color: t.primary }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DemoAvatar person={person} size={28} online={person?.online} />
                    <span className="font-semibold truncate">{e.name}</span>
                  </div>
                  <span style={{ color: '#22C55E' }}>{e.onTime}%</span>
                  <span style={{ color: e.delayRate > 12 ? '#F43F5E' : t.muted }}>{e.delayRate}%</span>
                  <span className="font-bold">{e.score.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


/* Re-exported product-matched demos */
export { DemoChatMeetings, DemoCalendar, DemoTeamGuests, DemoWorkTrends } from './ShowcaseProductDemos';

/* ── 7. Sheets settings page ── */

export function DemoSheets({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const t = tone(isDark);
  const [connected, setConnected] = useState(true);
  const [log, setLog] = useState(() => localizedSheetsLog(lang));
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLog(localizedSheetsLog(lang));
  }, [lang]);

  const run = (dir: 'export' | 'import', name: string) => {
    setBusy(dir);
    window.setTimeout(() => {
      setLog((prev) => [{ id: `s${Date.now()}`, name, when: ui.justNow, dir }, ...prev]);
      setBusy(null);
    }, 700);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: t.canvas }}>
      <div className="max-w-xl mx-auto p-4 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.muted }}>
            Settings · Integrations
          </p>
          <h3 className="text-lg font-black" style={{ color: t.primary }}>
            Google Sheets
          </h3>
        </div>
        <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white" style={{ background: '#0F9D58' }}>
            S
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: t.primary }}>
              {connected ? ui.connected : ui.notConnected}
            </p>
            <p className="text-[11px] truncate" style={{ color: t.muted }}>
              {connected ? 'ops@novabuild.io' : ui.connectHint}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConnected((c) => !c)}
            className="px-3 py-2 rounded-xl text-[11px] font-bold"
            style={{
              background: connected ? 'rgba(239,68,68,0.15)' : '#2563EB',
              color: connected ? '#EF4444' : '#fff',
            }}
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!connected || busy !== null}
            onClick={() => run('export', 'Board export · Sprint 24')}
            className="rounded-2xl p-4 text-left disabled:opacity-40"
            style={{ background: t.elevated, border: `1px solid ${t.border}` }}
          >
            <MdCloudUpload size={22} style={{ color: '#3B82F6' }} />
            <p className="text-[12px] font-bold mt-2" style={{ color: t.primary }}>
              {busy === 'export' ? ui.exporting : ui.exportBoard}
            </p>
            <p className="text-[10px]" style={{ color: t.muted }}>
              {lang === 'fa' ? 'ایجاد شیت در درایو' : 'Create spreadsheet in Drive'}
            </p>
          </button>
          <button
            type="button"
            disabled={!connected || busy !== null}
            onClick={() => run('import', 'Import · Ops backlog')}
            className="rounded-2xl p-4 text-left disabled:opacity-40"
            style={{ background: t.elevated, border: `1px solid ${t.border}` }}
          >
            <MdCloudDownload size={22} style={{ color: '#22C55E' }} />
            <p className="text-[12px] font-bold mt-2" style={{ color: t.primary }}>
              {busy === 'import' ? ui.importing : ui.importSheet}
            </p>
            <p className="text-[10px]" style={{ color: t.muted }}>
              {lang === 'fa' ? 'ردیف‌ها → کارت برد' : 'Rows → board cards'}
            </p>
          </button>
        </div>
        <div className="rounded-2xl p-3 space-y-2" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
          <p className="text-[11px] font-bold" style={{ color: t.primary }}>
            Activity
          </p>
          {log.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-[11px]">
              {r.dir === 'export' ? <MdCloudUpload size={14} style={{ color: '#3B82F6' }} /> : <MdCloudDownload size={14} style={{ color: '#22C55E' }} />}
              <span className="flex-1 truncate" style={{ color: t.primary }}>
                {r.name}
              </span>
              <span style={{ color: t.muted }}>{r.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 9. Messaging = email client (different from chat) ── */

export function DemoMessaging({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const t = tone(isDark);
  const [mails, setMails] = useState(() => localizedMail(lang));
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
  const [active, setActive] = useState('e1');
  const current = mails.find((m) => m.id === active);

  useEffect(() => {
    setMails(localizedMail(lang));
  }, [lang]);

  const list = mails.filter((m) => m.folder === folder);

  return (
    <div className="h-full grid grid-cols-[88px_1fr] sm:grid-cols-[200px_1fr_1.1fr] min-h-0" style={{ background: t.card }}>
      <aside className="p-2 space-y-1" style={{ background: isDark ? '#111827' : '#F1F5F9', borderRight: `1px solid ${t.border}` }}>
        {(['inbox', 'sent'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFolder(f)}
            className="w-full rounded-lg px-2 py-2 text-[11px] font-bold capitalize text-left"
            style={{ background: folder === f ? '#2563EB' : 'transparent', color: folder === f ? '#fff' : t.muted }}
          >
            {f}
          </button>
        ))}
      </aside>
      <div className="overflow-y-auto min-h-0" style={{ borderRight: `1px solid ${t.border}` }}>
        {list.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setActive(m.id);
              setMails((prev) => prev.map((x) => (x.id === m.id ? { ...x, unread: false } : x)));
            }}
            className="w-full text-left px-3 py-2.5"
            style={{
              background: active === m.id ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)') : 'transparent',
              borderBottom: `1px solid ${t.border}`,
            }}
          >
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold truncate flex-1" style={{ color: t.primary, fontWeight: m.unread ? 800 : 600 }}>
                {m.from}
              </p>
              <span className="text-[9px]" style={{ color: t.muted }}>
                {m.time}
              </span>
            </div>
            <p className="text-[11px] truncate" style={{ color: t.primary }}>
              {m.subject}
            </p>
            <p className="text-[10px] truncate" style={{ color: t.muted }}>
              {m.preview}
            </p>
          </button>
        ))}
      </div>
      <div className="hidden sm:flex flex-col p-4 min-h-0 overflow-y-auto" style={{ background: t.elevated }}>
        {current ? (
          <>
            <div className="flex items-start gap-2 mb-3">
              <div className="flex-1">
                <h4 className="text-base font-bold" style={{ color: t.primary }}>
                  {current.subject}
                </h4>
                <p className="text-[11px]" style={{ color: t.muted }}>
                  {current.from} · {current.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMails((prev) => prev.map((x) => (x.id === current.id ? { ...x, unread: !x.unread } : x)))}
                style={{ color: '#F59E0B' }}
              >
                {current.unread ? <MdStar size={18} /> : <MdStarBorder size={18} />}
              </button>
            </div>
            <p className="text-[13px] leading-relaxed flex-1" style={{ color: t.primary }}>
              {current.preview} This is a seeded mailbox preview — replies stay local in the landing demo so visitors can feel the real Enterhub email client without signing in.
            </p>
            <button type="button" className="mt-4 self-start px-4 py-2 rounded-xl text-[12px] font-bold text-white" style={{ background: '#2563EB' }}>
              Reply
            </button>
          </>
        ) : (
          <p style={{ color: t.muted }}>Select a message</p>
        )}
      </div>
    </div>
  );
}

/* ── 11. Checklists split pane ── */

export function DemoChecklists({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const checklistCards = localizedChecklist(lang);
  const t = tone(isDark);
  const [cardId, setCardId] = useState('ck1');
  const [items, setItems] = useState([
    { id: 'i1', label: ui.startTask, done: true, bookend: true },
    { id: 'i2', label: lang === 'fa' ? 'پر کردن داده دمو' : 'Seed demo data', done: true, bookend: false },
    { id: 'i3', label: lang === 'fa' ? 'ساخت پیش‌نمایش برد' : 'Build board preview', done: true, bookend: false },
    { id: 'i4', label: lang === 'fa' ? 'اتصال تعویض‌کننده ویژگی' : 'Wire feature switcher', done: false, bookend: false },
    { id: 'i5', label: lang === 'fa' ? 'پرداخت انیمیشن' : 'Polish motion', done: false, bookend: false },
    { id: 'i6', label: ui.endOfTask, done: false, bookend: true },
  ]);
  const done = items.filter((i) => i.done).length;
  const card = checklistCards.find((c) => c.id === cardId)!;

  useEffect(() => {
    const c = demoChrome(lang);
    setItems([
      { id: 'i1', label: c.startTask, done: true, bookend: true },
      { id: 'i2', label: lang === 'fa' ? 'پر کردن داده دمو' : 'Seed demo data', done: true, bookend: false },
      { id: 'i3', label: lang === 'fa' ? 'ساخت پیش‌نمایش برد' : 'Build board preview', done: true, bookend: false },
      { id: 'i4', label: lang === 'fa' ? 'اتصال تعویض‌کننده ویژگی' : 'Wire feature switcher', done: false, bookend: false },
      { id: 'i5', label: lang === 'fa' ? 'پرداخت انیمیشن' : 'Polish motion', done: false, bookend: false },
      { id: 'i6', label: c.endOfTask, done: false, bookend: true },
    ]);
  }, [lang]);

  return (
    <div className="h-full grid md:grid-cols-[240px_1fr] min-h-0" style={{ background: t.canvas }}>
      <div className="overflow-y-auto p-2 space-y-1.5" style={{ background: t.elevated, borderRight: `1px solid ${t.border}` }}>
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: t.muted }}>
          Cards
        </p>
        {checklistCards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCardId(c.id)}
            className="w-full text-left rounded-xl px-3 py-2.5"
            style={{
              background: cardId === c.id ? (isDark ? 'rgba(59,130,246,0.2)' : 'rgba(37,99,235,0.1)') : t.soft,
              border: `1px solid ${cardId === c.id ? '#3B82F6' : 'transparent'}`,
            }}
          >
            <p className="text-[12px] font-bold" style={{ color: t.primary }}>
              {c.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Pri value={c.priority} />
              <span className="text-[10px] capitalize" style={{ color: t.muted }}>
                {c.status}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="p-4 overflow-y-auto">
        <div className="max-w-md mx-auto rounded-2xl p-4" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-base font-bold" style={{ color: t.primary }}>
                {card.title}
              </p>
              <p className="text-[11px] capitalize" style={{ color: '#F59E0B' }}>
                {card.status}
              </p>
            </div>
            <Pri value={card.priority} />
          </div>
          <div className="h-2 rounded-full mb-4 overflow-hidden" style={{ background: t.soft }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${(done / items.length) * 100}%`, background: '#22C55E' }} />
          </div>
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, done: !x.done } : x)))}
                className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left"
                style={{ background: item.done ? 'rgba(34,197,94,0.1)' : 'transparent' }}
              >
                {item.done ? <MdCheckBox size={18} style={{ color: '#22C55E' }} /> : <MdCheckBoxOutlineBlank size={18} style={{ color: t.muted }} />}
                <span
                  className="text-[12px] flex-1"
                  style={{
                    color: item.done ? t.muted : t.primary,
                    textDecoration: item.done ? 'line-through' : 'none',
                    fontWeight: item.bookend ? 700 : 500,
                  }}
                >
                  {item.label}
                </span>
                {item.bookend && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: t.soft, color: t.muted }}>
                    gate
                  </span>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems((prev) => prev.map((x) => ({ ...x, done: true })))}
            className="mt-4 w-full rounded-xl py-2.5 text-[12px] font-bold text-white inline-flex items-center justify-center gap-1"
            style={{ background: '#16A34A' }}
          >
            <MdCheck size={16} /> Complete all & submit review
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 12. Security matrix with toggles ── */

export function DemoSecurity({ isDark }: { isDark: boolean }) {
  const { lang } = useLang();
  const ui = demoChrome(lang);
  const rbac = localizedRbac(lang);
  const t = tone(isDark);
  const [matrix, setMatrix] = useState(() =>
    rbac.matrix.map((r) => ({ ...r, flags: [...r.flags] }))
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const next = localizedRbac(lang);
    setMatrix(next.matrix.map((r) => ({ ...r, flags: [...r.flags] })));
  }, [lang]);

  const toggle = (ri: number, ci: number) => {
    setMatrix((prev) =>
      prev.map((row, i) => {
        if (i !== ri) return row;
        const flags = [...row.flags];
        flags[ci] = !flags[ci];
        return { ...row, flags };
      })
    );
    setSaved(false);
  };

  return (
    <div className="h-full flex flex-col min-h-0" style={{ background: t.canvas }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: t.elevated, borderBottom: `1px solid ${t.border}` }}>
        <div className="mr-auto">
          <h3 className="text-sm font-bold" style={{ color: t.primary }}>
            Security & RBAC
          </h3>
          <p className="text-[10px]" style={{ color: t.muted }}>
            Click cells to toggle · Save persists in this demo
          </p>
        </div>
        {saved && (
          <span className="text-[11px] font-bold" style={{ color: '#22C55E' }}>
            Saved
          </span>
        )}
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white"
          style={{ background: '#2563EB' }}
        >
          Save policy
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="rounded-xl overflow-hidden min-w-[520px]" style={{ background: t.elevated, border: `1px solid ${t.border}` }}>
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ background: t.soft, color: t.muted }}>
                <th className="text-left px-3 py-2.5 font-bold">{lang === 'fa' ? 'نقش' : 'Role'}</th>
                {rbac.cols.map((c) => (
                  <th key={c} className="px-2 py-2.5 font-bold text-center">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, ri) => (
                <tr key={row.role} style={{ borderTop: `1px solid ${t.border}`, color: t.primary }}>
                  <td className="px-3 py-2.5 font-bold">{row.role}</td>
                  {row.flags.map((on, ci) => (
                    <td key={rbac.cols[ci]} className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(ri, ci)}
                        className="w-8 h-8 rounded-lg inline-flex items-center justify-center mx-auto"
                        style={{
                          background: on ? 'rgba(34,197,94,0.18)' : t.soft,
                          color: on ? '#22C55E' : t.muted,
                        }}
                      >
                        {on ? <MdCheckCircle size={18} /> : <MdClose size={16} />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[10px]" style={{ color: t.muted }}>
          <span className="inline-flex items-center gap-1">
            <MdFilterList size={12} /> {ui.optional2fa}
          </span>
          <span className="inline-flex items-center gap-1">
            <MdPeople size={12} /> IP allowlists
          </span>
          <span className="inline-flex items-center gap-1">
            <MdMoreHoriz size={12} /> Audit log in workspace settings
          </span>
        </div>
      </div>
    </div>
  );
}
