import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { isChecklistBookend } from "@/lib/checklist-defaults";

type Ctx = { params: Promise<{ id: string }> };

function dueBucket(
  due: Date | null,
): "overdue" | "today" | "tomorrow" | "week" | "later" | "none" {
  if (!due) return "none";
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(start.getTime() + 86400000);
  const endTomorrow = new Date(start.getTime() + 2 * 86400000);
  const endWeek = new Date(start.getTime() + 7 * 86400000);
  const t = due.getTime();
  if (t < start.getTime()) return "overdue";
  if (t < endToday.getTime()) return "today";
  if (t < endTomorrow.getTime()) return "tomorrow";
  if (t < endWeek.getTime()) return "week";
  return "later";
}

function listBucket(title: string): "todo" | "progress" | "review" | "done" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

/** GET /api/workspaces/[id]/my-dashboard — personal tasks & my projects only */
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

  const assigned = await prisma.cardAssignee.findMany({
    where: {
      userId,
      card: {
        archivedAt: null,
        list: { archivedAt: null, board: { workspaceId, archivedAt: null } },
      },
    },
    include: {
      card: {
        include: {
          list: {
            select: {
              id: true,
              title: true,
              board: { select: { id: true, name: true, updatedAt: true } },
            },
          },
          checklistItems: { select: { id: true, title: true, isDone: true }, orderBy: { order: 'asc' as const } },
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          labels: {
            include: { label: { select: { id: true, name: true, color: true } } },
          },
          delayIncident: {
            select: { id: true, status: true, daysLate: true },
          },
          extensionRequests: {
            where: { status: "PENDING" },
            select: { id: true },
            take: 1,
          },
          _count: { select: { comments: true, attachments: true } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
    take: 300,
  });

  const now = Date.now();
  const { ensureDelayIncident } = await import("@/lib/card-delay");

  // Lazy-open delay incidents for overdue assigned cards
  await Promise.all(
    assigned
      .filter(
        (a) =>
          a.card.dueDate &&
          a.card.dueDate.getTime() < now &&
          a.card.workflowStatus !== "APPROVED",
      )
      .slice(0, 40)
      .map((a) =>
        ensureDelayIncident({
          cardId: a.card.id,
          workspaceId,
          dueDate: a.card.dueDate,
          workflowStatus: a.card.workflowStatus,
          assigneeUserIds: [userId],
          createdById: a.card.createdById,
        }),
      ),
  );

  const delayByCard = new Map(
    (
      await prisma.cardDelayIncident.findMany({
        where: { cardId: { in: assigned.map((a) => a.card.id) } },
        select: { cardId: true, status: true, daysLate: true, id: true },
      })
    ).map((d) => [d.cardId, d] as const),
  );

  const progress = { todo: 0, progress: 0, review: 0, done: 0, overdue: 0, other: 0 };
  const projectMap = new Map<
    string,
    {
      id: string;
      name: string;
      updatedAt: string;
      open: number;
      done: number;
      overdue: number;
    }
  >();

  const tasks = assigned.map((a) => {
    const bucket = dueBucket(a.card.dueDate);
    const listStatus = listBucket(a.card.list.title);
    const workflowStatus = a.card.workflowStatus;
    let status = listStatus;
    if (workflowStatus === "IN_PROGRESS" || workflowStatus === "PENDING_APPROVAL") {
      status = workflowStatus === "PENDING_APPROVAL" ? "review" : "progress";
    } else if (workflowStatus === "APPROVED") {
      status = "done";
    }
    progress[status] = (progress[status] || 0) + 1;
    if (a.card.dueDate && a.card.dueDate.getTime() < now && status !== "done") {
      progress.overdue += 1;
    }

    const board = a.card.list.board;
    const prev = projectMap.get(board.id) || {
      id: board.id,
      name: board.name,
      updatedAt: board.updatedAt.toISOString(),
      open: 0,
      done: 0,
      overdue: 0,
    };
    if (status === "done") prev.done += 1;
    else {
      prev.open += 1;
      if (a.card.dueDate && a.card.dueDate.getTime() < now) prev.overdue += 1;
    }
    projectMap.set(board.id, prev);

    const checks = a.card.checklistItems;
    const milestones = checks.filter((c) => !isChecklistBookend(c.title));
    const done = milestones.filter((c) => c.isDone).length;
    return {
      id: a.card.id,
      title: a.card.title,
      description: a.card.description,
      dueDate: a.card.dueDate?.toISOString() ?? null,
      startDate: a.card.startDate?.toISOString() ?? null,
      priority: a.card.priority,
      bucket,
      status,
      workflowStatus,
      startedAt: a.card.startedAt?.toISOString() ?? null,
      estimatedHours: a.card.estimatedHours,
      list: { id: a.card.list.id, title: a.card.list.title },
      board: { id: board.id, name: board.name },
      labels: a.card.labels.map((cl) => ({
        id: cl.label.id,
        name: cl.label.name,
        color: cl.label.color,
      })),
      checklist: { done, total: milestones.length },
      checklistItems: checks.map((c) => ({
        id: c.id,
        title: c.title,
        isDone: c.isDone,
      })),
      assignees: a.card.assignees.map((as) => ({
        id: as.user.id,
        name: as.user.name || as.user.email || 'User',
        avatarUrl: as.user.avatarUrl,
      })),
      commentCount: a.card._count.comments,
      attachmentCount: a.card._count.attachments,
      delayStatus: delayByCard.get(a.card.id)?.status ?? null,
      delayIncidentId: delayByCard.get(a.card.id)?.id ?? null,
      hasPendingExtension: (a.card.extensionRequests?.length ?? 0) > 0,
    };
  });

  const openTasks = tasks.filter((t) => t.status !== "done");
  const myProjects = [...projectMap.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const calendar = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      cardId: t.id,
      title: t.title,
      dueDate: t.dueDate!,
      boardId: t.board.id,
      boardName: t.board.name,
      status: t.status,
      priority: t.priority,
      labels: t.labels,
    }));

  const openCount = openTasks.length;
  const doneCount = progress.done;
  const total = tasks.length;
  const completionPct = total ? Math.round((doneCount / total) * 100) : 0;
  const todayAll = tasks.filter((t) => t.bucket === "today");
  const todayOpen = openTasks.filter((t) => t.bucket === "today").length;

  return NextResponse.json({
    data: {
      tasks,
      buckets: {
        overdue: openTasks.filter((t) => t.bucket === "overdue"),
        today: openTasks.filter((t) => t.bucket === "today"),
        tomorrow: openTasks.filter((t) => t.bucket === "tomorrow"),
        week: openTasks.filter((t) => t.bucket === "week"),
        later: openTasks.filter((t) => t.bucket === "later"),
        nodate: openTasks.filter((t) => t.bucket === "none"),
      },
      boardColumns: {
        todo: openTasks.filter((t) => t.status === "todo" || t.status === "other"),
        progress: openTasks.filter((t) => t.status === "progress"),
        review: openTasks.filter((t) => t.status === "review"),
        done: tasks.filter((t) => t.status === "done").slice(0, 40),
      },
      myProjects,
      progress,
      summary: {
        total,
        open: openCount,
        done: doneCount,
        overdue: progress.overdue,
        completionPct,
        todayOpen,
        inboxZeroToday: todayAll.length > 0 && todayOpen === 0,
      },
      calendar,
    },
  });
}
