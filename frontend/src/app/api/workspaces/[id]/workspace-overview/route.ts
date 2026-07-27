import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";

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
 * GET /api/workspaces/[id]/workspace-overview
 * Workspace-wide trends + all visible projects (scoped by permission).
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

  const userId = session.user.id;
  const [isManager, canAudit, canLead, membership, workspace] = await Promise.all([
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "workspace:audit"),
    hasPermission(userId, workspaceId, "board:settings"),
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { role: { select: { name: true } } },
    }),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true },
    }),
  ]);

  if (!workspace || !membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const fullAccess = isManager || canAudit || canLead;

  const boards = await prisma.board.findMany({
    where: {
      workspaceId,
      archivedAt: null,
      ...(fullAccess ? {} : { visibility: { in: ["WORKSPACE", "PUBLIC"] } }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      updatedAt: true,
      lists: {
        where: { archivedAt: null },
        select: {
          title: true,
          cards: {
            where: { archivedAt: null },
            select: {
              id: true,
              dueDate: true,
              updatedAt: true,
              assignees: {
                select: {
                  userId: true,
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const statusBreakdown = {
    todo: 0,
    progress: 0,
    review: 0,
    done: 0,
    overdue: 0,
    other: 0,
  };
  const workload = new Map<string, { name: string; email: string; count: number }>();
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  let closedThisWeek = 0;
  let openCards = 0;

  const projects = boards.map((b) => {
    let open = 0;
    let done = 0;
    let overdue = 0;
    let todo = 0;
    let progress = 0;
    let review = 0;

    for (const l of b.lists) {
      const bucket = listBucket(l.title);
      for (const c of l.cards) {
        statusBreakdown[bucket] = (statusBreakdown[bucket] || 0) + 1;
        if (bucket === "done") {
          done += 1;
          if (c.updatedAt.getTime() >= weekAgo) closedThisWeek += 1;
        } else {
          open += 1;
          openCards += 1;
          if (bucket === "todo") todo += 1;
          else if (bucket === "progress") progress += 1;
          else if (bucket === "review") review += 1;
          if (c.dueDate && c.dueDate.getTime() < now) {
            overdue += 1;
            statusBreakdown.overdue += 1;
          }
        }

        if (fullAccess) {
          for (const a of c.assignees) {
            const prev = workload.get(a.userId) || {
              name: a.user.name || a.user.email,
              email: a.user.email,
              count: 0,
            };
            prev.count += 1;
            workload.set(a.userId, prev);
          }
        }
      }
    }

    const total = open + done;
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      visibility: b.visibility,
      updatedAt: b.updatedAt,
      open,
      done,
      overdue,
      todo,
      progress,
      review,
      total,
      completionPct: total ? Math.round((done / total) * 100) : 0,
    };
  });

  const totalCards = projects.reduce((n, p) => n + p.total, 0);
  const totalDone = projects.reduce((n, p) => n + p.done, 0);

  return NextResponse.json({
    data: {
      workspace: { id: workspace.id, name: workspace.name },
      me: {
        roleName: membership.role.name,
        title: membership.title,
      },
      scope: fullAccess ? "manager" : "member",
      summary: {
        projectCount: projects.length,
        openCards,
        doneCards: totalDone,
        totalCards,
        overdue: statusBreakdown.overdue,
        completionPct: totalCards ? Math.round((totalDone / totalCards) * 100) : 0,
        closedThisWeek,
      },
      statusBreakdown,
      projects,
      workload: fullAccess
        ? [...workload.entries()]
            .map(([userId, v]) => ({ userId, ...v }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15)
        : [],
    },
  });
}
