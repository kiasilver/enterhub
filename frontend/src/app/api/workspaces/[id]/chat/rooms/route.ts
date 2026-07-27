import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/chat/rooms */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      workspaceId,
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      messages: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myMemberships = await prisma.chatRoomMember.findMany({
    where: {
      userId: session.user.id,
      roomId: { in: rooms.map((r) => r.id) },
    },
  });
  const readMap = new Map(myMemberships.map((m) => [m.roomId, m.lastReadAt]));

  const unreadCounts = await Promise.all(
    rooms.map(async (r) => {
      const lastRead = readMap.get(r.id);
      const count = await prisma.chatMessage.count({
        where: {
          roomId: r.id,
          deletedAt: null,
          authorId: { not: session.user!.id },
          ...(lastRead ? { createdAt: { gt: lastRead } } : {}),
        },
      });
      return [r.id, count] as const;
    }),
  );
  const unreadMap = new Map(unreadCounts);

  const data = rooms.map((r) => {
    const others = r.members.filter((m) => m.userId !== session.user!.id);
    const title =
      r.type === "CHANNEL"
        ? r.name || "Channel"
        : others.map((m) => m.user.name || m.user.email).join(", ") || "Direct";
    const last = r.messages[0] || null;
    return {
      id: r.id,
      type: r.type,
      name: r.name,
      title,
      memberCount: r.members.length,
      members: r.members.map((m) => ({
        userId: m.userId,
        name: m.user.name || m.user.email,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      })),
      lastMessage: last
        ? {
            id: last.id,
            body: last.body,
            createdAt: last.createdAt,
            authorName: last.author.name || last.author.email,
          }
        : null,
      messageCount: r._count.messages,
      unreadCount: unreadMap.get(r.id) || 0,
      updatedAt: r.updatedAt,
    };
  });

  return NextResponse.json({ data });
}

const createSchema = z.object({
  type: z.enum(["DIRECT", "CHANNEL"]).default("CHANNEL"),
  name: z.string().min(1).max(120).optional(),
  memberIds: z.array(z.string().min(1)).max(50).optional(),
});

/** POST create channel or DM */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const memberIds = [...new Set([session.user.id, ...(parsed.data.memberIds || [])])];

  if (parsed.data.type === "CHANNEL" && (!parsed.data.memberIds || parsed.data.memberIds.length === 0)) {
    const all = await prisma.workspaceMember.findMany({
      where: { workspaceId, status: "ACTIVE" },
      select: { userId: true },
    });
    for (const m of all) memberIds.push(m.userId);
  }

  const uniqueMembers = [...new Set(memberIds)];

  if (parsed.data.type === "DIRECT") {
    if (uniqueMembers.length !== 2) {
      return NextResponse.json({ error: "DM needs exactly one other member" }, { status: 400 });
    }
    const existing = await prisma.chatRoom.findMany({
      where: {
        workspaceId,
        type: "DIRECT",
        AND: uniqueMembers.map((uid) => ({ members: { some: { userId: uid } } })),
      },
      include: { members: true },
    });
    const hit = existing.find((r) => r.members.length === 2);
    if (hit) return NextResponse.json({ data: { id: hit.id, existing: true } });
  }

  const room = await prisma.chatRoom.create({
    data: {
      workspaceId,
      type: parsed.data.type,
      name: parsed.data.type === "CHANNEL" ? parsed.data.name || "General" : null,
      members: {
        create: uniqueMembers.map((userId) => ({ userId })),
      },
    },
  });

  return NextResponse.json({ data: { id: room.id } }, { status: 201 });
}
