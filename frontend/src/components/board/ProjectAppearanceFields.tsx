'use client';

import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { DepartmentIcon } from '@/components/departments/DepartmentIcon';
import {
  textMuted,
  textPrimary,
  textSecondary,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { PROJECT_COLOR_PALETTE, PROJECT_ICON_PRESETS } from '@/lib/project-identity';
import { ProjectMark } from '@/components/board/ProjectMark';

export function ProjectAppearanceFields({
  name,
  color,
  icon,
  isDark,
  onColorChange,
  onIconChange,
}: {
  name: string;
  color: string | null;
  icon: string | null;
  isDark: boolean;
  onColorChange: (color: string | null) => void;
  onIconChange: (icon: string | null) => void;
}) {
  const { t } = useLang();
  const previewColor = color || PROJECT_COLOR_PALETTE[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ProjectMark name={name || 'P'} color={previewColor} icon={icon} size={44} isDark={isDark} />
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
            {t('projectsPage.projectLook')}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: textMuted(isDark) }}>
          {t('projectsPage.projectColor')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onColorChange(null)}
            className="h-8 px-2.5 rounded-lg text-[11px] font-semibold"
            style={{
              border: `1px solid ${!color ? (isDark ? '#93c5fd' : '#2563eb') : borderSubtle(isDark)}`,
              color: textSecondary(isDark),
              background: surfaceItem(isDark),
            }}
          >
            {t('projectsPage.colorAuto')}
          </button>
          {PROJECT_COLOR_PALETTE.map((hex) => {
            const on = color?.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                aria-label={hex}
                onClick={() => onColorChange(hex)}
                className="h-8 w-8 rounded-lg"
                style={{
                  background: hex,
                  boxShadow: on ? `0 0 0 2px ${isDark ? '#0f172a' : '#fff'}, 0 0 0 4px ${hex}` : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-1.5" style={{ color: textMuted(isDark) }}>
          {t('projectsPage.projectIcon')}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onIconChange(null)}
            className="h-9 px-2.5 rounded-lg text-[11px] font-semibold"
            style={{
              border: `1px solid ${!icon ? (isDark ? '#93c5fd' : '#2563eb') : borderSubtle(isDark)}`,
              color: textPrimary(isDark),
              background: surfaceItem(isDark),
            }}
          >
            {t('projectsPage.projectIconDefault')}
          </button>
          {PROJECT_ICON_PRESETS.map((name) => {
            const on = icon === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onIconChange(name)}
                className="h-9 w-9 rounded-lg inline-flex items-center justify-center overflow-hidden"
                dir="ltr"
                style={{
                  border: `1px solid ${on ? (isDark ? '#93c5fd' : '#2563eb') : borderSubtle(isDark)}`,
                  background: on ? `${previewColor}22` : surfaceItem(isDark),
                  color: previewColor,
                }}
                aria-label={name}
              >
                <DepartmentIcon name={name} size={18} style={{ color: previewColor }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
