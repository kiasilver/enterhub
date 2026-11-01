import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { emitToChatRoom } from "@/lib/socket-emit";
import {
  assertChatRoomMember,
  messageInclude,
  serializeChatMessage,
} from "@/lib/chat";
import { retentionPurgeAfter } from "@/lib/platform-settings";

type Ctx = { params: Promise<{ id: string; roomId: string; messageId: string }> };

/** DELETE — soft-delete message (+ attachments) with 6-day purge window */
export async function DELETE(_req: Request, ctx: Ctx) {
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
  if (!msg) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (msg.authorId !== session.user.id && !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const purgeAfter = retentionPurgeAfter(now);

  await prisma.$transaction([
    prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: now, purgeAfter },
    }),
    prisma.chatAttachment.updateMany({
      where: { messageId, deletedAt: null },
      data: { deletedAt: now, purgeAfter },
    }),
  ]);

  const updated = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    include: {
      ...messageInclude,
      savedBy: { where: { userId: session.user.id }, select: { userId: true } },
    },
  });
  if (updated) {
    const payload = serializeChatMessage(updated, session.user.id);
    const { isMine: _isMine, ...broadcast } = payload;
    emitToChatRoom(roomId, "chat:message", { ...broadcast, roomId, softDeleted: true });
  }

  return NextResponse.json({ data: { ok: true } });
}
