'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdRefresh, MdTrendingDown, MdWarning } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  glassStyle,
  hexToRgba,
  tableRowBg,
} from '@/components/SafeDashboard/theme';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type EmployeeTrend = {
  employeeId: string;
  name: string;
  email: string;
  extensionRequested: number;
  extensionApproved: number;
  extensionRejected: number;
  totalAddedHours: number;
  totalAddedDays: number;
  avgAddedHours: number;
  avgAddedDays: number;
  chargedDelays: number;
  waivedDelays: number;
  openDelays: number;
  completedOnTime: number;
  delayRatePct: number;
  delayScore: number;
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

const SIGNAL_KEYS: Record<
  CreatorTrend['signal'],
  { key: 'workTrendsPage.signalOk' | 'workTrendsPage.signalWatch' | 'workTrendsPage.signalWeakEstimate'; color: string }
> = {
  ok: { key: 'workTrendsPage.signalOk', color: '#22c55e' },
  watch: { key: 'workTrendsPage.signalWatch', color: '#f59e0b' },
  weak_estimate: { key: 'workTrendsPage.signalWeakEstimate', color: '#ef4444' },
};

export function WorkTrendsClient({ workspaceId }: { workspaceId: string }) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeTrend[]>([]);
  const [creators, setCreators] = useState<CreatorTrend[]>([]);
  const [canManage, setCanManage] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/work-trends?year=${year}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setEmployees(json.data?.employees || []);
      setCreators(json.data?.creators || []);
      setCanManage(!!json.meta?.canManage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const glass = glassStyle(isDark);
  const th = {
    color: textMuted(isDark),
    borderBottom: `1px solid ${borderSubtle(isDark)}`,
  };
  const td = {
    color: textSecondary(isDark),
    borderBottom: `1px solid ${borderSubtle(isDark)}`,
  };

  return (
    <div
      className="h-full w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden space-y-6 px-4 sm:px-6 py-4 sm:py-5"
      style={{ scrollbarWidth: 'thin' }}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: textPrimary(isDark) }}
          >
            {t('workTrendsPage.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted(isDark) }}>
            {t('workTrendsPage.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl px-3 py-2 text-sm outline-none bg-transparent"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textPrimary(isDark),
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
          <GlassButton
            type="button"
            onClick={() => void load()}
            className="px-3 py-2 rounded-xl text-sm inline-flex items-center gap-1"
          >
            <MdRefresh size={16} />
            {t('workTrendsPage.refresh')}
          </GlassButton>
        </div>
      </div>

      {loading && (
        <div
          className="flex justify-center py-16 text-sm"
          style={{ color: textMuted(isDark) }}
        >
          {t('workTrendsPage.loading')}
        </div>
      )}

      {error && (
        <p className="text-sm" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <section className="rounded-2xl p-4 md:p-6 overflow-x-auto" style={glass}>
            <h2
              className="text-lg font-semibold mb-1 inline-flex items-center gap-2"
              style={{ color: textPrimary(isDark) }}
            >
              <MdTrendingDown size={20} />
              {t('workTrendsPage.allMembers')}
            </h2>
            <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>
              {t('workTrendsPage.membersDesc')}
            </p>
            {employees.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
                {t('workTrendsPage.noMembers')}
              </p>
            ) : (
              <table className="w-full text-start text-sm min-w-[720px]">
                <thead>
                  <tr>
                    {[
                      t('workTrendsPage.colPerson'),
                      t('workTrendsPage.colLateScore'),
                      t('workTrendsPage.colMarkedLate'),
                      t('workTrendsPage.colExcused'),
                      t('workTrendsPage.colOnTime'),
                      t('workTrendsPage.colLatePct'),
                      t('workTrendsPage.colTimeRequests'),
                      t('workTrendsPage.colApproved'),
                      t('workTrendsPage.colExtraHours'),
                      t('workTrendsPage.colExtraDays'),
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
                        {e.delayRatePct}%
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.extensionRequested}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.extensionApproved}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums" style={td}>
                        {e.totalAddedHours}
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

          {canManage && (
            <section className="rounded-2xl p-4 md:p-6 overflow-x-auto" style={glass}>
              <h2
                className="text-lg font-semibold mb-1 inline-flex items-center gap-2"
                style={{ color: textPrimary(isDark) }}
              >
                <MdWarning size={20} />
                {t('workTrendsPage.managersCreators')}
              </h2>
              <p className="text-xs mb-4" style={{ color: textMuted(isDark) }}>
                {t('workTrendsPage.creatorsDesc')}
              </p>
              {creators.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: textMuted(isDark) }}>
                  {t('workTrendsPage.noCreatorData', { year })}
                </p>
              ) : (
                <table className="w-full text-start text-sm min-w-[640px]">
                  <thead>
                    <tr>
                      {[
                        t('workTrendsPage.colCreator'),
                        t('workTrendsPage.colTasks'),
                        t('workTrendsPage.colExtensions'),
                        t('workTrendsPage.colApproved'),
                        t('workTrendsPage.colExtraHours'),
                        t('workTrendsPage.colExtraDays'),
                        t('workTrendsPage.colChargedDelays'),
                        t('workTrendsPage.colSignal'),
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
                      const sig = SIGNAL_KEYS[c.signal];
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
                            {c.totalAddedHours}
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
                                background: hexToRgba(sig.color, 0.15),
                                color: sig.color,
                              }}
                            >
                              {t(sig.key)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
