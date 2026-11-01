'use client';

import { useMemo, useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import type { DeptData } from '@/components/departments/department-types';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import { textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem } from '@/components/SafeDashboard/theme';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { useCalendar } from '@/components/CalendarProvider/CalendarProvider';
import { localizeListTitle, localizeWorkflowStatus } from '@/lib/list-i18n';

export default function DepartmentTaskList({
  data,
  isDark,
  onReload,
}: {
  data: DeptData;
  isDark: boolean;
  onReload: () => void | Promise<void>;
}) {
  const { t } = useLang();
  const { formatDate } = useCalendar();
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<{ boardId: string; cardId: string } | null>(
    null,
  );

  const rows = useMemo(() => {
    const all = data.projects.flatMap((p) =>
      p.cards.map((c) => ({
        ...c,
        projectId: p.id,
        projectName: p.name,
        projectColor: p.coverColor,
      })),
    );
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.projectName.toLowerCase().includes(needle) ||
        c.listTitle.toLowerCase().includes(needle),
    );
  }, [data.projects, q]);

  const cardBg = 'transparent';

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <MdSearch
          size={18}
          className="absolute start-3 top-1/2 -translate-y-1/2"
          style={{ color: textMuted(isDark) }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('departmentsPage.searchTasks')}
          className="w-full ps-9 pe-3 py-2.5 rounded-xl text-sm outline-none text-start"
          style={{
            background: cardBg,
            border: `1px solid ${borderSubtle(isDark)}`,
            color: textPrimary(isDark),
          }}
        />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: `1px solid ${borderSubtle(isDark)}` }}
      >
        <div
          className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            color: textMuted(isDark),
            borderBottom: `1px solid ${borderSubtle(isDark)}`,
          }}
        >
          <span className="col-span-4">{t('departmentsPage.colTask')}</span>
          <span className="col-span-2">{t('departmentsPage.colProject')}</span>
          <span className="col-span-2">{t('departmentsPage.colStatus')}</span>
          <span className="col-span-2">{t('departmentsPage.colDue')}</span>
          <span className="col-span-2">{t('departmentsPage.colTimer')}</span>
        </div>
        <ul>
          {rows.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setDetail({ boardId: c.projectId, cardId: c.id })}
                className="w-full text-start px-4 py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center hover:opacity-95"
                style={{
                  borderBottom: `1px solid ${borderSubtle(isDark)}`,
                  background: surfaceItem(isDark),
                }}
              >
                <span className="sm:col-span-4 min-w-0">
                  <span
                    className="block text-sm font-semibold truncate"
                    style={{ color: textPrimary(isDark) }}
                  >
                    {c.title}
                  </span>
                  <span className="text-[10px]" style={{ color: textMuted(isDark) }}>
                    {localizeListTitle(c.listTitle, t)}
                    {c.checklist.total > 0
                      ? ` · ${c.checklist.done}/${c.checklist.total}`
                      : ''}
                  </span>
                </span>
                <span
                  className="sm:col-span-2 text-xs truncate"
                  style={{ color: textSecondary(isDark) }}
                >
                  {c.projectName}
                </span>
                <span className="sm:col-span-2 text-xs font-medium" style={{ color: textSecondary(isDark) }}>
                  {localizeWorkflowStatus(c.workflowStatus, t)}
                </span>
                <span className="sm:col-span-2 text-xs tabular-nums" style={{ color: textMuted(isDark) }}>
                  {c.dueDate ? formatDate(c.dueDate, 'short') : '—'}
                </span>
                <span className="sm:col-span-2">
                  <WorkTimerBadge
                    startedAt={c.startedAt}
                    workflowStatus={c.workflowStatus}
                    size="sm"
                  />
                </span>
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="text-sm text-center py-12" style={{ color: textMuted(isDark) }}>
              {t('common.noResults')}
            </li>
          )}
        </ul>
      </div>

      {detail && (
        <CardDetailsModal
          boardId={detail.boardId}
          cardId={detail.cardId}
          open
          onClose={() => {
            setDetail(null);
            void onReload();
          }}
          onChanged={() => {
            void onReload();
          }}
        />
      )}
    </div>
  );
}
