'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  MdAnalytics,
  MdBusiness,
  MdExpandLess,
  MdExpandMore,
  MdGroups,
  MdRateReview,
  MdRefresh,
  MdWarning,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba,
  surfaceItem,
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  gregorianYearToJalaliYear,
  jalaliYearToGregorianYear,
  listRecentYears,
} from '@/lib/app-date';
import { localizedDepartmentLabel } from '@/lib/department-i18n';

type EmployeeTrend = {
  employeeId: string;
  name: string;
  email: string;
  departmentNames?: string[];
  extensionRequested: number;
  extensionApproved: number;
  extensionRejected: number;
  totalAddedHours: number;
  totalAddedDays: number;
  chargedDelays: number;
  waivedDelays: number;
  openDelays: number;
  completedOnTime: number;
  delayRatePct: number;
  delayScore: number;
  tasksApproved?: number;
};

type CreatorTrend = {
  creatorId: string;
  name: string;
  email: string;
  tasksCreated: number;
  extensionsOnCreatedTasks: number;
  approvedExtensions: number;
  totalAddedHours: number;
  totalAddedDays: number;
  chargedOnCreatedTasks: number;
  signal: 'ok' | 'watch' | 'weak_estimate';
};

type DeptOpt = { id: string; name: string; key: string; role: string };

type EvalPerson = {
  employeeId: string;
  name: string;
  email: string;
  taskCount: number;
  averages: {
    quality: number;
    timeliness: number;
    communication: number;
    initiative: number;
    collaboration: number;
    overall: number;
  };
  evaluations: {
    id: string;
    cardId: string;
    cardTitle: string;
    quality: number;
    timeliness: number;
    communication: number;
    initiative: number;
    collaboration: number;
    overall: number;
    strengths?: string | null;
    improvements?: string | null;
    notes?: string | null;
    evaluator: { id: string; name: string | null; email: string };
    createdAt: string;
  }[];
};

const SIGNAL_COLORS: Record<CreatorTrend['signal'], string> = {
  ok: '#22c55e',
  watch: '#f59e0b',
  weak_estimate: '#ef4444',
};

function scoreColor(n: number) {
  if (n >= 4.2) return '#22c55e';
  if (n >= 3.2) return '#f59e0b';
  return '#ef4444';
}

export function AnalyticsClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const { calendar } = useCalendar();
  const isDark = theme === 'dark';
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeParam = searchParams.get('scope'); // company | team | null
  const basePath = `/workspace/${workspaceId}/analytics`;

  /** Nav "My departments" → team; everything else (incl. Company) → company */
  const viewMode: 'company' | 'team' =
    scopeParam === 'team' ? 'team' : 'company';

  const [year, setYear] = useState(new Date().getFullYear());
  const [departmentId, setDepartmentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeTrend[]>([]);
  const [creators, setCreators] = useState<CreatorTrend[]>([]);
  const [canCompany, setCanCompany] = useState(false);
  const [canTeam, setCanTeam] = useState(false);
  const [departments, setDepartments] = useState<DeptOpt[]>([]);
  const [evalPeople, setEvalPeople] = useState<EvalPerson[]>([]);
  const [expandedEval, setExpandedEval] = useState<string | null>(null);
  const [needsDepartment, setNeedsDepartment] = useState(false);

  useEffect(() => {
    if (viewMode === 'company') setDepartmentId('');
  }, [viewMode]);

  const goCompany = () => {
    setDepartmentId('');
    router.push(`${basePath}?scope=company`);
  };

  const goTeamDept = (id: string) => {
    setDepartmentId(id);
    router.push(`${basePath}?scope=team`);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        year: String(year),
        mode: viewMode,
      });
      if (viewMode === 'team' && departmentId) {
        q.set('departmentId', departmentId);
      }
      const [trendsRes, evalRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/work-trends?${q}`),
        fetch(`/api/workspaces/${workspaceId}/evaluations?${q}`),
      ]);
      const json = await trendsRes.json();
      if (!trendsRes.ok) throw new Error(json.error || 'Failed to load');

      const depts: DeptOpt[] = json.meta?.departments || [];
      setDepartments(depts);
      setCanCompany(!!json.meta?.canCompany);
      setCanTeam(!!json.meta?.canTeam);
      setNeedsDepartment(!!json.meta?.needsDepartment);

      // Team must pick one department (org admin manages all → union == company)
      if (viewMode === 'team' && !departmentId && depts.length > 0) {
        setDepartmentId(depts[0].id);
        return;
      }

      setEmployees(json.data?.employees || []);
      setCreators(json.data?.creators || []);

      if (evalRes.ok) {
        const ej = await evalRes.json();
        setEvalPeople(ej.data?.people || []);
      } else {
        setEvalPeople([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, year, departmentId, viewMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = useMemo(() => {
    if (viewMode === 'company') return t('analyticsPage.titleCompany');
    if (departmentId) {
      const d = departments.find((x) => x.id === departmentId);
      return d
        ? t('analyticsPage.titleDepartmentNamed', { name: d.name })
        : t('analyticsPage.titleDepartment');
    }
    return t('analyticsPage.titleDepartment');
  }, [viewMode, departmentId, departments, t]);

  const signalLabel = useCallback(
    (signal: CreatorTrend['signal']) => {
      const labels: Record<CreatorTrend['signal'], string> = {
        ok: t('analyticsPage.signalOk'),
        watch: t('analyticsPage.signalWatch'),
        weak_estimate: t('analyticsPage.signalWeakEstimate'),
      };
      return labels[signal];
    },
    [t],
  );

  const panel = {
    background: 'transparent',
    border: `1px solid ${borderSubtle(isDark)}`,
  };
  const kpiPanel = {
    background: surfaceItem(isDark),
    border: `1px solid ${borderSubtle(isDark)}`,
  };
  const th = {
    color: textMuted(isDark),
    borderBottom: `1px solid ${borderSubtle(isDark)}`,
  };
  const td = {
    color: textSecondary(isDark),
    borderBottom: `1px solid ${borderSubtle(isDark)}`,
  };

  const totals = useMemo(() => {
    const late = employees.reduce((n, e) => n + e.chargedDelays, 0);
    const excused = employees.reduce((n, e) => n + e.waivedDelays, 0);
    const onTime = employees.reduce((n, e) => n + e.completedOnTime, 0);
    const approved = employees.reduce((n, e) => n + (e.tasksApproved || 0), 0);
    const reviews = evalPeople.reduce((n, e) => n + e.taskCount, 0);
    const avgOverall =
      evalPeople.length > 0
        ? +(
            evalPeople.reduce((n, e) => n + e.averages.overall, 0) /
            evalPeople.length
          ).toFixed(2)
        : null;
    return {
      late,
      excused,
      onTime,
      approved,
      people: employees.length,
      reviews,
      avgOverall,
    };
  }, [employees, evalPeople]);

  return (
    <div
      className="h-full w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-6 px-4 sm:px-6 py-4 sm:py-5"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold inline-flex items-center gap-2"
            style={{ color: textPrimary(isDark) }}
          >
            <MdAnalytics size={28} />
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted(isDark) }}>
            {t('analyticsPage.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canCompany && (
            <button
              type="button"
              onClick={goCompany}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                background:
                  viewMode === 'company'
                    ? isDark
                      ? 'rgba(37,99,235,0.35)'
                      : '#2563eb'
                    : isDark
                      ? 'var(--surface)'
                      : '#F3F4F6',
                color:
                  viewMode === 'company' ? '#fff' : textPrimary(isDark),
              }}
            >
              <MdBusiness size={14} /> {t('analyticsPage.company')}
            </button>
          )}
          {(canTeam || departments.length > 0) && (
            <div className="inline-flex items-center gap-1.5">
              {viewMode === 'team' && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2"
                  style={{ color: textMuted(isDark) }}
                >
                  <MdGroups size={14} /> {t('analyticsPage.dept')}
                </span>
              )}
              <select
                value={
                  viewMode === 'team'
                    ? departmentId || departments[0]?.id || ''
                    : ''
                }
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) {
                    goCompany();
                    return;
                  }
                  goTeamDept(id);
                }}
                className="rounded-xl px-3 py-2 text-xs outline-none bg-transparent"
                style={{
                  border: `1px solid ${
                    viewMode === 'team'
                      ? isDark
                        ? 'rgba(37,99,235,0.55)'
                        : '#2563eb'
                      : borderSubtle(isDark)
                  }`,
                  color: textPrimary(isDark),
                  minWidth: 160,
                }}
              >
                {viewMode === 'company' && (
                  <option value="">
                    {t('analyticsPage.pickDepartment')}
                  </option>
                )}
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {localizedDepartmentLabel(t, d.key, d.name)}
                  </option>
                ))}
              </select>
            </div>
          )}
          {viewMode === 'team' && needsDepartment && !departmentId && (
            <span className="text-xs" style={{ color: '#f59e0b' }}>
              {t('analyticsPage.selectDepartment')}
            </span>
          )}
          <select
            value={
              calendar === 'jalali' ? gregorianYearToJalaliYear(year) : year
            }
            onChange={(e) => {
              const v = Number(e.target.value);
              setYear(calendar === 'jalali' ? jalaliYearToGregorianYear(v) : v);
            }}
            className="rounded-xl px-3 py-2 text-sm outline-none bg-transparent"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textPrimary(isDark),
            }}
          >
            {listRecentYears(calendar, 3).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <GlassButton
            type="button"
            onClick={() => void load()}
            className="px-3 py-2 rounded-xl text-sm inline-flex items-center gap-1"
          >
            <MdRefresh size={16} />
            {t('analyticsPage.refresh')}
          </GlassButton>
        </div>
      </div>

      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: t('analyticsPage.kpiPeople'), value: totals.people, color: '#3b82f6' },
            { label: t('analyticsPage.kpiTasksDone'), value: totals.approved, color: '#22c55e' },
            { label: t('analyticsPage.kpiOnTime'), value: totals.onTime, color: '#06b6d4' },
            { label: t('analyticsPage.kpiMarkedLate'), value: totals.late, color: '#ef4444' },
            { label: t('analyticsPage.kpiReviews'), value: totals.reviews, color: '#8b5cf6' },
            {
              label: t('analyticsPage.kpiAvgRating'),
              value: totals.avgOverall ?? '—',
              color: totals.avgOverall != null ? scoreColor(totals.avgOverall) : '#94a3b8',
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={kpiPanel}
            >
              <p className="text-[10px] font-bold uppercase" style={{ color: textMuted(isDark) }}>
                {k.label}
              </p>
              <p
                className="text-2xl font-bold tabular-nums mt-1"
                style={{ color: k.color }}
              >
                {k.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16 text-sm" style={{ color: textMuted(isDark) }}>
          {t('analyticsPage.loading')}
        </div>
      )}
      {error && (
        <p className="text-sm" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <section className="rounded-2xl p-4 md:p-6 overflow-x-auto" style={panel}>
            <h2
              className="text-lg font-semibold mb-1 inline-flex items-center gap-2"
              style={{ color: textPrimary(isDark) }}
            >
              <MdGroups size={20} />
              {t('analyticsPage.peopleTitle')}
            </h2>
            <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>
              {t('analyticsPage.peopleDesc')}
            </p>
            {employees.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
                {t('analyticsPage.noPeople')}
              </p>
            ) : (
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead>
                  <tr>
                    {[
                      t('analyticsPage.colPerson'),
                      t('analyticsPage.colDept'),
                      t('analyticsPage.colLateScore'),
                      t('analyticsPage.colMarkedLate'),
                      t('analyticsPage.colExcused'),
                      t('analyticsPage.colOnTime'),
                      t('analyticsPage.colDone'),
                      t('analyticsPage.colLatePct'),
                      t('analyticsPage.colTimeReq'),
                      t('analyticsPage.colApproved'),
                      t('analyticsPage.colExtraDays'),
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-[10px] font-bold uppercase tracking-wide py-2 pr-3"
                        style={th}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e, i) => (
                    <tr
                      key={e.employeeId}
                      style={{ background: tableRowBg(isDark, i) }}
                    >
                      <td className="py-2.5 pr-3" style={td}>
                        <div style={{ color: textPrimary(isDark) }}>{e.name}</div>
                        <div className="text-[10px]" style={{ color: textMuted(isDark) }}>
                          {e.email}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[11px]" style={td}>
                        {(e.departmentNames || []).join(', ') || '—'}
                      </td>
                      <td
                        className="py-2.5 pr-3 font-bold tabular-nums"
                        style={{
                          ...td,
                          color: e.delayScore < 0 ? '#f87171' : textPrimary(isDark),
                        }}
                      >
                        {e.delayScore}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.chargedDelays}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.waivedDelays}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.completedOnTime}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.tasksApproved ?? 0}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.delayRatePct}%
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.extensionRequested}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.extensionApproved}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.totalAddedDays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="rounded-2xl p-4 md:p-6 overflow-x-auto" style={panel}>
            <h2
              className="text-lg font-semibold mb-1 inline-flex items-center gap-2"
              style={{ color: textPrimary(isDark) }}
            >
              <MdRateReview size={20} />
              {t('analyticsPage.reviewsTitle')}
            </h2>
            <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>
              {t('analyticsPage.reviewsDesc')}
            </p>
            {evalPeople.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
                {t('analyticsPage.noReviews')}
              </p>
            ) : (
              <div className="space-y-2">
                {evalPeople.map((p) => {
                  const open = expandedEval === p.employeeId;
                  return (
                    <div
                      key={p.employeeId}
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: `1px solid ${borderSubtle(isDark)}`,
                        background: isDark ? 'var(--surface)' : '#F9FAFB',
                      }}
                    >
                      <button
                        type="button"
                        className="w-full flex flex-wrap items-center gap-3 px-3 py-3 text-left"
                        onClick={() =>
                          setExpandedEval(open ? null : p.employeeId)
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: textPrimary(isDark) }}
                          >
                            {p.name}
                          </p>
                          <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                            {p.taskCount === 1
                              ? t('analyticsPage.reviewCount', { n: p.taskCount })
                              : t('analyticsPage.reviewCountPlural', { n: p.taskCount })}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] tabular-nums">
                          {(
                            [
                              [t('analyticsPage.evalOverall'), p.averages.overall],
                              [t('analyticsPage.evalQuality'), p.averages.quality],
                              [t('analyticsPage.evalTime'), p.averages.timeliness],
                              [t('analyticsPage.evalComm'), p.averages.communication],
                              [t('analyticsPage.evalInit'), p.averages.initiative],
                              [t('analyticsPage.evalCollab'), p.averages.collaboration],
                            ] as const
                          ).map(([label, val]) => (
                            <span
                              key={label}
                              className="px-2 py-1 rounded-lg font-semibold"
                              style={{
                                background: hexToRgba(scoreColor(val), 0.12),
                                color: scoreColor(val),
                              }}
                            >
                              {label} {val}
                            </span>
                          ))}
                        </div>
                        {open ? (
                          <MdExpandLess size={20} style={{ color: textMuted(isDark) }} />
                        ) : (
                          <MdExpandMore size={20} style={{ color: textMuted(isDark) }} />
                        )}
                      </button>
                      {open && (
                        <ul
                          className="px-3 pb-3 space-y-2 border-t"
                          style={{ borderColor: borderSubtle(isDark) }}
                        >
                          {p.evaluations.map((ev) => (
                            <li
                              key={ev.id}
                              className="rounded-lg px-3 py-2.5 mt-2"
                              style={{
                                background: surfaceItem(isDark),
                                border: `1px solid ${borderSubtle(isDark)}`,
                              }}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p
                                    className="text-sm font-medium"
                                    style={{ color: textPrimary(isDark) }}
                                  >
                                    {ev.cardTitle}
                                  </p>
                                  <p
                                    className="text-[11px] mt-0.5"
                                    style={{ color: textMuted(isDark) }}
                                  >
                                    {t('analyticsPage.evalBy', {
                                      name: ev.evaluator.name || ev.evaluator.email,
                                    })}
                                    {' · '}
                                    {new Date(ev.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <span
                                  className="text-xs font-bold px-2 py-0.5 rounded-md tabular-nums"
                                  style={{
                                    background: hexToRgba(
                                      scoreColor(ev.overall),
                                      0.15,
                                    ),
                                    color: scoreColor(ev.overall),
                                  }}
                                >
                                  {t('analyticsPage.evalOverallScore', { score: ev.overall })}
                                </span>
                              </div>
                              <div
                                className="flex flex-wrap gap-2 mt-2 text-[10px] tabular-nums"
                                style={{ color: textSecondary(isDark) }}
                              >
                                <span>Q {ev.quality}</span>
                                <span>T {ev.timeliness}</span>
                                <span>C {ev.communication}</span>
                                <span>I {ev.initiative}</span>
                                <span>Collab {ev.collaboration}</span>
                              </div>
                              {(ev.strengths ||
                                ev.improvements ||
                                ev.notes) && (
                                <div
                                  className="mt-2 space-y-1 text-[12px]"
                                  style={{ color: textSecondary(isDark) }}
                                >
                                  {ev.strengths && (
                                    <p>
                                      <span className="font-semibold text-green-500">
                                        {t('analyticsPage.strengths')}{' '}
                                      </span>
                                      {ev.strengths}
                                    </p>
                                  )}
                                  {ev.improvements && (
                                    <p>
                                      <span className="font-semibold text-amber-500">
                                        {t('analyticsPage.improvements')}{' '}
                                      </span>
                                      {ev.improvements}
                                    </p>
                                  )}
                                  {ev.notes && (
                                    <p>
                                      <span className="font-semibold">{t('analyticsPage.notes')} </span>
                                      {ev.notes}
                                    </p>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {creators.length > 0 && (
            <section className="rounded-2xl p-4 md:p-6 overflow-x-auto" style={panel}>
              <h2
                className="text-lg font-semibold mb-1 inline-flex items-center gap-2"
                style={{ color: textPrimary(isDark) }}
              >
                <MdWarning size={20} />
                {t('analyticsPage.creatorsTitle')}
              </h2>
              <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>
                {t('analyticsPage.creatorsDesc')}
              </p>
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead>
                  <tr>
                    {[
                      t('analyticsPage.colCreator'),
                      t('analyticsPage.colTasks'),
                      t('analyticsPage.colExtensions'),
                      t('analyticsPage.colApproved'),
                      t('analyticsPage.colExtraDays'),
                      t('analyticsPage.colLateOnTasks'),
                      t('analyticsPage.colSignal'),
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-[10px] font-bold uppercase tracking-wide py-2 pr-3"
                        style={th}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creators.map((c, i) => {
                    const sigColor = SIGNAL_COLORS[c.signal];
                    return (
                      <tr key={c.creatorId} style={{ background: tableRowBg(isDark, i) }}>
                        <td className="py-2.5 pr-3" style={td}>
                          <div style={{ color: textPrimary(isDark) }}>{c.name}</div>
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums" style={td}>
                          {c.tasksCreated}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums" style={td}>
                          {c.extensionsOnCreatedTasks}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums" style={td}>
                          {c.approvedExtensions}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums" style={td}>
                          {c.totalAddedDays}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums" style={td}>
                          {c.chargedOnCreatedTasks}
                        </td>
                        <td className="py-2.5 pr-3" style={td}>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                            style={{
                              background: hexToRgba(sigColor, 0.15),
                              color: sigColor,
                            }}
                          >
                            {signalLabel(c.signal)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}

          <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
            {t('analyticsPage.accessNote')}
          </p>
        </>
      )}
    </div>
  );
}
