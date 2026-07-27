'use client';

import { departmentIcon } from '@/lib/department-meta';

type Props = {
  /** Material Icons ligature e.g. "computer" */
  name?: string | null;
  /** Fallback from department key */
  deptKey?: string | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'filled' | 'outlined' | 'round';
};

/**
 * Renders a Material Design icon as SVG-quality glyph via the official
 * `material-icons` package (already loaded in app layout).
 */
export function DepartmentIcon({
  name,
  deptKey,
  size = 22,
  className = '',
  style,
  variant = 'outlined',
}: Props) {
  const ligature =
    (name && name.trim()) ||
    (deptKey ? departmentIcon(deptKey) : 'business');

  const cls =
    variant === 'filled'
      ? 'material-icons'
      : variant === 'round'
        ? 'material-icons-round'
        : 'material-icons-outlined';

  return (
    <span
      className={`${cls} ${className}`.trim()}
      style={{
        fontSize: size,
        lineHeight: 1,
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        ...style,
      }}
      aria-hidden
    >
      {ligature}
    </span>
  );
}
