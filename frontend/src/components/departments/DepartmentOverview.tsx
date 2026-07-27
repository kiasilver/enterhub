'use client';

import Link from 'next/link';
import { MdCheckCircle, MdErrorOutline, MdPlayCircle, MdWork } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import type { DeptData } from '@/components/departments/department-types';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  hexToRgba,
} from '@/components/SafeDashboard/theme';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || '?').toUpperCase();
}

export default function DepartmentOverview({
  data,
  kpis,
  isDark,
  workspaceId,
}: {
  data: DeptData;
  kpis: {
    total: number;
    open: number;
    done: number;
    overdue: number;
    inProgress: number;
    completionPct: number;
  };
  isDark: boolean;
  workspaceId: string;
}) {
  const { t } = useLang();
  const roleLabel = (role: string) => {
    if (role === 'MANAGER') return t('departmentsPage.roleManager');
    if (role === 'SUPERVISOR') return t('departmentsPage.roleSupervisor');
    if (role === 'MEMBER') return t('departmentsPage.roleMember');
    return role;
  };
  const cardBg = 'transparent';
  const kpiBg = surfaceItem(isDark);
  const running = data.projects
    .flatMap((p) => p.cards.map((c) => ({ ...c, projectName: p.name, boardId: p.id })))
    .filter((c) => c.workflowStatus === 'IN_PROGRESS')
    .slice(0, 8);

  const kpiCards = [
    { label: t('departmentsPage.projects'), value: data.projects.length, color: data.color, icon: MdWork },
    { label: t('projectsPage.kpiOpenTasks'), value: kpis.open, color: '#3b82f6', icon: MdPlayCircle },
    { label: t('projectsPage.statusActive'), value: kpis.inProgress, color: '#8b5cf6', icon: MdPlayCircle },
    { label: t('projectsPage.kpiDone'), value: kpis.done, color: '#22c55e', icon: MdCheckCircle },
    { label: t('projectsPage.kpiOverdue'), value: kpis.overdue, color: '#ef4444', icon: MdErrorOutline },
    { label: t('projectsPage.kpiCompletion'), value: `${kpis.completionPct}%`, color: '#06b6d4', icon: MdCheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-2xl p-4"
              style={{
                background: kpiBg,
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium" style={{ color: textMuted(isDark) }}>
                  {k.label}
                </span>
                <Icon size={16} style={{ color: k.color }} />
              </div>
              <p className="text-2xl font-bold tabular-nums" style={{ color: textPrimary(isDark) }}>
                {k.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section
          className="lg:col-span-2 rounded-2xl p-5 space-y-4"
          style={{ background: cardBg, border: `1px solid ${borderSubtle(isDark)}` }}
        >
          <h2 className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
            {t('projectsPage.title')}
          </h2>
          <ul className="space-y-3">
            {data.projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/board/${p.id}`}
                  className="block rounded-xl p-3 transition-colors"
                  style={{
                    background: surfaceItem(isDark),
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-sm" style={{ color: textPrimary(isDark) }}>
                      {p.name}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: textMuted(isDark) }}>
                      {t('departmentsPage.tasksCount', { n: p.cardCount })} · {p.completionPct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: hexToRgba(p.coverColor, 0.2) }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.completionPct}%`,
                        background: p.coverColor,
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
            {data.projects.length === 0 && (
              <li className="text-sm py-6 text-center" style={{ color: textMuted(isDark) }}>
                {t('departmentsPage.noProjects')}
              </li>
            )}
          </ul>
        </section>

        <section
          className="rounded-2xl p-5 space-y-4"
          style={{ background: cardBg, border: `1px solid ${borderSubtle(isDark)}` }}
        >
          <h2 className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
            {t('departmentsPage.labelTeam')}
          </h2>
          <ul className="space-y-2 max-h-[420px] overflow-y-auto">
            {data.members.map((m) => (
              <li
                key={m.userId}
                className="flex items-center gap-3 px-2 py-2 rounded-xl"
                style={{ background: surfaceItem(isDark) }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: data.color }}
                >
                  {initials(m.user.name || m.user.email)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {m.user.name || m.user.email}
                  </p>
                  <p className="text-[10px]" style={{ color: textMuted(isDark) }}>
                    {roleLabel(m.role)}
                  </p>
                </div>
              </li>
            ))}
            {data.members.length === 0 && (
              <li className="text-sm text-center py-4" style={{ color: textMuted(isDark) }}>
                {t('departmentsPage.noTeamYet')}
              </li>
            )}
          </ul>
          <Link
            href={`/workspace/${workspaceId}/boards`}
            className="text-xs font-semibold inline-flex items-center gap-1"
            style={{ color: data.color }}
          >
            <DepartmentIcon name={data.icon} deptKey={data.key} size={14} />
            {t('departmentsPage.allProjects')}
          </Link>
        </section>
      </div>

      {running.length > 0 && (
        <section
          className="rounded-2xl p-5 space-y-3"
          style={{ background: cardBg, border: `1px solid ${borderSubtle(isDark)}` }}
        >
          <h2 className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
            Running now
          </h2>
          <ul className="space-y-2">
            {running.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: surfaceItem(isDark) }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {c.title}
                  </p>
                  <p className="text-[10px]" style={{ color: textSecondary(isDark) }}>
                    {c.projectName}
                  </p>
                </div>
                <WorkTimerBadge
                  startedAt={c.startedAt}
                  workflowStatus={c.workflowStatus}
                  size="md"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
