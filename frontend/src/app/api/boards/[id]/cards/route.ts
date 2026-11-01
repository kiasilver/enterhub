import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import {
  canAccessBoard,
  redactCardForGuest,
  type CardPayload,
} from "@/lib/board-access";
import { notifyUsers } from "@/lib/card-permissions";
import { emitToBoardRoom } from "@/lib/socket-emit";
import { normalizeChecklistCreate } from "@/lib/checklist-defaults";
import { parseCardDateInput } from "@/lib/card-dates";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/boards/[id]/cards
 * Guests: redact timeLogs/financial; ASSIGNED_ONLY filters to their cards.
 */
export async function GET(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Impersonation is read-only — GET allowed
  const userId = session.user.id;
  const { id: boardId } = await context.params;

  const access = await canAccessBoard(userId, boardId);
  if (!access.ok) {
    const status = access.reason === "not_found" ? 404 : 403;
    return NextResponse.json({ error: "Forbidden or not found" }, { status });
  }

  const lists = await prisma.list.findMany({
    where: { boardId, archivedAt: null },
    orderBy: { order: "asc" },
    include: {
      cards: {
        where: { archivedAt: null },
        orderBy: { order: "asc" },
        include: {
          assignees: {
            select: {
              userId: true,
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
          supervisor: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          comments: {
            select: { id: true, body: true, authorId: true, createdAt: true },
            take: 20,
            orderBy: { createdAt: "desc" },
          },
          attachments: {
            select: { id: true, fileName: true, fileUrl: true, mimeType: true },
          },
          checklistItems: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, isDone: true, description: true },
          },
          labels: {
            include: {
              label: { select: { id: true, name: true, color: true } },
            },
          },
          _count: { select: { comments: true, attachments: true } },
        },
      },
    },
  });

  let listsOut = lists.map((l) => ({
    id: l.id,
    title: l.title,
    order: l.order,
    cardIds: l.cards.map((c) => c.id),
  }));

  let cards = lists.flatMap((l) =>
    l.cards.map((c) => ({
      ...c,
      listTitle: l.title,
      timeLogs: [] as unknown[],
      financialMeta: null as unknown,
    })),
  );

  if (access.via === "guest") {
    if (access.guestLevel === "ASSIGNED_ONLY") {
      cards = cards.filter((c) => c.assignees.some((a) => a.userId === userId));
      const allowed = new Set(cards.map((c) => c.id));
      listsOut = listsOut.map((l) => ({
        ...l,
        cardIds: l.cardIds.filter((id) => allowed.has(id)),
      }));
    }
    cards = cards.map((c) =>
      redactCardForGuest(c as CardPayload, access.guestLevel),
    ) as typeof cards;
  }

  return NextResponse.json({
    data: {
      boardId,
      access,
      lists: listsOut,
      cards,
    },
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(300),
  listId: z.string().min(1),
  description: z.string().max(5000).optional(),
  /** ISO date or `YYYY-MM-DD` from date inputs (range end) */
  dueDate: z.string().optional().nullable(),
  /** Range start (`YYYY-MM-DD`) */
  startDate: z.string().optional().nullable(),
  /** Optional expected effort in hours */
  estimatedHours: z.number().positive().max(1000).optional().nullable(),
  assignToSelf: z.boolean().optional(),
  assigneeIds: z.array(z.string().min(1)).max(50).optional(),
  supervisorId: z.string().min(1).optional().nullable(),
  checklist: z
    .array(
      z.union([
        z.string().min(1).max(300),
        z.object({
          title: z.string().min(1).max(300),
          description: z.string().max(2000).optional().nullable(),
        }),
      ]),
    )
    .max(50)
    .optional(),
  labelIds: z.array(z.string().min(1)).max(20).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  attachments: z
    .array(
      z.object({
        fileName: z.string().min(1).max(240),
        fileUrl: z.string().min(1).max(8_000_000),
        mimeType: z.string().max(120).optional(),
        sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024).optional(),
      }),
    )
    .max(10)
    .optional(),
});

/** POST /api/boards/[id]/cards */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  const { id: boardId } = await context.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via === "guest") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true, departmentId: true },
  });
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!(await hasPermission(session.user.id, board.workspaceId, "card:create"))) {
    return NextResponse.json({ error: "Forbidden: card:create" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const list = await prisma.list.findFirst({
    where: { id: parsed.data.listId, boardId },
  });
  if (!list) {
    return NextResponse.json({ error: "List not on this board" }, { status: 400 });
  }

  const maxOrder = await prisma.card.aggregate({
    where: { listId: list.id },
    _max: { order: true },
  });

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

  if (
    startDate instanceof Date &&
    dueDate instanceof Date &&
    startDate.getTime() > dueDate.getTime()
  ) {
    return NextResponse.json(
      { error: "Start date must be on or before due date" },
      { status: 400 },
    );
  }

  const assigneeIds = new Set<string>(parsed.data.assigneeIds ?? []);
  if (parsed.data.assignToSelf) {
    assigneeIds.add(session.user.id);
  }

  if (assigneeIds.size > 0) {
    if (!parsed.data.dueDate || !parsed.data.startDate) {
      return NextResponse.json(
        { error: "Due date range (start and end) is required when assigning a task" },
        { status: 400 },
      );
    }
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: board.workspaceId,
        userId: { in: [...assigneeIds] },
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    const ok = new Set(members.map((m) => m.userId));
    for (const id of assigneeIds) {
      if (!ok.has(id)) {
        return NextResponse.json(
          { error: "Assignee is not an active workspace member" },
          { status: 400 },
        );
      }
    }
  }

  let supervisorId: string | null = parsed.data.supervisorId || null;
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

  const checklistItems = normalizeChecklistCreate(parsed.data.checklist);

  let labelIds: string[] = [];
  if (parsed.data.labelIds?.length) {
    const labels = await prisma.workspaceLabel.findMany({
      where: {
        workspaceId: board.workspaceId,
        id: { in: parsed.data.labelIds },
      },
      select: { id: true },
    });
    labelIds = labels.map((l) => l.id);
  }

  const card = await prisma.card.create({
    data: {
      listId: list.id,
      title: parsed.data.title,
      description: parsed.data.description,
      order: (maxOrder._max.order ?? -1) + 1,
      createdById: session.user.id,
      supervisorId,
      priority: parsed.data.priority || "NONE",
      estimatedHours: parsed.data.estimatedHours ?? null,
      workflowStatus: "ASSIGNED",
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(startDate !== undefined ? { startDate } : {}),
      assignees:
        assigneeIds.size > 0
          ? { create: [...assigneeIds].map((userId) => ({ userId })) }
          : undefined,
      labels: labelIds.length
        ? { create: labelIds.map((labelId) => ({ labelId })) }
        : undefined,
      checklistItems: {
        create: checklistItems.map((item, i) => ({
          title: item.title,
          description: item.description,
          order: i,
        })),
      },
      attachments: parsed.data.attachments?.length
        ? {
            create: parsed.data.attachments.map((a) => ({
              fileName: a.fileName,
              fileUrl: a.fileUrl,
              mimeType: a.mimeType || "application/octet-stream",
              sizeBytes: a.sizeBytes ?? null,
              uploadedById: session.user.id,
            })),
          }
        : undefined,
    },
  });

  if (assigneeIds.size > 0) {
    await notifyUsers({
      userIds: [...assigneeIds],
      workspaceId: board.workspaceId,
      boardId,
      cardId: card.id,
      actorId: session.user.id,
      type: "assigned",
      title: `Assigned to “${card.title}”`,
      body: "You were assigned to a new task",
    });
    try {
      const { emailUsersTaskAssigned } = await import("@/lib/notify-email");
      await emailUsersTaskAssigned({
        userIds: [...assigneeIds],
        actorId: session.user.id,
        boardId,
        cardId: card.id,
        cardTitle: card.title,
        workspaceId: board.workspaceId,
      });
    } catch (e) {
      console.error("[card.create] task email failed", e);
    }
  }
  if (supervisorId) {
    await notifyUsers({
      userIds: [supervisorId],
      workspaceId: board.workspaceId,
      boardId,
      cardId: card.id,
      actorId: session.user.id,
      type: "task.supervisor",
      title: `Supervisor on “${card.title}”`,
      body: "You were set as supervisor for this task",
    });
  }

  emitToBoardRoom(boardId, "card-updated", {
    type: "card.created",
    boardId,
    cards: [{ id: card.id, listId: card.listId, order: card.order }],
  });

  const { publishBoardLive } = await import("@/lib/boards-live-bus");
  publishBoardLive({
    type: "card.changed",
    workspaceId: board.workspaceId,
    boardId,
    cardId: card.id,
    departmentId: board.departmentId,
    reason: "created",
  });

  return NextResponse.json({ data: card }, { status: 201 });
}

