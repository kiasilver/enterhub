import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertChatRoomMember } from "@/lib/chat";

type Ctx = { params: Promise<{ id: string; roomId: string }> };

/** POST — bump lastReadAt while viewing a live room (badge accuracy) */
export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, roomId } = await ctx.params;
  if (!(await assertChatRoomMember(session.user.id, workspaceId, roomId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.chatRoomMember.updateMany({
    where: { roomId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });

  const { publishBadgeRefresh } = await import("@/lib/badge-bus");
  publishBadgeRefresh({ workspaceId, userId: session.user.id });

  return NextResponse.json({ ok: true });
}
