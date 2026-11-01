'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { MdClose, MdFolderOpen, MdLock, MdPublic, MdVisibility } from 'react-icons/md';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { ProjectAppearanceFields } from '@/components/board/ProjectAppearanceFields';
import {
  glassStyle,
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

export type ProjectDeptOption = {
  id: string | null;
  key: string;
  label: string;
};

type MemberOption = { userId: string; label: string };

type Props = {
  workspaceId: string;
  isDark: boolean;
  open: boolean;
  onClose: () => void;
  onCreated?: (boardId: string) => void | Promise<void>;
  departments: ProjectDeptOption[];
  lockDepartment?: boolean;
  defaultDepartmentId?: string | null;
};

export function CreateProjectModal({
  workspaceId,
  isDark,
  open,
  onClose,
  onCreated,
  departments,
  lockDepartment = false,
  defaultDepartmentId = null,
}: Props) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId || '');
  const [visibility, setVisibility] = useState<'WORKSPACE' | 'PRIVATE'>('WORKSPACE');
  const [observerIds, setObserverIds] = useState<string[]>([]);
  const [color, setColor] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setDepartmentId(defaultDepartmentId || '');
    setVisibility('WORKSPACE');
    setObserverIds([]);
    setColor(null);
    setIcon(null);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        const json = await res.json();
        if (!res.ok) return;
        setMembers(
          (json.data || [])
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
      } catch {
        setMembers([]);
      }
    })();
  }, [open, workspaceId, defaultDepartmentId]);

  function toggleObserver(userId: string) {
    setObserverIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          ...(description.trim() ? { description: description.trim() } : {}),
          visibility,
          departmentId: departmentId || null,
          ...(color ? { color } : {}),
          ...(icon ? { icon } : {}),
          ...(visibility === 'PRIVATE' && observerIds.length
            ? { observerIds }
            : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('projectsPage.createFailed'));
      onClose();
      if (json.data?.id) await onCreated?.(json.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projectsPage.createFailed'));
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const fieldStyle = {
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${borderSubtle(isDark)}`,
    color: textPrimary(isDark),
  } as const;

  const deptOptions = departments.filter(
    (d, i, arr) => arr.findIndex((x) => (x.id || 'general') === (d.id || 'general')) === i,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={() => !busy && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        style={glassStyle(isDark)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('projectsPage.createProject')}
      >
        <div
          className="flex items-center justify-between gap-3 px-5 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
        >
          <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
            {t('projectsPage.createProject')}
          </p>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="p-2 rounded-lg"
            style={{ color: textMuted(isDark) }}
            aria-label={t('common.close')}
          >
            <MdClose size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.projectName')}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder={t('projectsPage.newBoardPlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={fieldStyle}
              autoFocus
            />
          </div>

          <div>
            <p
              className="text-xs font-medium mb-1.5 inline-flex items-center gap-1.5"
              style={{ color: textMuted(isDark) }}
            >
              <MdFolderOpen size={14} />
              {t('projectsPage.section')}
            </p>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={lockDepartment}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none bg-transparent disabled:opacity-70"
              style={fieldStyle}
            >
              {deptOptions.map((d) => (
                <option key={d.id || 'general'} value={d.id || ''}>
                  {localizedDepartmentLabel(t, d.key, d.label)}
                </option>
              ))}
            </select>
            <p className="text-[11px] mt-1.5" style={{ color: textMuted(isDark) }}>
              {t('projectsPage.sectionHint')}
            </p>
          </div>

          <ProjectAppearanceFields
            name={name}
            color={color}
            icon={icon}
            isDark={isDark}
            onColorChange={setColor}
            onIconChange={setIcon}
          />

          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: textMuted(isDark) }}>
              {t('boardTask.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder={t('projectsPage.projectDescPlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={fieldStyle}
            />
          </div>

          <div>
            <p
              className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"
              style={{ color: textMuted(isDark) }}
            >
              <MdVisibility size={14} />
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
                    onClick={() => {
                      setVisibility(opt.value);
                      if (opt.value !== 'PRIVATE') setObserverIds([]);
                    }}
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

          <div className="pt-1 space-y-2">
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: isDark ? 'rgba(37,99,235,0.9)' : '#2563eb' }}
            >
              {busy ? t('kanban.creating') : t('projectsPage.createProject')}
            </button>
            <button
              type="button"
              onClick={() => !busy && onClose()}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textSecondary(isDark),
              }}
            >
              {t('kanban.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
