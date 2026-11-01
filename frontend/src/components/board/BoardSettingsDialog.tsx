'use client';

import { useEffect, useState } from 'react';
import { MdLock, MdPublic } from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { ProjectAppearanceFields } from '@/components/board/ProjectAppearanceFields';

type DeptOpt = { id: string; key: string; label: string; color?: string };
type MemberOption = { userId: string; label: string };
type AccessMode = 'WORKSPACE' | 'PRIVATE';

function asAccessMode(raw: string | null | undefined): AccessMode {
  return raw === 'PRIVATE' ? 'PRIVATE' : 'WORKSPACE';
}

type Props = {
  open: boolean;
  boardId: string;
  workspaceId: string;
  initial: {
    name: string;
    description: string | null;
    visibility: string;
    background: string | null;
    color?: string | null;
    icon?: string | null;
    departmentId?: string | null;
  };
  departments: DeptOpt[];
  isGeneral?: boolean;
  canDelete?: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
};

export default function BoardSettingsDialog({
  open,
  boardId,
  workspaceId,
  initial,
  departments,
  isGeneral = false,
  canDelete = false,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description || '');
  const [visibility, setVisibility] = useState<AccessMode>(asAccessMode(initial.visibility));
  const [color, setColor] = useState<string | null>(initial.color ?? null);
  const [icon, setIcon] = useState<string | null>(initial.icon ?? null);
  const [departmentId, setDepartmentId] = useState(initial.departmentId || '');
  const [observerIds, setObserverIds] = useState<string[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [guestsLoaded, setGuestsLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial.name);
    setDescription(initial.description || '');
    setVisibility(asAccessMode(initial.visibility));
    setColor(initial.color ?? null);
    setIcon(initial.icon ?? null);
    setDepartmentId(initial.departmentId || '');
    setError(null);
    setGuestsLoaded(false);
    void (async () => {
      try {
        const [membersRes, guestsRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}/members`),
          fetch(`/api/boards/${boardId}/guests`),
        ]);
        const membersJson = await membersRes.json().catch(() => ({}));
        if (membersRes.ok) {
          setMembers(
            (membersJson.data || [])
              .filter((m: { status?: string }) => !m.status || m.status === 'ACTIVE')
              .map(
                (m: {
                  userId?: string;
                  user: { id: string; name: string | null; email: string };
                }) => ({
                  userId: m.userId || m.user.id,
                  label: m.user.name || m.user.email,
                }),
              ),
          );
        }
        if (guestsRes.ok) {
          const guestsJson = await guestsRes.json();
          setObserverIds(
            (guestsJson.data || [])
              .map((g: { userId?: string; user?: { id: string } }) => g.userId || g.user?.id)
              .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0),
          );
          setGuestsLoaded(true);
        } else {
          setObserverIds([]);
          setGuestsLoaded(false);
        }
      } catch {
        /* keep empty lists */
      }
    })();
  }, [open, initial, workspaceId, boardId]);

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
    background: 'transparent',
  } as const;

  function toggleObserver(userId: string) {
    setObserverIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          visibility,
          color,
          icon,
          departmentId: departmentId || null,
          ...(visibility === 'PRIVATE' && (guestsLoaded || observerIds.length > 0)
            ? { observerIds: observerIds.slice(0, 50) }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('common.saveFailed'));
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function archiveBoard() {
    if (!window.confirm(t('projectsPage.deleteProjectConfirm'))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.error === 'Cannot delete the default General project'
            ? t('projectsPage.cannotDeleteGeneral')
            : json.error || t('common.saveFailed'),
        );
      }
      onDeleted?.();
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('projectsPage.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t('projectsPage.editProject')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.projectName')}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-start"
              style={field}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('boardTask.description')}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none text-start"
              style={field}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.section')}
            </span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none text-start"
              style={field}
            >
              <option value="">{t('projectsPage.generalSection')}</option>
              {departments
                .filter((d) => d.id && d.key !== 'general')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {localizedDepartmentLabel(t, d.key, d.label)}
                  </option>
                ))}
            </select>
          </label>
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.access')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: 'WORKSPACE' as const,
                    icon: MdPublic,
                    title: t('projectsPage.accessWorkspace'),
                    hint: t('projectsPage.accessWorkspaceHint'),
                  },
                  {
                    value: 'PRIVATE' as const,
                    icon: MdLock,
                    title: t('projectsPage.accessPrivate'),
                    hint: t('projectsPage.accessPrivateHint'),
                  },
                ] as const
              ).map((opt) => {
                const on = visibility === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className="text-start rounded-xl px-3 py-2.5"
                    style={{
                      background: on ? surfaceItem(isDark) : 'transparent',
                      border: `1px solid ${on ? (isDark ? '#60a5fa' : '#2563eb') : borderSubtle(isDark)}`,
                      color: textPrimary(isDark),
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                      <opt.icon size={16} />
                      {opt.title}
                    </span>
                    <span className="block text-[11px] mt-1" style={{ color: textMuted(isDark) }}>
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {visibility === 'PRIVATE' && (
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.observers')}
              </p>
              <p className="text-[11px] mb-2" style={{ color: textMuted(isDark) }}>
                {t('projectsPage.observersHint')}
              </p>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {members.length === 0 && (
                  <li className="text-xs" style={{ color: textMuted(isDark) }}>
                    {t('membersPage.noMembers')}
                  </li>
                )}
                {members.map((m) => {
                  const checked = observerIds.includes(m.userId);
                  return (
                    <li key={m.userId}>
                      <label
                        className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer"
                        style={{
                          background: checked ? surfaceItem(isDark) : 'transparent',
                          color: textSecondary(isDark),
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleObserver(m.userId)}
                        />
                        <span className="truncate">{m.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <ProjectAppearanceFields
            name={name}
            color={color}
            icon={icon}
            isDark={isDark}
            onColorChange={setColor}
            onIconChange={setIcon}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          {!isGeneral && canDelete && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void archiveBoard()}
              className="me-auto px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}
            >
              {t('projectsPage.deleteProject')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ border: `1px solid ${borderSubtle(isDark)}`, color: textSecondary(isDark) }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void save()}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: '#2563eb' }}
          >
            {busy ? t('common.saving') : t('common.save')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
