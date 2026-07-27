import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { serializeChatMessage, messageInclude } from "@/lib/chat";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/chat/saved */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.savedChatMessage.findMany({
    where: { workspaceId, userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      message: {
        include: {
          ...messageInclude,
          room: { select: { id: true, name: true, type: true } },
          savedBy: {
            where: { userId: session.user.id },
            select: { userId: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    data: rows.map((r) => ({
      savedAt: r.createdAt,
      room: {
        id: r.message.room.id,
        name: r.message.room.name,
        type: r.message.room.type,
      },
      message: serializeChatMessage(r.message, session.user!.id),
    })),
  });
}
