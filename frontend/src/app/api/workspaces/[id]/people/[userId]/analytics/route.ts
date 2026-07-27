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

type Insight = {
  kind: "strength" | "watch" | "risk";
  title: string;
  detail: string;
};

function buildHrBrief(input: {
  name: string;
  completionPct: number;
  overdue: number;
  open: number;
  delayRatePct: number;
  delayScore: number;
  chargedDelays: number;
  extensionRequested: number;
  extensionApproved: number;
  avgOverall: number | null;
  evalCount: number;
  scores: {
    quality: number | null;
    timeliness: number | null;
    communication: number | null;
    initiative: number | null;
    collaboration: number | null;
  };
  tasksApproved: number;
}): {
  summary: string;
  strengths: Insight[];
  weaknesses: Insight[];
  recommendations: string[];
  overallBand: "excellent" | "strong" | "mixed" | "needs_attention";
} {
  const strengths: Insight[] = [];
  const weaknesses: Insight[] = [];
  const recommendations: string[] = [];
  const first = input.name.split(/\s+/)[0] || "This teammate";

  if (input.completionPct >= 80 && input.open + input.overdue > 0) {
    strengths.push({
      kind: "strength",
      title: "Reliable delivery",
      detail: `${first} closes ${input.completionPct}% of assigned work — a strong throughput signal for team planning.`,
    });
  } else if (input.completionPct >= 60) {
    strengths.push({
      kind: "strength",
      title: "Steady progress",
      detail: `Completion sits at ${input.completionPct}%. Keep protecting focus time so this stays above 70%.`,
    });
  } else if (input.completionPct < 50 && input.open > 3) {
    weaknesses.push({
      kind: "risk",
      title: "Low completion rate",
      detail: `Only ${input.completionPct}% of assigned work is done while ${input.open} items remain open — capacity or prioritization may need a reset.`,
    });
    recommendations.push(
      "Run a 1:1 workload triage: cut, defer, or reassign the oldest open tasks.",
    );
  }

  if (input.overdue === 0 && input.open > 0) {
    strengths.push({
      kind: "strength",
      title: "On-time discipline",
      detail: "No overdue assigned tasks right now — schedule hygiene looks healthy.",
    });
  } else if (input.overdue >= 2 || input.delayRatePct >= 25) {
    weaknesses.push({
      kind: "risk",
      title: "Deadline pressure",
      detail: `${input.overdue} overdue · delay rate ${input.delayRatePct}% (score ${input.delayScore}). This often shows estimate gaps or blocked dependencies.`,
    });
    recommendations.push(
      "Require start/end estimates on new assignments and review blockers weekly.",
    );
  }

  if (input.extensionRequested >= 3) {
    weaknesses.push({
      kind: "watch",
      title: "Frequent extensions",
      detail: `${input.extensionRequested} extension requests this year (${input.extensionApproved} approved) — initial estimates may be optimistic.`,
    });
    recommendations.push(
      "Pair the next three tasks with a peer estimate check before kickoff.",
    );
  } else if (input.extensionRequested === 0 && input.tasksApproved >= 3) {
    strengths.push({
      kind: "strength",
      title: "Estimate accuracy",
      detail: "No extension requests against approved deliveries — planning confidence is high.",
    });
  }

  if (input.chargedDelays >= 2) {
    weaknesses.push({
      kind: "risk",
      title: "Charged delays",
      detail: `${input.chargedDelays} charged delay incidents — treat as a coaching topic, not only a metric.`,
    });
  }

  const s = input.scores;
  const dims: { key: string; label: string; value: number | null }[] = [
    { key: "quality", label: "Quality", value: s.quality },
    { key: "timeliness", label: "Timeliness", value: s.timeliness },
    { key: "communication", label: "Communication", value: s.communication },
    { key: "initiative", label: "Initiative", value: s.initiative },
    { key: "collaboration", label: "Collaboration", value: s.collaboration },
  ];
  const rated = dims.filter((d) => d.value != null) as {
    key: string;
    label: string;
    value: number;
  }[];
  if (rated.length) {
    const best = [...rated].sort((a, b) => b.value - a.value)[0];
    const worst = [...rated].sort((a, b) => a.value - b.value)[0];
    if (best.value >= 4) {
      strengths.push({
        kind: "strength",
        title: `Standout: ${best.label}`,
        detail: `Manager ratings average ${best.value.toFixed(1)}/5 on ${best.label.toLowerCase()} across ${input.evalCount} reviews.`,
      });
    }
    if (worst.value <= 3 && worst.key !== best.key) {
      weaknesses.push({
        kind: "watch",
        title: `Growth area: ${worst.label}`,
        detail: `${worst.label} averages ${worst.value.toFixed(1)}/5 — the clearest coaching lever from evaluations.`,
      });
      recommendations.push(
        `Set one concrete ${worst.label.toLowerCase()} goal for the next sprint and review it in standup.`,
      );
    }
  } else {
    recommendations.push(
      "No manager evaluations yet — approve completed work with a short 1–5 score to unlock HR scoring.",
    );
  }

  let overallBand: "excellent" | "strong" | "mixed" | "needs_attention" = "mixed";
  const score = input.avgOverall;
  if (
    (score != null && score >= 4.3 && input.completionPct >= 75 && input.delayRatePct < 15) ||
    (score == null && input.completionPct >= 85 && input.overdue === 0)
  ) {
    overallBand = "excellent";
  } else if (
    (score != null && score >= 3.6) ||
    (input.completionPct >= 65 && input.delayRatePct < 30)
  ) {
    overallBand = "strong";
  } else if (
    (score != null && score < 3) ||
    input.completionPct < 45 ||
    input.delayRatePct >= 40 ||
    input.overdue >= 4
  ) {
    overallBand = "needs_attention";
  }

  const bandCopy = {
    excellent: `${first} is performing at a high bar — protect autonomy and use them as a peer mentor.`,
    strong: `${first} is a solid contributor with clear upside; reinforce strengths while closing one weakness.`,
    mixed: `${first} shows mixed signals — balance recognition with a focused improvement plan.`,
    needs_attention: `${first} needs structured support now — clarify priorities, capacity, and coaching ownership.`,
  } as const;

  if (recommendations.length === 0) {
    recommendations.push(
      "Keep monthly check-ins light: confirm workload fit and celebrate one shipped outcome.",
    );
  }

  return {
    summary: bandCopy[overallBand],
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    overallBand,
  };
}

/**
 * GET /api/workspaces/[id]/people/[userId]/analytics?year=
 * Full people analytics dossier (workload, trends, evaluations, HR brief).
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
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: {
      role: { select: { id: true, name: true } },
    },
  });

  const boardWhere = { workspaceId, archivedAt: null as null };

  const [
    assigned,
    createdCount,
    depts,
    evaluations,
    extensions,
    incidents,
    approvedCards,
  ] = await Promise.all([
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
            createdAt: true,
            approvedAt: true,
            list: {
              select: {
                title: true,
                board: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      take: 400,
    }),
    prisma.card.count({
      where: {
        createdById: userId,
        archivedAt: null,
        list: { archivedAt: null, board: boardWhere },
      },
    }),
    prisma.departmentMember.findMany({
      where: { userId, department: { workspaceId } },
      include: {
        department: { select: { id: true, name: true, color: true, key: true } },
      },
    }),
    prisma.cardEvaluation.findMany({
      where: {
        workspaceId,
        employeeId: userId,
        createdAt: { gte: from, lt: to },
      },
      include: {
        card: { select: { id: true, title: true } },
        evaluator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.cardExtensionRequest.findMany({
      where: {
        workspaceId,
        requestedById: userId,
        createdAt: { gte: from, lt: to },
      },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.cardDelayIncident.findMany({
      where: {
        workspaceId,
        employeeId: userId,
        overdueAt: { gte: from, lt: to },
      },
      select: { id: true, status: true, daysLate: true, overdueAt: true },
    }),
    prisma.card.findMany({
      where: {
        list: { board: { workspaceId } },
        workflowStatus: "APPROVED",
        approvedAt: { gte: from, lt: to },
        assignees: { some: { userId } },
      },
      select: { id: true, approvedAt: true, dueDate: true, submittedAt: true },
      take: 500,
    }),
  ]);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let open = 0;
  let done = 0;
  let overdue = 0;
  let inProgress = 0;
  let todo = 0;
  let review = 0;

  const monthlyMap = new Map<
    string,
    { month: string; assigned: number; done: number; overdue: number }
  >();
  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { month: key, assigned: 0, done: 0, overdue: 0 });
  }

  const recentTasks = assigned.slice(0, 10).map((row) => {
    const bucket = listBucket(row.card.list.title);
    const isDone =
      bucket === "done" || row.card.workflowStatus === "APPROVED";
    const isOverdue =
      !isDone &&
      !!row.card.dueDate &&
      row.card.dueDate.getTime() < startOfDay.getTime();
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

  for (const row of assigned) {
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
      if (bucket === "progress" || row.card.workflowStatus === "IN_PROGRESS") {
        inProgress += 1;
      } else if (bucket === "todo") todo += 1;
      else if (bucket === "review") review += 1;
    }

    const created = row.card.createdAt;
    if (created >= from && created < to) {
      const key = `${created.getUTCFullYear()}-${String(created.getUTCMonth() + 1).padStart(2, "0")}`;
      const slot = monthlyMap.get(key);
      if (slot) {
        slot.assigned += 1;
        if (isDone) slot.done += 1;
        if (isOverdue) slot.overdue += 1;
      }
    }
  }

  const total = open + done;
  const completionPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const avg = (vals: number[]) =>
    vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;

  const scores = {
    quality: avg(evaluations.map((e) => e.quality).filter((n): n is number => n != null)),
    timeliness: avg(
      evaluations.map((e) => e.timeliness).filter((n): n is number => n != null),
    ),
    communication: avg(
      evaluations.map((e) => e.communication).filter((n): n is number => n != null),
    ),
    initiative: avg(
      evaluations.map((e) => e.initiative).filter((n): n is number => n != null),
    ),
    collaboration: avg(
      evaluations.map((e) => e.collaboration).filter((n): n is number => n != null),
    ),
    overall: avg(
      evaluations.map((e) => e.overall).filter((n): n is number => n != null),
    ),
  };

  const chargedDelays = incidents.filter((i) => i.status === "CHARGED").length;
  const waivedDelays = incidents.filter((i) => i.status === "WAIVED").length;
  const openDelays = incidents.filter((i) => i.status === "OPEN").length;
  const completedOnTime = approvedCards.filter((c) => {
    if (!c.dueDate || !c.approvedAt) return true;
    return c.approvedAt.getTime() <= c.dueDate.getTime();
  }).length;
  const delayDenom = approvedCards.length + incidents.length;
  const delayRatePct =
    delayDenom > 0
      ? Math.round(((chargedDelays + openDelays) / delayDenom) * 100)
      : 0;
  const delayScore = Math.max(0, 100 - delayRatePct * 2 - overdue * 3);

  const extensionRequested = extensions.length;
  const extensionApproved = extensions.filter((e) => e.status === "APPROVED").length;

  const displayName = user.name || user.email;
  const hr = buildHrBrief({
    name: displayName,
    completionPct,
    overdue,
    open,
    delayRatePct,
    delayScore,
    chargedDelays,
    extensionRequested,
    extensionApproved,
    avgOverall: scores.overall,
    evalCount: evaluations.length,
    scores,
    tasksApproved: approvedCards.length,
  });

  return NextResponse.json({
    data: {
      user,
      member: member
        ? {
            title: member.title,
            status: member.status,
            role: member.role,
          }
        : null,
      accessScope: access.scope,
      year,
      departments: depts.map((d) => ({
        id: d.department.id,
        name: d.department.name,
        color: d.department.color,
        key: d.department.key,
        role: d.role,
      })),
      workload: {
        assigned: total,
        open,
        done,
        overdue,
        inProgress,
        todo,
        review,
        created: createdCount,
        completionPct,
      },
      trends: {
        extensionRequested,
        extensionApproved,
        chargedDelays,
        waivedDelays,
        openDelays,
        completedOnTime,
        tasksApproved: approvedCards.length,
        delayRatePct,
        delayScore,
      },
      evaluations: {
        count: evaluations.length,
        averages: scores,
        recent: evaluations.slice(0, 8).map((e) => ({
          id: e.id,
          overall: e.overall,
          quality: e.quality,
          timeliness: e.timeliness,
          communication: e.communication,
          initiative: e.initiative,
          collaboration: e.collaboration,
          note: e.notes,
          strengths: e.strengths,
          improvements: e.improvements,
          createdAt: e.createdAt.toISOString(),
          cardTitle: e.card.title,
          evaluatorName: e.evaluator.name || e.evaluator.email,
        })),
      },
      charts: {
        statusBreakdown: [
          { name: "To Do", value: todo, color: "#94a3b8" },
          { name: "In progress", value: inProgress, color: "#3b82f6" },
          { name: "Review", value: review, color: "#a855f7" },
          { name: "Done", value: done, color: "#22c55e" },
          { name: "Overdue", value: overdue, color: "#ef4444" },
        ],
        scoreRadar: [
          { name: "Quality", value: scores.quality ?? 0 },
          { name: "Timeliness", value: scores.timeliness ?? 0 },
          { name: "Communication", value: scores.communication ?? 0 },
          { name: "Initiative", value: scores.initiative ?? 0 },
          { name: "Collaboration", value: scores.collaboration ?? 0 },
        ],
        monthly: Array.from(monthlyMap.values()),
      },
      recentTasks,
      hr,
    },
  });
}
