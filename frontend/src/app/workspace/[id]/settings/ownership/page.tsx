'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  SettingsGlassCard,
  SettingsSectionTitle,
} from '@/components/workspace/SettingsGlassCard';
import {
  borderSubtle,
  surfaceItem,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';

type Member = {
  id: string;
  status: string;
  user: { id: string; email: string; name: string | null };
  role: { id: string; name: string };
};

export default function OwnershipSettingsPage() {
  const params = useParams();
  const workspaceId = String(params.id);
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';

  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [newOwnerUserId, setNewOwnerUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    const [sRes, mRes] = await Promise.all([
      fetch(`/api/workspaces/${workspaceId}/settings`),
      fetch(`/api/workspaces/${workspaceId}/members`),
    ]);
    const sJson = await sRes.json();
    const mJson = await mRes.json();
    if (sRes.status === 403 || !sJson.data?.capabilities?.canTransfer) {
      setForbidden(true);
      return;
    }
    if (sRes.ok) setOwnerId(sJson.data.workspace.ownerId);
    if (mRes.ok) {
      setMembers(mJson.data || []);
      const candidates = (mJson.data || []).filter(
        (m: Member) => m.role.name !== 'Owner' && m.status === 'ACTIVE'
      );
      if (candidates[0]) setNewOwnerUserId(candidates[0].user.id);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transfer(e: React.FormEvent) {
    e.preventDefault();
    if (!newOwnerUserId) return;
    if (!confirm(t('settingsUi.transferConfirm'))) return;
    setBusy(true);
    setError(null);
    setOk(null);
    const res = await fetch(`/api/workspaces/${workspaceId}/transfer-ownership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newOwnerUserId }),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || 'Transfer failed');
      return;
    }
    setOk(t('settingsUi.ownershipTransferred'));
    await load();
  }

  const field = {
    border: `1px solid ${borderSubtle(isDark)}`,
    background: surfaceItem(isDark),
    color: textPrimary(isDark),
  } as const;

  if (forbidden) {
    return (
      <p className="text-sm" style={{ color: textMuted(isDark) }}>
        {t('settingsUi.ownershipForbidden')}
      </p>
    );
  }

  const candidates = members.filter(
    (m) => m.user.id !== ownerId && m.status === 'ACTIVE'
  );

  return (
    <form onSubmit={(e) => void transfer(e)} className="w-full">
      <SettingsGlassCard accent="#ef4444">
        <SettingsSectionTitle
          title={t('settingsUi.ownershipTitle')}
          subtitle={t('settingsUi.ownershipSubtitle')}
          badge={t('settings.ownership')}
          badgeColor="#ef4444"
        />

        <label className="block space-y-1.5">
          <span className="text-xs font-medium" style={{ color: textSecondary(isDark) }}>
            {t('settingsUi.newOwner')}
          </span>
          <select
            value={newOwnerUserId}
            onChange={(e) => setNewOwnerUserId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={field}
            required
          >
            {candidates.length === 0 && (
              <option value="" style={{ color: '#000' }}>
                {t('settingsUi.inviteMemberFirst')}
              </option>
            )}
            {candidates.map((m) => (
              <option key={m.user.id} value={m.user.id} style={{ color: '#000' }}>
                {m.user.name || m.user.email} · {m.role.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        {ok && <p className="text-sm mt-3" style={{ color: '#22c55e' }}>{ok}</p>}

        <button
          type="submit"
          disabled={busy || !newOwnerUserId}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}
        >
          {busy ? t('settingsUi.transferring') : t('settingsUi.transferBtn')}
        </button>
      </SettingsGlassCard>
    </form>
  );
}
