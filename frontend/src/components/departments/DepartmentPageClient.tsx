'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MdAdd,
  MdArrowBack,
  MdEdit,
  MdGroups,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import DepartmentKanban from '@/components/departments/DepartmentKanban';
import { EditDepartmentDialog } from '@/components/departments/EditDepartmentDialog';
import type { DeptData } from '@/components/departments/department-types';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  hexToRgba, panelFill } from '@/components/SafeDashboard/theme';
import { safeReturnPath } from '@/lib/nav-from';

export default function DepartmentPageClient({
  workspaceId,
  deptId,
}: {
  workspaceId: string;
  deptId: string;
}) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const searchParams = useSearchParams();
  const backHref = safeReturnPath(
    searchParams.get('from'),
    `/workspace/${workspaceId}/departments?view=list`,
  );

  const [data, setData] = useState<DeptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/departments/${deptId}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, deptId]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    if (!data) return null;
    const cards = data.projects.flatMap((p) => p.cards);
    const total = cards.length;
    const done = cards.filter(
      (c) =>
        c.workflowStatus === 'APPROVED' ||
        /done|complete|closed/i.test(c.listTitle),
    ).length;
    const overdue = cards.filter((c) => {
      if (!c.dueDate) return false;
      if (c.workflowStatus === 'APPROVED' || /done|complete/i.test(c.listTitle)) {
        return false;
      }
      return new Date(c.dueDate).getTime() < Date.now();
    }).length;
    const open = total - done;
    const completionPct = total ? Math.round((done / total) * 100) : 0;
    return { total, open, done, overdue, completionPct };
  }, [data]);

  if (loading && !data) {
    return (
      <p className="text-sm py-12 text-center" style={{ color: textMuted(isDark) }}>
        Loading department…
      </p>
    );
  }
  if (error || !data) {
    return <p className="text-sm text-red-500">{error || 'Not found'}</p>;
  }

  const accent = data.color || '#3B82F6';

  return (
    <div className="space-y-5 w-full pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
              style={{
                color: textPrimary(isDark),
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
            >
              <MdArrowBack size={16} />
              Back
            </Link>
            {(data.canManage || data.canManageMembers) && (
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors duration-200"
                style={{
                  color: textPrimary(isDark),
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  border: `1px solid ${borderSubtle(isDark)}`,
                }}
              >
                <MdEdit size={16} />
                {t('common.edit')}
              </button>
            )}
          </div>

          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: textMuted(isDark) }}
            >
              Department · Kanban
            </p>
            <h1
              className="text-xl sm:text-2xl font-bold flex items-center gap-2.5"
              style={{ color: textPrimary(isDark) }}
            >
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                style={{
                  background: hexToRgba(accent, 0.18),
                  color: accent,
                  border: `1px solid ${hexToRgba(accent, 0.35)}`,
                }}
              >
                <DepartmentIcon name={data.icon} deptKey={data.key} size={22} />
              </span>
              <span className="truncate">{data.name}</span>
            </h1>
            <p className="text-sm mt-1.5" style={{ color: textSecondary(isDark) }}>
              {t('departmentsPage.projectsCount', { n: data.projects.length })} · {t('departmentsPage.tasksCount', { n: kpis?.total ?? 0 })}
              {kpis ? ` · ${kpis.completionPct}%` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: t('departmentsPage.chipOpen'), value: kpis?.open ?? 0, color: '#3b82f6' },
            { label: t('departmentsPage.chipDone'), value: kpis?.done ?? 0, color: '#22c55e' },
            { label: t('departmentsPage.chipOverdue'), value: kpis?.overdue ?? 0, color: '#ef4444' },
            {
              label: t('departmentsPage.kpiPeople'),
              value: data.members.length,
              color: accent,
              icon: true,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-3.5 py-2.5 min-w-[76px]"
              style={{
                background: 'transparent',
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: textMuted(isDark) }}
              >
                {s.icon ? (
                  <span className="inline-flex items-center gap-1">
                    <MdGroups size={11} /> {s.label}
                  </span>
                ) : (
                  s.label
                )}
              </p>
              <p
                className="text-lg font-bold tabular-nums mt-0.5"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <DepartmentKanban
        workspaceId={workspaceId}
        deptId={deptId}
        data={data}
        onReload={load}
        hideChrome
      />

      <EditDepartmentDialog
        open={editOpen}
        workspaceId={workspaceId}
        department={data}
        canManage={!!data.canManage}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          void load();
        }}
      />
    </div>
  );
}
