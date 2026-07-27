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
} from "@/lib/departments";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  visibility: z.enum(["PRIVATE", "WORKSPACE", "PUBLIC"]).optional(),
  defaultView: z.enum(["KANBAN", "LIST", "TIMELINE", "CALENDAR"]).optional(),
  background: z.string().max(500).optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),
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

  if (parsed.data.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: parsed.data.departmentId, workspaceId: board.workspaceId },
    });
    if (!dept) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    }
  }

  const updated = await prisma.board.update({
    where: { id },
    data: parsed.data,
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: board.workspaceId,
    boardId: id,
    action: "board.update",
    metadata: parsed.data,
  });

  return NextResponse.json({ data: updated });
}
