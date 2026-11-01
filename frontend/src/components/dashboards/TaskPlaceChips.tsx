'use client';

import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { localizeProjectName } from '@/lib/list-i18n';
import { hexToRgba } from '@/components/SafeDashboard/theme';
import type { MyTaskItem } from '@/components/dashboards/MyTasksViews';

export function TaskPlaceChips({
  task,
  isDark,
  className = '',
}: {
  task: MyTaskItem;
  isDark: boolean;
  className?: string;
}) {
  const { t } = useLang();
  const dept = task.board.department;
  const deptColor = dept?.color || '#6B7280';
  const deptName = localizedDepartmentLabel(t, dept?.key, dept?.name);
  const projColor = task.board.color || deptColor;
  const projName = localizeProjectName(task.board.name, t, task.board.isGeneral);

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 min-w-0 ${className}`}>
      {dept && (
        <span
          className="max-w-[10rem] truncate text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1"
          style={{
            background: hexToRgba(deptColor, isDark ? 0.32 : 0.18),
            color: deptColor,
            border: `1px solid ${hexToRgba(deptColor, isDark ? 0.55 : 0.35)}`,
          }}
          title={deptName}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: deptColor }}
          />
          {deptName}
        </span>
      )}
      <span
        className="max-w-[11rem] truncate text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1"
        style={{
          background: hexToRgba(projColor, isDark ? 0.32 : 0.18),
          color: projColor,
          border: `1px solid ${hexToRgba(projColor, isDark ? 0.55 : 0.35)}`,
        }}
        title={projName}
      >
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ background: projColor }}
        />
        {projName}
      </span>
    </span>
  );
}
