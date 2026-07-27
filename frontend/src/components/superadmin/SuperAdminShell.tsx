'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
import SafeAppShell from '@/components/SafeDashboard/SafeAppShell';
import type { NavEntry } from '@/components/SafeDashboard/SafeSidebar';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';

const Icon = ({ d, size = 17 }: { d: string | string[]; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ROUTES: Record<string, string> = {
  'sa-overview': '/superadmin',
  'sa-tenants': '/superadmin/tenants',
  'sa-users': '/superadmin/users',
  'sa-payments': '/superadmin/payments',
  'sa-c2c': '/superadmin/payments/c2c',
  'sa-plans': '/superadmin/plans',
  'sa-recovery': '/superadmin/recovery',
  'sa-system': '/superadmin/system',
  'sa-settings': '/superadmin/settings',
  'sa-audit': '/superadmin/audit',
  'sa-flags': '/superadmin/flags',
  'sa-support': '/superadmin/support',
};

function resolveActiveId(pathname: string): string {
  if (pathname.startsWith('/superadmin/payments/c2c')) return 'sa-c2c';
  if (pathname.startsWith('/superadmin/payments')) return 'sa-payments';
  if (pathname.startsWith('/superadmin/tenants')) return 'sa-tenants';
  if (pathname.startsWith('/superadmin/users')) return 'sa-users';
  if (pathname.startsWith('/superadmin/plans')) return 'sa-plans';
  if (pathname.startsWith('/superadmin/recovery')) return 'sa-recovery';
  if (pathname.startsWith('/superadmin/system')) return 'sa-system';
  if (pathname.startsWith('/superadmin/settings')) return 'sa-settings';
  if (pathname.startsWith('/superadmin/audit')) return 'sa-audit';
  if (pathname.startsWith('/superadmin/flags')) return 'sa-flags';
  if (pathname.startsWith('/superadmin/support')) return 'sa-support';
  return 'sa-overview';
}

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();

  const nav: NavEntry[] = useMemo(
    () => [
      { isSection: true, label: t('workspace.menu') },
      {
        id: 'sa-overview',
        label: t('superadmin.overview'),
        icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
      },
      {
        id: 'sa-tenants',
        label: t('superadmin.tenants'),
        icon: <Icon d={['M3 21h18', 'M5 21V7l7-4 7 4v14', 'M9 21V12h6v9']} />,
      },
      {
        id: 'sa-users',
        label: t('superadmin.users'),
        icon: <Icon d={['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', 'M9 11a4 4 0 100-8 4 4 0 000 8z', 'M23 21v-2a4 4 0 00-3-3.87', 'M16 3.13a4 4 0 010 7.75']} />,
      },
      {
        id: 'sa-payments',
        label: t('superadmin.payments'),
        icon: <Icon d={['M12 1v22', 'M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6']} />,
      },
      {
        id: 'sa-c2c',
        label: t('superadmin.c2c'),
        icon: <Icon d={['M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z', 'M1 10h22']} />,
      },
      {
        id: 'sa-plans',
        label: t('superadmin.plans'),
        icon: <Icon d={['M4 19.5A2.5 2.5 0 016.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z']} />,
      },
      {
        id: 'sa-recovery',
        label: t('superadmin.recovery'),
        icon: <Icon d={['M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8', 'M3 3v5h5']} />,
      },
      {
        id: 'sa-system',
        label: t('superadmin.system'),
        icon: <Icon d={['M22 12h-4l-3 9L9 3l-3 9H2']} />,
      },
      {
        id: 'sa-settings',
        label: t('superadmin.settings'),
        icon: <Icon d={['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z']} />,
      },
      {
        id: 'sa-audit',
        label: t('superadmin.audit'),
        icon: <Icon d={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6']} />,
      },
      {
        id: 'sa-flags',
        label: t('superadmin.flags'),
        icon: <Icon d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />,
      },
      {
        id: 'sa-support',
        label: t('superadmin.support'),
        icon: <Icon d={['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z']} />,
      },
    ],
    [t],
  );

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin');
  }, [status, router]);

  async function stopImpersonation() {
    await fetch('/api/superadmin/impersonate', { method: 'DELETE' });
    await update({ stopImpersonation: true });
    router.push('/superadmin');
    router.refresh();
  }

  if (status === 'loading') {
    return <p className="p-8">{t('common.loading')}</p>;
  }

  if (session && !session.user.isSuperAdmin && !session.user.impersonating) {
    return (
      <div className="p-8">
        <p className="text-red-500">403 — Super Admin only</p>
        <Link href="/" className="underline text-sm">
          {t('workspace.analyticsHome')}
        </Link>
      </div>
    );
  }

  const banner = session?.user?.impersonating ? (
    <div
      className="px-4 py-2 text-sm flex items-center justify-between gap-3 flex-shrink-0"
      style={{ background: '#7c2d12', color: '#fff' }}
    >
      <span>Read-only impersonation active</span>
      <button type="button" className="underline font-semibold" onClick={() => void stopImpersonation()}>
        Exit
      </button>
    </div>
  ) : null;

  return (
    <SafeAppShell
      nav={nav}
      routes={ROUTES}
      activeId={resolveActiveId(pathname)}
      brandTitle="Enterhub"
      brandSubtitle={t('workspace.superAdmin')}
      banner={banner}
    >
      <div className="w-full max-w-6xl 3xl:max-w-7xl 4xl:max-w-[90rem] mx-auto min-w-0">
        {children}
      </div>
    </SafeAppShell>
  );
}
