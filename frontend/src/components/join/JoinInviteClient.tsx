'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';

type InviteView = {
  workspaceId: string;
  workspaceName: string;
  roleName: string;
  email: string;
  status: string;
  used: boolean;
  expired: boolean;
  oneTime: boolean;
};

export function JoinInviteClient({ token }: { token: string }) {
  const { t } = useLang();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [data, setData] = useState<InviteView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/join/${encodeURIComponent(token)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t('membersPage.inviteNotFound'));
        return;
      }
      setData(json.data);
    })();
  }, [token, t]);

  async function accept() {
    if (authStatus !== 'authenticated') {
      router.push(`/signin?callbackUrl=${encodeURIComponent(`/join/${token}`)}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.status === 401) {
        router.push(`/signin?callbackUrl=${encodeURIComponent(`/join/${token}`)}`);
        return;
      }
      if (!res.ok) throw new Error(json.error || t('membersPage.inviteFailed'));
      const wsId = json.data?.workspaceId || data?.workspaceId;
      router.push(wsId ? `/workspace/${wsId}` : '/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('membersPage.inviteFailed'));
    } finally {
      setBusy(false);
    }
  }

  const locked = Boolean(data?.used || data?.expired);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl p-6 space-y-4"
        style={{
          background: isDark ? '#131B2B' : '#fff',
          border: `1px solid ${borderSubtle(isDark)}`,
        }}
      >
        <p className="text-xs font-bold" style={{ color: textMuted(isDark) }}>
          {t('membersPage.oneTimeLink')}
        </p>
        <h1 className="text-xl font-bold" style={{ color: textPrimary(isDark) }}>
          {data?.workspaceName || t('membersPage.inviteTitle')}
        </h1>
        {data && (
          <p className="text-sm" style={{ color: textSecondary(isDark) }}>
            {t('membersPage.inviteForEmail', { email: data.email })}
          </p>
        )}
        <p className="text-[13px]" style={{ color: textMuted(isDark) }}>
          {t('membersPage.oneTimeHint')}
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="button"
          disabled={busy || locked || !data}
          onClick={() => void accept()}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#2563eb' }}
        >
          {authStatus === 'authenticated'
            ? busy
              ? t('common.loading')
              : t('homePage.accept')
            : t('membersPage.signInToAccept')}
        </button>
        <Link
          href="/signin"
          className="block text-center text-xs"
          style={{ color: textMuted(isDark) }}
        >
          {t('nav.signIn')}
        </Link>
      </div>
    </div>
  );
}
