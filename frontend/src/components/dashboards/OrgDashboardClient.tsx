'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Users, Kanban, Mail, LayoutDashboard, CheckSquare, Clock } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import SafeStatsRow from '@/components/SafeDashboard/SafeStatsRow';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba,
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
} from '@/components/SafeDashboard/theme';

type DashboardData = {
  workspace: {
    id: string;
    name: string;
    planTier: string;
    seatLimit: number;
    enforce2FA: boolean;
    status: string;
  };
  seats: { used: number; limit: number };
  boardCount: number;
  tasks: { inFlow: number; done: number; overdue: number };
  pendingInvites: number;
  membersWithout2FA: {
    membershipId: string;
    user: { id: string; email: string; name: string | null };
  }[];
  boards: {
    id: string;
    name: string;
    visibility: string;
    updatedAt: string;
    cardCount: number;
  }[];
  canBilling: boolean;
  canSecurity: boolean;
};

export function OrgDashboardClient({ workspaceId }: { workspaceId: string }) {
  const { theme, primaryColor } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/dashboard`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load dashboard');
        setLoading(false);
        return;
      }
      setData(json.data);
      setLoading(false);
    })();
  }, [workspaceId]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.boards.slice(0, 6).map((b) => ({
      name: b.name.length > 10 ? `${b.name.slice(0, 10)}…` : b.name,
      cards: b.cardCount,
      flow: Math.max(1, Math.round(b.cardCount * 0.4)),
    }));
  }, [data]);

  if (loading) {
    return <p className="text-sm" style={{ color: textMuted(isDark) }}>Loading dashboard…</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || 'No data'}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
          Workspaces / Project Overview
        </p>
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
          {data.workspace.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
          Org overview · {data.workspace.planTier} · {data.workspace.status}
        </p>
      </div>

      <SafeStatsRow
        isDark={isDark}
        stats={[
          {
            label: t('usageStrip.seats'),
            value: data.seats.used,
            unit: `/ ${data.seats.limit}`,
            sub: `${data.pendingInvites} pending invites`,
            accentColor: '#3b82f6',
            icon: Users,
          },
          {
            label: 'Boards',
            value: data.boardCount,
            unit: 'active',
            sub: 'Workspace boards',
            accentColor: primaryColor,
            icon: LayoutDashboard,
          },
          {
            label: 'In flow',
            value: data.tasks.inFlow,
            unit: 'cards',
            sub: `${data.tasks.done} done`,
            accentColor: '#10b981',
            icon: CheckSquare,
          },
          {
            label: 'Overdue',
            value: data.tasks.overdue,
            unit: 'cards',
            sub: 'Past due date',
            accentColor: '#f59e0b',
            icon: Clock,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className="lg:col-span-2 rounded-[18px] p-5 flex flex-col h-[320px]"
          style={{
            background: 'transparent',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary(isDark) }}>
            Board activity
          </h3>
          <div className="flex-1 min-h-0">
            {chartData.length === 0 ? (
              <p className="text-sm" style={{ color: textMuted(isDark) }}>
                No boards yet — create one to see charts
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={borderSubtle(isDark)} />
                  <XAxis dataKey="name" tick={{ fill: textMuted(isDark), fontSize: 11 }} />
                  <YAxis tick={{ fill: textMuted(isDark), fontSize: 11 }} />
                  <Tooltip
                    contentStyle={chartTooltipStyle(isDark)}
                    labelStyle={chartTooltipLabelStyle(isDark)}
                    itemStyle={chartTooltipItemStyle(isDark)}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar dataKey="cards" fill={hexToRgba(primaryColor, 0.55)} radius={[6, 6, 0, 0]} />
                  <Line type="monotone" dataKey="flow" stroke={primaryColor} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <WidgetFrame
          title="Members without 2FA"
          isDark={isDark}
          elevated
          action={
            data.canSecurity ? (
              <Link
                href={`/workspace/${workspaceId}/security`}
                className="text-xs font-medium"
                style={{ color: textSecondary(isDark) }}
              >
                Policies
              </Link>
            ) : undefined
          }
        >
          {data.membersWithout2FA.length === 0 ? (
            <p className="text-sm" style={{ color: textMuted(isDark) }}>
              All active members have 2FA enabled
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.membersWithout2FA.map((m) => (
                <li
                  key={m.membershipId}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ border: `1px solid ${borderSubtle(isDark)}` }}
                >
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span style={{ color: textPrimary(isDark) }}>{m.user.name || m.user.email}</span>
                </li>
              ))}
            </ul>
          )}
        </WidgetFrame>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <WidgetFrame
          title="Boards"
          isDark={isDark}
          elevated
          action={
            <Link
              href={`/workspace/${workspaceId}/boards`}
              className="text-xs font-medium"
              style={{ color: textSecondary(isDark) }}
            >
              View all
            </Link>
          }
        >
          <ul className="space-y-2 text-sm">
            {data.boards.slice(0, 8).map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                style={{ border: `1px solid ${borderSubtle(isDark)}` }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Kanban size={14} style={{ color: textMuted(isDark) }} />
                  <Link
                    href={`/board/${b.id}`}
                    className="truncate font-medium"
                    style={{ color: textPrimary(isDark) }}
                  >
                    {b.name}
                  </Link>
                </div>
                <span className="tabular-nums shrink-0" style={{ color: textMuted(isDark) }}>
                  {b.cardCount}
                </span>
              </li>
            ))}
            {data.boards.length === 0 && (
              <li style={{ color: textMuted(isDark) }}>No boards yet</li>
            )}
          </ul>
        </WidgetFrame>

        <WidgetFrame title="Pending invites" isDark={isDark} elevated>
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} style={{ color: textMuted(isDark) }} />
            <span style={{ color: textPrimary(isDark) }}>
              {data.pendingInvites} invitation{data.pendingInvites === 1 ? '' : 's'} waiting
            </span>
            <Link
              href={`/workspace/${workspaceId}/members`}
              className="ml-auto text-xs font-medium inline-flex items-center gap-1"
              style={{ color: textSecondary(isDark) }}
            >
              <Users size={14} /> Members
            </Link>
          </div>
        </WidgetFrame>
      </div>
    </div>
  );
}
