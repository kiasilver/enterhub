import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import {
  ensureWorkspaceDepartments,
  backfillBoardDepartments,
  listAccessibleDepartmentIds,
  canManageDepartments,
  departmentColor,
  departmentIcon,
} from "@/lib/departments";

type Ctx = { params: Promise<{ id: string }> };

function listBucket(title: string): "todo" | "progress" | "review" | "done" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

/**
 * GET /api/workspaces/[id]/departments
 * Includes leads (manager/supervisor) and task completion stats per department.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureWorkspaceDepartments(workspaceId);
  await backfillBoardDepartments(workspaceId);

  const accessible = await listAccessibleDepartmentIds(
    session.user.id,
    workspaceId,
  );
  const admin = accessible === "all";
  const canManage = await canManageDepartments(session.user.id, workspaceId);

  const departments = await prisma.department.findMany({
    where: {
      workspaceId,
      ...(admin ? {} : { id: { in: accessible } }),
      // Non-managers only see active departments
      ...(canManage ? {} : { archivedAt: null }),
    },
    orderBy: [{ archivedAt: "asc" }, { order: "asc" }],
    include: {
      _count: { select: { boards: true, members: true } },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  });

  // Org-level access (Owner / Org Admin / department:manage) — not department managers
  const orgAccessMembers = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      OR: [
        { role: { name: { in: ["Owner", "Org Admin"] }, isSystem: true } },
        {
          role: {
            permissions: {
              some: {
                permission: {
                  actionName: {
                    in: [
                      "department:manage",
                      "analytics:company",
                      "workspace:roles",
                    ],
                  },
                },
              },
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      role: { select: { name: true } },
    },
  });

  const orgAccessPeople = orgAccessMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    avatarUrl: m.user.avatarUrl,
    accessVia: m.role.name,
  }));

  const deptIds = departments.map((d) => d.id);
  const cards =
    deptIds.length === 0
      ? []
      : await prisma.card.findMany({
          where: {
            archivedAt: null,
            list: {
              archivedAt: null,
              board: {
                workspaceId,
                archivedAt: null,
                departmentId: { in: deptIds },
              },
            },
          },
          select: {
            dueDate: true,
            workflowStatus: true,
            list: {
              select: {
                title: true,
                board: { select: { departmentId: true } },
              },
            },
          },
          take: 8000,
        });

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  type Agg = {
    open: number;
    done: number;
    overdue: number;
    inProgress: number;
    total: number;
  };
  const statsByDept = new Map<string, Agg>();
  for (const id of deptIds) {
    statsByDept.set(id, {
      open: 0,
      done: 0,
      overdue: 0,
      inProgress: 0,
      total: 0,
    });
  }

  for (const c of cards) {
    const deptId = c.list.board.departmentId;
    if (!deptId) continue;
    const agg = statsByDept.get(deptId);
    if (!agg) continue;
    agg.total += 1;
    const bucket = listBucket(c.list.title);
    const isDone = bucket === "done" || c.workflowStatus === "APPROVED";
    if (isDone) {
      agg.done += 1;
      continue;
    }
    agg.open += 1;
    if (
      bucket === "progress" ||
      c.workflowStatus === "IN_PROGRESS"
    ) {
      agg.inProgress += 1;
    }
    if (c.dueDate && c.dueDate.getTime() < startOfDay.getTime()) {
      agg.overdue += 1;
    }
  }

  return NextResponse.json({
    data: departments.map((d) => {
      const managers = d.members
        .filter((m) => m.role === "MANAGER")
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        }));
      const supervisors = d.members
        .filter((m) => m.role === "SUPERVISOR")
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        }));
      const team = d.members
        .filter((m) => m.role === "MEMBER")
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        }));

      // Org access people who are not already listed as manager / supervisor / team
      const onRoster = new Set(d.members.map((m) => m.userId));
      const access = orgAccessPeople
        .filter((p) => !onRoster.has(p.id))
        .map(({ id, name, email, avatarUrl, accessVia }) => ({
          id,
          name,
          email,
          avatarUrl,
          accessVia,
        }));

      const stats = statsByDept.get(d.id) || {
        open: 0,
        done: 0,
        overdue: 0,
        inProgress: 0,
        total: 0,
      };
      const completionPct =
        stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

      return {
        id: d.id,
        key: d.key,
        name: d.name,
        color: d.color,
        icon: d.icon || departmentIcon(d.key),
        order: d.order,
        archivedAt: d.archivedAt,
        boardCount: d._count.boards,
        memberCount: d._count.members,
        managers,
        supervisors,
        team,
        access,
        stats: {
          ...stats,
          completionPct,
        },
        members: d.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          user: m.user,
        })),
      };
    }),
    meta: { isAdmin: admin, canManage },
  });
}

const createSchema = z.object({
  key: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().min(2).max(80),
  color: z.string().max(20).optional(),
  icon: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
  members: z
    .array(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["MANAGER", "SUPERVISOR", "MEMBER"]),
      }),
    )
    .max(200)
    .optional(),
});

/**
 * POST /api/workspaces/[id]/departments — workspace admin only
 */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await canManageDepartments(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const members = parsed.data.members || [];
  if (members.length) {
    const userIds = members.map((m) => m.userId);
    const wsMembers = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        userId: { in: userIds },
        status: "ACTIVE",
      },
      select: { userId: true },
    });
    const ok = new Set(wsMembers.map((m) => m.userId));
    for (const id of userIds) {
      if (!ok.has(id)) {
        return NextResponse.json(
          { error: "All members must be active workspace members" },
          { status: 400 },
        );
      }
    }
  }

  const max = await prisma.department.aggregate({
    where: { workspaceId },
    _max: { order: true },
  });

  const dept = await prisma.$transaction(async (tx) => {
    const created = await tx.department.create({
      data: {
        workspaceId,
        key: parsed.data.key,
        name: parsed.data.name,
        color: parsed.data.color || departmentColor(parsed.data.key),
        icon: parsed.data.icon || departmentIcon(parsed.data.key),
        order: (max._max.order ?? 0) + 1,
      },
    });
    if (members.length) {
      await tx.departmentMember.createMany({
        data: members.map((m) => ({
          departmentId: created.id,
          userId: m.userId,
          role: m.role,
        })),
      });
    }
    await tx.board.create({
      data: {
        workspaceId,
        departmentId: created.id,
        name: "General",
        description: "Default inbox for this department",
        visibility: "WORKSPACE",
        isGeneral: true,
        lists: {
          create: [
            { title: "To Do", order: 0 },
            { title: "In Progress", order: 1 },
            { title: "On Review", order: 2 },
            { title: "Done", order: 3 },
          ],
        },
      },
    });
    return created;
  });

  const { publishBoardLive } = await import("@/lib/boards-live-bus");
  publishBoardLive({
    type: "department.changed",
    workspaceId,
    departmentId: dept.id,
    reason: "created",
  });

  // Notify workspace managers + designated department managers
  try {
    const { notifyUsers } = await import("@/lib/card-permissions");
    const managerIds = new Set<string>();
    for (const m of members) {
      if (m.role === "MANAGER" || m.role === "SUPERVISOR") {
        managerIds.add(m.userId);
      }
    }
    const admins = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        status: "ACTIVE",
        role: {
          OR: [
            { name: { in: ["OWNER", "ORG_ADMIN"] } },
            {
              permissions: {
                some: {
                  permission: { actionName: "department:manage" },
                },
              },
            },
          ],
        },
      },
      select: { userId: true },
      take: 50,
    });
    for (const a of admins) managerIds.add(a.userId);
    if (managerIds.size) {
      await notifyUsers({
        userIds: [...managerIds],
        workspaceId,
        actorId: session.user.id,
        type: "department.created",
        title: `Department “${dept.name}” created`,
        body: "A new department was added to the workspace",
        href: `/workspace/${workspaceId}/boards?view=departments`,
      });
    }
  } catch (e) {
    console.error("[department.created] notify failed", e);
  }

  return NextResponse.json({ data: dept }, { status: 201 });
}
