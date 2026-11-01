import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { emitToWorkspaceRoom } from "@/lib/socket-emit";

type Ctx = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

/** GET letters — inbox + sent (or all if letter:read_all) */
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
  const box = url.searchParams.get("box") || "inbox";
  const canReadAll = await hasPermission(
    session.user.id,
    workspaceId,
    "letter:read_all",
  );
  const canSend = await hasPermission(session.user.id, workspaceId, "letter:send");

  const where =
    canReadAll && box === "all"
      ? { workspaceId, parentId: null }
      : box === "sent"
        ? { workspaceId, fromUserId: session.user.id, parentId: null }
        : {
            workspaceId,
            toUserId: session.user.id,
            parentId: null,
          };

  const letters = await prisma.workspaceLetter.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      fromUser: { select: userSelect },
      toUser: { select: userSelect },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          fromUser: { select: userSelect },
          toUser: { select: userSelect },
        },
      },
    },
  });

  return NextResponse.json({
    data: letters.map((l) => ({
      id: l.id,
      type: l.type,
      status: l.status,
      subject: l.subject,
      body: l.body,
      createdAt: l.createdAt,
      readAt: l.readAt,
      from: {
        id: l.fromUser.id,
        name: l.fromUser.name || l.fromUser.email,
        email: l.fromUser.email,
        avatarUrl: l.fromUser.avatarUrl,
      },
      to: {
        id: l.toUser.id,
        name: l.toUser.name || l.toUser.email,
        email: l.toUser.email,
        avatarUrl: l.toUser.avatarUrl,
      },
      replies: l.replies.map((r) => ({
        id: r.id,
        subject: r.subject,
        body: r.body,
        createdAt: r.createdAt,
        from: {
          id: r.fromUser.id,
          name: r.fromUser.name || r.fromUser.email,
          avatarUrl: r.fromUser.avatarUrl,
        },
      })),
    })),
    meta: { canSend, canReadAll },
  });
}

const createSchema = z.object({
  type: z.enum(["EXCUSE", "ADMIN", "GENERAL"]).default("GENERAL"),
  toUserId: z.string().min(1),
  subject: z.string().min(2).max(200),
  body: z.string().min(1).max(20000),
  parentId: z.string().min(1).optional().nullable(),
});

/** POST compose or reply */
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
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const isReply = !!parsed.data.parentId;
  if (!isReply) {
    const canSend = await hasPermission(
      session.user.id,
      workspaceId,
      "letter:send",
    );
    if (!canSend) {
      return NextResponse.json(
        { error: "Forbidden: letter:send required" },
        { status: 403 },
      );
    }
  }

  const recipient = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: parsed.data.toUserId,
      status: "ACTIVE",
    },
  });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not in workspace" }, { status: 400 });
  }

  let parentType: "EXCUSE" | "ADMIN" | "GENERAL" = parsed.data.type;
  if (parsed.data.parentId) {
    const parent = await prisma.workspaceLetter.findFirst({
      where: { id: parsed.data.parentId, workspaceId },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent letter not found" }, { status: 404 });
    }
    const canAccess =
      parent.fromUserId === session.user.id ||
      parent.toUserId === session.user.id ||
      (await hasPermission(session.user.id, workspaceId, "letter:read_all"));
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    parentType = parent.type;
    await prisma.workspaceLetter.update({
      where: { id: parent.id },
      data: { status: "REPLIED" },
    });
  }

  const letter = await prisma.workspaceLetter.create({
    data: {
      workspaceId,
      type: parentType,
      fromUserId: session.user.id,
      toUserId: parsed.data.toUserId,
      subject: parsed.data.subject.trim(),
      body: parsed.data.body.trim(),
      parentId: parsed.data.parentId || null,
      status: isReply ? "REPLIED" : "OPEN",
    },
    include: {
      fromUser: { select: userSelect },
      toUser: { select: userSelect },
    },
  });

  emitToWorkspaceRoom(workspaceId, "letter:new", {
    id: letter.id,
    toUserId: letter.toUserId,
    fromUserId: letter.fromUserId,
    subject: letter.subject,
    type: letter.type,
  });

  try {
    const { notifyUsers } = await import("@/lib/card-permissions");
    await notifyUsers({
      userIds: [letter.toUserId],
      workspaceId,
      actorId: session.user.id,
      type: "letter.received",
      title: letter.subject,
      body: isReply ? "New reply on a letter" : "New letter for you",
      href: `/workspace/${workspaceId}/chat`,
    });
  } catch (e) {
    console.error("[letter] notify failed", e);
  }

  const { publishBadgeRefresh } = await import("@/lib/badge-bus");
  publishBadgeRefresh({ workspaceId, userId: letter.toUserId });

  return NextResponse.json(
    {
      data: {
        id: letter.id,
        type: letter.type,
        subject: letter.subject,
        body: letter.body,
        createdAt: letter.createdAt,
        from: {
          id: letter.fromUser.id,
          name: letter.fromUser.name || letter.fromUser.email,
        },
        to: {
          id: letter.toUser.id,
          name: letter.toUser.name || letter.toUser.email,
        },
      },
    },
    { status: 201 },
  );
}
