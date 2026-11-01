'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Filter, Plus, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';
import GlassButton from '@/components/SafeDashboard/GlassButton';
import { CardDetailsModal } from '@/components/board/CardDetailsModal';
import { CreateTaskModal } from '@/components/board/CreateTaskModal';
import { RichTaskCard, type RichTaskCardData } from '@/components/board/RichTaskCard';
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
import { localizedDepartmentLabel } from '@/lib/department-i18n';
import { localizeListTitle } from '@/lib/list-i18n';
import type { GuestAccessLevel } from '@prisma/client';
import type { DeptPerson } from '@/components/departments/department-types';

const STARRED_KEY = 'enterhub-starred-boards';

type CardMeta = RichTaskCardData & {
  assigneeIds: string[];
};

type BoardPerson = {
  id: string;
  name: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

type Props = {
  boardId: string;
  workspaceId: string;
  boardName?: string;
  visibility?: 'PRIVATE' | 'WORKSPACE' | 'PUBLIC' | string;
  department?: { id: string; key: string; name: string } | null;
  from?: string | null;
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

function asPerson(p?: BoardPerson | null): DeptPerson | null {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    email: p.email || '',
    avatarUrl: p.avatarUrl ?? null,
  };
}

export function BoardKanban({
  boardId,
  workspaceId,
  boardName,
  visibility,
  department,
  from,
  readOnly,
  guestLevel,
}: Props) {
  const { theme } = useTheme();
  const { t } = useLang();
  const isDark = theme === 'dark';
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myCardsOnly, setMyCardsOnly] = useState(false);
  const [dueThisWeek, setDueThisWeek] = useState(false);
  const [starred, setStarred] = useState(false);
  const [cardMeta, setCardMeta] = useState<Record<string, CardMeta>>({});
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [createListId, setCreateListId] = useState<string | null>(null);

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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
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
        }),
      );
      const cards = (json.data.cards || []).map(
        (c: {
          id: string;
          listId: string;
          title: string;
          order: number;
        }) => ({
          id: c.id,
          listId: c.listId,
          title: c.title,
          order: c.order,
        }),
      );
      const meta: Record<string, CardMeta> = {};
      for (const c of json.data.cards || []) {
        const assigneeRows = (c.assignees || []) as Array<{
          userId?: string;
          user?: BoardPerson;
        }>;
        const assignees = assigneeRows
          .map((a) => asPerson(a.user || (a.userId ? { id: a.userId, name: null } : null)))
          .filter((p): p is DeptPerson => Boolean(p));
        meta[c.id] = {
          id: c.id,
          title: c.title,
          description: c.description ?? null,
          dueDate: c.dueDate ?? null,
          priority: c.priority,
          workflowStatus: c.workflowStatus,
          startedAt: c.startedAt ?? null,
          labels: (c.labels || [])
            .map(
              (row: { label?: { id: string; name: string; color: string } }) =>
                row.label,
            )
            .filter(Boolean) as { id: string; name: string; color: string }[],
          assignees,
          supervisor: asPerson(c.supervisor),
          createdBy: asPerson(c.createdBy),
          checklistItems: (c.checklistItems || []).map(
            (i: {
              id: string;
              title: string;
              isDone: boolean;
              description?: string | null;
            }) => ({
              id: i.id,
              title: i.title,
              isDone: i.isDone,
              description: i.description ?? null,
            }),
          ),
          commentCount: c._count?.comments ?? c.comments?.length ?? 0,
          attachmentCount: c._count?.attachments ?? c.attachments?.length ?? 0,
          assigneeIds: assigneeRows
            .map((a) => a.userId || a.user?.id)
            .filter((id): id is string => Boolean(id)),
        };
      }
      setCardMeta(meta);
      hydrate(listsData, cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      if (!opts?.silent) setLoading(false);
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

  const filterActive = myCardsOnly || dueThisWeek;
  const deptSlug = department?.id || 'general';
  const boardsHome = `/workspace/${workspaceId}/boards?view=list&mode=kanban`;
  const sectionHref = `/workspace/${workspaceId}/departments/${deptSlug}?from=${encodeURIComponent(from || boardsHome)}`;
  const sectionLabel = localizedDepartmentLabel(
    t,
    department?.key ?? 'general',
    department?.name,
  );
  const visibilityLabel =
    visibility === 'PRIVATE'
      ? t('projectsPage.accessPrivate')
      : visibility === 'PUBLIC'
        ? t('board.visibilityShare')
        : t('projectsPage.accessPublic');

  if (loading && lists.length === 0) {
    return <p style={{ color: textMuted(isDark) }}>{t('board.loadingBoard')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <nav
            className="flex flex-wrap items-center gap-1.5 text-sm font-semibold"
            style={{ color: textPrimary(isDark) }}
            aria-label={t('projectsPage.sectionBreadcrumb')}
          >
            <Link
              href={sectionHref}
              className="hover:underline underline-offset-2"
              style={{ color: textSecondary(isDark) }}
            >
              {sectionLabel}
            </Link>
            <span style={{ color: textMuted(isDark) }} aria-hidden>
              →
            </span>
            <span className="truncate">{boardName || t('board.kanban')}</span>
            {visibility && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background:
                    visibility === 'PRIVATE'
                      ? isDark
                        ? 'rgba(245,158,11,0.2)'
                        : 'rgba(245,158,11,0.14)'
                      : isDark
                        ? 'rgba(20,184,166,0.2)'
                        : 'rgba(20,184,166,0.12)',
                  color: visibility === 'PRIVATE' ? '#f59e0b' : '#14b8a6',
                }}
              >
                {visibilityLabel}
              </span>
            )}
          </nav>
          <p className="text-sm" style={{ color: textSecondary(isDark) }}>
            {t('board.dragHint')} {isSyncing ? `· ${t('board.syncing')}` : ''}
            {readOnly ? ` · ${t('board.readOnlySuffix')}` : ''}
          </p>
        </div>
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
                className="w-[min(20rem,calc(100vw-3rem))] sm:w-80 flex-shrink-0 rounded-2xl p-3"
                style={{
                  ...glassStyle(isDark),
                  borderRadius: 16,
                }}
              >
                <h3
                  className="font-semibold text-sm mb-3 px-1 flex items-center justify-between gap-2"
                  style={{ color: textPrimary(isDark) }}
                >
                  <span className="min-w-0 truncate">{localizeListTitle(list.title, t)}</span>
                  <span className="text-xs font-normal tabular-nums shrink-0" style={{ color: textMuted(isDark) }}>
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
                        const rich = cardMeta[cid];
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
                                style={drag.draggableProps.style}
                              >
                                <RichTaskCard
                                  card={{
                                    ...(rich || { id: card.id, title: card.title }),
                                    title: card.title,
                                    listTitle: undefined,
                                  }}
                                  cardBg={surfaceItem(isDark)}
                                  isDark={isDark}
                                  workspaceId={workspaceId}
                                  departmentId={department?.id}
                                  onOpen={() => setOpenCardId(cid)}
                                />
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
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      border: `1px dashed ${borderSubtle(isDark)}`,
                      color: textSecondary(isDark),
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
                    }}
                    onClick={() => setCreateListId(list.id)}
                  >
                    <Plus size={14} />
                    {t('board.newTask')}
                  </button>
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
          onClose={() => setOpenCardId(null)}
          onChanged={() => {
            void load({ silent: true });
          }}
          onDeleted={() => {
            if (openCardId) useBoardStore.getState().removeCard(openCardId);
            setOpenCardId(null);
          }}
          readOnly={readOnly}
          isGuest={Boolean(guestLevel)}
        />
      )}

      <CreateTaskModal
        workspaceId={workspaceId}
        isDark={isDark}
        open={Boolean(createListId)}
        initialBoardId={boardId}
        initialListId={createListId}
        lockBoard
        onClose={() => setCreateListId(null)}
        onCreated={async () => {
          setCreateListId(null);
          await load({ silent: true });
        }}
      />
    </div>
  );
}
