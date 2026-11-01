import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { canAccessBoard } from "@/lib/board-access";
import { AuditLogger } from "@/lib/audit-logger";
import {
  isBoardDepartmentSupervisor,
  isWorkspaceAdmin,
  canArchiveBoard,
} from "@/lib/departments";
import { isGeneralBoardName } from "@/lib/board-lists";
import { publishBoardLive } from "@/lib/boards-live-bus";
import { emitToWorkspaceRoom } from "@/lib/socket-emit";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
  defaultView: z.enum(["KANBAN", "LIST", "TIMELINE", "CALENDAR"]).optional(),
  background: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    .optional()
    .nullable(),
  icon: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/)
    .optional()
    .nullable(),
  departmentId: z.string().min(1).optional().nullable(),
  observerIds: z.array(z.string().min(1)).max(50).optional(),
});

/** GET /api/boards/[id] */
export async function GET(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const access = await canAccessBoard(session.user.id, id);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: access.reason === "not_found" ? 404 : 403 });
  }

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      workspace: { select: { id: true, name: true } },
      department: { select: { id: true, key: true, name: true } },
      _count: { select: { lists: true, guests: true } },
    },
  });
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { ...board, access } });
}

/** PATCH /api/boards/[id] */
export async function PATCH(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  const { id } = await context.params;
  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canSettings = await hasPermission(
    session.user.id,
    board.workspaceId,
    "board:settings",
  );
  const deptSup = await isBoardDepartmentSupervisor(session.user.id, id);
  const admin = await isWorkspaceAdmin(session.user.id, board.workspaceId);
  if (!canSettings && !deptSup && !admin) {
    return NextResponse.json({ error: "Forbidden: board:settings" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const protectedGeneral = board.isGeneral || isGeneralBoardName(board.name);
  if (
    protectedGeneral &&
    parsed.data.departmentId !== undefined &&
    parsed.data.departmentId !== board.departmentId
  ) {
    return NextResponse.json(
      { error: "Cannot move the default General project to another section" },
      { status: 400 },
    );
  }

  if (parsed.data.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: parsed.data.departmentId, workspaceId: board.workspaceId },
    });
    if (!dept) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }
  }

  const { observerIds: observerIdsRaw, ...boardPatch } = parsed.data;

  const updated = await prisma.board.update({
    where: { id },
    data: boardPatch,
  });

  if (observerIdsRaw !== undefined) {
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: board.workspaceId,
        userId: { in: observerIdsRaw },
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    const keep = [...new Set(members.map((m) => m.userId))];
    await prisma.$transaction([
      prisma.boardGuest.deleteMany({
        where: { boardId: id, ...(keep.length ? { userId: { notIn: keep } } : {}) },
      }),
      ...keep.map((userId) =>
        prisma.boardGuest.upsert({
          where: { boardId_userId: { boardId: id, userId } },
          create: { boardId: id, userId, accessLevel: "READ_ONLY" },
          update: {},
        }),
      ),
    ]);
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: board.workspaceId,
    boardId: id,
    action: "board.update",
    metadata: parsed.data,
  });

  publishBoardLive({
    type: "board.changed",
    workspaceId: board.workspaceId,
    boardId: id,
    departmentId: updated.departmentId,
    reason: "updated",
  });

  return NextResponse.json({ data: updated });
}

/** DELETE /api/boards/[id] — archive project (department lead / board admin) */
export async function DELETE(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  const { id } = await context.params;
  const board = await prisma.board.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      departmentId: true,
      isGeneral: true,
      archivedAt: true,
    },
  });
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (board.isGeneral || isGeneralBoardName(board.name)) {
    return NextResponse.json(
      { error: "Cannot delete the default General project" },
      { status: 400 },
    );
  }
  if (!(await canArchiveBoard(session.user.id, board))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const archived = await prisma.board.update({
    where: { id },
    data: { archivedAt: board.archivedAt ? board.archivedAt : new Date() },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: board.workspaceId,
    boardId: id,
    action: "board.archive",
    metadata: { name: board.name },
  });

  const live = {
    type: "board.archived" as const,
    workspaceId: board.workspaceId,
    boardId: id,
    departmentId: board.departmentId,
  };
  publishBoardLive(live);
  emitToWorkspaceRoom(board.workspaceId, "board-updated", live);

  return NextResponse.json({ data: archived });
}
