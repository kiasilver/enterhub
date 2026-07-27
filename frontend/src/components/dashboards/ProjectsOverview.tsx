'use client';

import { useMemo } from 'react';
import {
  MdDownload,
  MdFilterAlt,
} from 'react-icons/md';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProjectBoard } from '@/components/dashboards/ProjectsDirectory';
import { WidgetFrame } from '@/components/dashboards/WidgetFrame';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { downloadCsv, toCsv } from '@/lib/csv';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  chartTooltipStyle,
  chartTooltipLabelStyle,
  chartTooltipItemStyle,
} from '@/components/SafeDashboard/theme';

type Props = {
  boards: ProjectBoard[];
  isDark: boolean;
  filtersActive: boolean;
};

function shortName(name: string, max = 12) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

export function ProjectsOverview({ boards, isDark, filtersActive }: Props) {
  const { t, lang } = useLang();
  const healthMeta = useMemo(
    () => ({
      on_track: { label: t('projectsPage.healthOnTrack'), color: '#22c55e' },
      at_risk: { label: t('projectsPage.healthAtRisk'), color: '#eab308' },
      off_track: { label: t('projectsPage.healthOffTrack'), color: '#ef4444' },
    }),
    [t, lang],
  );
  const visMeta = useMemo(
    () => ({
      PUBLIC: { label: t('projectsPage.accessPublic'), color: '#06b6d4' },
      WORKSPACE: { label: t('projectsPage.accessWorkspace'), color: '#3b82f6' },
      PRIVATE: { label: t('projectsPage.accessPrivate'), color: '#8b5cf6' },
    }),
    [t, lang],
  );
  const cardBg = surfaceItem(isDark);
  const elevatedBg = 'transparent';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const tick = { fill: textMuted(isDark), fontSize: 11 };
  const tooltipStyle = chartTooltipStyle(isDark);
  const tooltipLabel = chartTooltipLabelStyle(isDark);
  const tooltipItem = chartTooltipItemStyle(isDark);

  const kpis = useMemo(() => {
    const open = boards.reduce((n, b) => n + (b.open || 0), 0);
    const done = boards.reduce((n, b) => n + (b.done || 0), 0);
    const overdue = boards.reduce((n, b) => n + (b.overdue || 0), 0);
    const totalTasks = open + done;
    const atRisk = boards.filter((b) => b.health !== 'on_track').length;
    return {
      projects: boards.length,
      open,
      done,
      overdue,
      atRisk,
      completionPct: totalTasks ? Math.round((done / totalTasks) * 100) : 0,
    };
  }, [boards]);

  const byDepartment = useMemo(() => {
    const map = new Map<
      string,
      { name: string; projects: number; open: number; done: number; overdue: number }
    >();
    for (const b of boards) {
      const key = b.departmentKey || 'general';
      const name = localizedDepartmentLabel(t, key, b.departmentLabel);
      const prev = map.get(key) || {
        name,
        projects: 0,
        open: 0,
        done: 0,
        overdue: 0,
      };
      prev.projects += 1;
      prev.open += b.open || 0;
      prev.done += b.done || 0;
      prev.overdue += b.overdue || 0;
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.projects - a.projects);
  }, [boards, t, lang]);

  const byHealth = useMemo(() => {
    const counts: Record<ProjectBoard['health'], number> = {
      on_track: 0,
      at_risk: 0,
      off_track: 0,
    };
    for (const b of boards) counts[b.health] += 1;
    return (Object.keys(counts) as ProjectBoard['health'][])
      .map((h) => ({
        name: healthMeta[h].label,
        value: counts[h],
        color: healthMeta[h].color,
      }))
      .filter((d) => d.value > 0);
  }, [boards, healthMeta]);

  const byAccess = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of boards) {
      counts[b.visibility] = (counts[b.visibility] || 0) + 1;
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: visMeta[key as keyof typeof visMeta]?.label || key,
      value,
      color: visMeta[key as keyof typeof visMeta]?.color || '#94a3b8',
    }));
  }, [boards, visMeta]);

  const byProject = useMemo(
    () =>
      [...boards]
        .sort((a, b) => b.open + b.done - (a.open + a.done))
        .slice(0, 10)
        .map((b) => ({
          name: shortName(b.name),
          fullName: b.name,
          open: b.open,
          done: b.done,
          overdue: b.overdue,
          completion: b.completionPct,
        })),
    [boards],
  );

  const byManager = useMemo(() => {
    const map = new Map<string, { name: string; projects: number; open: number; done: number }>();
    for (const b of boards) {
      const id = b.manager?.id || 'unassigned';
      const label = b.manager?.name || t('projectsPage.unassigned');
      const prev = map.get(id) || { name: label, projects: 0, open: 0, done: 0 };
      prev.projects += 1;
      prev.open += b.open || 0;
      prev.done += b.done || 0;
      map.set(id, prev);
    }
    return [...map.values()]
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 8)
      .map((m) => ({
        name: shortName(m.name, 14),
        fullName: m.name,
        projects: m.projects,
        open: m.open,
        done: m.done,
      }));
  }, [boards, t, lang]);

  function exportProjects() {
    const headers = [
      t('projectsPage.colProject'),
      t('projectsPage.colDepartment'),
      t('projectsPage.colManager'),
      t('projectsPage.colVisibility'),
      t('projectsPage.colHealth'),
      t('projectsPage.colStatus'),
      t('projectsPage.colOpen'),
      t('projectsPage.colDone'),
      t('projectsPage.colOverdue'),
      t('projectsPage.colCompletion'),
      t('projectsPage.colMembers'),
      t('projectsPage.colUpdated'),
    ];
    const rows = boards.map((b) => [
      b.name,
      localizedDepartmentLabel(t, b.departmentKey, b.departmentLabel),
      b.manager?.name || '',
      visMeta[b.visibility as keyof typeof visMeta]?.label || b.visibility,
      healthMeta[b.health].label,
      b.status,
      b.open,
      b.done,
      b.overdue,
      b.completionPct,
      b.memberCount,
      b.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : '',
    ]);
    downloadCsv(`projects-report-${stamp()}.csv`, toCsv(headers, rows));
  }

  function exportDepartments() {
    const headers = [
      t('projectsPage.colDepartment'),
      t('projectsPage.kpiProjects'),
      t('projectsPage.colOpen'),
      t('projectsPage.colDone'),
      t('projectsPage.colOverdue'),
      t('projectsPage.colCompletion'),
    ];
    const rows = byDepartment.map((d) => {
      const total = d.open + d.done;
      return [
        d.name,
        d.projects,
        d.open,
        d.done,
        d.overdue,
        total ? Math.round((d.done / total) * 100) : 0,
      ];
    });
    downloadCsv(`departments-report-${stamp()}.csv`, toCsv(headers, rows));
  }

  function exportHealth() {
    const headers = [
      t('projectsPage.colProject'),
      t('projectsPage.colDepartment'),
      t('projectsPage.colHealth'),
      t('projectsPage.colOpen'),
      t('projectsPage.colOverdue'),
      t('projectsPage.colCompletion'),
    ];
    const rows = boards.map((b) => [
      b.name,
      localizedDepartmentLabel(t, b.departmentKey, b.departmentLabel),
      healthMeta[b.health].label,
      b.open,
      b.overdue,
      b.completionPct,
    ]);
    downloadCsv(`health-report-${stamp()}.csv`, toCsv(headers, rows));
  }

  const kpiCards = [
    { label: t('projectsPage.kpiProjects'), value: kpis.projects, color: '#06b6d4' },
    { label: t('projectsPage.kpiOpenTasks'), value: kpis.open, color: '#3b82f6' },
    { label: t('projectsPage.kpiDone'), value: kpis.done, color: '#22c55e' },
    { label: t('projectsPage.kpiOverdue'), value: kpis.overdue, color: '#ef4444' },
    { label: t('projectsPage.kpiAtRisk'), value: kpis.atRisk, color: '#eab308' },
    { label: t('projectsPage.kpiCompletion'), value: `${kpis.completionPct}%`, color: '#8b5cf6' },
  ];

  if (boards.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: elevatedBg, border: `1px solid ${cardBorder}` }}
      >
        <p style={{ color: textMuted(isDark) }}>
          {filtersActive
            ? t('projectsPage.overviewNoMatch')
            : t('projectsPage.overviewEmpty')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {filtersActive && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
          style={{
            background: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)',
            color: isDark ? '#93c5fd' : '#2563eb',
            border: `1px solid ${isDark ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.2)'}`,
          }}
        >
          <MdFilterAlt size={16} />
          {t('projectsPage.filtersActiveBanner', { n: boards.length })}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-4"
            style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
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

      <div className="flex flex-wrap gap-2">
        <ExportBtn label={t('projectsPage.exportProjectsCsv')} onClick={exportProjects} isDark={isDark} />
        <ExportBtn label={t('projectsPage.exportDepartmentsCsv')} onClick={exportDepartments} isDark={isDark} />
        <ExportBtn label={t('projectsPage.exportHealthCsv')} onClick={exportHealth} isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WidgetFrame title={t('projectsPage.chartOpenVsDone')} isDark={isDark} elevated className="lg:col-span-2">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byProject} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderSubtle(isDark)} />
                <XAxis dataKey="name" tick={tick} />
                <YAxis tick={tick} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={tooltipLabel}
                  itemStyle={tooltipItem}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                  formatter={(value, name) => [
                    value,
                    name === 'open'
                      ? t('projectsPage.colOpen')
                      : name === 'done'
                        ? t('projectsPage.colDone')
                        : String(name),
                  ]}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName || ''
                  }
                />
                <Legend />
                <Bar dataKey="open" name={t('projectsPage.colOpen')} fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="done" name={t('projectsPage.colDone')} fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetFrame>

        <WidgetFrame title={t('projectsPage.chartHealth')} isDark={isDark} elevated>
          <div className="h-[280px]">
            {byHealth.length === 0 ? (
              <p className="text-sm" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.noHealthData')}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byHealth}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {byHealth.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </WidgetFrame>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WidgetFrame title={t('projectsPage.chartDeptWorkload')} isDark={isDark} elevated>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byDepartment.slice(0, 8)}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={borderSubtle(isDark)} horizontal={false} />
                <XAxis type="number" tick={tick} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={100} tick={tick} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
                <Legend />
                <Bar dataKey="open" name={t('projectsPage.colOpen')} fill="#3b82f6" stackId="d" radius={[0, 4, 4, 0]} />
                <Bar dataKey="done" name={t('projectsPage.colDone')} fill="#22c55e" stackId="d" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetFrame>

        <WidgetFrame title={t('projectsPage.chartByManager')} isDark={isDark} elevated>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byManager} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderSubtle(isDark)} />
                <XAxis dataKey="name" tick={tick} />
                <YAxis tick={tick} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullName?: string } | undefined)?.fullName || ''
                  }
                />
                <Bar dataKey="projects" name={t('projectsPage.kpiProjects')} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </WidgetFrame>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WidgetFrame title={t('projectsPage.chartAccessMix')} isDark={isDark} elevated>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byAccess}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {byAccess.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabel} itemStyle={tooltipItem} cursor={{ fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </WidgetFrame>

        <WidgetFrame title={t('projectsPage.chartAtRisk')} isDark={isDark} elevated>
          <ul className="space-y-2 max-h-[220px] overflow-y-auto">
            {boards
              .filter((b) => b.health !== 'on_track' || b.overdue > 0)
              .sort((a, b) => b.overdue - a.overdue)
              .slice(0, 8)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: surfaceItem(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                      {b.name}
                    </p>
                    <p className="text-[11px]" style={{ color: textSecondary(isDark) }}>
                      {localizedDepartmentLabel(t, b.departmentKey, b.departmentLabel)} ·{' '}
                      {healthMeta[b.health].label}
                    </p>
                  </div>
                  <span
                    className="text-xs font-bold tabular-nums shrink-0"
                    style={{ color: b.overdue > 0 ? '#ef4444' : healthMeta[b.health].color }}
                  >
                    {b.overdue > 0
                      ? t('projectsPage.overdue', { n: b.overdue })
                      : `${b.completionPct}%`}
                  </span>
                </li>
              ))}
            {boards.every((b) => b.health === 'on_track' && b.overdue === 0) && (
              <li className="text-sm py-6 text-center" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.allHealthy')}
              </li>
            )}
          </ul>
        </WidgetFrame>
      </div>
    </div>
  );
}

function ExportBtn({
  label,
  onClick,
  isDark,
}: {
  label: string;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
      style={{
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        color: textPrimary(isDark),
      }}
    >
      <MdDownload size={14} />
      {label}
    </button>
  );
}

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
