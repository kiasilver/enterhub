/**
 * Custom Node server wrapping Next.js + Socket.io
 * Usage: node server.js  (or npm run start:socket)
 *
 * Clients join rooms via: socket.emit('board:join', { boardId })
 * Room name: room:board_[id]
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Expose for API route emitters (same process)
  global.io = io;

  io.on("connection", (socket) => {
    socket.on("board:join", (payload = {}) => {
      const boardId = payload.boardId;
      if (!boardId || typeof boardId !== "string") return;
      const room = `room:board_${boardId}`;
      socket.join(room);
    });

    socket.on("board:leave", (payload = {}) => {
      const boardId = payload.boardId;
      if (!boardId || typeof boardId !== "string") return;
      socket.leave(`room:board_${boardId}`);
    });

    socket.on("chat:join", (payload = {}) => {
      const roomId = payload.roomId;
      if (!roomId || typeof roomId !== "string") return;
      socket.join(`room:chat_${roomId}`);
    });

    socket.on("chat:leave", (payload = {}) => {
      const roomId = payload.roomId;
      if (!roomId || typeof roomId !== "string") return;
      socket.leave(`room:chat_${roomId}`);
    });

    socket.on("workspace:join", (payload = {}) => {
      const workspaceId = payload.workspaceId;
      if (!workspaceId || typeof workspaceId !== "string") return;
      socket.join(`room:ws_${workspaceId}`);
    });

    socket.on("presence:set", (payload = {}) => {
      const workspaceId = payload.workspaceId;
      const status = payload.status;
      const userId = payload.userId;
      if (
        !workspaceId ||
        typeof workspaceId !== "string" ||
        !status ||
        typeof status !== "string"
      ) {
        return;
      }
      socket.data.presence = { workspaceId, status, userId };
      io.to(`room:ws_${workspaceId}`).emit("presence:update", {
        userId,
        status,
        socketId: socket.id,
      });
    });

    socket.on("chat:typing", (payload = {}) => {
      const roomId = payload.roomId;
      const userId = payload.userId;
      const name = payload.name;
      if (!roomId || typeof roomId !== "string") return;
      socket.to(`room:chat_${roomId}`).emit("chat:typing", {
        roomId,
        userId,
        name,
      });
    });

    // ─── HD Meetings (WebRTC signaling) ─────────────────────────────
    socket.on("meeting:join", (payload = {}) => {
      const meetingId = payload.meetingId;
      const user = payload.user;
      if (!meetingId || typeof meetingId !== "string") return;
      const room = `room:meeting_${meetingId}`;
      socket.join(room);
      socket.data.meeting = {
        meetingId,
        userId: user?.id || null,
        name: user?.name || "Guest",
        avatarUrl: user?.avatarUrl || null,
      };
      const peers = [];
      for (const [, s] of io.of("/").sockets) {
        if (
          s.id !== socket.id &&
          s.data?.meeting?.meetingId === meetingId
        ) {
          peers.push({
            socketId: s.id,
            userId: s.data.meeting.userId,
            name: s.data.meeting.name,
            avatarUrl: s.data.meeting.avatarUrl,
          });
        }
      }
      socket.emit("meeting:peers", { meetingId, peers });
      socket.to(room).emit("meeting:peer-joined", {
        meetingId,
        peer: {
          socketId: socket.id,
          userId: user?.id || null,
          name: user?.name || "Guest",
          avatarUrl: user?.avatarUrl || null,
        },
      });
    });

    socket.on("meeting:leave", (payload = {}) => {
      const meetingId =
        payload.meetingId || socket.data?.meeting?.meetingId;
      if (!meetingId) return;
      const room = `room:meeting_${meetingId}`;
      socket.to(room).emit("meeting:peer-left", {
        meetingId,
        socketId: socket.id,
      });
      socket.leave(room);
      socket.data.meeting = null;
    });

    socket.on("meeting:signal", (payload = {}) => {
      const { to, signal, meetingId } = payload;
      if (!to || !signal) return;
      io.to(to).emit("meeting:signal", {
        from: socket.id,
        meetingId,
        signal,
        user: socket.data?.meeting
          ? {
              userId: socket.data.meeting.userId,
              name: socket.data.meeting.name,
              avatarUrl: socket.data.meeting.avatarUrl,
            }
          : null,
      });
    });

    socket.on("meeting:state", (payload = {}) => {
      const meetingId =
        payload.meetingId || socket.data?.meeting?.meetingId;
      if (!meetingId) return;
      socket.to(`room:meeting_${meetingId}`).emit("meeting:state", {
        socketId: socket.id,
        meetingId,
        audio: !!payload.audio,
        video: !!payload.video,
        screen: !!payload.screen,
        screenQuality: payload.screenQuality || null,
      });
    });

    socket.on("disconnect", (reason) => {
      const m = socket.data.meeting;
      if (m?.meetingId) {
        io.to(`room:meeting_${m.meetingId}`).emit("meeting:peer-left", {
          meetingId: m.meetingId,
          socketId: socket.id,
        });
      }
      const p = socket.data.presence;
      if (p?.workspaceId && p?.userId) {
        // Only mark offline if no other sockets for this user in the workspace
        let stillOnline = false;
        for (const [, s] of io.of("/").sockets) {
          if (
            s.id !== socket.id &&
            s.data?.presence?.userId === p.userId &&
            s.data?.presence?.workspaceId === p.workspaceId
          ) {
            stillOnline = true;
            break;
          }
        }
        if (!stillOnline) {
          io.to(`room:ws_${p.workspaceId}`).emit("presence:update", {
            userId: p.userId,
            status: "offline",
            socketId: socket.id,
          });
        }
      }
      if (dev) console.log("[socket] disconnect", socket.id, reason);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port} (Next + Socket.io)`);
  });
});
