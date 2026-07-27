import { create } from "zustand";
import type { DropResult } from "@hello-pangea/dnd";

export type BoardCard = {
  id: string;
  listId: string;
  title: string;
  order: number;
};

export type BoardList = {
  id: string;
  title: string;
  order: number;
  cardIds: string[];
};

type Snapshot = {
  lists: BoardList[];
  cardsById: Record<string, BoardCard>;
};

type BoardState = Snapshot & {
  boardId: string | null;
  workspaceId: string | null;
  isSyncing: boolean;
  setBoardContext: (boardId: string, workspaceId: string) => void;
  hydrate: (lists: BoardList[], cards: BoardCard[]) => void;
  /** Apply remote socket payload without triggering API. */
  applyRemoteCards: (cards: Array<{ id: string; listId: string; order: number }>) => void;
  onDragEnd: (result: DropResult) => Promise<void>;
};

function reindexOrders(list: BoardList, cardsById: Record<string, BoardCard>): BoardCard[] {
  return list.cardIds.map((id, index) => {
    const card = cardsById[id];
    return { ...card, listId: list.id, order: index };
  });
}

function cloneSnapshot(state: Snapshot): Snapshot {
  return {
    lists: state.lists.map((l) => ({ ...l, cardIds: [...l.cardIds] })),
    cardsById: Object.fromEntries(
      Object.entries(state.cardsById).map(([k, v]) => [k, { ...v }])
    ),
  };
}

async function syncReorder(
  workspaceId: string,
  boardId: string,
  cards: BoardCard[]
): Promise<void> {
  const res = await fetch("/api/cards/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspaceId,
      boardId,
      cards: cards.map((c) => ({ id: c.id, listId: c.listId, order: c.order })),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Reorder failed (${res.status})`);
  }
}

/**
 * Kanban store with optimistic DnD + rollback.
 * Keep selectors narrow in components to avoid re-render storms.
 */
export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  workspaceId: null,
  lists: [],
  cardsById: {},
  isSyncing: false,

  setBoardContext: (boardId, workspaceId) => set({ boardId, workspaceId }),

  hydrate: (lists, cards) => {
    const cardsById: Record<string, BoardCard> = {};
    for (const c of cards) cardsById[c.id] = c;
    set({ lists, cardsById });
  },

  applyRemoteCards: (updates) => {
    set((state) => {
      const cardsById = { ...state.cardsById };
      const lists = state.lists.map((l) => ({ ...l, cardIds: [] as string[] }));
      const listIndex = new Map(lists.map((l, i) => [l.id, i]));

      for (const u of updates) {
        const prev = cardsById[u.id];
        if (!prev) continue;
        cardsById[u.id] = { ...prev, listId: u.listId, order: u.order };
      }

      const all = Object.values(cardsById).sort((a, b) => a.order - b.order);
      for (const c of all) {
        const idx = listIndex.get(c.listId);
        if (idx === undefined) continue;
        lists[idx].cardIds.push(c.id);
      }

      return { lists, cardsById };
    });
  },

  onDragEnd: async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const { boardId, workspaceId } = get();
    if (!boardId || !workspaceId) return;

    const before = cloneSnapshot(get());

    // --- Optimistic local update ---
    set((state) => {
      const lists = state.lists.map((l) => ({ ...l, cardIds: [...l.cardIds] }));
      const cardsById = { ...state.cardsById };

      const sourceList = lists.find((l) => l.id === source.droppableId);
      const destList = lists.find((l) => l.id === destination.droppableId);
      if (!sourceList || !destList) return state;

      sourceList.cardIds.splice(source.index, 1);
      destList.cardIds.splice(destination.index, 0, draggableId);

      const touched = new Set([sourceList.id, destList.id]);
      for (const list of lists) {
        if (!touched.has(list.id)) continue;
        for (const updated of reindexOrders(list, cardsById)) {
          cardsById[updated.id] = updated;
        }
      }

      return { lists, cardsById, isSyncing: true };
    });

    const cards = Object.values(get().cardsById);

    try {
      await syncReorder(workspaceId, boardId, cards);
      set({ isSyncing: false });
    } catch (err) {
      console.error("[useBoardStore] reorder failed — rolling back", err);
      set({ ...before, isSyncing: false });
    }
  },
}));
