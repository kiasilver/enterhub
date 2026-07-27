'use client';

import { useMemo, useState } from 'react';
import { MdSearch } from 'react-icons/md';
import { MATERIAL_ICON_NAMES } from '@/components/SafeDashboard/materialIconsData';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

/** Curated starters for common org units */
export const DEPARTMENT_ICON_PRESETS: { name: string; label: string; keys?: string[] }[] = [
  { name: 'computer', label: 'IT / Engineering', keys: ['it'] },
  { name: 'memory', label: 'Infrastructure', keys: ['it'] },
  { name: 'dns', label: 'Servers', keys: ['it'] },
  { name: 'code', label: 'Development', keys: ['it'] },
  { name: 'security', label: 'Security', keys: ['it'] },
  { name: 'account_balance', label: 'Finance', keys: ['finance'] },
  { name: 'payments', label: 'Payments', keys: ['finance'] },
  { name: 'receipt_long', label: 'Accounting', keys: ['finance'] },
  { name: 'groups', label: 'HR / People', keys: ['hr'] },
  { name: 'badge', label: 'Recruiting', keys: ['hr'] },
  { name: 'campaign', label: 'Marketing', keys: ['marketing'] },
  { name: 'ads_click', label: 'Ads', keys: ['marketing'] },
  { name: 'precision_manufacturing', label: 'Operations', keys: ['operations'] },
  { name: 'local_shipping', label: 'Logistics', keys: ['operations'] },
  { name: 'business', label: 'General', keys: ['general'] },
  { name: 'apartment', label: 'Company', keys: ['general'] },
  { name: 'support_agent', label: 'Support' },
  { name: 'gavel', label: 'Legal' },
  { name: 'science', label: 'R&D' },
  { name: 'storefront', label: 'Sales' },
];

type Props = {
  value: string;
  onChange: (icon: string) => void;
  accentColor?: string;
};

export function DepartmentIconPicker({ value, onChange, accentColor }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [query, setQuery] = useState('');
  const [browseAll, setBrowseAll] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '_');
    if (!browseAll) {
      if (!q) return DEPARTMENT_ICON_PRESETS.map((p) => p.name);
      return DEPARTMENT_ICON_PRESETS.filter(
        (p) =>
          p.name.includes(q) ||
          p.label.toLowerCase().includes(query.trim().toLowerCase()),
      ).map((p) => p.name);
    }
    const source = MATERIAL_ICON_NAMES;
    if (!q) return source.slice(0, 120);
    return source.filter((n) => n.includes(q)).slice(0, 160);
  }, [query, browseAll]);

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: accentColor ? `${accentColor}22` : surfaceItem(isDark),
            border: `1px solid ${borderSubtle(isDark)}`,
            color: accentColor || textPrimary(isDark),
          }}
        >
          <DepartmentIcon name={value || 'business'} size={28} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
            Selected icon
          </p>
          <p className="text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>
            {value || 'business'}
          </p>
        </div>
      </div>

      <div className="relative">
        <MdSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: textMuted(isDark) }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={browseAll ? 'Search all Material Icons…' : 'Search department icons…'}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
          style={field}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBrowseAll(false)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{
            background: !browseAll
              ? isDark
                ? 'rgba(37,99,235,0.35)'
                : 'rgba(37,99,235,0.12)'
              : 'transparent',
            color: !browseAll ? textPrimary(isDark) : textMuted(isDark),
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
        >
          Suggested
        </button>
        <button
          type="button"
          onClick={() => setBrowseAll(true)}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{
            background: browseAll
              ? isDark
                ? 'rgba(37,99,235,0.35)'
                : 'rgba(37,99,235,0.12)'
              : 'transparent',
            color: browseAll ? textPrimary(isDark) : textMuted(isDark),
            border: `1px solid ${borderSubtle(isDark)}`,
          }}
        >
          Browse all Material Icons
        </button>
      </div>

      <div
        className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-52 overflow-y-auto p-1 rounded-xl"
        style={{ border: `1px solid ${borderSubtle(isDark)}` }}
      >
        {filtered.map((icon) => {
          const active = value === icon;
          return (
            <button
              key={icon}
              type="button"
              title={icon}
              onClick={() => onChange(icon)}
              className="aspect-square rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: active
                  ? accentColor
                    ? `${accentColor}33`
                    : isDark
                      ? 'rgba(37,99,235,0.35)'
                      : 'rgba(37,99,235,0.15)'
                  : 'transparent',
                color: active
                  ? accentColor || textPrimary(isDark)
                  : textSecondary(isDark),
                boxShadow: active
                  ? `inset 0 0 0 1.5px ${accentColor || '#2563eb'}`
                  : undefined,
              }}
            >
              <DepartmentIcon name={icon} size={22} />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p
            className="col-span-full text-xs text-center py-6"
            style={{ color: textMuted(isDark) }}
          >
            No icons match
          </p>
        )}
      </div>
      <p className="text-[10px]" style={{ color: textMuted(isDark) }}>
        Icons from Google Material Icons (SVG font) — package: material-icons
      </p>
    </div>
  );
}
