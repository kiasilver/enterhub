'use client';

import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import { hexToRgba } from '@/components/SafeDashboard/theme';
import { projectInitials } from '@/lib/project-identity';

export function ProjectMark({
  name,
  color,
  icon,
  size = 32,
  isDark = false,
}: {
  name: string;
  color: string;
  icon?: string | null;
  size?: number;
  isDark?: boolean;
}) {
  const radius = size >= 36 ? 12 : size >= 28 ? 10 : 8;
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 font-bold select-none"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: hexToRgba(color, isDark ? 0.28 : 0.16),
        color,
        fontSize: Math.max(10, Math.round(size * 0.38)),
        letterSpacing: '-0.02em',
      }}
      aria-hidden
    >
      {icon ? (
        <DepartmentIcon name={icon} size={Math.round(size * 0.56)} style={{ color }} />
      ) : (
        projectInitials(name)
      )}
    </span>
  );
}
