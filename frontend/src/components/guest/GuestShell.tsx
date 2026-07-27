'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import SafeAppShell from '@/components/SafeDashboard/SafeAppShell';
import type { NavEntry } from '@/components/SafeDashboard/SafeSidebar';
import { textMuted } from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

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

const NAV: NavEntry[] = [
  { isSection: true, label: 'GUEST' },
  {
    id: 'guest-home',
    label: 'Shared boards',
    icon: <Icon d={['M4 4h6v16H4z', 'M14 4h6v10h-6z']} />,
  },
];

const ROUTES: Record<string, string> = {
  'guest-home': '/guest',
};

export function GuestShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();

  return (
    <SafeAppShell
      nav={NAV}
      routes={ROUTES}
      activeId={pathname.startsWith('/guest') ? 'guest-home' : 'guest-home'}
      brandTitle="Enterhub"
      brandSubtitle={session?.user?.email || 'Guest access'}
    >
      <div className="w-full max-w-5xl 3xl:max-w-6xl mx-auto min-w-0">
        {children}
        <p className="text-center text-xs pt-4" style={{ color: textMuted(isDark) }}>
          Guests can open shared boards only
        </p>
      </div>
    </SafeAppShell>
  );
}
