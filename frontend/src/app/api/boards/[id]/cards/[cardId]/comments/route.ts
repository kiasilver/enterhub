import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import {
  getMentionableUsers,
  notifyUsers,
  resolveCardCapabilities,
  resolveMentions,
} from "@/lib/card-permissions";
import { AuditLogger } from "@/lib/audit-logger";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/** POST /api/boards/[id]/cards/[cardId]/comments */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (access.via === "guest" && access.guestLevel === "READ_ONLY") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z
    .object({
      body: z.string().min(1).max(5000),
      mentionIds: z.array(z.string().min(1)).max(20).optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true, title: true, createdById: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    card,
    access,
  );
  if (!caps.canView || !caps.canComment) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (access.via === "member") {
    if (!(await hasPermission(session.user.id, board.workspaceId, "comment:create"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const mentionable = await getMentionableUsers(
    board.workspaceId,
    boardId,
    access.via === "guest",
  );

  const fromText = resolveMentions(body.data.body, mentionable);
  const mentionIds = [
    ...new Set([...(body.data.mentionIds || []), ...fromText]),
  ].filter((id) => mentionable.some((m) => m.userId === id));

  const comment = await prisma.comment.create({
    data: {
      cardId,
      authorId: session.user.id,
      body: body.data.body,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  if (mentionIds.length) {
    const actorName = comment.author.name || comment.author.email;
    await notifyUsers({
      userIds: mentionIds,
      workspaceId: board.workspaceId,
      boardId,
      cardId,
      actorId: session.user.id,
      type: "mention",
      title: `${actorName} mentioned you`,
      body: `On “${card.title}”: ${body.data.body.slice(0, 160)}`,
    });
    await AuditLogger.log({
      userId: session.user.id,
      workspaceId: board.workspaceId,
      boardId,
      action: "comment.mention",
      metadata: { cardId, mentionIds, commentId: comment.id },
    });
  }

  return NextResponse.json({ data: comment }, { status: 201 });
}

/** PATCH /api/boards/[id]/cards/[cardId]/comments — body: { commentId, body } */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z
    .object({
      commentId: z.string().min(1),
      body: z.string().min(1).max(5000),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.comment.findFirst({
    where: { id: body.data.commentId, cardId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.comment.update({
    where: { id: existing.id },
    data: { body: body.data.body.trim() },
    include: { author: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: comment });
}

/** DELETE /api/boards/[id]/cards/[cardId]/comments?commentId= */
export async function DELETE(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const commentId = new URL(req.url).searchParams.get("commentId");
  if (!commentId) {
    return NextResponse.json({ error: "commentId required" }, { status: 400 });
  }

  const existing = await prisma.comment.findFirst({
    where: { id: commentId, cardId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
