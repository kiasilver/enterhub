import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard, redactCardForGuest } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import {
  assertLabelChangeAllowed,
  filterCustomFieldsForUser,
  resolveCardCapabilities,
} from "@/lib/card-permissions";
import { emitToBoardRoom, emitToWorkspaceRoom } from "@/lib/socket-emit";
import { parseCardDateInput } from "@/lib/card-dates";
import { publishBoardLive } from "@/lib/boards-live-bus";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

/** GET /api/boards/[id]/cards/[cardId] */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    include: {
      list: { select: { id: true, title: true } },
      supervisor: { select: { id: true, name: true, email: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
      attachments: { orderBy: { createdAt: "desc" } },
      checklistItems: { orderBy: { order: "asc" } },
      labels: {
        include: { label: { select: { id: true, name: true, color: true, isSystem: true } } },
      },
      evaluation: {
        include: {
          evaluator: { select: { id: true, name: true, email: true } },
          employee: { select: { id: true, name: true, email: true } },
        },
      },
      extensionRequests: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          requestedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      },
      scheduleChanges: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          changedBy: { select: { id: true, name: true, email: true } },
        },
      },
      delayIncident: {
        include: {
          chargedBy: { select: { id: true, name: true, email: true } },
          waivedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, workspaceId: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Lazy ensure OPEN delay incident when overdue
  const { ensureDelayIncident, daysBetween } = await import("@/lib/card-delay");
  let delayIncident = card.delayIncident;
  const ensured = await ensureDelayIncident({
    cardId: card.id,
    workspaceId: board.workspaceId,
    dueDate: card.dueDate,
    workflowStatus: card.workflowStatus,
    assigneeUserIds: card.assignees.map((a) => a.userId),
    createdById: card.createdById,
  });
  if (ensured) {
    delayIncident = {
      ...(delayIncident || ensured),
      ...ensured,
      daysLate:
        ensured.status === "OPEN"
          ? daysBetween(ensured.overdueAt, new Date())
          : ensured.daysLate,
      chargedBy: delayIncident?.chargedBy ?? null,
      waivedBy: delayIncident?.waivedBy ?? null,
    } as typeof card.delayIncident;
  }

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    { id: card.id, createdById: card.createdById, supervisorId: card.supervisorId },
    access,
  );
  if (!caps.canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customFieldsRaw = await prisma.boardCustomField.findMany({
    where: { boardId },
    orderBy: { sortOrder: "asc" },
  });
  const customFields = filterCustomFieldsForUser(
    customFieldsRaw,
    caps.canSeeFinancialFields,
  );

  const now = new Date();
  try {
    await prisma.cardView.upsert({
      where: { cardId_userId: { cardId, userId: session.user.id } },
      create: {
        cardId,
        userId: session.user.id,
        firstSeenAt: now,
        lastSeenAt: now,
        seeCount: 1,
      },
      update: {
        lastSeenAt: now,
        seeCount: { increment: 1 },
      },
    });
  } catch {
    /* ignore if table not migrated yet */
  }

  let views: unknown[] | undefined;
  if (caps.canSeeViews && access.via === "member") {
    const rows = await prisma.cardView.findMany({
      where: { cardId },
      orderBy: { lastSeenAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    views = rows.map((v) => ({
      userId: v.userId,
      user: v.user,
      firstSeenAt: v.firstSeenAt,
      lastSeenAt: v.lastSeenAt,
      seeCount: v.seeCount,
    }));
  }

  let payload: Record<string, unknown> = {
    ...card,
    delayIncident,
    workspaceId: board.workspaceId,
    isAssignee: card.assignees.some((a) => a.userId === session.user!.id),
    customFields,
    role: caps.role,
    permissions: {
      canEdit: caps.canEditTitle || caps.canEditDescription,
      canEditTitle: caps.canEditTitle,
      canEditDescription: caps.canEditDescription,
      canEditDueDate: caps.canEditDueDate,
      canEditPriority: caps.canEditPriority,
      canEditLabels: caps.canEditLabels,
      canDelete: caps.canDelete,
      canAssign: caps.canAssign,
      canMove: caps.canMove,
      canMoveToDone: caps.canMoveToDone,
      canChecklist: caps.canChecklist,
      canAttach: caps.canAttach,
      canComment: caps.canComment,
      canSeeFinancialFields: caps.canSeeFinancialFields,
      canSeeViews: caps.canSeeViews,
      canOverrideAutomation: caps.canOverrideAutomation,
    },
    ...(views ? { views } : {}),
    timeLogs: [],
    financialMeta: null,
  };

  if (access.via === "guest") {
    payload = redactCardForGuest(payload as never, access.guestLevel) as Record<
      string,
      unknown
    >;
    delete payload.timeLogs;
    delete payload.financialMeta;
    delete payload.views;
  }

  return NextResponse.json({ data: payload, access });
}

const patchSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(20000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  estimatedHours: z.number().positive().max(1000).optional().nullable(),
  supervisorId: z.string().min(1).optional().nullable(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  labelIds: z.array(z.string().min(1)).max(20).optional(),
});

/** PATCH card — field-level checks by contextual role */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via !== "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId } },
    select: { id: true, createdById: true, supervisorId: true, title: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    existing,
    access,
  );

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.title !== undefined && !caps.canEditTitle) {
    return NextResponse.json(
      { error: "Forbidden: only creator or board admin can edit title" },
      { status: 403 },
    );
  }
  if (parsed.data.description !== undefined && !caps.canEditDescription) {
    return NextResponse.json(
      { error: "Forbidden: only creator or board admin can edit description" },
      { status: 403 },
    );
  }
  if (
    (parsed.data.dueDate !== undefined || parsed.data.startDate !== undefined) &&
    !caps.canEditDueDate
  ) {
    return NextResponse.json(
      { error: "Forbidden: cannot change due date on this card" },
      { status: 403 },
    );
  }
  if (parsed.data.estimatedHours !== undefined && !caps.canEditDueDate) {
    return NextResponse.json(
      { error: "Forbidden: only manager/creator can set estimated hours" },
      { status: 403 },
    );
  }
  if (parsed.data.supervisorId !== undefined && !caps.canAssign) {
    return NextResponse.json(
      { error: "Forbidden: cannot change the supervisor on this card" },
      { status: 403 },
    );
  }
  if (parsed.data.priority !== undefined && !caps.canEditPriority) {
    return NextResponse.json(
      { error: "Forbidden: cannot change priority on this card" },
      { status: 403 },
    );
  }
  if (parsed.data.labelIds !== undefined) {
    if (!caps.canEditLabels) {
      return NextResponse.json(
        { error: "Forbidden: cannot change labels on this card" },
        { status: 403 },
      );
    }
    const labelErr = await assertLabelChangeAllowed(
      board.workspaceId,
      cardId,
      parsed.data.labelIds,
      caps.canOverrideAutomation,
    );
    if (labelErr) {
      return NextResponse.json({ error: labelErr }, { status: 403 });
    }
  }

  let dueDate: Date | null | undefined = undefined;
  if (parsed.data.dueDate === null) dueDate = null;
  else if (parsed.data.dueDate) {
    const d = parseCardDateInput(parsed.data.dueDate);
    if (d === null) {
      return NextResponse.json({ error: "Invalid dueDate" }, { status: 400 });
    }
    dueDate = d;
  }

  let startDate: Date | null | undefined = undefined;
  if (parsed.data.startDate === null) startDate = null;
  else if (parsed.data.startDate) {
    const d = parseCardDateInput(parsed.data.startDate);
    if (d === null) {
      return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
    }
    startDate = d;
  }

  let supervisorId: string | null | undefined = undefined;
  if (parsed.data.supervisorId !== undefined) {
    supervisorId = parsed.data.supervisorId || null;
    if (supervisorId) {
      const supervisor = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: board.workspaceId,
          userId: supervisorId,
          status: "ACTIVE",
        },
        select: { userId: true },
      });
      if (!supervisor) {
        return NextResponse.json(
          { error: "Supervisor is not an active workspace member" },
          { status: 400 },
        );
      }
    }
  }

  const card = await prisma.card.update({
    where: { id: cardId },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined
        ? {
            description:
              parsed.data.description === null ? null : parsed.data.description,
          }
        : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      ...(parsed.data.estimatedHours !== undefined
        ? { estimatedHours: parsed.data.estimatedHours }
        : {}),
      ...(supervisorId !== undefined ? { supervisorId } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
    },
  });

  if (parsed.data.labelIds) {
    const labels = await prisma.workspaceLabel.findMany({
      where: {
        workspaceId: board.workspaceId,
        id: { in: parsed.data.labelIds },
      },
      select: { id: true },
    });
    const ids = labels.map((l) => l.id);
    await prisma.cardLabel.deleteMany({ where: { cardId } });
    if (ids.length) {
      await prisma.cardLabel.createMany({
        data: ids.map((labelId) => ({ cardId, labelId })),
        skipDuplicates: true,
      });
    }
  }

  if (
    supervisorId &&
    supervisorId !== existing.supervisorId
  ) {
    const { notifyUsers } = await import("@/lib/card-permissions");
    await notifyUsers({
      userIds: [supervisorId],
      workspaceId: board.workspaceId,
      boardId,
      cardId,
      actorId: session.user.id,
      type: "task.supervisor",
      title: `Supervisor on “${parsed.data.title || existing.title}”`,
      body: "You were set as supervisor for this task",
    });
  }

  emitToBoardRoom(boardId, "card-updated", {
    type: "card.updated",
    boardId,
    cards: [{ id: card.id, listId: card.listId, order: card.order }],
  });

  publishBoardLive({
    type: "card.changed",
    workspaceId: board.workspaceId,
    boardId,
    cardId: card.id,
    departmentId: board.departmentId,
    reason: "updated",
  });

  return NextResponse.json({ data: card });
}

/** DELETE — soft-archive card (creator or board admin only) */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via !== "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true, createdById: true, listId: true, order: true, title: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    existing,
    access,
  );
  if (!caps.canDelete) {
    return NextResponse.json(
      { error: "Forbidden: only creator or board admin can delete this card" },
      { status: 403 },
    );
  }

  await prisma.card.update({
    where: { id: cardId },
    data: { archivedAt: new Date() },
  });

  emitToBoardRoom(boardId, "card-updated", {
    type: "card.deleted",
    boardId,
    cardId,
    listId: existing.listId,
  });
  const live = {
    type: "card.deleted" as const,
    workspaceId: board.workspaceId,
    boardId,
    cardId,
    departmentId: board.departmentId,
  };
  publishBoardLive(live);
  emitToWorkspaceRoom(board.workspaceId, "board-updated", live);

  return NextResponse.json({ ok: true });
}
