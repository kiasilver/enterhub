'use client';

import GlassDatePicker from '@/components/SafeDashboard/GlassDatePicker';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Parse YYYY-MM-DD (or ISO date prefix) to local Date at noon-safe local midnight. */
export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const ymd = value.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

/** Format Date → YYYY-MM-DD for APIs / form state. */
export function formatDateInput(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type Props = {
  /** YYYY-MM-DD string (empty = none) */
  value: string;
  onChange: (ymd: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isDark?: boolean;
  /** When false, Clear is still available via picker; required is for UX only */
  required?: boolean;
};

/**
 * Product date field — same GlassDatePicker as Dashboard → Date and Time.
 * Uses string YYYY-MM-DD to match existing form / API state.
 */
export function AppDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className = '',
  isDark: isDarkProp,
}: Props) {
  const { theme } = useTheme();
  const isDark = isDarkProp ?? theme === 'dark';

  return (
    <GlassDatePicker
      isDark={isDark}
      value={parseDateInput(value)}
      onChange={(d) => onChange(formatDateInput(d))}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
