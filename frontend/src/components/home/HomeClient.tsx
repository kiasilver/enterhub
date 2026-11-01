'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import Navbar from '@/components/Navbar/Navbar';
import PlasmaWrapper from '@/components/Plasma/PlasmaWrapper';
import { canvasBg, panelFill } from '@/components/SafeDashboard/theme';

type InviteRow = {
  id: string;
  status: string;
  workspaceId: string;
  workspaceName: string;
  departmentName: string | null;
  roleName: string;
  invitedByName: string;
};

export function HomeClient({
  userName,
  invites,
}: {
  userName: string;
  invites: InviteRow[];
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useLang();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function acceptInvite(invite: InviteRow) {
    setBusyId(invite.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/workspaces/${invite.workspaceId}/invites/${invite.id}/accept`,
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Accept failed');
      router.push(`/workspace/${invite.workspaceId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accept failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main
      className="relative min-h-screen overflow-x-hidden flex flex-col"
      style={{ backgroundColor: canvasBg(isDark) }}
    >
      <div className="fixed inset-0 z-0">
        <PlasmaWrapper fullscreen />
      </div>
      <Navbar />
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div
          className="w-full max-w-lg p-6 sm:p-8 rounded-[28px] backdrop-blur-2xl space-y-6"
          style={{
            backgroundColor: panelFill(isDark),
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            color: isDark ? 'white' : 'black',
          }}
        >
          <div className="flex justify-end">
            <LanguageSwitcher size="sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-1">{t('homePage.title')}</h1>
            <p className="text-sm opacity-70">
              {t('homePage.hello').replace('{name}', userName || t('homePage.you'))}
            </p>
            <p className="text-sm opacity-60 mt-2">{t('homePage.subtitle')}</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold opacity-80">{t('homePage.pendingInvites')}</h2>
            {invites.length === 0 ? (
              <p className="text-sm opacity-55">{t('homePage.noInvites')}</p>
            ) : (
              invites.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{inv.workspaceName}</div>
                    <div className="text-xs opacity-60">
                      {inv.departmentName ? `${inv.departmentName} · ` : ''}
                      {inv.roleName} · {inv.invitedByName}
                      {inv.status === 'PENDING_APPROVAL'
                        ? ` · ${t('homePage.awaitingApproval')}`
                        : ''}
                    </div>
                  </div>
                  {inv.status === 'PENDING_ACCEPT' ? (
                    <button
                      type="button"
                      disabled={busyId === inv.id}
                      onClick={() => void acceptInvite(inv)}
                      className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}
                    >
                      {busyId === inv.id ? t('common.loading') : t('homePage.accept')}
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </section>

          <div className="pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
            <Link
              href="/onboarding/company"
              className="inline-flex w-full items-center justify-center px-4 py-3 rounded-2xl font-semibold text-sm"
              style={{
                backgroundColor: isDark ? 'white' : 'black',
                color: isDark ? 'black' : 'white',
              }}
            >
              {t('homePage.createCompany')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
