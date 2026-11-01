import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { emitToChatRoom } from "@/lib/socket-emit";
import {
  assertChatRoomMember,
  messageInclude,
  serializeChatMessage,
} from "@/lib/chat";

type Ctx = { params: Promise<{ id: string; roomId: string }> };

/** GET messages */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, roomId } = await ctx.params;
  if (!(await assertChatRoomMember(session.user.id, workspaceId, roomId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
    take: 300,
    include: {
      ...messageInclude,
      savedBy: {
        where: { userId: session.user.id },
        select: { userId: true },
      },
    },
  });

  // Mark room as read
  await prisma.chatRoomMember.updateMany({
    where: { roomId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });

  const { publishBadgeRefresh } = await import("@/lib/badge-bus");
  publishBadgeRefresh({ workspaceId, userId: session.user.id });

  return NextResponse.json({
    data: messages.map((m) => serializeChatMessage(m, session.user!.id)),
  });
}

const postSchema = z.object({
  body: z.string().min(1).max(8000),
  replyToId: z.string().min(1).optional().nullable(),
  mentionIds: z.array(z.string().min(1)).max(30).optional(),
  entityMentions: z
    .array(
      z.object({
        kind: z.enum(["user", "board", "media"]),
        id: z.string().min(1),
        label: z.string().min(1).max(240),
        url: z.string().max(4000).optional().nullable(),
      }),
    )
    .max(40)
    .optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1).max(240),
        fileUrl: z.string().min(1).max(4000),
        mimeType: z.string().max(120).optional().nullable(),
        sizeBytes: z.number().int().min(0).max(50_000_000).optional(),
      }),
    )
    .max(10)
    .optional(),
});

/** POST message */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, roomId } = await ctx.params;
  if (!(await assertChatRoomMember(session.user.id, workspaceId, roomId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.replyToId) {
    const parent = await prisma.chatMessage.findFirst({
      where: { id: parsed.data.replyToId, roomId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Reply target not found" }, { status: 400 });
    }
  }

  const entityMentions = parsed.data.entityMentions || [];
  const mentionIds = [
    ...new Set([
      ...(parsed.data.mentionIds || []),
      ...entityMentions.filter((e) => e.kind === "user").map((e) => e.id),
    ]),
  ];

  if (mentionIds.length) {
    const ok = await prisma.workspaceMember.count({
      where: {
        workspaceId,
        userId: { in: mentionIds },
        status: "ACTIVE",
      },
    });
    if (ok !== mentionIds.length) {
      return NextResponse.json(
        { error: "Mentions must be workspace members" },
        { status: 400 },
      );
    }
  }

  for (const e of entityMentions) {
    if (e.kind === "board") {
      const board = await prisma.board.findFirst({
        where: { id: e.id, workspaceId, archivedAt: null },
      });
      if (!board) {
        return NextResponse.json({ error: "Invalid project mention" }, { status: 400 });
      }
    }
    if (e.kind === "media") {
      const file = await prisma.mediaAsset.findFirst({
        where: { id: e.id, workspaceId },
      });
      if (!file) {
        return NextResponse.json({ error: "Invalid file mention" }, { status: 400 });
      }
    }
  }

  const attachments = parsed.data.attachments || [];

  const msg = await prisma.chatMessage.create({
    data: {
      roomId,
      authorId: session.user.id,
      body: parsed.data.body.trim(),
      replyToId: parsed.data.replyToId || null,
      entityMentions: entityMentions.length ? entityMentions : undefined,
      mentions: mentionIds.length
        ? { create: mentionIds.map((userId) => ({ userId })) }
        : undefined,
      attachments: attachments.length
        ? {
            create: attachments.map((a) => ({
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              mimeType: a.mimeType || null,
              sizeBytes: a.sizeBytes || 0,
            })),
          }
        : undefined,
    },
    include: {
      ...messageInclude,
      savedBy: { where: { userId: session.user.id }, select: { userId: true } },
    },
  });

  await prisma.chatRoom.update({
    where: { id: roomId },
    data: { updatedAt: new Date() },
  });

  // Persist media assets for gallery / quota tracking
  if (attachments.length) {
    await prisma.mediaAsset.createMany({
      data: attachments.map((a) => ({
        workspaceId,
        uploadedById: session.user!.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        mimeType: a.mimeType || null,
        sizeBytes: a.sizeBytes || 0,
        source: "CHAT" as const,
        sourceRef: roomId,
      })),
    });
  }

  const payload = serializeChatMessage(msg, session.user.id);
  // Broadcast without viewer-scoped isMine — each client derives from author.id
  const { isMine: _isMine, ...broadcast } = payload;
  emitToChatRoom(roomId, "chat:message", { ...broadcast, roomId });

  if (mentionIds.length) {
    try {
      const { notifyUsers } = await import("@/lib/card-permissions");
      const actor =
        session.user.name || session.user.email || "Someone";
      await notifyUsers({
        userIds: mentionIds,
        workspaceId,
        actorId: session.user.id,
        type: "chat.mention",
        title: `${actor} mentioned you in chat`,
        body: parsed.data.body.trim().slice(0, 180),
        href: `/workspace/${workspaceId}/chat?room=${roomId}`,
      });
    } catch (e) {
      console.error("[chat.mention] notify failed", e);
    }
  }

  const { publishBadgeRefresh } = await import("@/lib/badge-bus");
  publishBadgeRefresh({ workspaceId });

  return NextResponse.json({ data: payload }, { status: 201 });
}
