'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SafeAppShell from '@/components/SafeDashboard/SafeAppShell';
import type { NavChild, NavEntry } from '@/components/SafeDashboard/SafeSidebar';
import { WorkspaceTopbar } from '@/components/workspace/WorkspaceTopbar';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { localizeRoleName } from '@/lib/role-i18n';
import { PresenceProvider } from '@/hooks/usePresence';

const Icon = ({
  d,
  size = 17,
}: {
  d: string | string[];
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="block shrink-0 overflow-visible"
    aria-hidden
  >
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const DEPT_KEYS = new Set(['finance', 'it', 'hr', 'marketing', 'operations', 'general']);

type BoardRow = { id: string; name: string; cardCount?: number };

type Translate = (key: string, params?: Record<string, string | number>) => string;

function buildWorkspaceNav(
  workspaceId: string,
  permissions: string[],
  isSuperAdmin: boolean | undefined,
  folders: { key: string; label: string; deptId?: string; boards: BoardRow[] }[],
  uncategorized: BoardRow[],
  badges: { chatTotal?: number; email?: number } | undefined,
  t: Translate,
): { nav: NavEntry[]; routes: Record<string, string> } {
  const can = (p?: string) => !p || permissions.includes(p);
  const base = `/workspace/${workspaceId}`;
  const routes: Record<string, string> = {};
  const nav: NavEntry[] = [];

  const badgePill = (n?: number) =>
    n && n > 0
      ? { text: n > 99 ? '99+' : String(n), color: '#ef4444' }
      : undefined;

  const add = (
    id: string,
    label: string,
    href: string,
    icon: React.ReactNode,
    permission?: string,
    children?: NavChild[],
    badge?: { text: string; color: string }
  ) => {
    if (!can(permission)) return;
    routes[id] = href;
    nav.push({ id, label, icon, children, badge });
  };

  // ── Core menu ──
  nav.push({ isSection: true, label: t('workspace.menu') });

  // Chat first
  add(
    'ws-chat',
    t('workspace.chat'),
    `${base}/chat`,
    <Icon d={['M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z']} />,
    'workspace:read',
    undefined,
    badgePill(badges?.chatTotal)
  );

  // My Tasks → Projects → Departments
  if (can('board:read')) {
    routes['ws-tasks-list'] = `${base}/my-tasks?tab=list`;
    routes['ws-tasks-overview'] = `${base}/my-tasks?tab=overview`;
    routes['ws-tasks'] = `${base}/my-tasks?tab=list`;
    nav.push({
      id: 'ws-tasks',
      label: t('workspace.myTasks'),
      icon: <Icon d={['M9 11l3 3L22 4', 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11']} />,
      children: [
        { id: 'ws-tasks-list', label: t('workspace.list') },
        { id: 'ws-tasks-overview', label: t('workspace.overview') },
      ],
    });
  }

  const canDeptLead =
    can('board:settings') ||
    can('card:complete_done') ||
    can('analytics:team') ||
    can('analytics:company') ||
    can('department:manage') ||
    can('workspace:roles');

  // Projects — List first, then Overview (Kanban/Table live inside List)
  if (can('board:read')) {
    routes['ws-boards'] = `${base}/boards?view=list`;
    routes['ws-boards-list'] = `${base}/boards?view=list`;
    routes['ws-boards-overview'] = `${base}/boards?view=overview`;

    for (const folder of folders) {
      for (const b of folder.boards) {
        const bid = `ws-board-${b.id}`;
        routes[bid] = `/board/${b.id}`;
      }
    }
    for (const b of uncategorized) {
      const bid = `ws-board-${b.id}`;
      routes[bid] = `/board/${b.id}`;
    }

    nav.push({
      id: 'ws-boards',
      label: t('workspace.projects'),
      icon: <Icon d={['M4 4h6v16H4z', 'M14 4h6v10h-6z']} />,
      children: [
        { id: 'ws-boards-list', label: t('workspace.list') },
        { id: 'ws-boards-overview', label: t('workspace.overview') },
      ],
    });
  }

  // Departments
  if (can('board:read') || canDeptLead) {
    routes['ws-departments'] = `${base}/departments?view=list`;
    routes['ws-departments-list'] = `${base}/departments?view=list`;
    routes['ws-departments-overview'] = `${base}/departments?view=overview`;

    nav.push({
      id: 'ws-departments',
      label: t('workspace.departments'),
      icon: (
        <Icon
          d={[
            'M3 21h18',
            'M5 21V7l7-4 7 4v14',
            'M9 21v-6h6v6',
          ]}
        />
      ),
      children: [
        { id: 'ws-departments-list', label: t('workspace.list') },
        { id: 'ws-departments-overview', label: t('workspace.overview') },
      ],
    });
  }

  // Analytics — Home + My Workspace + scores / lead / trends
  const canAnalyticsDeep =
    can('analytics:company') ||
    can('analytics:team') ||
    can('department:manage') ||
    can('card:complete_done') ||
    can('board:settings') ||
    can('workspace:roles');

  routes['ws-analytics'] = base;
  routes['ws-analytics-home'] = base;
  routes['ws-analytics-my'] = `${base}/my-workspace`;
  routes['ws-analytics-company'] = `${base}/analytics?scope=company`;
  routes['ws-analytics-team'] = `${base}/analytics?scope=team`;
  routes['ws-analytics-lead'] = `${base}/lead`;
  routes['ws-analytics-trends'] = `${base}/work-trends`;

  const analyticsChildren: NavChild[] = [
    { id: 'ws-analytics-home', label: t('workspace.analyticsHome') },
  ];
  if (can('board:read')) {
    analyticsChildren.push({ id: 'ws-analytics-my', label: t('workspace.myWorkspace') });
  }
  if (
    can('analytics:company') ||
    can('department:manage') ||
    can('workspace:roles')
  ) {
    analyticsChildren.push({ id: 'ws-analytics-company', label: t('workspace.company') });
  }
  if (canAnalyticsDeep) {
    analyticsChildren.push({ id: 'ws-analytics-team', label: t('workspace.departments') });
  }
  if (can('board:settings') || can('card:complete_done') || canDeptLead) {
    analyticsChildren.push({ id: 'ws-analytics-lead', label: t('workspace.lead') });
    analyticsChildren.push({ id: 'ws-analytics-trends', label: t('workspace.workTrends') });
  }

  nav.push({
    id: 'ws-analytics',
    label: t('workspace.analytics'),
    icon: <Icon d={['M18 20V10', 'M12 20V4', 'M6 20v-6']} />,
    children: analyticsChildren,
  });

  // ── Apps ──
  nav.push({ isSection: true, label: t('workspace.apps') });
  add(
    'ws-email',
    t('workspace.email'),
    `${base}/email`,
    <Icon
      d={[
        'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z',
        'M22 6l-10 7L2 6',
      ]}
    />,
    'workspace:read',
    undefined,
    badgePill(badges?.email)
  );
  add(
    'ws-calendar',
    t('workspace.calendar'),
    `${base}/calendar`,
    <Icon
      d={['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z']}
    />,
    'board:read'
  );

  // Apps section continues — admin lives in Workspace Settings (not sidebar)

  // Team directory for all members
  if (can('workspace:read') && !routes['ws-team']) {
    add(
      'ws-team',
      t('workspace.team'),
      `${base}/team`,
      <Icon
        d={[
          'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
          'M13 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0',
          'M22 21v-2a4 4 0 0 0-3-3.87',
          'M16 3.13a4 4 0 0 1 0 7.75',
        ]}
      />,
      'workspace:read'
    );
  }

  // Settings route + media gallery (members reach gallery from Home strip)
  const canSettings =
    can('workspace:members') ||
    can('workspace:roles') ||
    can('workspace:billing') ||
    can('workspace:audit') ||
    can('security:policies') ||
    can('workspace:update') ||
    can('workspace:transfer_ownership');
  routes['ws-settings'] = `${base}/settings`;
  routes['ws-media'] = `${base}/settings/media`;
  routes['account-profile'] = `${base}/account?tab=profile`;
  routes['account-settings'] = `${base}/account?tab=settings`;
  routes['account-help'] = `${base}/account?tab=help`;
  // Billing lives in workspace settings (not personal account)
  routes['account-billing'] = `${base}/settings/billing`;
  if (canSettings) {
    // keep route; entry is via header gear / switcher — not sidebar
  }

  if (isSuperAdmin) {
    nav.push({ isSection: true, label: t('workspace.platform') });
    routes['ws-superadmin'] = '/superadmin';
    nav.push({
      id: 'ws-superadmin',
      label: t('workspace.superAdmin'),
      icon: (
        <Icon d={['M12 3h7a2 2 0 012 2v14a2 2 0 01-2 2h-7m0-18H5a2 2 0 00-2 2v14a2 2 0 002 2h7m0-18v18']} />
      ),
    });
  }

  return { nav, routes };
}

function resolveActiveId(pathname: string, workspaceId: string, search = ''): string {
  const base = `/workspace/${workspaceId}`;
  if (pathname.includes('/chat')) return 'ws-chat';
  if (pathname.includes('/email')) return 'ws-email';
  if (pathname.includes('/calendar')) return 'ws-calendar';
  if (pathname.includes('/account')) {
    if (search.includes('tab=settings')) return 'account-settings';
    if (search.includes('tab=help')) return 'account-help';
    return 'account-profile';
  }
  if (pathname.includes('/my-workspace')) return 'ws-analytics-my';
  if (pathname.includes('/my-tasks')) {
    const tab = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('tab');
    if (tab === 'overview') return 'ws-tasks-overview';
    return 'ws-tasks-list';
  }
  if (pathname.includes('/inbox')) return 'ws-analytics-home';
  if (pathname.includes('/settings')) return 'ws-settings';
  if (pathname.match(/\/board\/([^/]+)/)) {
    const m = pathname.match(/\/board\/([^/]+)/);
    if (m) return `ws-board-${m[1]}`;
  }
  if (pathname.includes('/boards')) {
    const view = new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search,
    ).get('view');
    if (view === 'overview') return 'ws-boards-overview';
    return 'ws-boards-list';
  }
  if (pathname.match(/\/departments\/?$/) || pathname.endsWith('/departments')) {
    const view = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get(
      'view',
    );
    if (view === 'overview') return 'ws-departments-overview';
    return 'ws-departments-list';
  }
  if (pathname.includes('/departments/')) {
    return 'ws-departments-list';
  }
  if (pathname.includes('/analytics')) {
    const scope = new URLSearchParams(
      search.startsWith('?') ? search.slice(1) : search,
    ).get('scope');
    if (scope === 'team') return 'ws-analytics-team';
    if (scope === 'company') return 'ws-analytics-company';
    return 'ws-analytics-company';
  }
  if (pathname.includes('/work-trends')) return 'ws-analytics-trends';
  if (pathname.includes('/lead')) return 'ws-analytics-lead';
  if (pathname.includes('/team')) return 'ws-team';
  if (pathname === base || pathname === `${base}/`) return 'ws-analytics-home';
  return 'ws-analytics-home';
}

export function WorkspaceShell({
  workspaceId,
  workspaceName,
  permissions,
  isSuperAdmin = false,
  impersonating = false,
  children,
}: {
  workspaceId: string;
  workspaceName: string;
  permissions: string[];
  isSuperAdmin?: boolean;
  impersonating?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLang();
  const [folders, setFolders] = useState<
    { key: string; label: string; deptId?: string; boards: BoardRow[] }[]
  >([]);
  const [uncategorized, setUncategorized] = useState<BoardRow[]>([]);
  const [badges, setBadges] = useState<{ chatTotal?: number; email?: number }>({});
  const [profileTitle, setProfileTitle] = useState<string | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let closed = false;

    void (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/badges`);
        const json = await res.json();
        if (res.ok && json.data) {
          setBadges({
            chatTotal: json.data.chatTotal || 0,
            email: json.data.email || 0,
          });
        }
      } catch {
        /* ignore */
      }
    })();

    try {
      es = new EventSource(`/api/workspaces/${workspaceId}/badges/stream`);
      es.addEventListener('badges', (ev) => {
        try {
          const data = JSON.parse((ev as MessageEvent).data) as {
            chatTotal?: number;
            email?: number;
          };
          if (!closed) {
            setBadges({
              chatTotal: data.chatTotal || 0,
              email: data.email || 0,
            });
          }
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* EventSource unavailable */
    }

    return () => {
      closed = true;
      es?.close();
    };
  }, [workspaceId]);

  useEffect(() => {
    void (async () => {
      const [homeRes, deptRes, boardsRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/home`),
        fetch(`/api/workspaces/${workspaceId}/departments`),
        fetch(`/api/workspaces/${workspaceId}/boards`),
      ]);

      if (homeRes.ok) {
        const json = await homeRes.json();
        setUncategorized(json.data?.uncategorized || []);
        const meTitle =
          (typeof json.data?.me?.title === 'string' && json.data.me.title.trim()) ||
          (typeof json.data?.me?.roleName === 'string' && json.data.me.roleName.trim()) ||
          '';
        setProfileTitle(meTitle || null);
      }

      const boardsByDept = new Map<string, BoardRow[]>();
      if (boardsRes.ok) {
        const bj = await boardsRes.json();
        for (const b of bj.data || []) {
          const key = b.departmentKey || 'general';
          const list = boardsByDept.get(key) || [];
          list.push({ id: b.id, name: b.name, cardCount: b.cardCount });
          boardsByDept.set(key, list);
        }
      }

      if (deptRes.ok) {
        const json = await deptRes.json();
        const depts: { id: string; key: string; name: string }[] = json.data || [];
        setFolders(
          depts.map((d) => ({
            key: d.key,
            label: localizedDepartmentLabel(t, d.key, d.name),
            deptId: d.id,
            boards: boardsByDept.get(d.key) || [],
          })),
        );
      } else if (homeRes.ok) {
        // home already parsed above — fall back via boards grouping
        setFolders(
          [...boardsByDept.entries()].map(([key, boards]) => ({
            key,
            label: localizedDepartmentLabel(t, DEPT_KEYS.has(key) ? key : 'general', key),
            boards,
          })),
        );
      }
    })();
  }, [workspaceId, t]);

  const { nav, routes } = useMemo(
    () =>
      buildWorkspaceNav(
        workspaceId,
        permissions,
        isSuperAdmin,
        folders,
        uncategorized,
        badges,
        t,
      ),
    [workspaceId, permissions, isSuperAdmin, folders, uncategorized, badges, t]
  );
  const activeId = resolveActiveId(pathname, workspaceId, searchParams.toString());
  const fullBleed =
    pathname.includes('/chat') ||
    pathname.includes('/calendar') ||
    pathname.includes('/email') ||
    pathname.includes('/account') ||
    pathname.includes('/analytics') ||
    pathname.includes('/work-trends');

  async function stopImpersonation() {
    await fetch('/api/superadmin/impersonate', { method: 'DELETE' });
    router.push('/superadmin');
    router.refresh();
  }

  const banner = impersonating ? (
    <div
      className="px-4 py-2 text-sm flex items-center justify-between gap-3 flex-shrink-0"
      style={{ background: '#7c2d12', color: '#fff' }}
    >
      <span>Read-only impersonation — viewing as workspace member</span>
      <button type="button" className="underline font-semibold" onClick={() => void stopImpersonation()}>
        Exit
      </button>
    </div>
  ) : null;

  return (
    <PresenceProvider workspaceId={workspaceId} userId={session?.user?.id}>
      <SafeAppShell
        nav={nav}
        routes={routes}
        activeId={activeId}
        brandTitle="Enterhub"
        banner={banner}
        fullBleed={fullBleed}
        profileMenuItems={[
          { id: 'account-profile', label: t('workspace.profile') },
          { id: 'account-settings', label: t('workspace.settings') },
          { id: 'account-help', label: t('workspace.help') },
        ]}
        profileDisplayName={session?.user?.name || session?.user?.email || t('workspace.profile')}
        profileSubtitle={
          profileTitle ? localizeRoleName(profileTitle, t) : undefined
        }        topbar={({ isDark: dark, onMenuToggle }) => (
          <WorkspaceTopbar
            workspaceId={workspaceId}
            isDark={dark}
            onMenuToggle={onMenuToggle}
            canManageWorkspace={
              permissions.includes('workspace:update') ||
              permissions.includes('workspace:members') ||
              permissions.includes('workspace:roles') ||
              permissions.includes('workspace:billing') ||
              permissions.includes('workspace:audit') ||
              permissions.includes('security:policies') ||
              permissions.includes('workspace:transfer_ownership')
            }
          />
        )}
      >
        {children}
      </SafeAppShell>
    </PresenceProvider>
  );
}
