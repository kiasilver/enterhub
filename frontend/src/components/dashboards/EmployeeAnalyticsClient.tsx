'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  MdArrowBack,
  MdChatBubbleOutline,
  MdCheckCircle,
  MdTrendingUp,
  MdWarningAmber,
} from 'react-icons/md';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { PersonAvatar } from '@/components/departments/PersonQuickActions';
import type { DeptPerson } from '@/components/departments/department-types';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
} from '@/components/SafeDashboard/theme';

type AnalyticsPayload = {
  user: DeptPerson;
  member: {
    title: string | null;
    status: string;
    role: { id: string; name: string };
  } | null;
  accessScope: string;
  year: number;
  departments: { id: string; name: string; color: string; role: string }[];
  workload: {
    assigned: number;
    open: number;
    done: number;
    overdue: number;
    inProgress: number;
    todo: number;
    review: number;
    created: number;
    completionPct: number;
  };
  trends: {
    extensionRequested: number;
    extensionApproved: number;
    chargedDelays: number;
    waivedDelays: number;
    openDelays: number;
    completedOnTime: number;
    tasksApproved: number;
    delayRatePct: number;
    delayScore: number;
  };
  evaluations: {
    count: number;
    averages: {
      quality: number | null;
      timeliness: number | null;
      communication: number | null;
      initiative: number | null;
      collaboration: number | null;
      overall: number | null;
    };
    recent: {
      id: string;
      overall: number;
      note: string | null;
      strengths: string | null;
      improvements: string | null;
      createdAt: string;
      cardTitle: string;
      evaluatorName: string;
    }[];
  };
  charts: {
    statusBreakdown: { name: string; value: number; color: string }[];
    scoreRadar: { name: string; value: number }[];
    monthly: { month: string; assigned: number; done: number; overdue: number }[];
  };
  recentTasks: {
    id: string;
    title: string;
    boardName: string;
    listTitle: string;
    status: string;
  }[];
  hr: {
    summary: string;
    strengths: { kind: string; title: string; detail: string }[];
    weaknesses: { kind: string; title: string; detail: string }[];
    recommendations: string[];
    overallBand: 'excellent' | 'strong' | 'mixed' | 'needs_attention';
  };
};

const BAND_STYLE = {
  excellent: { label: 'Excellent', color: '#22c55e' },
  strong: { label: 'Strong', color: '#3b82f6' },
  mixed: { label: 'Mixed', color: '#f59e0b' },
  needs_attention: { label: 'Needs attention', color: '#ef4444' },
} as const;

function StatCard({
  label,
  value,
  color,
  isDark,
}: {
  label: string;
  value: string | number;
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: surfaceItem(isDark),
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      <p
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: textMuted(isDark) }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  isDark,
  children,
}: {
  title: string;
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'transparent',
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
    >
      <p className="text-sm font-semibold mb-4" style={{ color: textPrimary(isDark) }}>
        {title}
      </p>
      {children}
    </div>
  );
}

export function EmployeeAnalyticsClient({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatBusy, setChatBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/people/${userId}/analytics?year=${year}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load analytics');
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, userId, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthLabels = useMemo(() => {
    if (!data) return [];
    return data.charts.monthly.map((m) => ({
      ...m,
      label: new Date(`${m.month}-01`).toLocaleDateString(undefined, {
        month: 'short',
      }),
    }));
  }, [data]);

  async function openChat() {
    if (!data) return;
    setChatBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'DIRECT', memberIds: [userId] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Chat failed');
      window.location.href = `/workspace/${workspaceId}/chat?room=${json.data.id}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chat failed');
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm" style={{ color: textMuted(isDark) }}>
        Loading people analytics…
      </p>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-3">
        <Link
          href={`/workspace/${workspaceId}/team`}
          className="inline-flex items-center gap-1 text-sm font-medium"
          style={{ color: textSecondary(isDark) }}
        >
          <MdArrowBack size={16} /> Back to team
        </Link>
        <p className="text-sm text-red-500">{error || 'No data'}</p>
      </div>
    );
  }

  const band = BAND_STYLE[data.hr.overallBand];
  const label = data.user.name || data.user.email;
  const tipStyle = chartTooltipStyle(isDark);
  const tipLabel = chartTooltipLabelStyle(isDark);
  const tipItem = chartTooltipItemStyle(isDark);

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/workspace/${workspaceId}/team`}
            className="inline-flex items-center gap-1 text-xs font-medium mb-2"
            style={{ color: textMuted(isDark) }}
          >
            <MdArrowBack size={14} /> Team / People analytics
          </Link>
          <div className="flex items-start gap-3">
            <PersonAvatar person={data.user} size={56} isDark={isDark} />
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold truncate"
                style={{ color: textPrimary(isDark) }}
              >
                {label}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: textSecondary(isDark) }}>
                {data.member?.title || data.member?.role.name || 'Team member'}
                {data.member ? ` · ${data.member.role.name}` : ''}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded-lg text-white"
                  style={{ background: band.color }}
                >
                  {band.label}
                </span>
                {data.departments.map((d) => (
                  <span
                    key={d.id}
                    className="text-[11px] font-semibold px-2 py-1 rounded-lg text-white"
                    style={{ background: d.color || '#64748b' }}
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-end">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-transparent outline-none"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
            }}
          >
            {[0, 1, 2].map((i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            disabled={chatBusy}
            onClick={() => void openChat()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: isDark ? 'rgba(37,99,235,0.9)' : '#2563eb' }}
          >
            <MdChatBubbleOutline size={16} />
            {chatBusy ? 'Opening…' : 'Open chat'}
          </button>
        </div>
      </div>

      {/* HR professional brief */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{
          background: 'transparent',
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
      >
        <div className="flex items-center gap-2">
          <MdTrendingUp size={18} style={{ color: band.color }} />
          <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
            HR · Team management brief
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: textSecondary(isDark) }}>
          {data.hr.summary}
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: '#22c55e' }}
            >
              Strengths
            </p>
            <ul className="space-y-2">
              {data.hr.strengths.length === 0 && (
                <li className="text-xs" style={{ color: textMuted(isDark) }}>
                  Not enough signal yet
                </li>
              )}
              {data.hr.strengths.map((s) => (
                <li
                  key={s.title}
                  className="rounded-xl p-3"
                  style={{ background: surfaceItem(isDark) }}
                >
                  <p
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: textPrimary(isDark) }}
                  >
                    <MdCheckCircle size={14} style={{ color: '#22c55e' }} />
                    {s.title}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: textSecondary(isDark) }}>
                    {s.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider mb-2"
              style={{ color: '#ef4444' }}
            >
              Watch / gaps
            </p>
            <ul className="space-y-2">
              {data.hr.weaknesses.length === 0 && (
                <li className="text-xs" style={{ color: textMuted(isDark) }}>
                  No critical gaps flagged
                </li>
              )}
              {data.hr.weaknesses.map((s) => (
                <li
                  key={s.title}
                  className="rounded-xl p-3"
                  style={{ background: surfaceItem(isDark) }}
                >
                  <p
                    className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: textPrimary(isDark) }}
                  >
                    <MdWarningAmber size={14} style={{ color: '#f59e0b' }} />
                    {s.title}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: textSecondary(isDark) }}>
                    {s.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider mb-2"
            style={{ color: textMuted(isDark) }}
          >
            Recommended actions
          </p>
          <ol className="space-y-1.5 list-decimal list-inside">
            {data.hr.recommendations.map((r) => (
              <li key={r} className="text-xs leading-relaxed" style={{ color: textSecondary(isDark) }}>
                {r}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl 4xl:max-w-7xl">
        <StatCard label="Assigned" value={data.workload.assigned} color="#8b5cf6" isDark={isDark} />
        <StatCard label="Open" value={data.workload.open} color="#3b82f6" isDark={isDark} />
        <StatCard label="Done" value={data.workload.done} color="#22c55e" isDark={isDark} />
        <StatCard label="Overdue" value={data.workload.overdue} color="#ef4444" isDark={isDark} />
        <StatCard
          label="Completion"
          value={`${data.workload.completionPct}%`}
          color="#06b6d4"
          isDark={isDark}
        />
        <StatCard
          label="Delay score"
          value={data.trends.delayScore}
          color="#f59e0b"
          isDark={isDark}
        />
        <StatCard
          label="Eval overall"
          value={data.evaluations.averages.overall?.toFixed(1) ?? '—'}
          color="#a855f7"
          isDark={isDark}
        />
        <StatCard
          label="Approved tasks"
          value={data.trends.tasksApproved}
          color="#22c55e"
          isDark={isDark}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Workload mix" isDark={isDark}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.statusBreakdown}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tipStyle}
                  labelStyle={tipLabel}
                  itemStyle={tipItem}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.charts.statusBreakdown.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Evaluation radar (1–5)" isDark={isDark}>
          <div className="h-64">
            {data.evaluations.count === 0 ? (
              <p className="text-sm py-16 text-center" style={{ color: textMuted(isDark) }}>
                No evaluations yet this year
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.charts.scoreRadar}>
                  <PolarGrid stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'} />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                  contentStyle={tipStyle}
                  labelStyle={tipLabel}
                  itemStyle={tipItem}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title={`Trend · ${year}`} isDark={isDark}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthLabels}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: textMuted(isDark), fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tipStyle}
                  labelStyle={tipLabel}
                  itemStyle={tipItem}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="assigned" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="done" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="overdue" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Delay & extensions" isDark={isDark}>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { label: 'Delay rate', value: `${data.trends.delayRatePct}%` },
                { label: 'On-time approvals', value: data.trends.completedOnTime },
                { label: 'Charged delays', value: data.trends.chargedDelays },
                { label: 'Waived delays', value: data.trends.waivedDelays },
                { label: 'Extensions asked', value: data.trends.extensionRequested },
                { label: 'Extensions approved', value: data.trends.extensionApproved },
              ] as const
            ).map((k) => (
              <div
                key={k.label}
                className="rounded-xl p-3"
                style={{ background: surfaceItem(isDark) }}
              >
                <p className="text-[10px] font-bold uppercase" style={{ color: textMuted(isDark) }}>
                  {k.label}
                </p>
                <p
                  className="text-lg font-bold tabular-nums mt-0.5"
                  style={{ color: textPrimary(isDark) }}
                >
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Recent evaluations" isDark={isDark}>
          <ul className="space-y-2 max-h-80 overflow-auto">
            {data.evaluations.recent.length === 0 && (
              <li className="text-sm" style={{ color: textMuted(isDark) }}>
                No reviews yet
              </li>
            )}
            {data.evaluations.recent.map((e) => (
              <li
                key={e.id}
                className="rounded-xl p-3"
                style={{ background: surfaceItem(isDark) }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {e.cardTitle}
                  </p>
                  <span className="text-xs font-bold tabular-nums" style={{ color: '#a855f7' }}>
                    {e.overall}/5
                  </span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: textMuted(isDark) }}>
                  {e.evaluatorName} · {new Date(e.createdAt).toLocaleDateString()}
                </p>
                {(e.strengths || e.improvements || e.note) && (
                  <p className="text-xs mt-1.5 line-clamp-2" style={{ color: textSecondary(isDark) }}>
                    {e.strengths || e.improvements || e.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="Recent tasks" isDark={isDark}>
          <ul className="space-y-2 max-h-80 overflow-auto">
            {data.recentTasks.length === 0 && (
              <li className="text-sm" style={{ color: textMuted(isDark) }}>
                No assigned tasks
              </li>
            )}
            {data.recentTasks.map((t) => (
              <li
                key={t.id}
                className="rounded-xl p-3"
                style={{ background: surfaceItem(isDark) }}
              >
                <p className="text-xs font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                  {t.title}
                </p>
                <p className="text-[10px] mt-1" style={{ color: textMuted(isDark) }}>
                  {t.boardName} · {t.listTitle} · {t.status}
                </p>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
