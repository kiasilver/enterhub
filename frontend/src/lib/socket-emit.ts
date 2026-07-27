/**
 * Socket emit bridge used by API routes.
 * In production, prefer Redis adapter + dedicated socket process.
 * When `global.io` is set by server.js, emit to board rooms.
 */

type ServerLike = {
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
};

declare global {
  // eslint-disable-next-line no-var
  var io: ServerLike | undefined;
}

export function emitToBoardRoom(boardId: string, event: string, payload: unknown): void {
  try {
    const io = global.io;
    if (!io) return;
    io.to(`room:board_${boardId}`).emit(event, payload);
  } catch (err) {
    console.error("[socket-emit] failed", err);
  }
}

export function emitToChatRoom(roomId: string, event: string, payload: unknown): void {
  try {
    const io = global.io;
    if (!io) return;
    io.to(`room:chat_${roomId}`).emit(event, payload);
  } catch (err) {
    console.error("[socket-emit] chat failed", err);
  }
}

export function emitToWorkspaceRoom(
  workspaceId: string,
  event: string,
  payload: unknown,
): void {
  try {
    const io = global.io;
    if (!io) return;
    io.to(`room:ws_${workspaceId}`).emit(event, payload);
  } catch (err) {
    console.error("[socket-emit] workspace failed", err);
  }
}
