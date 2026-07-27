'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MdFolderOpen,
  MdGroups,
  MdTrendingUp,
  MdWarningAmber,
} from 'react-icons/md';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba,
  surfaceItem,
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
} from '@/components/SafeDashboard/theme';

type Overview = {
  workspace: { id: string; name: string };
  me: { roleName: string; title: string | null };
  scope: 'manager' | 'member';
  summary: {
    projectCount: number;
    openCards: number;
    doneCards: number;
    totalCards: number;
    overdue: number;
    completionPct: number;
    closedThisWeek: number;
  };
  statusBreakdown: Record<string, number>;
  projects: {
    id: string;
    name: string;
    description: string | null;
    visibility: string;
    updatedAt: string;
    open: number;
    done: number;
    overdue: number;
    todo: number;
    progress: number;
    review: number;
    total: number;
    completionPct: number;
  }[];
  workload: { userId: string; name: string; email: string; count: number }[];
};

const CHART_COLORS = ['#94a3b8', '#3b82f6', '#a855f7', '#22c55e', '#ef4444'];

/** Workspace view: all visible projects + company/team trends by permission */
export function MyWorkspaceClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/workspace-overview`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to load');
          setData(null);
          return;
        }
        setData(json.data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const sb = data.statusBreakdown;
    return [
      { name: 'Todo', count: sb.todo ?? 0 },
      { name: 'Progress', count: sb.progress ?? 0 },
      { name: 'Review', count: sb.review ?? 0 },
      { name: 'Done', count: sb.done ?? 0 },
      { name: 'Overdue', count: sb.overdue ?? 0 },
    ];
  }, [data]);

  if (loading) {
    return (
      <p className="text-sm" style={{ color: textMuted(isDark) }}>
        Loading workspace…
      </p>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || 'No data'}</p>;
  }

  const cardBg = surfaceItem(isDark);
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const isManager = data.scope === 'manager';
  const s = data.summary;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
            {data.workspace.name} · {data.me.roleName}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            My Workspace
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            {isManager
              ? 'Full workspace trends and all projects (manager access).'
              : 'Workspace trends and projects you can see — private boards stay hidden.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full self-center"
            style={{
              background: hexToRgba(isManager ? '#06b6d4' : '#8b5cf6', 0.15),
              color: isManager ? '#06b6d4' : '#8b5cf6',
              border: `1px solid ${hexToRgba(isManager ? '#06b6d4' : '#8b5cf6', 0.35)}`,
            }}
          >
            {isManager ? 'Manager view' : 'Member view'}
          </span>
          <Link
            href={`/workspace/${workspaceId}/my-tasks`}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}
          >
            My tasks →
          </Link>
          <Link
            href={`/workspace/${workspaceId}/boards`}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}
          >
            All projects
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Projects', value: s.projectCount, color: '#06b6d4' },
          { label: 'Open cards', value: s.openCards, color: '#3b82f6' },
          { label: 'Done', value: s.doneCards, color: '#22c55e' },
          { label: 'Overdue', value: s.overdue, color: '#ef4444' },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
              {k.label}
            </p>
            <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: k.color }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <WidgetFrame
          title="Workspace progress"
          isDark={isDark}
          elevated
          action={<MdTrendingUp size={16} style={{ color: textMuted(isDark) }} />}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: textSecondary(isDark) }}>
              Overall completion · {s.closedThisWeek} closed this week
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: textPrimary(isDark) }}>
              {s.completionPct}%
            </p>
          </div>
          <div
            className="h-2 rounded-full mb-4 overflow-hidden"
            style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, s.completionPct)}%`,
                background: 'linear-gradient(90deg,#06b6d4,#22c55e)',
              }}
            />
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
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
                  contentStyle={chartTooltipStyle(isDark)}
                  labelStyle={chartTooltipLabelStyle(isDark)}
                  itemStyle={chartTooltipItemStyle(isDark)}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetFrame>

        {isManager ? (
          <WidgetFrame
            title="Team workload"
            isDark={isDark}
            elevated
            action={<MdGroups size={16} style={{ color: textMuted(isDark) }} />}
          >
            <ul className="space-y-2 text-sm max-h-72 overflow-auto">
              {data.workload.map((w) => (
                <li
                  key={w.userId}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    background: surfaceItem(isDark),
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium" style={{ color: textPrimary(isDark) }}>
                      {w.name}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: textMuted(isDark) }}>
                      {w.email}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: '#8b5cf6' }}>
                    {w.count}
                  </span>
                </li>
              ))}
              {data.workload.length === 0 && (
                <li style={{ color: textMuted(isDark) }}>No assignee data yet</li>
              )}
            </ul>
          </WidgetFrame>
        ) : (
          <WidgetFrame
            title="Access note"
            isDark={isDark}
            elevated
            action={<MdWarningAmber size={16} style={{ color: textMuted(isDark) }} />}
          >
            <p className="text-sm leading-relaxed" style={{ color: textSecondary(isDark) }}>
              You see workspace and public projects only. Private boards and team workload are
              visible to managers (members / audit / board settings). Your personal assignments live
              under{' '}
              <Link href={`/workspace/${workspaceId}/my-tasks`} className="underline font-semibold">
                My Tasks
              </Link>
              .
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div
                className="rounded-xl p-3"
                style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
              >
                <p className="text-[10px] uppercase" style={{ color: textMuted(isDark) }}>
                  Visible projects
                </p>
                <p className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>
                  {s.projectCount}
                </p>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
              >
                <p className="text-[10px] uppercase" style={{ color: textMuted(isDark) }}>
                  Cards in view
                </p>
                <p className="text-lg font-bold" style={{ color: textPrimary(isDark) }}>
                  {s.totalCards}
                </p>
              </div>
            </div>
          </WidgetFrame>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
            {isManager ? 'All projects' : 'Visible projects'}
          </h2>
          <MdFolderOpen size={16} style={{ color: textMuted(isDark) }} />
        </div>
        {data.projects.length === 0 ? (
          <p className="text-sm" style={{ color: textMuted(isDark) }}>
            No projects yet
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {data.projects.map((p) => (
              <Link
                key={p.id}
                href={`/board/${p.id}`}
                className="rounded-2xl p-4 block transition-colors"
                style={{
                  background: surfaceItem(isDark),
                  border: `1px solid ${
                    p.overdue > 0 ? hexToRgba('#ef4444', 0.35) : borderSubtle(isDark)
                  }`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-sm truncate" style={{ color: textPrimary(isDark) }}>
                    {p.name}
                  </p>
                  <span
                    className="text-[10px] font-bold tabular-nums shrink-0"
                    style={{ color: textMuted(isDark) }}
                  >
                    {p.completionPct}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full mb-3 overflow-hidden"
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, p.completionPct)}%`,
                      background: 'linear-gradient(90deg,#06b6d4,#22c55e)',
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]" style={{ color: textMuted(isDark) }}>
                  <span>{p.open} open</span>
                  <span>{p.done} done</span>
                  {p.overdue > 0 && (
                    <span style={{ color: '#ef4444' }}>{p.overdue} overdue</span>
                  )}
                  <span className="ml-auto opacity-70">{p.visibility}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
