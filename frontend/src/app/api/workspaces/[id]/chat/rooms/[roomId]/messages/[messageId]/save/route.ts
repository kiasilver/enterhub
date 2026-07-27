import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { assertChatRoomMember } from "@/lib/chat";

type Ctx = { params: Promise<{ id: string; roomId: string; messageId: string }> };

/** POST save message / DELETE unsave */
export async function POST(_req: Request, ctx: Ctx) {
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
    where: { id: messageId, roomId },
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.savedChatMessage.upsert({
    where: {
      userId_messageId: { userId: session.user.id, messageId },
    },
    create: {
      workspaceId,
      userId: session.user.id,
      messageId,
    },
    update: {},
  });
  return NextResponse.json({ ok: true, saved: true });
}

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
  await prisma.savedChatMessage.deleteMany({
    where: { userId: session.user.id, messageId, workspaceId },
  });
  return NextResponse.json({ ok: true, saved: false });
}
