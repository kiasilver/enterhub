'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { MdAdd, MdDelete, MdLabel } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

type LabelRow = {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  cardCount: number;
  createdBy: { id: string; name: string | null; email: string } | null;
};

const PRESET_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#22C55E',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
];

export default function LabelsPanel() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/labels`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setLabels(json.data || []);
      setCanManage(Boolean(json.canManage));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createLabel(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !canManage || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Create failed');
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function updateColor(labelId: string, next: string) {
    if (!canManage) return;
    const res = await fetch(`/api/workspaces/${workspaceId}/labels`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelId, color: next }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || 'Update failed');
      return;
    }
    await load();
  }

  async function removeLabel(labelId: string) {
    if (!canManage) return;
    if (!window.confirm(t('settingsUi.deleteLabelConfirm'))) return;
    const res = await fetch(
      `/api/workspaces/${workspaceId}/labels?labelId=${labelId}`,
      { method: 'DELETE' },
    );
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || 'Delete failed');
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold" style={{ color: textPrimary(isDark) }}>
          {t('settingsUi.labelsTitle')}
        </h2>
        <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
          {t('settingsUi.labelsSubtitle')}
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {canManage && (
        <SettingsGlassCard accent="#f97316">
          <SettingsSectionTitle>{t('settingsUi.newLabel')}</SettingsSectionTitle>
          <form onSubmit={createLabel} className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settingsUi.labelName')}
              maxLength={60}
              className="w-full rounded-xl px-3 py-2.5 text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textPrimary(isDark) }}
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${textPrimary(isDark)}` : 'none',
                    outlineOffset: 2,
                  }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
            <GlassButton type="submit" disabled={busy || !name.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm">
              <MdAdd size={16} />
              {t('settingsUi.addLabel')}
            </GlassButton>
          </form>
        </SettingsGlassCard>
      )}

      <SettingsGlassCard accent="#f97316">
        <SettingsSectionTitle>
          <span className="inline-flex items-center gap-2">
            <MdLabel size={18} />
            {t('settingsUi.workspaceLabels')}
          </span>
        </SettingsSectionTitle>
        {loading ? (
          <p className="text-sm mt-4" style={{ color: textMuted(isDark) }}>
            {t('common.loading')}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {labels.map((l) => (
              <li
                key={l.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: l.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: textPrimary(isDark) }}>
                    {l.name}
                    {l.isSystem && (
                      <span className="ml-2 text-[10px] font-normal" style={{ color: textMuted(isDark) }}>
                        default
                      </span>
                    )}
                  </p>
                  <p className="text-[11px]" style={{ color: textMuted(isDark) }}>
                    {l.cardCount} task{l.cardCount === 1 ? '' : 's'}
                    {l.createdBy ? ` · ${l.createdBy.name || l.createdBy.email}` : ''}
                  </p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    {PRESET_COLORS.slice(0, 5).map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-5 h-5 rounded-full"
                        style={{ background: c, opacity: l.color === c ? 1 : 0.45 }}
                        onClick={() => void updateColor(l.id, c)}
                        aria-label={`Set ${c}`}
                      />
                    ))}
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-red-500"
                      onClick={() => void removeLabel(l.id)}
                      aria-label="Delete label"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
            {labels.length === 0 && (
              <li className="text-sm py-6 text-center" style={{ color: textMuted(isDark) }}>
                No labels yet
              </li>
            )}
          </ul>
        )}
      </SettingsGlassCard>
    </div>
  );
}
