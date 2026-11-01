'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import SafeAppShell from '@/components/SafeDashboard/SafeAppShell';
import type { NavEntry } from '@/components/SafeDashboard/SafeSidebar';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { safeReturnPath } from '@/lib/nav-from';

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
    className="block shrink-0"
    aria-hidden
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function BoardShellInner({
  workspaceId,
  boardId,
  boardName,
  departmentKey,
  departmentName,
  canSettings,
  guestMode,
  children,
}: {
  workspaceId: string;
  boardId: string;
  boardName: string;
  departmentKey?: string | null;
  departmentName?: string | null;
  canSettings: boolean;
  guestMode?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const fromRaw = searchParams.get('from');
  const defaultBack = `/workspace/${workspaceId}/boards?view=list&mode=kanban`;
  const backHref = guestMode ? '/guest' : safeReturnPath(fromRaw, defaultBack);
  const fromQ = fromRaw ? `?from=${encodeURIComponent(fromRaw)}` : '';

  const routes: Record<string, string> = {
    'board-back': backHref,
    'board-kanban': `/board/${boardId}${fromQ}`,
  };
  if (canSettings) {
    routes['board-settings'] = `/board/${boardId}/settings${fromQ}`;
  }

  const nav: NavEntry[] = [
    { isSection: true, label: 'BOARD' }, // TODO: i18n key
    {
      id: 'board-back',
      label: guestMode ? 'Guest home' : t('board.backToProjects'), // TODO: guest home key
      icon: <Icon d="M19 12H5M12 19l-7-7 7-7" />,
    },
    {
      id: 'board-kanban',
      label: t('board.kanban'),
      icon: <Icon d={['M4 4h6v16H4z', 'M14 4h6v10h-6z']} />,
    },
  ];
  if (canSettings) {
    nav.push({
      id: 'board-settings',
      label: t('board.settings'),
      icon: (
        <Icon
          d={[
            'M12 15a3 3 0 100-6 3 3 0 000 6z',
            'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
          ]}
        />
      ),
    });
  }

  const activeId = pathname.includes('/settings') ? 'board-settings' : 'board-kanban';

  return (
    <SafeAppShell
      nav={nav}
      routes={routes}
      activeId={activeId}
      brandTitle="Enterhub"
      brandSubtitle={
        departmentKey || departmentName
          ? `${localizedDepartmentLabel(t, departmentKey, departmentName)} · ${boardName}`
          : boardName
      }
      fullBleed
    >
      <div className="h-full w-full min-w-0 overflow-auto px-3 xs:px-4 sm:px-6 3xl:px-8 py-4 sm:py-5">{children}</div>
    </SafeAppShell>
  );
}

export function BoardShell(props: {
  workspaceId: string;
  boardId: string;
  boardName: string;
  departmentKey?: string | null;
  departmentName?: string | null;
  canSettings: boolean;
  guestMode?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <BoardShellInner {...props} />
    </Suspense>
  );
}
