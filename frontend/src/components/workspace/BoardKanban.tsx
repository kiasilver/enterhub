'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Filter, Plus, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import { WorkTimerBadge } from '@/components/ui/WorkTimerBadge';
import {
  textPrimary,
  textSecondary,
  textMuted,
  borderSubtle,
  glassStyle,
  surfaceItem,
} from '@/components/SafeDashboard/theme';
import { useBoardStore } from '@/stores/useBoardStore';
import { useSocket } from '@/hooks/useSocket';
import { useLang } from '@/components/LanguageProvider/LanguageProvider';
import { localizeListTitle } from '@/lib/list-i18n';
import type { GuestAccessLevel } from '@prisma/client';

const STARRED_KEY = 'enterhub-starred-boards';

type CardMeta = {
  assigneeIds: string[];
  dueDate: string | null;
  priority?: string;
  checklistDone?: number;
  checklistTotal?: number;
  labels?: { id: string; name: string; color: string }[];
  workflowStatus?: string;
  startedAt?: string | null;
};

type Props = {
  boardId: string;
  workspaceId: string;
  readOnly?: boolean;
  guestLevel?: GuestAccessLevel | string;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function readStarred(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function BoardKanban({ boardId, workspaceId, readOnly, guestLevel }: Props) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [error, setError] = useState<string | null>(null);
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [myCardsOnly, setMyCardsOnly] = useState(false);
  const [dueThisWeek, setDueThisWeek] = useState(false);
  const [starred, setStarred] = useState(false);
  const [cardMeta, setCardMeta] = useState<Record<string, CardMeta>>({});
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const hydrate = useBoardStore((s) => s.hydrate);
  const setBoardContext = useBoardStore((s) => s.setBoardContext);
  const lists = useBoardStore((s) => s.lists);
  const cardsById = useBoardStore((s) => s.cardsById);
  const onDragEnd = useBoardStore((s) => s.onDragEnd);
  const isSyncing = useBoardStore((s) => s.isSyncing);

  useSocket(boardId);

  useEffect(() => {
    setStarred(readStarred().includes(boardId));
  }, [boardId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/cards`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load board');
      setBoardContext(boardId, workspaceId);
      const listsData = (json.data.lists || []).map(
        (l: { id: string; title: string; order: number; cardIds: string[] }) => ({
          id: l.id,
          title: l.title,
          order: l.order,
          cardIds: l.cardIds,
        })
      );
      const cards = (json.data.cards || []).map(
        (c: {
          id: string;
          listId: string;
          title: string;
          order: number;
          dueDate?: string | null;
          assignees?: Array<{ userId: string }>;
        }) => ({
          id: c.id,
          listId: c.listId,
          title: c.title,
          order: c.order,
        })
      );
      const meta: Record<string, CardMeta> = {};
      for (const c of json.data.cards || []) {
        const items = c.checklistItems || [];
        meta[c.id] = {
          assigneeIds: (c.assignees || []).map((a: { userId: string }) => a.userId),
          dueDate: c.dueDate ?? null,
          priority: c.priority,
          checklistDone: items.filter((i: { isDone: boolean }) => i.isDone).length,
          checklistTotal: items.length,
          workflowStatus: c.workflowStatus,
          startedAt: c.startedAt ?? null,
          labels: (c.labels || [])
            .map(
              (row: { label?: { id: string; name: string; color: string } }) =>
                row.label,
            )
            .filter(Boolean) as { id: string; name: string; color: string }[],
        };
      }
      setCardMeta(meta);
      hydrate(listsData, cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [boardId, workspaceId, hydrate, setBoardContext]);

  useEffect(() => {
    void load();
  }, [load]);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekEnd = useMemo(() => endOfWeek(new Date()), []);

  function cardPassesFilter(cardId: string) {
    const meta = cardMeta[cardId];
    if (myCardsOnly) {
      if (!userId || !meta?.assigneeIds.includes(userId)) return false;
    }
    if (dueThisWeek) {
      if (!meta?.dueDate) return false;
      const d = new Date(meta.dueDate);
      if (Number.isNaN(d.getTime()) || d < weekStart || d > weekEnd) return false;
    }
    return true;
  }

  function toggleStar() {
    const current = readStarred();
    const next = starred
      ? current.filter((id) => id !== boardId)
      : [...new Set([...current, boardId])];
    localStorage.setItem(STARRED_KEY, JSON.stringify(next));
    setStarred(!starred);
  }

  async function handleDragEnd(result: DropResult) {
    if (readOnly) return;
    await onDragEnd(result);
  }

  async function addCard(listId: string) {
    if (readOnly) return;
    const title = (newTitles[listId] || '').trim();
    if (!title) return;
    const res = await fetch(`/api/boards/${boardId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, title }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || 'Create failed');
      return;
    }
    setNewTitles((t) => ({ ...t, [listId]: '' }));
    await load();
  }

  const filterActive = myCardsOnly || dueThisWeek;

  if (loading) {
    return <p style={{ color: textMuted(isDark) }}>{t('board.loadingBoard')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm" style={{ color: textSecondary(isDark) }}>
          {t('board.dragHint')} {isSyncing ? `· ${t('board.syncing')}` : ''}
          {readOnly ? ` · ${t('board.readOnlySuffix')}` : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            onClick={toggleStar}
            aria-pressed={starred}
          >
            <Star
              size={14}
              fill={starred ? 'currentColor' : 'none'}
              style={{ color: starred ? '#eab308' : undefined }}
            />
            {starred ? t('board.starred') : t('board.star')}
          </GlassButton>
          <GlassButton
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            onClick={() => setMyCardsOnly((v) => !v)}
            aria-pressed={myCardsOnly}
            style={
              myCardsOnly
                ? { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }
                : undefined
            }
          >
            <Filter size={12} />
            {t('board.myCards')}
          </GlassButton>
          <GlassButton
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            onClick={() => setDueThisWeek((v) => !v)}
            aria-pressed={dueThisWeek}
            style={
              dueThisWeek
                ? { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }
                : undefined
            }
          >
            {t('board.dueThisWeek')}
          </GlassButton>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 items-start min-w-0">
          {lists.map((list) => {
            const visibleIds = filterActive
              ? list.cardIds.filter(cardPassesFilter)
              : list.cardIds;
            return (
              <div
                key={list.id}
                className="w-[min(18rem,calc(100vw-3rem))] sm:w-72 flex-shrink-0 rounded-2xl p-3"
                style={{
                  ...glassStyle(isDark),
                  borderRadius: 16,
                }}
              >
                <h3
                  className="font-semibold text-sm mb-3 px-1"
                  style={{ color: textPrimary(isDark) }}
                >
                  {localizeListTitle(list.title, t)}
                  <span className="ms-2 text-xs font-normal" style={{ color: textMuted(isDark) }}>
                    {visibleIds.length}
                    {filterActive && visibleIds.length !== list.cardIds.length
                      ? ` / ${list.cardIds.length}`
                      : ''}
                  </span>
                </h3>

                <Droppable droppableId={list.id} isDropDisabled={readOnly || filterActive}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[40px]"
                    >
                      {(filterActive ? visibleIds : list.cardIds).map((cid, index) => {
                        const card = cardsById[cid];
                        if (!card) return null;
                        return (
                          <Draggable
                            key={cid}
                            draggableId={cid}
                            index={index}
                            isDragDisabled={readOnly || filterActive}
                          >
                            {(drag) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                role="button"
                                tabIndex={0}
                                onClick={() => setOpenCardId(cid)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setOpenCardId(cid);
                                  }
                                }}
                                className="p-3 rounded-xl text-sm shadow-sm cursor-pointer space-y-2"
                                style={{
                                  ...drag.draggableProps.style,
                                  background: surfaceItem(isDark),
                                  border: `1px solid ${borderSubtle(isDark)}`,
                                  color: textPrimary(isDark),
                                }}
                              >
                                <p className="font-medium leading-snug">{card.title}</p>
                                {(() => {
                                  const m = cardMeta[cid];
                                  if (!m) return null;
                                  const pct =
                                    m.checklistTotal && m.checklistTotal > 0
                                      ? Math.round(
                                          ((m.checklistDone || 0) / m.checklistTotal) * 100,
                                        )
                                      : 0;
                                  return (
                                    <>
                                      {m.labels && m.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {m.labels.slice(0, 3).map((l) => (
                                            <span
                                              key={l.id}
                                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
                                              style={{ background: l.color }}
                                            >
                                              {l.name}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      {m.checklistTotal != null && m.checklistTotal > 0 && (
                                        <div>
                                          <div
                                            className="flex justify-between text-[10px] mb-0.5"
                                            style={{ color: textMuted(isDark) }}
                                          >
                                            <span>
                                              {m.checklistDone}/{m.checklistTotal}
                                            </span>
                                            <span>{pct}%</span>
                                          </div>
                                          <div
                                            className="h-1 rounded-full overflow-hidden"
                                            style={{
                                              background: isDark
                                                ? 'rgba(255,255,255,0.1)'
                                                : 'rgba(0,0,0,0.08)',
                                            }}
                                          >
                                            <div
                                              className="h-full rounded-full"
                                              style={{
                                                width: `${pct}%`,
                                                background: '#14b8a6',
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      {m.dueDate && (
                                        <p
                                          className="text-[10px] font-semibold inline-flex items-center gap-1.5"
                                          style={{
                                            color:
                                              m.workflowStatus !== 'APPROVED' &&
                                              new Date(m.dueDate).getTime() < Date.now()
                                                ? '#f87171'
                                                : textSecondary(isDark),
                                          }}
                                        >
                                          {new Date(m.dueDate).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                          {m.workflowStatus !== 'APPROVED' &&
                                            new Date(m.dueDate).getTime() < Date.now() && (
                                              <span
                                                className="font-bold px-1 py-0.5 rounded"
                                                style={{
                                                  background: 'rgba(239,68,68,0.15)',
                                                  border: '1px solid rgba(239,68,68,0.35)',
                                                }}
                                              >
                                                Delayed
                                              </span>
                                            )}
                                        </p>
                                      )}
                                      <WorkTimerBadge
                                        startedAt={m.startedAt}
                                        workflowStatus={m.workflowStatus}
                                        size="sm"
                                      />
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {!readOnly && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newTitles[list.id] || ''}
                      onChange={(e) =>
                        setNewTitles((t) => ({ ...t, [list.id]: e.target.value }))
                      }
                      placeholder={t('board.addCardPlaceholder')}
                      className="flex-1 px-2 py-1.5 rounded-lg text-sm outline-none"
                      style={{
                        border: `1px solid ${borderSubtle(isDark)}`,
                        background: isDark ? 'var(--surface)' : 'rgba(255,255,255,0.9)',
                        color: textPrimary(isDark),
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void addCard(list.id);
                      }}
                    />
                    <GlassButton
                      type="button"
                      className="p-2 rounded-lg"
                      onClick={() => void addCard(list.id)}
                    >
                      <Plus size={14} />
                    </GlassButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {openCardId && (
        <CardDetailsModal
          boardId={boardId}
          cardId={openCardId}
          open={Boolean(openCardId)}
          onClose={() => {
            setOpenCardId(null);
            void load();
          }}
          onChanged={() => {
            void load();
          }}
          onDeleted={() => {
            setOpenCardId(null);
            void load();
          }}
          readOnly={readOnly}
          isGuest={Boolean(guestLevel)}
        />
      )}
    </div>
  );
}
