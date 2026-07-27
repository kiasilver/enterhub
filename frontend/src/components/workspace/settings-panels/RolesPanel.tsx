'use client';

import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdInfoOutline,
  MdSearch,
} from 'react-icons/md';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  SettingsGlassCard,
} from '@/components/workspace/SettingsGlassCard';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { POSITION_TEMPLATES, DEPARTMENTS } from '@/lib/enterprise-positions';
import { PERMISSION_CATALOG, SYSTEM_ROLE_META } from '@/lib/permissions-catalog';
import { localizeRoleName } from '@/lib/role-i18n';

type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
};

/** Only true RBAC system roles — position roles like Accountant are always renameable. */
const LOCKED_ROLE_NAMES = new Set(
  Object.values(SYSTEM_ROLE_META).map((m) => m.name)
);

function isNameLocked(role: RoleRow) {
  return LOCKED_ROLE_NAMES.has(role.name);
}

const PREFIX_ORDER = [
  'workspace',
  'security',
  'billing',
  'department',
  'analytics',
  'people',
  'board',
  'list',
  'card',
  'collab',
  'automation',
  'guest',
  'other',
] as const;

const PERM_META = Object.fromEntries(
  PERMISSION_CATALOG.map((p) => [p.actionName, p])
) as Record<string, (typeof PERMISSION_CATALOG)[number]>;

const DEPT_LABEL: Record<string, string> = {
  leadership: 'Leadership',
  ...Object.fromEntries(DEPARTMENTS.map((d) => [d.key, d.label])),
};

function prefixOf(action: string) {
  const p = action.split(':')[0];
  return p || 'other';
}

function Toggle({
  checked,
  onChange,
  isDark,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  isDark: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="relative w-10 h-5 rounded-full shrink-0 transition-colors"
      style={{
        background: checked
          ? isDark
            ? '#fff'
            : '#0a0a0a'
          : isDark
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(0,0,0,0.15)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
        style={{
          background: checked
            ? isDark
              ? '#000'
              : '#fff'
            : isDark
              ? 'rgba(255,255,255,0.7)'
              : '#fff',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

export default function RolesPage() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [catalog, setCatalog] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [positionQuery, setPositionQuery] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createPerms, setCreatePerms] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selected = roles.find((r) => r.id === selectedId) || null;

  function selectRole(r: RoleRow) {
    setSelectedId(r.id);
    setDraft(r.permissions);
    setEditName(r.name);
    setEditDesc(r.description || '');
    setOk(null);
    setError(null);
    setRenamingId(null);
    if (!isNameLocked(r)) {
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }

  async function renameRole(roleId: string, nextName: string) {
    const name = nextName.trim();
    if (name.length < 2) {
      setError(t('rolesPage.roleNameMin'));
      return;
    }
    const role = roles.find((r) => r.id === roleId);
    if (!role || isNameLocked(role)) return;
    if (name === role.name) {
      setRenamingId(null);
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('rolesPage.renameFailed'));
      setRenamingId(null);
      setOk(t('rolesPage.renamedTo', { name: json.data.name }));
      if (selectedId === roleId) setEditName(json.data.name);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('rolesPage.renameFailed'));
    } finally {
      setBusy(false);
    }
  }

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/roles`);
    if (res.status === 403) {
      setError(t('rolesPage.forbidden403'));
      return;
    }
    if (!res.ok) {
      setError(t('rolesPage.loadFailed'));
      return;
    }
    const json = await res.json();
    const list: RoleRow[] = json.data || [];
    setRoles(list);
    setCatalog(json.catalog?.length ? json.catalog : PERMISSION_CATALOG.map((p) => p.actionName));
    return list;
  }, [workspaceId]);

  useEffect(() => {
    void load().then((list) => {
      if (list?.[0] && !selectedId) {
        setSelectedId(list[0].id);
        setDraft(list[0].permissions || []);
        setEditName(list[0].name);
        setEditDesc(list[0].description || '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    if (!selected) return;
    setDraft(selected.permissions);
    setEditName(selected.name);
    setEditDesc(selected.description || '');
    setOk(null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredTemplates = useMemo(() => {
    const q = positionQuery.trim().toLowerCase();
    if (!q) return POSITION_TEMPLATES;
    return POSITION_TEMPLATES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        (DEPT_LABEL[t.department] || '').toLowerCase().includes(q)
    );
  }, [positionQuery]);

  function pickTemplate(key: string | null) {
    setSelectedTemplateKey(key);
    if (!key) {
      setCreateName('');
      setCreateDesc('');
      setCreatePerms(['workspace:read', 'board:read', 'card:create', 'card:update']);
      return;
    }
    const tmpl = POSITION_TEMPLATES.find((p) => p.key === key);
    if (!tmpl) return;
    setCreateName(tmpl.name);
    setCreateDesc(tmpl.description);
    setCreatePerms([...tmpl.permissions]);
  }

  function openCreate() {
    setCreateOpen(true);
    setPositionQuery('');
    pickTemplate(null);
    setError(null);
    setOk(null);
  }

  function togglePerm(action: string, target: 'edit' | 'create' = 'edit') {
    if (target === 'create') {
      setCreatePerms((prev) =>
        prev.includes(action) ? prev.filter((p) => p !== action) : [...prev, action]
      );
      return;
    }
    setDraft((prev) =>
      prev.includes(action) ? prev.filter((p) => p !== action) : [...prev, action]
    );
  }

  async function saveMatrix() {
    if (!selectedId || !selected) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const body: Record<string, unknown> = { permissions: draft };
      if (!isNameLocked(selected)) {
        const name = editName.trim();
        if (name.length < 2) throw new Error(t('rolesPage.roleNameMin'));
        body.name = name;
        body.description = editDesc.trim() || null;
      }
      const res = await fetch(
        `/api/workspaces/${workspaceId}/roles/${selectedId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('rolesPage.saveFailed'));
      setOk(t('rolesPage.roleSaved'));
      const list = await load();
      const updated = list?.find((r) => r.id === selectedId);
      if (updated) {
        setDraft(updated.permissions);
        setEditName(updated.name);
        setEditDesc(updated.description || '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('rolesPage.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) {
      setError(t('rolesPage.roleNameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDesc.trim() || undefined,
          permissions: createPerms,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t('rolesPage.createFailed'));
      setCreateOpen(false);
      setSelectedId(json.data.id);
      setOk(t('rolesPage.created', { name: json.data.name }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rolesPage.createFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function deleteRole() {
    if (!selected || isNameLocked(selected)) return;
    const label = selected.name;
    if (selected.memberCount > 0) {
      setError(t('rolesPage.reassignBeforeDelete', { n: selected.memberCount, name: label }));
      return;
    }
    if (!window.confirm(t('rolesPage.confirmDelete', { name: label }))) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/roles/${selected.id}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || t('rolesPage.deleteFailed'));
      setSelectedId(null);
      setOk(t('rolesPage.deleted', { name: label }));
      const list = await load();
      if (list?.[0]) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rolesPage.deleteFailed'));
    } finally {
      setBusy(false);
    }
  }

  const groups = useMemo(() => {
    const actions = catalog.length
      ? catalog
      : PERMISSION_CATALOG.map((p) => p.actionName);
    const acc: Record<string, string[]> = {};
    for (const action of actions) {
      const g = prefixOf(action);
      (acc[g] ||= []).push(action);
    }
    const ordered = PREFIX_ORDER.filter((p) => acc[p]?.length).map((p) => [p, acc[p]] as const);
    const extras = Object.keys(acc)
      .filter((k) => !(PREFIX_ORDER as readonly string[]).includes(k))
      .map((k) => [k, acc[k]] as const);
    return [...ordered, ...extras];
  }, [catalog]);

  const activePerms = createOpen ? createPerms : draft;

  function PermMatrix({ mode }: { mode: 'edit' | 'create' }) {
    return (
      <div className="space-y-5">
        {groups.map(([group, actions]) => (
          <div key={group}>
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: textMuted(isDark) }}
            >
              {group}:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {actions.map((action) => {
                const on = activePerms.includes(action);
                const meta = PERM_META[action];
                return (
                  <div
                    key={action}
                    className="flex items-center justify-between gap-3 text-sm px-3 py-2.5 rounded-xl"
                    style={{
                      border: `1px solid ${borderSubtle(isDark)}`,
                      background: surfaceItem(isDark),
                      color: textSecondary(isDark),
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="font-mono text-xs truncate"
                        style={{ color: textPrimary(isDark) }}
                        title={action}
                      >
                        {action}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex shrink-0 p-0.5 rounded-full opacity-70 hover:opacity-100"
                            style={{ color: textMuted(isDark) }}
                            aria-label={t('rolesPage.aboutPermission', { action })}
                            onClick={(e) => e.preventDefault()}
                          >
                            <MdInfoOutline size={15} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                          {meta?.description || t('rolesPage.noDescription')}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Toggle
                      checked={on}
                      isDark={isDark}
                      disabled={busy || (mode === 'edit' && selected?.isSystem && selected.name === 'Owner')}
                      onChange={() => togglePerm(action, mode)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <SettingsGlassCard accent="#a855f7" className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-bold tracking-tight" style={{ color: textPrimary(isDark) }}>
            {t('rolesPage.title')}
          </h2>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)' }}>
            {t('rolesPage.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(168,85,247,0.15)',
              color: '#a855f7',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            {t('rolesPage.badgeAccess')}
          </span>
          {!createOpen && (
            <button
              type="button"
              onClick={openCreate}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
            >
              <MdAdd size={18} /> {t('rolesPage.newRole')}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      {ok && <p className="text-sm text-emerald-500 mb-3">{ok}</p>}

      {createOpen ? (
        <form onSubmit={createRole} className="space-y-5">
          <div
            className="rounded-2xl p-4 space-y-3"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              background: surfaceItem(isDark),
            }}
          >
            <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
              {t('rolesPage.createFromTemplate')}
            </p>
            <p className="text-xs" style={{ color: textMuted(isDark) }}>
              {t('rolesPage.createFromTemplateDesc')}
            </p>

            <div className="relative">
              <MdSearch
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: textMuted(isDark) }}
              />
              <input
                value={positionQuery}
                onChange={(e) => setPositionQuery(e.target.value)}
                placeholder={t('rolesPage.searchPositions')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm"
                style={{
                  border: `1px solid ${borderSubtle(isDark)}`,
                  background: isDark ? 'rgba(0,0,0,0.35)' : '#fff',
                  color: textPrimary(isDark),
                }}
              />
            </div>

            <div
              className="max-h-48 overflow-y-auto rounded-xl space-y-0.5 p-1"
              style={{ border: `1px solid ${borderSubtle(isDark)}` }}
            >
              <button
                type="button"
                onClick={() => pickTemplate(null)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm"
                style={{
                  background:
                    selectedTemplateKey === null
                      ? isDark
                        ? 'rgba(168,85,247,0.2)'
                        : 'rgba(168,85,247,0.12)'
                      : 'transparent',
                  color: textPrimary(isDark),
                }}
              >
                <span className="font-medium">{t('rolesPage.customRole')}</span>
                <span className="block text-xs" style={{ color: textMuted(isDark) }}>
                  {t('rolesPage.customRoleDesc')}
                </span>
              </button>
              {filteredTemplates.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => pickTemplate(t.key)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm"
                  style={{
                    background:
                      selectedTemplateKey === t.key
                        ? isDark
                          ? 'rgba(168,85,247,0.2)'
                          : 'rgba(168,85,247,0.12)'
                        : 'transparent',
                    color: textPrimary(isDark),
                  }}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs ml-2" style={{ color: textMuted(isDark) }}>
                    {DEPT_LABEL[t.department] || t.department}
                  </span>
                  <span className="block text-xs mt-0.5" style={{ color: textSecondary(isDark) }}>
                    {t.description}
                  </span>
                </button>
              ))}
              {filteredTemplates.length === 0 && (
                <p className="px-3 py-4 text-sm text-center" style={{ color: textMuted(isDark) }}>
                  {t('rolesPage.noPositionsMatch', { query: positionQuery })}
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary(isDark) }}>
                  {t('rolesPage.roleName')}
                </label>
                <input
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={t('rolesPage.roleNamePlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    background: isDark ? 'rgba(0,0,0,0.35)' : '#fff',
                    color: textPrimary(isDark),
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary(isDark) }}>
                  {t('rolesPage.description')}
                </label>
                <input
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder={t('rolesPage.optional')}
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    background: isDark ? 'rgba(0,0,0,0.35)' : '#fff',
                    color: textPrimary(isDark),
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: textPrimary(isDark) }}>
              {t('rolesPage.permissions')}
              <span className="text-xs font-normal ml-2" style={{ color: textMuted(isDark) }}>
                {t('rolesPage.permissionsSelected', { n: createPerms.length })}
              </span>
            </p>
            <PermMatrix mode="create" />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || !createName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
            >
              <MdAdd size={18} /> {t('rolesPage.createRole')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                color: textSecondary(isDark),
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid lg:grid-cols-[240px_1fr] gap-4">
          <div
            className="space-y-1 p-2 rounded-2xl self-start"
            style={{ background: surfaceItem(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
          >
            {roles.map((r) => (
              <div
                key={r.id}
                className="rounded-xl"
                style={{
                  background:
                    selectedId === r.id
                      ? isDark
                        ? 'rgba(168,85,247,0.18)'
                        : 'rgba(168,85,247,0.1)'
                      : 'transparent',
                  border: `1px solid ${selectedId === r.id ? borderSubtle(isDark) : 'transparent'}`,
                }}
              >
                {renamingId === r.id ? (
                  <form
                    className="p-2 space-y-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void renameRole(r.id, renameDraft);
                    }}
                  >
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{
                        border: `1px solid ${borderSubtle(isDark)}`,
                        background: isDark ? 'rgba(0,0,0,0.35)' : '#fff',
                        color: textPrimary(isDark),
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-white"
                        style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
                      >
                        {t('rolesPage.saveName')}
                      </button>
                      <button
                        type="button"
                        className="text-[11px] px-2 py-1.5 rounded-lg"
                        style={{ color: textMuted(isDark) }}
                        onClick={() => setRenamingId(null)}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-stretch gap-0.5">
                    <button
                      type="button"
                      onClick={() => selectRole(r)}
                      className="flex-1 text-left px-3 py-2.5 rounded-xl text-sm min-w-0"
                      style={{ color: textPrimary(isDark) }}
                    >
                      <div className="font-medium truncate">{localizeRoleName(r.name, t)}</div>
                      <div className="text-xs" style={{ color: textMuted(isDark) }}>
                        {isNameLocked(r) ? t('rolesPage.system') : t('rolesPage.positionCustom')} ·{' '}
                        {r.memberCount === 1
                          ? t('rolesPage.memberCountOne')
                          : t('rolesPage.membersCount', { n: r.memberCount })}
                      </div>
                    </button>
                    {!isNameLocked(r) && (
                      <button
                        type="button"
                        title={t('rolesPage.renameRole')}
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectRole(r);
                          setRenamingId(r.id);
                          setRenameDraft(r.name);
                        }}
                        className="px-2.5 rounded-xl shrink-0 self-center mr-1"
                        style={{ color: textSecondary(isDark) }}
                      >
                        <MdEdit size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-5 min-w-0">
            {!selected ? (
              <p style={{ color: textMuted(isDark) }}>{t('rolesPage.selectRole')}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    {isNameLocked(selected) ? (
                      <>
                        <h3 className="font-semibold text-base" style={{ color: textPrimary(isDark) }}>
                          {localizeRoleName(selected.name, t)}
                        </h3>
                        {selected.description && (
                          <p className="text-sm" style={{ color: textSecondary(isDark) }}>
                            {selected.description}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: textMuted(isDark) }}>
                          {selected.memberCount === 1
                            ? t('rolesPage.systemRoleFixedOne')
                            : t('rolesPage.systemRoleFixed', { n: selected.memberCount })}
                        </p>
                      </>
                    ) : (
                      <>
                        <label className="block space-y-1 max-w-md">
                          <span className="text-xs font-medium" style={{ color: textSecondary(isDark) }}>
                            {t('rolesPage.roleName')}
                          </span>
                          <div className="flex gap-2">
                            <input
                              ref={nameInputRef}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl outline-none text-sm font-semibold"
                              style={{
                                border: `1px solid ${borderSubtle(isDark)}`,
                                background: surfaceItem(isDark),
                                color: textPrimary(isDark),
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  void renameRole(selected.id, editName);
                                }
                              }}
                            />
                            <button
                              type="button"
                              disabled={busy || editName.trim() === selected.name}
                              onClick={() => void renameRole(selected.id, editName)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-40 shrink-0"
                              style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
                            >
                              {t('rolesPage.rename')}
                            </button>
                          </div>
                        </label>
                        <label className="block space-y-1 max-w-md">
                          <span className="text-xs font-medium" style={{ color: textSecondary(isDark) }}>
                            {t('rolesPage.description')}
                          </span>
                          <input
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder={t('rolesPage.optionalDescription')}
                            className="w-full px-3 py-2 rounded-xl outline-none text-sm"
                            style={{
                              border: `1px solid ${borderSubtle(isDark)}`,
                              background: surfaceItem(isDark),
                              color: textPrimary(isDark),
                            }}
                          />
                        </label>
                        <p className="text-xs" style={{ color: textMuted(isDark) }}>
                          {t('rolesPage.editNameHint', { n: selected.memberCount })}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!isNameLocked(selected) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void deleteRole()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-500"
                        style={{
                          border: `1px solid ${isDark ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.25)'}`,
                          background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
                        }}
                      >
                        <MdDelete size={16} />
                        {t('rolesPage.delete')}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void saveMatrix()}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}
                    >
                      {t('rolesPage.save')}
                    </button>
                  </div>
                </div>

                <p className="text-xs" style={{ color: textMuted(isDark) }}>
                  {t('rolesPage.hoverPermHint')}
                </p>

                <PermMatrix mode="edit" />
              </>
            )}
          </div>
        </div>
      )}
    </SettingsGlassCard>
  );
}
