'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  MdMail,
  MdPerson,
  MdSearch,
  MdCircle,
  MdBarChart,
} from 'react-icons/md';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  surfaceItem,
  surfaceHover,
  hexToRgba,
} from '@/components/SafeDashboard/theme';
import { usePresence } from '@/hooks/usePresence';
import {
  PRESENCE_META,
  resolvePresence,
  type PresenceStatus,
} from '@/lib/presence';
import { localizeRoleName } from '@/lib/role-i18n';

type Member = {
  id: string;
  userId: string;
  title: string | null;
  status: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    lastLoginAt: string | null;
    presenceStatus?: string | null;
    presenceUpdatedAt?: string | null;
  };
  role: { id: string; name: string; isSystem: boolean };
};

type FilterKey = 'all' | PresenceStatus | 'offline';

const FILTER_IDS: FilterKey[] = ['all', 'available', 'meeting', 'away', 'leave', 'offline'];

function colorFor(p: PresenceStatus | 'offline') {
  if (p === 'offline') return '#94a3b8';
  return PRESENCE_META[p].color;
}

export function TeamDirectoryClient({ workspaceId }: { workspaceId: string }) {
  const { data: session } = useSession();
  const { theme, primaryColor } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useLang();
  const { liveMap } = usePresence(workspaceId, session?.user?.id);
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMembers(
        (json.data || []).filter(
          (m: Member) => m.status === 'ACTIVE' || m.status === 'INVITED',
        ),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const enriched = useMemo(
    () =>
      members.map((m) => {
        const live = liveMap[m.user.id];
        const presence: PresenceStatus | 'offline' =
          live ||
          resolvePresence(
            m.user.presenceStatus,
            m.user.presenceUpdatedAt ? new Date(m.user.presenceUpdatedAt) : null,
            { forceLive: m.user.id === session?.user?.id },
          );
        return {
          ...m,
          presence,
          displayName: m.user.name || m.user.email,
          dept: m.title || m.role.name,
        };
      }),
    [members, liveMap, session?.user?.id],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((m) => {
      if (filter !== 'all' && m.presence !== filter) return false;
      if (!q) return true;
      return [m.displayName, m.user.email, m.dept, m.role.name]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [enriched, query, filter]);

  const filterLabel = (id: FilterKey) => {
    if (id === 'all') return t('common.all');
    if (id === 'offline') return t('teamPage.offline');
    return t(`presence.${id}`);
  };

  const presenceLabel = (p: PresenceStatus | 'offline') => {
    if (p === 'offline') return t('teamPage.offline');
    return t(`presence.${p}`);
  };

  const onlineCount = enriched.filter((m) => m.presence === 'available').length;
  const cardBg = surfaceItem(isDark);
  const cardBorder = borderSubtle(isDark);

  return (
    <div className="space-y-5 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: textMuted(isDark) }}>
            {t('teamPage.breadcrumb')}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: textPrimary(isDark) }}>
            {t('teamPage.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: textSecondary(isDark) }}>
            {t('teamPage.membersAvailable', {
              members: enriched.length,
              available: onlineCount,
            })}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch
            className="absolute start-3 top-1/2 -translate-y-1/2"
            size={18}
            style={{ color: textMuted(isDark) }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('teamPage.searchMembers')}
            className="w-full ps-10 pe-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: surfaceItem(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textPrimary(isDark),
            }}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className="px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: filter === id ? surfaceHover(isDark) : surfaceItem(isDark),
                color: filter === id ? textPrimary(isDark) : textMuted(isDark),
                border: `1px solid ${borderSubtle(isDark)}`,
              }}
            >
              {filterLabel(id)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: textMuted(isDark) }}>
          {t('common.loading')}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => {
            const hovered = hoveredId === m.id;
            return (
            <Link
              key={m.id}
              href={`/workspace/${workspaceId}/people/${m.user.id}`}
              className="rounded-2xl p-4 transition-all duration-200"
              onMouseEnter={() => setHoveredId(m.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(m.id)}
              onBlur={() => setHoveredId(null)}
              style={{
                background: hovered
                  ? isDark
                    ? 'color-mix(in srgb, #131B2B 70%, #1E293B)'
                    : '#fff'
                  : cardBg,
                border: `1px solid ${
                  hovered
                    ? hexToRgba(primaryColor || '#2563EB', isDark ? 0.55 : 0.35)
                    : cardBorder
                }`,
                boxShadow: hovered
                  ? isDark
                    ? `0 0 0 1px ${hexToRgba(primaryColor || '#2563EB', 0.25)}, 0 12px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`
                    : `0 8px 24px rgba(15,23,42,0.1)`
                  : 'none',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold transition-shadow duration-200"
                    style={{
                      background: hovered
                        ? hexToRgba(primaryColor || '#2563EB', isDark ? 0.22 : 0.12)
                        : surfaceHover(isDark),
                      color: textPrimary(isDark),
                      boxShadow: hovered
                        ? `0 0 0 2px ${hexToRgba(primaryColor || '#2563EB', 0.35)}`
                        : 'none',
                    }}
                  >
                    {m.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <MdPerson size={22} style={{ color: textMuted(isDark) }} />
                    )}
                  </div>
                  <MdCircle
                    size={12}
                    className="absolute -bottom-0.5 -end-0.5"
                    style={{
                      color: colorFor(m.presence),
                      filter: hovered ? 'drop-shadow(0 0 4px currentColor)' : undefined,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                    {m.displayName}
                  </p>
                  <p className="text-xs truncate" style={{ color: textMuted(isDark) }}>
                    {m.dept}
                  </p>
                  <p
                    className="text-[10px] font-semibold mt-0.5"
                    style={{ color: colorFor(m.presence) }}
                  >
                    {presenceLabel(m.presence)}
                  </p>
                  <p
                    className="text-xs mt-1 inline-flex items-center gap-1 truncate"
                    style={{ color: textSecondary(isDark) }}
                  >
                    <MdMail size={12} />
                    {m.user.email}
                  </p>
                  <p
                    className="text-[10px] mt-2 inline-flex items-center gap-1 transition-colors duration-200"
                    style={{
                      color: hovered ? primaryColor || '#2563EB' : textMuted(isDark),
                    }}
                  >
                    <MdBarChart size={12} />
                    {localizeRoleName(m.role.name, t)} · {t('teamPage.viewAnalytics')}
                  </p>
                </div>
              </div>
            </Link>
            );
          })}
          {filtered.length === 0 && (
            <p
              className="col-span-full text-center py-10 text-sm"
              style={{ color: textMuted(isDark) }}
            >
              {t('teamPage.noMembersMatch')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
