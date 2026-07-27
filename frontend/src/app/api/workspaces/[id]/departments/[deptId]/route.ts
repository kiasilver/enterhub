import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import {
  canAccessDepartment,
  canManageDepartments,
  isDepartmentSupervisor,
} from "@/lib/departments";
import { isDoneListTitle } from "@/lib/board-access";

type Ctx = { params: Promise<{ id: string; deptId: string }> };

/**
 * GET /api/workspaces/[id]/departments/[deptId]
 * Department detail + projects with rich cards for Kanban columns.
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
  if (!(await canAccessDepartment(session.user.id, workspaceId, deptId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dept = await prisma.department.findFirst({
    where: { id: deptId, workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { role: "asc" },
      },
    },
  });
  if (!dept) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const boards = await prisma.board.findMany({
    where: { workspaceId, departmentId: deptId, archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      lists: {
        where: { archivedAt: null },
        orderBy: { order: "asc" },
        include: {
          cards: {
            where: { archivedAt: null },
            orderBy: { order: "asc" },
            include: {
              assignees: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              labels: {
                include: {
                  label: { select: { id: true, name: true, color: true } },
                },
              },
              checklistItems: {
                orderBy: { order: "asc" },
                select: { id: true, title: true, isDone: true },
              },
              _count: { select: { comments: true, attachments: true } },
            },
          },
        },
      },
    },
  });

  const projects = boards.map((b) => {
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

    return {
      id: b.id,
      name: b.name,
      description: b.description,
      background: b.background,
      coverColor: b.background || dept.color,
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
          createdBy: c.createdBy
            ? {
                id: c.createdBy.id,
                name: c.createdBy.name,
                email: c.createdBy.email,
                avatarUrl: c.createdBy.avatarUrl,
              }
            : null,
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

  const canManage = await canManageDepartments(session.user.id, workspaceId);
  const isSupervisor =
    canManage || (await isDepartmentSupervisor(session.user.id, deptId));
  const deptActive = !dept.archivedAt;
  const [canCreateBoardPerm, canCreateTaskPerm] = await Promise.all([
    hasPermission(session.user.id, workspaceId, "board:create"),
    hasPermission(session.user.id, workspaceId, "card:create"),
  ]);

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
  if (!(await canManageDepartments(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.board.updateMany({
    where: { departmentId: deptId },
    data: { departmentId: null },
  });
  await prisma.department.deleteMany({ where: { id: deptId, workspaceId } });
  return NextResponse.json({ ok: true });
}
