'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MdAdd,
  MdBlock,
  MdCheckCircle,
  MdClose,
  MdDelete,
  MdPersonOutline,
} from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DepartmentIconPicker } from '@/components/departments/DepartmentIconPicker';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

type Role = 'MANAGER' | 'SUPERVISOR' | 'MEMBER';

type Person = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

type MemberRow = {
  userId: string;
  role: Role;
  user: Person;
};

type DeptEdit = {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  archivedAt?: string | Date | null;
  members?: MemberRow[];
};

type WsMember = {
  user: Person;
  status?: string;
};

type Props = {
  open: boolean;
  workspaceId: string;
  department: DeptEdit | null;
  /** Org-level: can disable / delete */
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function EditDepartmentDialog({
  open,
  workspaceId,
  department,
  canManage,
  onClose,
  onSaved,
}: Props) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const roleOptions: { value: Role; label: string }[] = [
    { value: 'MANAGER', label: t('departmentsPage.roleManager') },
    { value: 'SUPERVISOR', label: t('departmentsPage.roleSupervisor') },
    { value: 'MEMBER', label: t('departmentsPage.roleMember') },
  ];
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('business');
  const [roster, setRoster] = useState<{ userId: string; role: Role; user: Person }[]>([]);
  const [wsMembers, setWsMembers] = useState<Person[]>([]);
  const [pickUserId, setPickUserId] = useState('');
  const [pickRole, setPickRole] = useState<Role>('MEMBER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const disabled = !!department?.archivedAt;

  useEffect(() => {
    if (!open || !department) return;
    setName(department.name);
    setColor(department.color || '#3B82F6');
    setIcon(department.icon || 'business');
    setRoster(
      (department.members || []).map((m) => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
    );
    setError(null);
    setConfirmDelete(false);
    setPickUserId('');
    setPickRole('MEMBER');
  }, [open, department]);

  useEffect(() => {
    if (!open || !workspaceId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        const json = await res.json();
        if (!res.ok || cancelled) return;
        const people = ((json.data || []) as WsMember[])
          .filter((m) => !m.status || m.status === 'ACTIVE')
          .map((m) => m.user)
          .filter(Boolean);
        setWsMembers(people);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, workspaceId]);

  const availableToAdd = useMemo(() => {
    const on = new Set(roster.map((r) => r.userId));
    return wsMembers.filter((u) => !on.has(u.id));
  }, [wsMembers, roster]);

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  function addMember() {
    if (!pickUserId) return;
    const user = wsMembers.find((u) => u.id === pickUserId);
    if (!user) return;
    setRoster((prev) => [...prev, { userId: user.id, role: pickRole, user }]);
    setPickUserId('');
    setPickRole('MEMBER');
  }

  function removeMember(userId: string) {
    setRoster((prev) => prev.filter((r) => r.userId !== userId));
  }

  function setRole(userId: string, role: Role) {
    setRoster((prev) =>
      prev.map((r) => (r.userId === userId ? { ...r, role } : r)),
    );
  }

  async function save() {
    if (!department) return;
    setBusy(true);
    setError(null);
    try {
      const patchRes = await fetch(
        `/api/workspaces/${workspaceId}/departments/${department.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            color,
            icon,
          }),
        },
      );
      const patchJson = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchJson.error || 'Update failed');

      const memRes = await fetch(
        `/api/workspaces/${workspaceId}/departments/${department.id}/members`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            members: roster.map((r) => ({ userId: r.userId, role: r.role })),
          }),
        },
      );
      const memJson = await memRes.json();
      if (!memRes.ok) throw new Error(memJson.error || 'Members update failed');

      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggleDisabled() {
    if (!department || !canManage) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/departments/${department.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disabled: !disabled }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function removeDepartment() {
    if (!department || !canManage) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/departments/${department.id}`,
        { method: 'DELETE' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('departmentsPage.editDepartment')}</DialogTitle>
          <DialogDescription>
            {t('departmentsPage.editDesc')}
            {disabled ? t('departmentsPage.editDescDisabled') : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('departmentsPage.fieldName')}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-start"
              style={field}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('departmentsPage.fieldColor')}
            </span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-xl cursor-pointer"
            />
          </label>

          <div>
            <p className="text-xs font-medium mb-2" style={{ color: textMuted(isDark) }}>
              {t('departmentsPage.fieldIcon')}
            </p>
            <DepartmentIconPicker
              value={icon}
              onChange={setIcon}
              accentColor={color}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('departmentsPage.fieldPeople')}
            </p>
            <ul className="space-y-2 max-h-48 overflow-auto">
              {roster.map((r) => (
                <li
                  key={r.userId}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${borderSubtle(isDark)}`,
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{
                      background: isDark ? 'var(--chip)' : '#E5E7EB',
                      color: textMuted(isDark),
                    }}
                  >
                    {r.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.user.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MdPersonOutline size={14} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: textPrimary(isDark) }}
                    >
                      {r.user.name || r.user.email}
                    </p>
                  </div>
                  <select
                    value={r.role}
                    onChange={(e) => setRole(r.userId, e.target.value as Role)}
                    className="text-[11px] rounded-lg px-2 py-1 outline-none"
                    style={field}
                  >
                    {roleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMember(r.userId)}
                    className="p-1 rounded-lg"
                    style={{ color: textMuted(isDark) }}
                    aria-label={t('common.remove')}
                  >
                    <MdClose size={16} />
                  </button>
                </li>
              ))}
              {roster.length === 0 && (
                <li className="text-xs py-2" style={{ color: textMuted(isDark) }}>
                  {t('departmentsPage.noPeopleYet')}
                </li>
              )}
            </ul>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={pickUserId}
                onChange={(e) => setPickUserId(e.target.value)}
                className="flex-1 text-xs rounded-xl px-2 py-2 outline-none"
                style={field}
              >
                <option value="">{t('departmentsPage.addMemberPlaceholder')}</option>
                {availableToAdd.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
              <select
                value={pickRole}
                onChange={(e) => setPickRole(e.target.value as Role)}
                className="text-xs rounded-xl px-2 py-2 outline-none sm:w-28"
                style={field}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!pickUserId}
                onClick={addMember}
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: color }}
              >
                <MdAdd size={16} /> {t('common.add')}
              </button>
            </div>
          </div>

          {canManage && (
            <div
              className="rounded-xl p-3 space-y-2"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
              }}
            >
              <p className="text-xs font-semibold" style={{ color: textSecondary(isDark) }}>
                {t('departmentsPage.dangerZone')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void toggleDisabled()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: disabled ? '#16a34a' : '#ea580c',
                    background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                  }}
                >
                  {disabled ? <MdCheckCircle size={16} /> : <MdBlock size={16} />}
                  {disabled
                    ? t('departmentsPage.enableDepartment')
                    : t('departmentsPage.disableDepartment')}
                </button>
                {!confirmDelete ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 disabled:opacity-50"
                    style={{
                      border: '1px solid rgba(239,68,68,0.35)',
                      background: isDark ? 'rgba(0,0,0,0.2)' : '#fff',
                    }}
                  >
                    <MdDelete size={16} /> {t('common.delete')}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px]" style={{ color: textMuted(isDark) }}>
                      {t('departmentsPage.permanentlyDelete')}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void removeDepartment()}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 disabled:opacity-50"
                    >
                      {t('departmentsPage.confirmDelete')}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirmDelete(false)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{ color: textSecondary(isDark) }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textSecondary(isDark),
            }}
          >
            {t('common.close')}
          </button>
          <button
            type="button"
            disabled={busy || name.trim().length < 2}
            onClick={() => void save()}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: color }}
          >
            {busy ? t('departmentsPage.saving') : t('departmentsPage.saveChanges')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
