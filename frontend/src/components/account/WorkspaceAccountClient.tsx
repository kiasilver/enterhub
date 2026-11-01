'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import {
  AccountShell,
  type AccountTab,
} from '@/components/account/AccountShell';
import { AccountProfile } from '@/components/account/AccountProfile';
import { AccountSettings } from '@/components/account/AccountSettings';
import { AccountNotifications } from '@/components/account/AccountNotifications';
import { AccountHelp } from '@/components/account/AccountHelp';
import { usePresence } from '@/hooks/usePresence';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import type { PresenceStatus } from '@/lib/presence';

function AccountInner() {
  const { t } = useLang();
  const params = useParams();
  const workspaceId = String(params.id);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { status: presenceStatus } = usePresence(workspaceId, session?.user?.id);

  const tabParam = searchParams.get('tab');
  const initial: AccountTab =
    tabParam === 'settings' ||
    tabParam === 'help' ||
    tabParam === 'profile' ||
    tabParam === 'notifications'
      ? tabParam
      : 'profile';
  const [tab, setTab] = useState<AccountTab>(initial);
  const [profileName, setProfileName] = useState(
    session?.user?.name || session?.user?.email || 'Account',
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (
      t === 'settings' ||
      t === 'help' ||
      t === 'profile' ||
      t === 'notifications'
    ) {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    void fetch('/api/account/profile')
      .then((r) => r.json())
      .then((j) => {
        if (j.data) {
          const n =
            [j.data.firstName, j.data.lastName].filter(Boolean).join(' ') ||
            j.data.name ||
            j.data.email;
          setProfileName(n);
          setAvatarUrl(j.data.avatarUrl || null);
        }
      })
      .catch(() => undefined);
  }, [tab]);

  function onTab(next: AccountTab) {
    setTab(next);
    router.replace(`/workspace/${workspaceId}/account?tab=${next}`);
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <AccountShell
        isDark={isDark}
        active={tab}
        onTab={onTab}
        displayName={profileName}
        email={session?.user?.email || undefined}
        avatarUrl={avatarUrl}
        presenceStatus={presenceStatus as PresenceStatus}
        subtitle={t('account.personalAccount')}
        onAvatarChange={(url) => {
          setAvatarUrl(url);
          void updateSession();
        }}
      >
        {tab === 'profile' && <AccountProfile isDark={isDark} />}
        {tab === 'settings' && <AccountSettings isDark={isDark} />}
        {tab === 'notifications' && <AccountNotifications isDark={isDark} />}
        {tab === 'help' && <AccountHelp isDark={isDark} workspaceId={workspaceId} />}
      </AccountShell>
    </div>
  );
}

export function WorkspaceAccountClient() {
  const { t } = useLang();
  return (
    <Suspense
      fallback={
        <div className="h-full w-full flex items-center justify-center text-sm opacity-60">
          {t('common.loading')}
        </div>
      }
    >
      <div className="h-full w-full min-h-0 flex flex-col">
        <AccountInner />
      </div>
    </Suspense>
  );
}
