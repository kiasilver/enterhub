'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageProvider/LanguageSwitcher';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import {
  borderSubtle,
  glassDropdown,
  glassTopbar,
  surfaceHover,
  surfaceItem,
  searchFieldBg,
  textMuted,
  textPrimary,
  textSecondary,
} from '@/components/SafeDashboard/theme';
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher';
import { usePresence } from '@/hooks/usePresence';
import { PRESENCE_META, type PresenceStatus } from '@/lib/presence';

type SearchHit = {
  id: string;
  name: string;
  type: 'board' | 'card' | 'member';
  href: string;
  boardName?: string;
  role?: string;
  email?: string;
};

export function WorkspaceTopbar({
  workspaceId,
  isDark,
  onMenuToggle,
  canManageWorkspace = false,
  avatarUrl: avatarUrlProp,
}: {
  workspaceId: string;
  isDark: boolean;
  onMenuToggle: () => void;
  canManageWorkspace?: boolean;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useLang();
  const statusOptions = useMemo(
    () =>
      (Object.keys(PRESENCE_META) as PresenceStatus[]).map((id) => ({
        id,
        label: t(`presence.${id}`),
        color: PRESENCE_META[id].color,
      })),
    [t],
  );
  const { status, setPresence } = usePresence(workspaceId, session?.user?.id);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<
    { id: string; title: string; sub: string; href?: string; color: string; unread?: boolean }[]
  >([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setHits([]);
    }
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen || query.trim().length < 1) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        setSearching(true);
        const res = await fetch(
          `/api/workspaces/${workspaceId}/search?q=${encodeURIComponent(query.trim())}`
        );
        const json = await res.json();
        if (res.ok && json.data) {
          const list: SearchHit[] = [
            ...(json.data.boards || []),
            ...(json.data.cards || []),
            ...(json.data.members || []),
          ];
          setHits(list);
        }
        setSearching(false);
      })();
    }, 220);
    return () => clearTimeout(t);
  }, [query, workspaceId, paletteOpen]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/notifications`);
      const json = await res.json();
      if (!res.ok) {
        setNotifs([]);
        setNotifUnread(0);
        return;
      }
      const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
      const items = (json.data?.items || []) as {
        id: string;
        title: string;
        body: string | null;
        href?: string;
        createdAt: string;
        type: string;
        readAt: string | null;
      }[];
      setNotifUnread(Number(json.data?.unreadCount || 0));
      setNotifs(
        items.slice(0, 10).map((a, i) => ({
          id: a.id,
          title: a.title,
          sub: [a.body, new Date(a.createdAt).toLocaleString()].filter(Boolean).join(' · '),
          href: a.href,
          color: colors[i % colors.length],
          unread: !a.readAt,
        })),
      );
    } catch {
      setNotifs([]);
      setNotifUnread(0);
    } finally {
      setNotifLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (notifOpen) void loadNotifications();
  }, [notifOpen, loadNotifications]);

  const currentStatus = statusOptions.find((s) => s.id === status) || statusOptions[0];
  const userName = session?.user?.name || session?.user?.email || t('topbar.account');
  const initials = userName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const avatarSrc = avatarUrlProp || session?.user?.image || null;

  return (
    <>
      <header
        className="flex-shrink-0 flex items-center justify-between px-2 xs:px-3 sm:px-5 3xl:px-6 z-40 gap-1.5 xs:gap-2 sm:gap-3 min-w-0"
        style={{ ...glassTopbar(isDark), height: 70 }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label={t('topbar.toggleSidebar')}
            className="p-2 rounded-xl flex-shrink-0"
            style={{ color: textSecondary(isDark) }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <WorkspaceSwitcher currentId={workspaceId} isDark={isDark} variant="header" />

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm min-w-[160px] max-w-[280px] flex-1"
            style={{
              background: searchFieldBg(isDark),
              border: `1px solid ${borderSubtle(isDark)}`,
              color: textMuted(isDark),
            }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="truncate">{t('workspace.search')}</span>
            <kbd
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
              style={{ background: isDark ? 'transparent' : surfaceHover(isDark), color: textMuted(isDark), border: `1px solid ${borderSubtle(isDark)}` }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="sm:hidden p-2 rounded-xl"
            style={{ color: textSecondary(isDark) }}
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((p) => {
                  const next = !p;
                  if (next) {
                    void fetch(`/api/workspaces/${workspaceId}/notifications`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ all: true }),
                    }).then(() => {
                      setNotifUnread(0);
                      void loadNotifications();
                    });
                  }
                  return next;
                });
                setProfileOpen(false);
              }}
              className="relative p-2 rounded-xl"
              style={{
                color: textSecondary(isDark),
                background: notifOpen ? surfaceHover(isDark) : 'transparent',
              }}
              aria-label={t('workspace.notifications')}
              title={t('workspace.notifications')}
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {notifUnread > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: '#ef4444' }}
                />
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute end-0 mt-2 z-50 w-[320px] max-w-[calc(100vw-1.5rem)] overflow-hidden"
                  style={glassDropdown(isDark)}
                >
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: textPrimary(isDark) }}>
                      {t('workspace.notifications')}
                    </span>
                    {notifs.length > 0 && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      >
                        {t('topbar.recentCount', { n: notifs.length })}
                      </span>
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1 max-h-[320px] overflow-y-auto">
                    {notifLoading && (
                      <p className="text-xs px-3 py-4 text-center" style={{ color: textMuted(isDark) }}>
                        {t('common.loading')}
                      </p>
                    )}
                    {!notifLoading && notifs.length === 0 && (
                      <p className="text-xs px-3 py-6 text-center" style={{ color: textMuted(isDark) }}>
                        {t('topbar.allCaughtUp')}
                      </p>
                    )}
                    {!notifLoading &&
                      notifs.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-start transition-colors"
                          style={{ background: 'transparent' }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.href) router.push(n.href);
                            else router.push(`/workspace/${workspaceId}/inbox`);
                          }}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              background: `${n.color}22`,
                              border: `1px solid ${n.color}44`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: n.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold line-clamp-2" style={{ color: textPrimary(isDark) }}>
                              {n.title}
                            </p>
                            <p className="text-[11px] mt-0.5 truncate" style={{ color: textMuted(isDark) }}>
                              {n.sub}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                  <div
                    className="px-3 pb-3 pt-1"
                    style={{ borderTop: `1px solid ${borderSubtle(isDark)}` }}
                  >
                    <button
                      type="button"
                      className="w-full py-2.5 rounded-xl text-xs font-semibold"
                      style={{
                        background: surfaceItem(isDark),
                        color: textPrimary(isDark),
                        border: `1px solid ${borderSubtle(isDark)}`,
                      }}
                      onClick={() => {
                        setNotifOpen(false);
                        router.push(`/workspace/${workspaceId}/inbox`);
                      }}
                    >
                      {t('topbar.openInbox', { inbox: t('workspace.inbox') })}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-1 flex items-center gap-1">
            <LanguageSwitcher size="sm" />
            <ThemeToggle />
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl"
              style={{ background: profileOpen ? surfaceHover(isDark) : 'transparent' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold overflow-hidden relative"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  color: textPrimary(isDark),
                }}
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    background: currentStatus.color,
                    borderColor: isDark ? 'var(--background)' : '#fff',
                  }}
                />
              </div>
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute end-0 mt-2 z-50 w-72 min-w-[14rem] max-w-[calc(100vw-1.5rem)] p-2"
                  style={glassDropdown(isDark)}
                >
                  <div className="px-2 py-2 mb-1" style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}>
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary(isDark) }}>
                      {userName}
                    </p>
                    <p className="text-xs truncate" style={{ color: textMuted(isDark) }}>
                      {session?.user?.email}
                    </p>
                  </div>
                  <p className="text-[10px] font-bold uppercase px-2 pt-1 pb-1" style={{ color: textMuted(isDark) }}>
                    {t('common.status')}
                  </p>
                  {statusOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-start whitespace-nowrap"
                      style={{
                        color: textPrimary(isDark),
                        background: status === s.id ? surfaceHover(isDark) : 'transparent',
                      }}
                      onClick={() => void setPresence(s.id)}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </button>
                  ))}
                  {canManageWorkspace && (
                    <>
                      <div style={{ borderTop: `1px solid ${borderSubtle(isDark)}`, margin: '6px 0' }} />
                      <button
                        type="button"
                        className="w-full text-start px-3 py-2 rounded-lg text-sm"
                        style={{ color: textSecondary(isDark) }}
                        onClick={() => {
                          setProfileOpen(false);
                          router.push(`/workspace/${workspaceId}/settings`);
                        }}
                      >
                        {t('settings.workspaceSettings')}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              onClick={() => setPaletteOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: isDark ? 'rgba(12,12,14,0.98)' : '#fff',
                border: `1px solid ${borderSubtle(isDark)}`,
                boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: `1px solid ${borderSubtle(isDark)}` }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: textMuted(isDark) }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('topbar.searchPlaceholder')}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: textPrimary(isDark) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && hits[0]) {
                      setPaletteOpen(false);
                      router.push(hits[0].href);
                    }
                  }}
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: textMuted(isDark), background: surfaceItem(isDark) }}>
                  Esc
                </kbd>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {searching && (
                  <p className="text-xs px-3 py-2" style={{ color: textMuted(isDark) }}>
                    {t('topbar.searching')}
                  </p>
                )}
                {!searching && query && hits.length === 0 && (
                  <p className="text-xs px-3 py-4 text-center" style={{ color: textMuted(isDark) }}>
                    {t('common.noResults')}
                  </p>
                )}
                {!query && (
                  <p className="text-xs px-3 py-4 text-center" style={{ color: textMuted(isDark) }}>
                    {t('topbar.typeToSearch')}
                  </p>
                )}
                {hits.map((h) => (
                  <button
                    key={`${h.type}-${h.id}`}
                    type="button"
                    className="w-full text-start px-3 py-2.5 rounded-xl flex items-center gap-3"
                    style={{ color: textPrimary(isDark) }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = surfaceHover(isDark);
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                    onClick={() => {
                      setPaletteOpen(false);
                      router.push(h.href);
                    }}
                  >
                    <span
                      className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded"
                      style={{ background: surfaceItem(isDark), color: textMuted(isDark) }}
                    >
                      {h.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{h.name}</p>
                      {(h.boardName || h.role || h.email) && (
                        <p className="text-[11px] truncate" style={{ color: textMuted(isDark) }}>
                          {h.boardName || h.role || h.email}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
