"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useBoardStore } from "@/stores/useBoardStore";

type CardUpdatedPayload = {
  type?: string;
  boardId?: string;
  cards?: Array<{ id: string; listId: string; order: number }>;
};

/**
 * Join `room:board_[id]`, listen for `card-updated`, patch Zustand.
 * Guards against Strict Mode double-mount duplicate bindings.
 *
 * Requires the Socket.io custom server (`npm run dev` → `node server.js`).
 * Plain `next dev` has no /socket.io endpoint — connection fails quietly.
 */
export function useSocket(boardId: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const boundBoardRef = useRef<string | null>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!boardId) return;

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
    const socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      timeout: 8000,
      autoConnect: true,
    });

    socketRef.current = socket;
    boundBoardRef.current = boardId;
    warnedRef.current = false;

    const onConnect = () => {
      warnedRef.current = false;
      socket.emit("board:join", { boardId });
    };

    const onCardUpdated = (payload: CardUpdatedPayload) => {
      if (!payload?.cards?.length) return;
      if (payload.boardId && payload.boardId !== boardId) return;
      // Avoid fighting local optimistic sync mid-drag
      if (useBoardStore.getState().isSyncing) return;
      useBoardStore.getState().applyRemoteCards(payload.cards);
    };

    const onConnectError = (err: Error) => {
      // Avoid Next.js console-error overlay spam when socket server isn't running
      if (warnedRef.current) return;
      warnedRef.current = true;
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[useSocket] Socket unavailable (%s). Use `npm run dev` (custom server) for realtime.",
          err.message,
        );
      }
    };

    socket.on("connect", onConnect);
    socket.on("card-updated", onCardUpdated);
    socket.on("connect_error", onConnectError);

    if (socket.connected) onConnect();

    return () => {
      socket.emit("board:leave", { boardId });
      socket.off("connect", onConnect);
      socket.off("card-updated", onCardUpdated);
      socket.off("connect_error", onConnectError);
      socket.disconnect();
      if (boundBoardRef.current === boardId) {
        boundBoardRef.current = null;
      }
      socketRef.current = null;
    };
  }, [boardId]);

  return socketRef;
}
