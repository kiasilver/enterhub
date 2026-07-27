import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { emitToChatRoom } from "@/lib/socket-emit";
import { assertChatRoomMember } from "@/lib/chat";

type Ctx = { params: Promise<{ id: string; roomId: string; messageId: string }> };

const schema = z.object({
  emoji: z.string().min(1).max(32),
});

/** POST toggle reaction on a message */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, roomId, messageId } = await ctx.params;
  if (!(await assertChatRoomMember(session.user.id, workspaceId, roomId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const msg = await prisma.chatMessage.findFirst({
    where: { id: messageId, roomId, deletedAt: null },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.chatReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: session.user.id,
        emoji: parsed.data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.chatReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.chatReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji: parsed.data.emoji,
      },
    });
  }

  const reactions = await prisma.chatReaction.findMany({
    where: { messageId },
    select: { emoji: true, userId: true },
  });
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const list = map.get(r.emoji) || [];
    list.push(r.userId);
    map.set(r.emoji, list);
  }
  const payload = {
    messageId,
    roomId,
    reactions: [...map.entries()].map(([emoji, userIds]) => ({
      emoji,
      userIds,
      count: userIds.length,
    })),
  };
  emitToChatRoom(roomId, "chat:reaction", payload);
  return NextResponse.json({ data: payload });
}
