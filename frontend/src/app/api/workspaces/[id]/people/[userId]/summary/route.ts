import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { canViewPersonAnalytics } from "@/lib/analytics-access";

type Ctx = { params: Promise<{ id: string; userId: string }> };

function listBucket(title: string): "todo" | "progress" | "review" | "done" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

/**
 * GET /api/workspaces/[id]/people/[userId]/summary?departmentId=
 * Lightweight workload summary — same access rules as people analytics.
 */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, userId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await isWorkspaceMember(userId, workspaceId))) {
    return NextResponse.json({ error: "User not in workspace" }, { status: 404 });
  }

  const access = await canViewPersonAnalytics(
    session.user.id,
    workspaceId,
    userId,
  );
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason || "Forbidden" },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const departmentId = url.searchParams.get("departmentId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const boardWhere = {
    workspaceId,
    archivedAt: null as null,
    ...(departmentId ? { departmentId } : {}),
  };

  const [assigned, createdCount, depts] = await Promise.all([
    prisma.cardAssignee.findMany({
      where: {
        userId,
        card: {
          archivedAt: null,
          list: { archivedAt: null, board: boardWhere },
        },
      },
      include: {
        card: {
          select: {
            id: true,
            title: true,
            dueDate: true,
            workflowStatus: true,
            list: {
              select: {
                title: true,
                board: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 200,
    }),
    prisma.card.count({
      where: {
        createdById: userId,
        archivedAt: null,
        list: { archivedAt: null, board: boardWhere },
      },
    }),
    prisma.departmentMember.findMany({
      where: {
        userId,
        department: { workspaceId },
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: { select: { id: true, name: true, color: true } },
      },
    }),
  ]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let open = 0;
  let done = 0;
  let overdue = 0;
  let inProgress = 0;
  let todo = 0;

  const classified = assigned.map((row) => {
    const bucket = listBucket(row.card.list.title);
    const isDone =
      bucket === "done" || row.card.workflowStatus === "APPROVED";
    const isOverdue =
      !isDone &&
      !!row.card.dueDate &&
      row.card.dueDate.getTime() < startOfDay.getTime();

    if (isDone) done += 1;
    else {
      open += 1;
      if (isOverdue) overdue += 1;
      if (
        bucket === "progress" ||
        row.card.workflowStatus === "IN_PROGRESS"
      ) {
        inProgress += 1;
      } else if (bucket === "todo") {
        todo += 1;
      }
    }

    return {
      id: row.card.id,
      title: row.card.title,
      boardId: row.card.list.board.id,
      boardName: row.card.list.board.name,
      listTitle: row.card.list.title,
      dueDate: row.card.dueDate?.toISOString() ?? null,
      status: isDone ? "done" : isOverdue ? "overdue" : bucket,
    };
  });

  const total = open + done;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return NextResponse.json({
    data: {
      user,
      scope: departmentId ? "department" : "workspace",
      departments: depts.map((d) => ({
        id: d.department.id,
        name: d.department.name,
        color: d.department.color,
        role: d.role,
      })),
      summary: {
        assigned: total,
        open,
        done,
        overdue,
        inProgress,
        todo,
        created: createdCount,
        completionPct,
      },
      recentTasks: classified.slice(0, 8),
    },
  });
}
