import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { withMetricsCache, invalidateMetricsCache } from "@/lib/metrics-cache";

type Ctx = { params: Promise<{ id: string }> };

function listBucket(
  title: string,
): "todo" | "progress" | "review" | "done" | "blocked" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(block|stuck|waiting|hold)/.test(t)) return "blocked";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** GET /api/workspaces/[id]/lead-dashboard */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const canLead =
    (await hasPermission(session.user.id, workspaceId, "board:settings")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:roles")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:audit"));
  if (!canLead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("fresh") === "1") {
    invalidateMetricsCache(`ws:${workspaceId}:lead`);
  }

  const data = await withMetricsCache(`ws:${workspaceId}:lead`, 15_000, async () => {
    const boards = await prisma.board.findMany({
      where: { workspaceId, archivedAt: null },
      select: {
        id: true,
        name: true,
        lists: {
          where: { archivedAt: null },
          select: {
            id: true,
            title: true,
            cards: {
              where: { archivedAt: null },
              select: {
                id: true,
                title: true,
                dueDate: true,
                createdAt: true,
                updatedAt: true,
                listId: true,
                assignees: {
                  select: {
                    userId: true,
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
              },
            },
          },
        },
        automations: { select: { id: true, name: true, isEnabled: true } },
        webhooks: { select: { id: true, url: true, isEnabled: true } },
      },
    });

    const now = new Date();
    const nowMs = now.getTime();
    const weekAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
    const twoWeeksAgo = nowMs - 14 * 24 * 60 * 60 * 1000;

    const statusCounts = {
      todo: 0,
      progress: 0,
      review: 0,
      done: 0,
      blocked: 0,
      overdue: 0,
      other: 0,
    };

    type WorkloadRow = {
      userId: string;
      name: string;
      email: string;
      avatarUrl: string | null;
      todo: number;
      progress: number;
      review: number;
      blocked: number;
      overdue: number;
      total: number;
      tasks: {
        id: string;
        title: string;
        boardId: string;
        boardName: string;
        status: string;
        dueDate: string | null;
      }[];
    };

    const workload = new Map<string, WorkloadRow>();
    type FlatCard = {
      id: string;
      title: string;
      boardId: string;
      boardName: string;
      bucket: string;
      dueDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    const flat: FlatCard[] = [];

    let closedThisWeek = 0;
    let closedPrevWeek = 0;

    for (const b of boards) {
      for (const l of b.lists) {
        const bucket = listBucket(l.title);
        for (const c of l.cards) {
          statusCounts[bucket] = (statusCounts[bucket] || 0) + 1;
          const overdue =
            !!c.dueDate && c.dueDate.getTime() < nowMs && bucket !== "done";
          if (overdue) statusCounts.overdue += 1;

          if (bucket === "done") {
            if (c.updatedAt.getTime() >= weekAgo) closedThisWeek += 1;
            else if (
              c.updatedAt.getTime() >= twoWeeksAgo &&
              c.updatedAt.getTime() < weekAgo
            ) {
              closedPrevWeek += 1;
            }
          }

          flat.push({
            id: c.id,
            title: c.title,
            boardId: b.id,
            boardName: b.name,
            bucket,
            dueDate: c.dueDate,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          });

          for (const a of c.assignees) {
            const prev = workload.get(a.userId) || {
              userId: a.userId,
              name: a.user.name || a.user.email,
              email: a.user.email,
              avatarUrl: a.user.avatarUrl,
              todo: 0,
              progress: 0,
              review: 0,
              blocked: 0,
              overdue: 0,
              total: 0,
              tasks: [],
            };
            if (bucket === "todo" || bucket === "other") prev.todo += 1;
            else if (bucket === "progress") prev.progress += 1;
            else if (bucket === "review") prev.review += 1;
            else if (bucket === "blocked") prev.blocked += 1;
            if (bucket !== "done") {
              prev.total += 1;
              if (overdue) prev.overdue += 1;
              prev.tasks.push({
                id: c.id,
                title: c.title,
                boardId: b.id,
                boardName: b.name,
                status: bucket,
                dueDate: c.dueDate?.toISOString() ?? null,
              });
            }
            workload.set(a.userId, prev);
          }
        }
      }
    }

    const open =
      statusCounts.todo +
      statusCounts.progress +
      statusCounts.review +
      statusCounts.blocked +
      statusCounts.other;
    const total = open + statusCounts.done;
    const completionRate = total ? Math.round((statusCounts.done / total) * 100) : 0;

    const totalTasksDelta = closedThisWeek - closedPrevWeek;
    // Estimated hours: 2h per open assigned task (until timesheet exists)
    const openAssigned = [...workload.values()].reduce((n, w) => n + w.total, 0);
    const loggedHours = Math.round(openAssigned * 2 + statusCounts.done * 1.5);

    // —— Burndown (14 days) ——
    const sprintDays = 14;
    const sprintStart = startOfDay(new Date(nowMs - (sprintDays - 1) * 86400000));
    const cardsAtStart = flat.filter((c) => c.createdAt.getTime() <= sprintStart.getTime() + 86400000);
    const startOpen =
      cardsAtStart.filter((c) => c.bucket !== "done").length +
      cardsAtStart.filter(
        (c) =>
          c.bucket === "done" && c.updatedAt.getTime() > sprintStart.getTime(),
      ).length;
    const burndownIdealStart = Math.max(startOpen, open, 1);

    const burndown: {
      date: string;
      label: string;
      ideal: number;
      actual: number;
    }[] = [];

    for (let i = 0; i < sprintDays; i++) {
      const day = new Date(sprintStart.getTime() + i * 86400000);
      const end = new Date(day.getTime() + 86400000 - 1);
      const ideal = Math.max(
        0,
        Math.round(burndownIdealStart * (1 - i / (sprintDays - 1))),
      );
      // Remaining = not done yet, OR done after this day
      const actual = flat.filter((c) => {
        if (c.createdAt.getTime() > end.getTime()) return false;
        if (c.bucket !== "done") return true;
        return c.updatedAt.getTime() > end.getTime();
      }).length;
      burndown.push({
        date: dayKey(day),
        label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        ideal,
        actual,
      });
    }

    // —— CFD (stacked counts per day) ——
    const cfd: {
      date: string;
      label: string;
      todo: number;
      progress: number;
      review: number;
      done: number;
    }[] = [];

    for (let i = 0; i < sprintDays; i++) {
      const day = new Date(sprintStart.getTime() + i * 86400000);
      const end = new Date(day.getTime() + 86400000 - 1);
      let todo = 0;
      let progress = 0;
      let review = 0;
      let done = 0;
      for (const c of flat) {
        if (c.createdAt.getTime() > end.getTime()) continue;
        const wasDoneByThen =
          c.bucket === "done" && c.updatedAt.getTime() <= end.getTime();
        if (wasDoneByThen) {
          done += 1;
        } else if (c.bucket === "review" || c.bucket === "blocked") {
          review += 1;
        } else if (c.bucket === "progress") {
          progress += 1;
        } else {
          todo += 1;
        }
      }
      cfd.push({
        date: dayKey(day),
        label: day.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        todo,
        progress,
        review,
        done,
      });
    }

    const workloadList = [...workload.values()]
      .map((w) => ({
        ...w,
        tasks: w.tasks.slice(0, 40),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 24);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId, status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      take: 80,
    });

    return {
      kpis: {
        totalTasks: total,
        totalTasksDelta,
        completionRate,
        blockedOverdue: statusCounts.blocked + statusCounts.overdue,
        overdue: statusCounts.overdue,
        blocked: statusCounts.blocked,
        loggedHours,
        loggedHoursEstimated: true,
        open,
        done: statusCounts.done,
      },
      statusBreakdown: statusCounts,
      doughnut: {
        done: statusCounts.done,
        progress: statusCounts.progress,
        review: statusCounts.review + statusCounts.blocked,
        todo: statusCounts.todo + statusCounts.other,
        open,
      },
      workload: workloadList,
      burndown,
      cfd,
      velocity: {
        closedThisWeek,
        closedPrevWeek,
        note: "Cards moved to Done in the last 7 days",
      },
      reassignTargets: members.map((m) => ({
        userId: m.userId,
        name: m.user.name || m.user.email,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      })),
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        automationCount: b.automations.filter((a) => a.isEnabled).length,
        webhookCount: b.webhooks.filter((w) => w.isEnabled).length,
      })),
      generatedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json({ data });
}
