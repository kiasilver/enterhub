import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import {
  canAccessDepartment,
  canManageDepartments,
  isDepartmentSupervisor,
  ensureDepartmentGeneralBoard,
} from "@/lib/departments";
import { isDoneListTitle } from "@/lib/board-access";
import { assignDistinctProjectColors } from "@/lib/project-identity";
import { isGeneralBoardName } from "@/lib/board-lists";

type Ctx = { params: Promise<{ id: string; deptId: string }> };

const personSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

const boardCardInclude = {
  lists: {
    where: { archivedAt: null },
    orderBy: { order: "asc" as const },
    include: {
      cards: {
        where: { archivedAt: null },
        orderBy: { order: "asc" as const },
        include: {
          assignees: {
            include: { user: { select: personSelect } },
          },
          createdBy: { select: personSelect },
          supervisor: { select: personSelect },
          labels: {
            include: {
              label: { select: { id: true, name: true, color: true } },
            },
          },
          checklistItems: {
            orderBy: { order: "asc" as const },
            select: { id: true, title: true, isDone: true, description: true },
          },
          _count: { select: { comments: true, attachments: true } },
        },
      },
    },
  },
};

function mapBoardsToProjects(
  boards: Array<{
    id: string;
    name: string;
    description: string | null;
    background: string | null;
    color?: string | null;
    icon?: string | null;
    visibility?: string;
    isGeneral?: boolean;
    lists: Array<{
      id: string;
      title: string;
      cards: Array<{
        id: string;
        title: string;
        description: string | null;
        dueDate: Date | null;
        startDate: Date | null;
        priority: string;
        workflowStatus: string;
        estimatedHours: number | null;
        startedAt: Date | null;
        assignees: Array<{ user: { id: string; name: string | null; email: string | null; avatarUrl: string | null } }>;
        createdBy: { id: string; name: string | null; email: string | null; avatarUrl: string | null } | null;
        supervisor: { id: string; name: string | null; email: string | null; avatarUrl: string | null } | null;
        labels: Array<{ label: { id: string; name: string; color: string } }>;
        checklistItems: Array<{
          id: string;
          title: string;
          isDone: boolean;
          description: string | null;
        }>;
        _count: { comments: number; attachments: number };
      }>;
    }>;
  }>,
  coverFallback: string,
) {
  const mapped = boards.map((b) => {
    const allCards = b.lists.flatMap((l) =>
      l.cards.map((c) => ({
        ...c,
        listTitle: l.title,
        listId: l.id,
      })),
    );
    const done = allCards.filter((c) => isDoneListTitle(c.listTitle)).length;
    const total = allCards.length;
    const completionPct = total ? Math.round((done / total) * 100) : 0;
    const isGeneral = Boolean(b.isGeneral) || isGeneralBoardName(b.name);

    return {
      id: b.id,
      name: b.name,
      isGeneral,
      description: b.description,
      background: b.background,
      visibility: b.visibility ?? "WORKSPACE",
      icon: b.icon ?? null,
      color: b.color ?? null,
      completionPct,
      cardCount: total,
      doneCount: done,
      cards: allCards.map((c) => {
        const clDone = c.checklistItems.filter((i) => i.isDone).length;
        const clTotal = c.checklistItems.length;
        return {
          id: c.id,
          title: c.title,
          description: c.description,
          dueDate: c.dueDate,
          startDate: c.startDate,
          priority: c.priority,
          workflowStatus: c.workflowStatus,
          estimatedHours: c.estimatedHours,
          startedAt: c.startedAt,
          listId: c.listId,
          listTitle: c.listTitle,
          assignees: c.assignees.map((a) => a.user),
          supervisor: c.supervisor,
          createdBy: c.createdBy,
          labels: c.labels.map((l) => l.label),
          checklist: {
            done: clDone,
            total: clTotal,
            items: c.checklistItems,
            progressPct: clTotal ? Math.round((clDone / clTotal) * 100) : 0,
          },
          commentCount: c._count.comments,
          attachmentCount: c._count.attachments,
        };
      }),
    };
  });
  mapped.sort((a, b) => {
    if (a.isGeneral !== b.isGeneral) return a.isGeneral ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return assignDistinctProjectColors(mapped, coverFallback);
}

/**
 * GET /api/workspaces/[id]/departments/[deptId]
 * Department detail + projects with rich cards for Kanban columns.
 * `general` is a virtual section for boards with no department.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, deptId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [canCreateBoardPerm, canCreateTaskPerm, canManage] = await Promise.all([
    hasPermission(session.user.id, workspaceId, "board:create"),
    hasPermission(session.user.id, workspaceId, "card:create"),
    canManageDepartments(session.user.id, workspaceId),
  ]);

  if (deptId === "general") {
    const boards = await prisma.board.findMany({
      where: { workspaceId, departmentId: null, archivedAt: null },
      orderBy: { name: "asc" },
      include: boardCardInclude,
    });
    return NextResponse.json({
      data: {
        id: "general",
        key: "general",
        name: "General",
        color: "#6B7280",
        icon: "business",
        archivedAt: null,
        members: [],
        projects: mapBoardsToProjects(boards, "#6B7280"),
        canManageMembers: false,
        canManage: false,
        canCreateBoard: canCreateBoardPerm,
        canCreateTask: canCreateTaskPerm,
      },
    });
  }

  if (!(await canAccessDepartment(session.user.id, workspaceId, deptId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dept = await prisma.department.findFirst({
    where: { id: deptId, workspaceId },
    include: {
      members: {
        include: {
          user: { select: personSelect },
        },
        orderBy: { role: "asc" },
      },
    },
  });
  if (!dept) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await ensureDepartmentGeneralBoard(workspaceId, deptId);

  const boards = await prisma.board.findMany({
    where: { workspaceId, departmentId: deptId, archivedAt: null },
    orderBy: { name: "asc" },
    include: boardCardInclude,
  });

  const isSupervisor =
    canManage || (await isDepartmentSupervisor(session.user.id, deptId));
  const projects = mapBoardsToProjects(boards, dept.color).map((p) => ({
    ...p,
    canDelete: isSupervisor && !p.isGeneral,
  }));
  const deptActive = !dept.archivedAt;

  return NextResponse.json({
    data: {
      id: dept.id,
      key: dept.key,
      name: dept.name,
      color: dept.color,
      icon: dept.icon,
      archivedAt: dept.archivedAt,
      members: dept.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
      projects,
      canManageMembers: isSupervisor,
      canManage,
      canCreateBoard: deptActive && canCreateBoardPerm,
      canCreateTask: deptActive && canCreateTaskPerm,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  color: z.string().max(20).optional(),
  icon: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  /** true = soft-disable, false = re-enable */
  disabled: z.boolean().optional(),
});

/**
 * PATCH /api/workspaces/[id]/departments/[deptId]
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId, deptId } = await ctx.params;
  if (deptId === "general") {
    return NextResponse.json({ error: "Cannot edit the general section" }, { status: 400 });
  }

  const canManage = await canManageDepartments(session.user.id, workspaceId);
  const canEditSelf =
    canManage || (await isDepartmentSupervisor(session.user.id, deptId));
  if (!canEditSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const { disabled, ...rest } = parsed.data;
  if (disabled !== undefined && !canManage) {
    return NextResponse.json(
      { error: "Only org access can disable departments" },
      { status: 403 },
    );
  }

  const data: {
    name?: string;
    color?: string;
    icon?: string;
    archivedAt?: Date | null;
  } = { ...rest };
  if (disabled === true) data.archivedAt = new Date();
  if (disabled === false) data.archivedAt = null;

  const updated = await prisma.department.updateMany({
    where: { id: deptId, workspaceId },
    data,
  });
  if (!updated.count) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const dept = await prisma.department.findUnique({ where: { id: deptId } });
  const { publishBoardLive } = await import("@/lib/boards-live-bus");
  publishBoardLive({
    type: "department.changed",
    workspaceId,
    departmentId: deptId,
    reason: "updated",
  });
  return NextResponse.json({ data: dept });
}

/**
 * DELETE /api/workspaces/[id]/departments/[deptId]
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId, deptId } = await ctx.params;
  if (deptId === "general") {
    return NextResponse.json({ error: "Cannot delete the general section" }, { status: 400 });
  }
  if (!(await canManageDepartments(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.board.updateMany({
    where: { departmentId: deptId },
    data: { departmentId: null },
  });
  await prisma.department.deleteMany({ where: { id: deptId, workspaceId } });
  const { publishBoardLive } = await import("@/lib/boards-live-bus");
  publishBoardLive({
    type: "department.changed",
    workspaceId,
    departmentId: deptId,
    reason: "deleted",
  });
  return NextResponse.json({ ok: true });
}
