'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  MdAdd,
  MdBusiness,
  MdEdit,
  MdGroups,
  MdList,
  MdPersonOutline,
  MdSearch,
  MdSupervisorAccount,
  MdTableChart,
  MdTrendingUp,
  MdVerifiedUser,
} from 'react-icons/md';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import { CreateDepartmentDialog } from '@/components/departments/CreateDepartmentDialog';
import { EditDepartmentDialog } from '@/components/departments/EditDepartmentDialog';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  searchFieldBg,
  selectedFill,
  surfaceItem,
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
} from '@/components/SafeDashboard/theme';

type Person = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  accessVia?: string;
};

type DeptMember = {
  userId: string;
  role: 'MANAGER' | 'SUPERVISOR' | 'MEMBER';
  user: Person;
};

type DeptRow = {
  id: string;
  key: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  archivedAt?: string | null;
  boardCount: number;
  memberCount: number;
  managers: Person[];
  supervisors: Person[];
  team: Person[];
  access: Person[];
  members?: DeptMember[];
  stats: {
    open: number;
    done: number;
    overdue: number;
    inProgress: number;
    total: number;
    completionPct: number;
  };
};

type PageView = 'list' | 'overview';

function progressColor(pct: number) {
  if (pct <= 0) return '#9CA3AF';
  if (pct >= 100) return '#22c55e';
  if (pct >= 70) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

function PersonChip({
  person,
  isDark,
  role,
}: {
  person: Person;
  isDark: boolean;
  role: string;
}) {
  const label = person.name || person.email;
  const tip = person.accessVia ? `${role}: ${label} (${person.accessVia})` : `${role}: ${label}`;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full pl-0.5 pr-2 py-0.5 max-w-full"
      style={{
        background: surfaceItem(isDark),
        border: `1px solid ${borderSubtle(isDark)}`,
      }}
      title={tip}
    >
      <span
        className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{
          background: isDark ? 'var(--chip)' : '#E5E7EB',
          color: textMuted(isDark),
        }}
      >
        {person.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <MdPersonOutline size={12} />
        )}
      </span>
      <span
        className="text-[10px] font-semibold truncate max-w-[7rem]"
        style={{ color: textSecondary(isDark) }}
      >
        {label}
      </span>
    </span>
  );
}

function parseView(raw: string | null): PageView {
  return raw === 'overview' ? 'overview' : 'list';
}

export function DepartmentsHubClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const base = `/workspace/${workspaceId}`;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageView = parseView(searchParams.get('view'));

  const [departments, setDepartments] = useState<DeptRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<DeptRow | null>(null);
  const [query, setQuery] = useState('');

  const setPageView = useCallback(
    (view: PageView) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set('view', view);
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!searchParams.get('view')) {
      const q = new URLSearchParams(searchParams.toString());
      q.set('view', 'list');
      router.replace(`${pathname}?${q.toString()}`, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    if (loading) return;
    if (canManage) setCreateOpen(true);
    const q = new URLSearchParams(searchParams.toString());
    q.delete('new');
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, canManage, loading, pathname, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/departments`);
      const text = await res.text();
      let json: {
        error?: string;
        data?: (DeptRow & { team?: Person[]; access?: Person[] })[];
        meta?: { isAdmin?: boolean; canManage?: boolean };
      } = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Failed to load (${res.status})`);
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setDepartments(
        (json.data || []).map(
          (d: DeptRow & { team?: Person[]; access?: Person[] }) => ({
            ...d,
            managers: d.managers || [],
            supervisors: d.supervisors || [],
            team: d.team || [],
            access: d.access || [],
          }),
        ),
      );
      setCanManage(!!json.meta?.canManage || !!json.meta?.isAdmin);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => {
      const label = localizedDepartmentLabel(t, d.key, d.name).toLowerCase();
      const leads = [...d.managers, ...d.supervisors]
        .map((p) => `${p.name || ''} ${p.email}`)
        .join(' ')
        .toLowerCase();
      return (
        label.includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.key.toLowerCase().includes(q) ||
        leads.includes(q)
      );
    });
  }, [departments, query, t]);

  const displayName = useCallback(
    (d: { key: string; name: string }) => localizedDepartmentLabel(t, d.key, d.name),
    [t],
  );

  const totals = useMemo(() => {
    const members = departments.reduce((n, d) => n + d.memberCount, 0);
    const projects = departments.reduce((n, d) => n + d.boardCount, 0);
    const open = departments.reduce((n, d) => n + d.stats.open, 0);
    const done = departments.reduce((n, d) => n + d.stats.done, 0);
    const overdue = departments.reduce((n, d) => n + d.stats.overdue, 0);
    const totalTasks = open + done;
    const completionPct =
      totalTasks > 0 ? Math.round((done / totalTasks) * 100) : 0;
    return {
      departments: departments.length,
      members,
      projects,
      open,
      done,
      overdue,
      completionPct,
      inProgress: departments.reduce((n, d) => n + d.stats.inProgress, 0),
    };
  }, [departments]);

  const flatBg = 'transparent';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const fieldStyle = {
    background: searchFieldBg(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  const tipStyle = chartTooltipStyle(isDark);
  const tipLabel = chartTooltipLabelStyle(isDark);
  const tipItem = chartTooltipItemStyle(isDark);

  const completionChart = useMemo(
    () =>
      departments.map((d) => {
        const label = localizedDepartmentLabel(t, d.key, d.name);
        return {
          name: label.length > 12 ? `${label.slice(0, 11)}…` : label,
          fullName: label,
          completion: d.stats.completionPct,
          open: d.stats.open,
          done: d.stats.done,
          color: d.color || '#3b82f6',
        };
      }),
    [departments, t],
  );

  const membersChart = useMemo(
    () =>
      departments.map((d) => {
        const label = localizedDepartmentLabel(t, d.key, d.name);
        return {
          name: label.length > 12 ? `${label.slice(0, 11)}…` : label,
          members: d.memberCount,
          color: d.color || '#8b5cf6',
        };
      }),
    [departments, t],
  );

  const statusPie = useMemo(
    () =>
      [
        { name: t('projectsPage.colOpen'), value: totals.open, color: '#3b82f6' },
        { name: t('projectsPage.colDone'), value: totals.done, color: '#22c55e' },
        { name: t('projectsPage.kpiOverdue'), value: totals.overdue, color: '#ef4444' },
        { name: t('projectsPage.statusActive'), value: totals.inProgress, color: '#a855f7' },
      ].filter((x) => x.value > 0),
    [totals, t],
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
            {t('departmentsPage.breadcrumb')}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            {t('departmentsPage.title')}
            <span
              className="ms-2 text-sm font-semibold capitalize"
              style={{ color: textMuted(isDark) }}
            >
              · {pageView === 'overview' ? t('workspace.overview') : t('workspace.list')}
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            {pageView === 'overview'
              ? t('departmentsPage.subtitleOverview')
              : t('departmentsPage.subtitleList')}
          </p>
        </div>
        <div
          className="inline-flex p-1 rounded-2xl self-start sm:self-end shrink-0"
          style={{
            background: 'transparent',
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
          role="tablist"
          aria-label={t('departmentsPage.views')}
        >
          {(
            [
              { id: 'list' as const, label: t('workspace.list'), icon: MdList },
              { id: 'overview' as const, label: t('workspace.overview'), icon: MdTableChart },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = pageView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setPageView(tab.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: active ? selectedFill(isDark) : 'transparent',
                  color: active ? textPrimary(isDark) : textSecondary(isDark),
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && departments.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('departmentsPage.kpiDepartments'), value: totals.departments, color: '#06b6d4' },
            { label: t('departmentsPage.kpiPeople'), value: totals.members, color: '#3b82f6' },
            { label: t('departmentsPage.kpiOpenTasks'), value: totals.open, color: '#f59e0b' },
            { label: t('departmentsPage.kpiOverall'), value: `${totals.completionPct}%`, color: '#8b5cf6' },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{ background: surfaceItem(isDark), border: `1px solid ${cardBorder}` }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: textMuted(isDark) }}
              >
                {k.label}
              </p>
              <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: k.color }}>
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {pageView === 'list' && (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MdSearch
                size={18}
                className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: textMuted(isDark) }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('departmentsPage.searchPlaceholder')}
                className="w-full rounded-xl ps-10 pe-3 py-2.5 text-sm outline-none"
                style={fieldStyle}
              />
            </div>
            {canManage && (
              <GlassButton
                type="button"
                variant="primary"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold shrink-0"
              >
                <MdAdd size={18} /> {t('departmentsPage.create')}
              </GlassButton>
            )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading ? (
        <p style={{ color: textMuted(isDark) }}>{t('departmentsPage.loading')}</p>
      ) : departments.length === 0 ? (
        <div
          className="rounded-[18px] p-6 sm:p-10 text-center"
          style={{ background: flatBg, border: `1px solid ${cardBorder}` }}
        >
          <MdBusiness size={28} className="mx-auto mb-3" style={{ color: textMuted(isDark) }} />
          <p style={{ color: textMuted(isDark) }}>
            {canManage
              ? t('departmentsPage.empty')
              : t('departmentsPage.emptyNoAccess')}
          </p>
          {canManage && (
            <GlassButton
              type="button"
              variant="primary"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold"
            >
              <MdAdd size={18} /> {t('departmentsPage.create')}
            </GlassButton>
          )}
        </div>
      ) : pageView === 'overview' ? (
        <div className="space-y-5">
          <div className="grid lg:grid-cols-2 gap-5">
            <div
              className="rounded-2xl p-5"
              style={{ background: flatBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdTrendingUp size={18} style={{ color: '#3b82f6' }} />
                <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
                  Completion by department
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionChart} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
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
                      domain={[0, 100]}
                      tick={{ fill: textMuted(isDark), fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tipStyle}
                      labelStyle={tipLabel}
                      itemStyle={tipItem}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                      formatter={(v) => [`${v}%`, 'Completion']}
                      labelFormatter={(_, payload) =>
                        String(payload?.[0]?.payload?.fullName || '')
                      }
                    />
                    <Bar dataKey="completion" radius={[6, 6, 0, 0]}>
                      {completionChart.map((d) => (
                        <Cell key={d.fullName} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: flatBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdGroups size={18} style={{ color: '#8b5cf6' }} />
                <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
                  Headcount by department
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={membersChart} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
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
                    <Bar dataKey="members" radius={[6, 6, 0, 0]}>
                      {membersChart.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
            <div
              className="rounded-2xl p-5"
              style={{ background: flatBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="text-sm font-semibold mb-4" style={{ color: textPrimary(isDark) }}>
                Workload mix
              </p>
              <div className="h-64">
                {statusPie.length === 0 ? (
                  <p className="text-sm py-20 text-center" style={{ color: textMuted(isDark) }}>
                    No tasks yet
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPie}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {statusPie.map((s) => (
                          <Cell key={s.name} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip
                      contentStyle={tipStyle}
                      labelStyle={tipLabel}
                      itemStyle={tipItem}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                    />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {statusPie.map((s) => (
                  <span
                    key={s.name}
                    className="text-[11px] font-semibold inline-flex items-center gap-1.5"
                    style={{ color: textSecondary(isDark) }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.name} · {s.value}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl p-5"
              style={{ background: flatBg, border: `1px solid ${cardBorder}` }}
            >
              <p className="text-sm font-semibold mb-4" style={{ color: textPrimary(isDark) }}>
                Department scorecard
              </p>
              <ul className="space-y-2 max-h-80 overflow-auto thin-scrollbar">
                {[...departments]
                  .sort((a, b) => b.stats.completionPct - a.stats.completionPct)
                  .map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`${base}/departments/${d.id}`}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                        style={{
                          background: surfaceItem(isDark),
                          border: `1px solid ${borderSubtle(isDark)}`,
                        }}
                      >
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `${d.color || '#3B82F6'}22`,
                            color: d.color || '#3B82F6',
                          }}
                        >
                          <DepartmentIcon name={d.icon} deptKey={d.key} size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: textPrimary(isDark) }}
                            >
                              {displayName(d)}
                            </p>
                            <span
                              className="text-xs font-bold tabular-nums"
                              style={{ color: progressColor(d.stats.completionPct) }}
                            >
                              {d.stats.completionPct}%
                            </span>
                          </div>
                          <div
                            className="mt-1.5 h-1.5 rounded-full overflow-hidden"
                            style={{
                              background: isDark
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(0,0,0,0.06)',
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${d.stats.completionPct}%`,
                                background: progressColor(d.stats.completionPct),
                              }}
                            />
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: textMuted(isDark) }}>
                            {d.memberCount} {t('departmentsPage.people')} · {d.stats.open} {t('departmentsPage.open')} · {d.stats.done} {t('departmentsPage.done')}
                            {d.stats.overdue > 0 ? ` · ${d.stats.overdue} ${t('departmentsPage.chipOverdue')}` : ''}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md relative"
              style={{
                background: flatBg,
                border: `1px solid ${cardBorder}`,
                opacity: d.archivedAt ? 0.72 : 1,
              }}
            >
              <div className="flex items-start gap-3">
                <Link
                  href={`${base}/departments/${d.id}`}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${d.color || '#3B82F6'}22`,
                    color: d.color || '#3B82F6',
                  }}
                >
                  <DepartmentIcon name={d.icon} deptKey={d.key} size={22} />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          href={`${base}/departments/${d.id}`}
                          className="text-base font-bold truncate hover:underline"
                          style={{ color: textPrimary(isDark) }}
                        >
                          {displayName(d)}
                        </Link>
                        {d.archivedAt && (
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0"
                            style={{
                              background: 'rgba(239,68,68,0.15)',
                              color: '#ef4444',
                            }}
                          >
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: textMuted(isDark) }}>
                        {d.memberCount} {t('departmentsPage.people')} · {d.boardCount} {t('departmentsPage.projects')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canManage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditDept(d);
                          }}
                          className="p-2 rounded-xl transition-colors"
                          style={{
                            color: textSecondary(isDark),
                            border: `1px solid ${borderSubtle(isDark)}`,
                            background: isDark
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(0,0,0,0.03)',
                          }}
                          title={t('departmentsPage.editDepartment')}
                          aria-label={`${t('common.edit')} ${displayName(d)}`}
                        >
                          <MdEdit size={16} />
                        </button>
                      )}
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: progressColor(d.stats.completionPct) }}
                      >
                        {d.stats.completionPct}%
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-3 h-1.5 rounded-full overflow-hidden"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.stats.completionPct}%`,
                        background: progressColor(d.stats.completionPct),
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: t('departmentsPage.chipOpen'), value: d.stats.open, color: '#3b82f6' },
                      { label: t('departmentsPage.chipDone'), value: d.stats.done, color: '#22c55e' },
                      { label: t('departmentsPage.chipOverdue'), value: d.stats.overdue, color: '#ef4444' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl px-2.5 py-2"
                        style={{
                          background: surfaceItem(isDark),
                          border: `1px solid ${borderSubtle(isDark)}`,
                        }}
                      >
                        <p
                          className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: textMuted(isDark) }}
                        >
                          {s.label}
                        </p>
                        <p
                          className="text-sm font-bold tabular-nums"
                          style={{ color: s.color }}
                        >
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-4 pt-3 space-y-2.5 border-t"
                    style={{ borderColor: borderSubtle(isDark) }}
                  >
                    <div className="flex items-start gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider shrink-0 pt-1 inline-flex items-center gap-1 w-[4.5rem]"
                        style={{ color: textMuted(isDark) }}
                      >
                        <MdSupervisorAccount size={12} /> {t('departmentsPage.labelManager')}
                      </span>
                      {d.managers.length > 0 ? (
                        d.managers.map((p) => (
                          <PersonChip
                            key={p.id}
                            person={p}
                            isDark={isDark}
                            role={t('departmentsPage.roleManager')}
                          />
                        ))
                      ) : (
                        <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
                          {t('departmentsPage.unassigned')}
                        </span>
                      )}
                    </div>
                    {d.supervisors.length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider shrink-0 pt-1 inline-flex items-center gap-1 w-[4.5rem]"
                          style={{ color: textMuted(isDark) }}
                        >
                          <MdGroups size={12} /> {t('departmentsPage.labelLead')}
                        </span>
                        {d.supervisors.map((p) => (
                          <PersonChip
                            key={p.id}
                            person={p}
                            isDark={isDark}
                            role={t('departmentsPage.roleSupervisor')}
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-start gap-2 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider shrink-0 pt-1 inline-flex items-center gap-1 w-[4.5rem]"
                        style={{ color: textMuted(isDark) }}
                      >
                        <MdGroups size={12} /> {t('departmentsPage.labelTeam')}
                      </span>
                      {d.team.length > 0 ? (
                        <>
                          <div className="flex -space-x-1.5 items-center">
                            {d.team.slice(0, 5).map((p) => (
                              <span
                                key={p.id}
                                className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center border-2"
                                style={{
                                  borderColor: isDark ? 'var(--background)' : '#fff',
                                  background: isDark ? 'var(--chip)' : '#E5E7EB',
                                  color: textMuted(isDark),
                                }}
                                title={p.name || p.email}
                              >
                                {p.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.avatarUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <MdPersonOutline size={12} />
                                )}
                              </span>
                            ))}
                          </div>
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: textSecondary(isDark) }}
                          >
                            {d.team.length === 1
                              ? t('departmentsPage.memberOne')
                              : t('departmentsPage.membersCount', { n: d.team.length })}
                            {d.team.length > 5
                              ? ` · ${t('departmentsPage.moreCount', { n: d.team.length - 5 })}`
                              : ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
                          {t('departmentsPage.noTeamYet')}
                        </span>
                      )}
                    </div>
                    {d.access.length > 0 && (
                      <div className="flex items-start gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider shrink-0 pt-1 inline-flex items-center gap-1 w-[4.5rem]"
                          style={{ color: textMuted(isDark) }}
                        >
                          <MdVerifiedUser size={12} /> {t('departmentsPage.labelAccess')}
                        </span>
                        {d.access.map((p) => (
                          <PersonChip
                            key={p.id}
                            person={p}
                            isDark={isDark}
                            role={t('departmentsPage.roleOrgAccess')}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p
              className="col-span-full text-center py-10 text-sm"
              style={{ color: textMuted(isDark) }}
            >
              {t('departmentsPage.noMatchSearch')}
            </p>
          )}
        </div>
      )}

      <CreateDepartmentDialog
        open={createOpen}
        workspaceId={workspaceId}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />

      <EditDepartmentDialog
        open={!!editDept}
        workspaceId={workspaceId}
        department={editDept}
        canManage={canManage}
        onClose={() => setEditDept(null)}
        onSaved={() => {
          setEditDept(null);
          void load();
        }}
      />
    </div>
  );
}
