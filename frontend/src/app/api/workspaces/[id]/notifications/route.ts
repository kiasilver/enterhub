import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/notifications */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "1";

  const rows = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      workspaceId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, workspaceId, readAt: null },
  });

  return NextResponse.json({
    data: {
      unreadCount,
      items: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        boardId: n.boardId,
        cardId: n.cardId,
        readAt: n.readAt,
        createdAt: n.createdAt,
        actor: n.actor,
        href:
          n.href ||
          (n.calendarEventId
            ? `/workspace/${workspaceId}/calendar?event=${n.calendarEventId}`
            : n.boardId
              ? `/board/${n.boardId}`
              : undefined),
        calendarEventId: n.calendarEventId,
      })),
    },
  });
}

/** PATCH — mark read (all or by ids) */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z
    .object({
      ids: z.array(z.string()).optional(),
      all: z.boolean().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      workspaceId,
      readAt: null,
      ...(body.data.all ? {} : { id: { in: body.data.ids || [] } }),
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ data: { ok: true } });
}
