'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MdPersonAdd, MdDelete, MdCheck, MdClose } from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import { localizeRoleName } from '@/lib/role-i18n';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  tableRowBg,
} from '@/components/SafeDashboard/theme';

type Member = {
  id: string;
  status: string;
  user: { id: string; email: string; name: string | null };
  role: { id: string; name: string };
};

type Role = { id: string; name: string; isSystem: boolean };
type Dept = { id: string; name: string; key: string };
type Invite = {
  id: string;
  email: string;
  status: string;
  departmentRole: string;
  department: { id: string; name: string } | null;
  role: { id: string; name: string };
  invitedBy: { name: string | null; email: string };
  invitee?: { id: string; email: string } | null;
};

export default function MembersPage() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useLang();

  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departmentRole, setDepartmentRole] = useState<'MANAGER' | 'SUPERVISOR' | 'MEMBER'>(
    'MEMBER',
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, rRes, dRes, iRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/members`),
        fetch(`/api/workspaces/${workspaceId}/roles`),
        fetch(`/api/workspaces/${workspaceId}/departments`),
        fetch(`/api/workspaces/${workspaceId}/invites`),
      ]);
      if (mRes.status === 403) {
        setError('403 — You do not have permission to manage members.');
        setMembers([]);
        return;
      }
      if (!mRes.ok) throw new Error('Failed to load members');
      const mJson = await mRes.json();
      setMembers(mJson.data || []);
      if (rRes.ok) {
        const rJson = await rRes.json();
        const list = (rJson.data || []).filter((r: Role) => r.name !== 'Owner');
        setRoles(list);
        setRoleId((prev) => prev || list[0]?.id || '');
      }
      if (dRes.ok) {
        const dJson = await dRes.json();
        setDepartments(
          (dJson.data || []).map((d: Dept) => ({
            id: d.id,
            name: d.name,
            key: d.key,
          })),
        );
      }
      if (iRes.ok) {
        const iJson = await iRes.json();
        setInvites(iJson.data || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          roleId,
          departmentId: departmentId || null,
          departmentRole: departmentId ? departmentRole : 'MEMBER',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Invite failed');
      setEmail('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  }

  async function runInviteAction(
    inviteId: string,
    action: 'accept' | 'approve' | 'reject',
  ) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/invites/${inviteId}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body:
            action === 'reject'
              ? JSON.stringify({ note: 'Declined from members settings' })
              : undefined,
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `${action} failed`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(memberId: string, nextRoleId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: nextRoleId, status: 'ACTIVE' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  const pendingAccept = invites.filter((i) => i.status === 'PENDING_ACCEPT');
  const pendingApproval = invites.filter((i) => i.status === 'PENDING_APPROVAL');

  return (
    <SettingsGlassCard accent="#22c55e" className="w-full">
      <SettingsSectionTitle
        title={t('membersPage.title')}
        subtitle={t('membersPage.subtitle')}
        badge="Team"
        badgeColor="#22c55e"
      />

      <form onSubmit={invite} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <input
          type="email"
          required
          placeholder="email@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2.5 rounded-xl outline-none lg:col-span-2"
          style={field}
        />
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="px-3 py-2.5 rounded-xl"
          style={field}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id} style={{ color: '#000' }}>
              {localizeRoleName(r.name, t)}
            </option>
          ))}
        </select>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="px-3 py-2.5 rounded-xl"
          style={field}
        >
          <option value="" style={{ color: '#000' }}>
            {t('membersPage.noDepartment')}
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id} style={{ color: '#000' }}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          value={departmentRole}
          disabled={!departmentId}
          onChange={(e) =>
            setDepartmentRole(e.target.value as 'MANAGER' | 'SUPERVISOR' | 'MEMBER')
          }
          className="px-3 py-2.5 rounded-xl disabled:opacity-50"
          style={field}
        >
          <option value="MEMBER" style={{ color: '#000' }}>
            {t('membersPage.employee')}
          </option>
          <option value="SUPERVISOR" style={{ color: '#000' }}>
            {t('membersPage.supervisor')}
          </option>
          <option value="MANAGER" style={{ color: '#000' }}>
            {t('membersPage.manager')}
          </option>
        </select>
        <button
          type="submit"
          disabled={busy || !roleId}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold disabled:opacity-50 text-white sm:col-span-2 lg:col-span-5"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
        >
          <MdPersonAdd size={16} />
          {t('membersPage.sendInvite')}
        </button>
      </form>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {(pendingAccept.length > 0 || pendingApproval.length > 0) && (
        <div className="space-y-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: textMuted(isDark) }}>
            {t('membersPage.inviteQueue')}
          </p>
          {[...pendingApproval, ...pendingAccept].map((inv) => (
            <div
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl"
              style={{
                border: `1px solid ${borderSubtle(isDark)}`,
                background: surfaceItem(isDark),
              }}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
                  {inv.email}
                </p>
                <p className="text-xs" style={{ color: textMuted(isDark) }}>
                  {inv.status.replace(/_/g, ' ')}
                  {inv.department ? ` · ${inv.department.name}` : ''}
                  {` · ${inv.departmentRole}`} · invited by{' '}
                  {inv.invitedBy.name || inv.invitedBy.email}
                </p>
              </div>
              <div className="flex gap-2">
                {inv.status === 'PENDING_ACCEPT' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runInviteAction(inv.id, 'accept')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: '#2563eb' }}
                  >
                    <MdCheck size={14} /> {t('common.accept')}
                  </button>
                )}
                {inv.status === 'PENDING_APPROVAL' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runInviteAction(inv.id, 'approve')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: '#16a34a' }}
                  >
                    <MdCheck size={14} /> {t('common.approve')}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void runInviteAction(inv.id, 'reject')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    border: `1px solid ${borderSubtle(isDark)}`,
                    color: textSecondary(isDark),
                  }}
                >
                  <MdClose size={14} /> {t('common.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: textMuted(isDark) }}>{t('common.loading')}</p>
      ) : members.length === 0 ? (
        <p style={{ color: textMuted(isDark) }}>{t('membersPage.noMembers')}</p>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl"
          style={{
            border: `1px solid ${borderSubtle(isDark)}`,
            background: surfaceItem(isDark),
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: textMuted(isDark), borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                <th className="text-left p-3 font-medium">{t('membersPage.colUser')}</th>
                <th className="text-left p-3 font-medium">{t('membersPage.colStatus')}</th>
                <th className="text-left p-3 font-medium">{t('membersPage.colRole')}</th>
                <th className="text-right p-3 font-medium">{t('membersPage.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: `1px solid ${borderSubtle(isDark)}`,
                    background: tableRowBg(isDark, i),
                  }}
                >
                  <td className="p-3" style={{ color: textPrimary(isDark) }}>
                    <div className="font-medium">{m.user.name || '—'}</div>
                    <div style={{ color: textSecondary(isDark) }}>{m.user.email}</div>
                  </td>
                  <td className="p-3" style={{ color: textSecondary(isDark) }}>
                    {m.status}
                  </td>
                  <td className="p-3">
                    <select
                      value={m.role.id}
                      disabled={busy || m.role.name === 'Owner'}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      className="px-2 py-1 rounded-lg"
                      style={{
                        border: `1px solid ${borderSubtle(isDark)}`,
                        background: isDark ? 'rgba(0,0,0,0.35)' : '#fff',
                        color: textPrimary(isDark),
                      }}
                    >
                      <option value={m.role.id} style={{ color: '#000' }}>
                        {localizeRoleName(m.role.name, t)}
                      </option>
                      {roles
                        .filter((r) => r.id !== m.role.id)
                        .map((r) => (
                          <option key={r.id} value={r.id} style={{ color: '#000' }}>
                            {localizeRoleName(r.name, t)}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      disabled={busy || m.role.name === 'Owner'}
                      onClick={() => removeMember(m.id)}
                      className="inline-flex p-2 rounded-lg disabled:opacity-30"
                      style={{ color: textSecondary(isDark) }}
                      title={t('membersPage.remove')}
                    >
                      <MdDelete size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsGlassCard>
  );
}
