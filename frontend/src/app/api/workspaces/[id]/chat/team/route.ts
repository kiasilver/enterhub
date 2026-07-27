import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { resolvePresence, toChatPresence } from "@/lib/presence";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/chat/team
 * All ACTIVE members + role + presence + in-progress task count.
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

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId, status: "ACTIVE" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          lastLoginAt: true,
          presenceStatus: true,
          presenceUpdatedAt: true,
        },
      },
      role: { select: { name: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const userIds = members.map((m) => m.userId);
  const inProgress = userIds.length
    ? await prisma.cardAssignee.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          card: {
            archivedAt: null,
            workflowStatus: "IN_PROGRESS",
            list: {
              archivedAt: null,
              board: { workspaceId, archivedAt: null },
            },
          },
        },
        _count: { _all: true },
      })
    : [];
  const taskMap = new Map(inProgress.map((r) => [r.userId, r._count._all]));

  const deptRoles = userIds.length
    ? await prisma.departmentMember.findMany({
        where: { userId: { in: userIds }, department: { workspaceId } },
        include: {
          department: { select: { name: true } },
        },
      })
    : [];
  const deptByUser = new Map<string, string[]>();
  for (const d of deptRoles) {
    const label =
      d.role === "MANAGER"
        ? `${d.department.name} Manager`
        : d.role === "SUPERVISOR"
          ? `${d.department.name} Lead`
          : d.department.name;
    const list = deptByUser.get(d.userId) || [];
    list.push(label);
    deptByUser.set(d.userId, list);
  }

  const data = members.map((m) => {
    const resolved = resolvePresence(m.user.presenceStatus, m.user.presenceUpdatedAt, {
      forceLive: m.user.id === session.user!.id,
    });
    const presence = toChatPresence(resolved);
    const activeTasks = taskMap.get(m.userId) || 0;
    return {
      id: m.user.id,
      name: m.user.name || m.user.email,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role.name,
      deptRoles: deptByUser.get(m.userId) || [],
      presence,
      presenceStatus: resolved,
      activeTasks,
      workStatus: activeTasks > 0 ? ("working" as const) : ("idle" as const),
      lastLoginAt: m.user.lastLoginAt,
    };
  });

  data.sort((a, b) => {
    const rank = (p: string) => (p === "online" ? 0 : p === "away" || p === "dnd" ? 1 : 2);
    const rd = rank(a.presence) - rank(b.presence);
    if (rd !== 0) return rd;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    data,
    meta: {
      canSendLetter: true,
    },
  });
}
