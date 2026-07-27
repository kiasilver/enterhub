'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  MdAccessTime,
  MdAssignment,
  MdCheckCircle,
  MdClose,
  MdPersonAdd,
  MdRefresh,
  MdTrendingDown,
  MdTrendingUp,
  MdWarning,
} from 'react-icons/md';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  surfaceHover,
  hexToRgba,
  chartTooltipStyle,
} from '@/components/SafeDashboard/theme';

type WorkloadMember = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  todo: number;
  progress: number;
  review: number;
  blocked: number;
  overdue: number;
  total: number;
  tasks: {
    id: string;
    title: string;
    boardId: string;
    boardName: string;
    status: string;
    dueDate: string | null;
  }[];
};

type LeadData = {
  kpis: {
    totalTasks: number;
    totalTasksDelta: number;
    completionRate: number;
    blockedOverdue: number;
    overdue: number;
    blocked: number;
    loggedHours: number;
    loggedHoursEstimated: boolean;
    open: number;
    done: number;
  };
  doughnut: {
    done: number;
    progress: number;
    review: number;
    todo: number;
    open: number;
  };
  workload: WorkloadMember[];
  burndown: { date: string; label: string; ideal: number; actual: number }[];
  cfd: {
    date: string;
    label: string;
    todo: number;
    progress: number;
    review: number;
    done: number;
  }[];
  velocity: { closedThisWeek: number; closedPrevWeek: number; note: string };
  reassignTargets: {
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  }[];
  boards: { id: string; name: string; automationCount: number; webhookCount: number }[];
  generatedAt: string;
};

const STACK = {
  todo: '#94a3b8',
  progress: '#3b82f6',
  review: '#eab308',
};

const DOUGHNUT_COLORS = {
  done: '#22c55e',
  progress: '#3b82f6',
  review: '#eab308',
  todo: '#ef4444',
};

function ChartTooltip({
  active,
  payload,
  label,
  isDark,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
  isDark: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl min-w-[140px]"
      style={chartTooltipStyle(isDark)}
    >
      {label && (
        <p className="font-semibold mb-1.5" style={{ color: isDark ? '#F9FAFB' : textSecondary(isDark) }}>
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((p, i) => (
          <li
            key={`${String(p.dataKey || p.name)}-${i}`}
            className="flex items-center justify-between gap-4"
            style={{ color: isDark ? '#F9FAFB' : textPrimary(isDark) }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-bold tabular-nums">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkloadTooltip({
  active,
  payload,
  isDark,
  t,
}: {
  active?: boolean;
  payload?: Array<{ payload?: WorkloadMember & { name: string } }>;
  isDark: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const w = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs shadow-xl max-w-[220px]"
      style={chartTooltipStyle(isDark)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden"
          style={{ background: surfaceHover(isDark), color: textPrimary(isDark) }}
        >
          {w.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            (w.name[0] || '?').toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate" style={{ color: isDark ? '#F9FAFB' : textPrimary(isDark) }}>
            {w.name}
          </p>
          <p className="truncate" style={{ color: isDark ? 'rgba(249,250,251,0.7)' : textMuted(isDark) }}>
            {t('leadPage.tooltipOpenClick', { total: w.total })}
          </p>
        </div>
      </div>
      <ul className="space-y-0.5" style={{ color: textSecondary(isDark) }}>
        <li>{t('myTasksPage.todo')}: {w.todo}</li>
        <li>{t('myTasksPage.onProcess')}: {w.progress}</li>
        <li>{t('myTasksPage.onReview')}: {w.review}</li>
        {w.overdue > 0 && (
          <li style={{ color: '#ef4444' }}>
            {t('leadPage.overdue')}: {w.overdue}
          </li>
        )}
      </ul>
    </div>
  );
}

const POLL_MS = 25_000;

/** Lead ops dashboard — bottlenecks, workload, burndown, CFD */
export function LeadDashboardClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [data, setData] = useState<LeadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const [selected, setSelected] = useState<WorkloadMember | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [taskId, setTaskId] = useState('');
  const [busy, setBusy] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  const load = useCallback(
    async (fresh = false) => {
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/lead-dashboard${fresh ? '?fresh=1' : ''}`,
        );
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to load');
          return;
        }
        setData(json.data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  // REST periodic refresh + focus (WebSocket workspace room not available yet)
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => void load(true), POLL_MS);
    const onFocus = () => void load(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [live, load]);

  const doughnutData = useMemo(() => {
    if (!data) return [];
    const d = data.doughnut;
    return [
      { name: t('myTasksPage.completed'), value: d.done, color: DOUGHNUT_COLORS.done },
      { name: t('myTasksPage.onProcess'), value: d.progress, color: DOUGHNUT_COLORS.progress },
      { name: t('leadPage.reviewBlocked'), value: d.review, color: DOUGHNUT_COLORS.review },
      { name: t('myTasksPage.todo'), value: d.todo, color: DOUGHNUT_COLORS.todo },
    ].filter((x) => x.value > 0);
  }, [data, t]);

  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const cardBg = 'transparent';
  const kpiBg = surfaceItem(isDark);
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  async function submitReassign() {
    if (!selected || !taskId || !reassignTo || busy) return;
    const task = selected.tasks.find((t) => t.id === taskId);
    if (!task) return;
    setBusy(true);
    setReassignError(null);
    try {
      // Remove from current assignee, add to target
      await fetch(`/api/boards/${task.boardId}/cards/${task.id}/assignees?userId=${selected.userId}`, {
        method: 'DELETE',
      });
      const res = await fetch(`/api/boards/${task.boardId}/cards/${task.id}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: reassignTo }),
      });
      const json = await res.json();
      if (!res.ok) {
        setReassignError(json.error || t('leadPage.reassignFailed'));
        return;
      }
      setSelected(null);
      setTaskId('');
      setReassignTo('');
      await load(true);
    } catch (e) {
      setReassignError(e instanceof Error ? e.message : t('leadPage.reassignFailed'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm" style={{ color: textMuted(isDark) }}>
        {t('leadPage.loading')}
      </p>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || t('leadPage.noData')}</p>;
  }

  const k = data.kpis;
  const deltaUp = k.totalTasksDelta >= 0;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
            {t('leadPage.eyebrow')}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            {t('leadPage.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            {t('leadPage.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className="text-xs font-semibold px-3 py-2 rounded-xl"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: live ? '#22c55e' : textMuted(isDark),
              background: surfaceItem(isDark),
            }}
          >
            {live ? t('leadPage.live') : t('leadPage.paused')}
          </button>
          <button
            type="button"
            onClick={() => void load(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
              background: surfaceItem(isDark),
            }}
          >
            <MdRefresh size={16} />
            {t('leadPage.refresh')}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 max-w-6xl 4xl:max-w-7xl">
        <KpiCard
          isDark={isDark}
          cardBg={kpiBg}
          cardBorder={cardBorder}
          label={t('leadPage.kpiTotalTasks')}
          value={k.totalTasks}
          icon={<MdAssignment size={20} />}
          accent="#8b5cf6"
          footer={
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: deltaUp ? '#22c55e' : '#ef4444' }}
            >
              {deltaUp ? <MdTrendingUp size={14} /> : <MdTrendingDown size={14} />}
              {t('leadPage.deltaVsLastWeek', {
                delta: `${deltaUp ? '+' : ''}${k.totalTasksDelta}`,
              })}
            </span>
          }
        />
        <KpiCard
          isDark={isDark}
          cardBg={kpiBg}
          cardBorder={cardBorder}
          label={t('leadPage.kpiCompletionRate')}
          value={`${k.completionRate}%`}
          icon={<MdCheckCircle size={20} />}
          accent="#22c55e"
          footer={
            <div
              className="h-1.5 rounded-full overflow-hidden mt-1"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, k.completionRate)}%`,
                  background: 'linear-gradient(90deg,#22c55e,#06b6d4)',
                }}
              />
            </div>
          }
        />
        <KpiCard
          isDark={isDark}
          cardBg={kpiBg}
          cardBorder={cardBorder}
          label={t('leadPage.kpiBlockedOverdue')}
          value={k.blockedOverdue}
          icon={<MdWarning size={20} />}
          accent="#ef4444"
          valueColor="#ef4444"
          footer={
            <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
              {t('leadPage.overdueBlocked', { overdue: k.overdue, blocked: k.blocked })}
            </span>
          }
        />
        <KpiCard
          isDark={isDark}
          cardBg={kpiBg}
          cardBorder={cardBorder}
          label={t('leadPage.kpiLoggedHours')}
          value={k.loggedHours}
          icon={<MdAccessTime size={20} />}
          accent="#06b6d4"
          footer={
            <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
              {k.loggedHoursEstimated ? t('leadPage.hoursEstimated') : t('leadPage.hoursFromTimesheet')}
            </span>
          }
        />
      </div>

      {/* Workload + Doughnut */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Panel title={t('leadPage.panelWorkload')} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder}>
          <p className="text-[11px] mb-3" style={{ color: textMuted(isDark) }}>
            {t('leadPage.panelWorkloadHint')}
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.workload}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: textMuted(isDark), fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={data.workload.length > 6 ? -25 : 0}
                  textAnchor={data.workload.length > 6 ? 'end' : 'middle'}
                  height={data.workload.length > 6 ? 60 : 30}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<WorkloadTooltip isDark={isDark} t={t} />} cursor={{ fill: hexToRgba('#3b82f6', 0.08) }} />
                <Bar
                  dataKey="todo"
                  stackId="a"
                  fill={STACK.todo}
                  name={t('myTasksPage.todo')}
                  cursor="pointer"
                  onClick={(_d, index) => {
                    const row = data.workload[index];
                    if (!row) return;
                    setSelected(row);
                    setTaskId(row.tasks[0]?.id || '');
                    setReassignTo('');
                    setReassignError(null);
                  }}
                />
                <Bar
                  dataKey="progress"
                  stackId="a"
                  fill={STACK.progress}
                  name={t('myTasksPage.onProcess')}
                  cursor="pointer"
                  onClick={(_d, index) => {
                    const row = data.workload[index];
                    if (!row) return;
                    setSelected(row);
                    setTaskId(row.tasks[0]?.id || '');
                    setReassignTo('');
                    setReassignError(null);
                  }}
                />
                <Bar
                  dataKey="review"
                  stackId="a"
                  fill={STACK.review}
                  name={t('myTasksPage.onReview')}
                  radius={[6, 6, 0, 0]}
                  cursor="pointer"
                  onClick={(_d, index) => {
                    const row = data.workload[index];
                    if (!row) return;
                    setSelected(row);
                    setTaskId(row.tasks[0]?.id || '');
                    setReassignTo('');
                    setReassignError(null);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.workload.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: textMuted(isDark) }}>
              {t('leadPage.noAssignees')}
            </p>
          )}
        </Panel>

        <Panel title={t('leadPage.panelBreakdown')} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder}>
          <div className="relative h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={doughnutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {doughnutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-black tabular-nums" style={{ color: textPrimary(isDark) }}>
                {data.doughnut.open}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: textMuted(isDark) }}>
                {t('leadPage.open')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-1">
            {doughnutData.map((d) => (
              <span key={d.name} className="text-[11px] inline-flex items-center gap-1.5" style={{ color: textSecondary(isDark) }}>
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* Burndown + CFD */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title={t('leadPage.panelBurndown')} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder}>
          <p className="text-[11px] mb-3" style={{ color: textMuted(isDark) }}>
            {t('leadPage.burndownHint')}
          </p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.burndown} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: textMuted(isDark), fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="transparent"
                  fill="url(#actualFill)"
                  name={t('leadPage.actualFill')}
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="ideal"
                  name={t('leadPage.ideal')}
                  stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name={t('leadPage.actual')}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t('leadPage.panelCfd')} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder}>
          <p className="text-[11px] mb-3" style={{ color: textMuted(isDark) }}>
            {t('leadPage.cfdHint')}
          </p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cfd} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: textMuted(isDark), fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip isDark={isDark} />} />
                <Area
                  type="monotone"
                  dataKey="done"
                  stackId="1"
                  name={t('myTasksPage.completed')}
                  stroke="#22c55e"
                  fill={hexToRgba('#22c55e', 0.55)}
                />
                <Area
                  type="monotone"
                  dataKey="review"
                  stackId="1"
                  name={t('myTasksPage.onReview')}
                  stroke="#eab308"
                  fill={hexToRgba('#eab308', 0.55)}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stackId="1"
                  name={t('myTasksPage.onProcess')}
                  stroke="#3b82f6"
                  fill={hexToRgba('#3b82f6', 0.5)}
                />
                <Area
                  type="monotone"
                  dataKey="todo"
                  stackId="1"
                  name={t('myTasksPage.todo')}
                  stroke="#94a3b8"
                  fill={hexToRgba('#94a3b8', 0.45)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div
        className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm"
        style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
      >
        <p style={{ color: textSecondary(isDark) }}>
          {t('leadPage.velocity')}{' '}
          <strong style={{ color: textPrimary(isDark) }}>{data.velocity.closedThisWeek}</strong>{' '}
          {t('leadPage.velocityThisWeek')}
          <span className="mx-2 opacity-40">·</span>
          {t('leadPage.prevWeek', { count: data.velocity.closedPrevWeek })}
        </p>
        <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
          {t('leadPage.updated', { time: new Date(data.generatedAt).toLocaleTimeString() })}
          {live ? t('leadPage.liveSuffix') : ''}
        </p>
      </div>

      {/* Reassign modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2">
              <MdPersonAdd size={20} />
              {t('leadPage.reassignTitle', { name: selected?.name ?? '' })}
            </DialogTitle>
            <DialogDescription>
              {t('leadPage.reassignDesc', { count: selected?.total ?? 0 })}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textMuted(isDark) }}>
                  {t('leadPage.task')}
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: surfaceItem(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textPrimary(isDark),
                  }}
                >
                  {selected.tasks.length === 0 && (
                    <option value="">{t('leadPage.noOpenTasks')}</option>
                  )}
                  {selected.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} · {task.boardName} ({task.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textMuted(isDark) }}>
                  {t('leadPage.assignTo')}
                </label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: surfaceItem(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textPrimary(isDark),
                  }}
                >
                  <option value="">{t('leadPage.selectMember')}</option>
                  {data.reassignTargets
                    .filter((m) => m.userId !== selected.userId)
                    .map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
              {taskId && (
                <Link
                  href={`/board/${selected.tasks.find((task) => task.id === taskId)?.boardId}`}
                  className="text-xs font-medium"
                  style={{ color: '#3b82f6' }}
                >
                  {t('leadPage.openBoard')}
                </Link>
              )}
              {reassignError && <p className="text-sm text-red-500">{reassignError}</p>}
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
              style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}
            >
              <MdClose size={14} />
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={busy || !taskId || !reassignTo}
              onClick={() => void submitReassign()}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: '#2563eb' }}
            >
              {busy ? t('leadPage.moving') : t('leadPage.reassign')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({
  isDark,
  cardBg,
  cardBorder,
  label,
  value,
  icon,
  accent,
  valueColor,
  footer,
}: {
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: string;
  valueColor?: string;
  footer: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        boxShadow: `inset 0 3px 0 0 ${hexToRgba(accent, 0.85)}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
          {label}
        </p>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <p
        className="text-3xl font-black tabular-nums tracking-tight"
        style={{ color: valueColor || textPrimary(isDark) }}
      >
        {value}
      </p>
      <div className="mt-2">{footer}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  isDark,
  cardBg,
  cardBorder,
}: {
  title: string;
  children: ReactNode;
  isDark: boolean;
  cardBg: string;
  cardBorder: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: textPrimary(isDark) }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
