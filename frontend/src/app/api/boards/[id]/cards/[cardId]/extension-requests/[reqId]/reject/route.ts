import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import {
  resolveCardCapabilities,
  notifyUsers,
} from "@/lib/card-permissions";
import { canManageDelayOrExtension } from "@/lib/card-delay";

type Ctx = {
  params: Promise<{ id: string; cardId: string; reqId: string }>;
};

const rejectSchema = z.object({
  reviewNote: z.string().trim().max(2000).optional().nullable(),
});

/**
 * POST — manager rejects extension request
 */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId, reqId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via === "guest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const request = await prisma.cardExtensionRequest.findFirst({
    where: { id: reqId, cardId, workspaceId: board.workspaceId },
    include: { card: true },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    request.card,
    access,
  );
  if (!canManageDelayOrExtension(caps)) {
    return NextResponse.json(
      { error: "Only a manager/creator can reject extensions" },
      { status: 403 },
    );
  }

  if (request.status !== "PENDING") {
    return NextResponse.json(
      { error: "Request is not pending" },
      { status: 400 },
    );
  }

  const parsed = rejectSchema.safeParse(await req.json().catch(() => ({})));
  const reviewNote = parsed.success ? parsed.data.reviewNote ?? null : null;

  const updated = await prisma.cardExtensionRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNote,
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyUsers({
    userIds: [request.requestedById],
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    actorId: session.user.id,
    type: "task.extension_rejected",
    title: `Extension rejected: “${request.card.title}”`,
    body: reviewNote || "Your extension request was not approved",
  });

  return NextResponse.json({ data: updated });
}
