import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";
import { applyWorkflowColumn } from "@/lib/card-workflow";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const bodySchema = z.object({
  to: z.enum(["todo", "progress", "review", "done"]),
});

export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, cardId } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    include: { assignees: { select: { userId: true } } },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    card,
    access,
  );
  const isAssignee = card.assignees.some((a) => a.userId === session.user!.id);
  if (
    !isAssignee &&
    caps.role !== "board_admin" &&
    caps.role !== "creator"
  ) {
    return NextResponse.json(
      { error: "Only the assigned employee can move this task" },
      { status: 403 },
    );
  }

  const updated = await applyWorkflowColumn(
    boardId,
    {
      id: card.id,
      workflowStatus: card.workflowStatus,
      startedAt: card.startedAt,
      supervisorId: card.supervisorId,
    },
    parsed.data.to,
  );
  return NextResponse.json({
    data: updated,
    column:
      parsed.data.to === "done" && card.supervisorId
        ? "review"
        : parsed.data.to,
  });
}
