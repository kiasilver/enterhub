'use client';

import { useEffect, useMemo, useState } from 'react';
import { MdAdd, MdClose, MdPersonOutline } from 'react-icons/md';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DepartmentIconPicker } from '@/components/departments/DepartmentIconPicker';
import { departmentIcon, departmentColor } from '@/lib/department-meta';
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

type Props = {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

export function CreateDepartmentDialog({
  open,
  workspaceId,
  onClose,
  onCreated,
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
  const [key, setKey] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('business');
  const [roster, setRoster] = useState<{ userId: string; role: Role; user: Person }[]>([]);
  const [wsMembers, setWsMembers] = useState<Person[]>([]);
  const [pickUserId, setPickUserId] = useState('');
  const [pickRole, setPickRole] = useState<Role>('MEMBER');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPickUserId('');
    setPickRole('MEMBER');
  }, [open]);

  useEffect(() => {
    if (!open || !workspaceId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        if (!res.ok || cancelled) return;
        const people = ((json.data || []) as { user: Person; status?: string }[])
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

  function onNameChange(v: string) {
    setName(v);
    const auto = slugify(v);
    setKey(auto);
    if (auto.includes('financ') || auto.includes('account')) {
      setIcon(departmentIcon('finance'));
      setColor(departmentColor('finance'));
    } else if (auto.includes('it') || auto.includes('eng') || auto.includes('tech')) {
      setIcon(departmentIcon('it'));
      setColor(departmentColor('it'));
    } else if (auto.includes('hr') || auto.includes('people')) {
      setIcon(departmentIcon('hr'));
      setColor(departmentColor('hr'));
    } else if (auto.includes('market')) {
      setIcon(departmentIcon('marketing'));
      setColor(departmentColor('marketing'));
    } else if (auto.includes('ops') || auto.includes('operation')) {
      setIcon(departmentIcon('operations'));
      setColor(departmentColor('operations'));
    }
  }

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

  function resetForm() {
    setName('');
    setKey('');
    setIcon('business');
    setColor('#3B82F6');
    setRoster([]);
    setPickUserId('');
    setPickRole('MEMBER');
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim() || slugify(name),
          color,
          icon,
          members: roster.map((r) => ({ userId: r.userId, role: r.role })),
        }),
      });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(json.error || 'Create failed');
      resetForm();
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('departmentsPage.createDepartment')}</DialogTitle>
          <DialogDescription>{t('departmentsPage.createDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('departmentsPage.fieldName')}
            </span>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t('departmentsPage.namePlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none text-start"
              style={field}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium" style={{ color: textMuted(isDark) }}>
              {t('departmentsPage.fieldKey')}
            </span>
            <input
              value={key}
              onChange={(e) => setKey(slugify(e.target.value))}
              placeholder="it"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono text-start"
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
            <ul className="space-y-2 max-h-40 overflow-auto">
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
                <li className="text-xs py-1" style={{ color: textMuted(isDark) }}>
                  {t('departmentsPage.optionalRoster')}
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

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
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
            disabled={busy || name.trim().length < 2}
            onClick={() => void submit()}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: color }}
          >
            {busy ? t('departmentsPage.creating') : t('departmentsPage.createDepartment')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
