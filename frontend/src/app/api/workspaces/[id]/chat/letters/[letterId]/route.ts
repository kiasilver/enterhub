import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string; letterId: string }> };

/** PATCH mark read / close */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, letterId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const letter = await prisma.workspaceLetter.findFirst({
    where: { id: letterId, workspaceId },
  });
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canAccess =
    letter.toUserId === session.user.id ||
    letter.fromUserId === session.user.id ||
    (await hasPermission(session.user.id, workspaceId, "letter:read_all"));
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    read?: boolean;
    status?: "OPEN" | "REPLIED" | "CLOSED";
  };

  const updated = await prisma.workspaceLetter.update({
    where: { id: letterId },
    data: {
      ...(body.read ? { readAt: new Date() } : {}),
      ...(body.status ? { status: body.status } : {}),
    },
  });

  return NextResponse.json({ data: updated });
}

/** GET single letter — auth check */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, letterId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const letter = await prisma.workspaceLetter.findFirst({
    where: { id: letterId, workspaceId },
    include: {
      fromUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      toUser: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          fromUser: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });
  if (!letter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canAccess =
    letter.toUserId === session.user.id ||
    letter.fromUserId === session.user.id ||
    (await hasPermission(session.user.id, workspaceId, "letter:read_all"));
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (letter.toUserId === session.user.id && !letter.readAt) {
    await prisma.workspaceLetter.update({
      where: { id: letter.id },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ data: letter });
}
