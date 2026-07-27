import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { resolveAnalyticsScope } from "@/lib/analytics-access";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/evaluations?year=&departmentId=&employeeId=
 * Manager 1–5 ratings + notes after task approve — scoped like Analytics.
 */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const employeeIdParam = url.searchParams.get("employeeId") || undefined;
  const departmentId = url.searchParams.get("departmentId") || null;
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());
  const modeParam = url.searchParams.get("mode");
  const mode =
    modeParam === "team" || modeParam === "company"
      ? modeParam
      : departmentId
        ? "team"
        : "company";
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  const scope = await resolveAnalyticsScope(
    session.user.id,
    workspaceId,
    departmentId,
    mode,
  );

  if (mode === "team" && !departmentId) {
    return NextResponse.json({
      data: { year, people: [] },
      meta: {
        canManage: scope.canTeam,
        canCompany: scope.canCompany,
        departments: scope.departments,
        departmentId: null,
        needsDepartment: true,
      },
    });
  }

  let employeeFilter: string[] | string | undefined;

  if (!scope.canTeam) {
    // Self only
    if (employeeIdParam && employeeIdParam !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    employeeFilter = session.user.id;
  } else if (employeeIdParam) {
    if (
      scope.employeeUserIds &&
      !scope.employeeUserIds.includes(employeeIdParam)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    employeeFilter = employeeIdParam;
  } else if (scope.employeeUserIds) {
    employeeFilter = scope.employeeUserIds;
  }

  const rows = await prisma.cardEvaluation.findMany({
    where: {
      workspaceId,
      createdAt: { gte: from, lt: to },
      ...(typeof employeeFilter === "string"
        ? { employeeId: employeeFilter }
        : Array.isArray(employeeFilter)
          ? { employeeId: { in: employeeFilter } }
          : {}),
    },
    include: {
      card: { select: { id: true, title: true } },
      employee: { select: { id: true, name: true, email: true } },
      evaluator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  type Agg = {
    employeeId: string;
    name: string;
    email: string;
    count: number;
    averages: {
      quality: number;
      timeliness: number;
      communication: number;
      initiative: number;
      collaboration: number;
      overall: number;
    };
    evaluations: typeof rows;
  };

  const byEmployee = new Map<string, Agg>();
  for (const r of rows) {
    let agg = byEmployee.get(r.employeeId);
    if (!agg) {
      agg = {
        employeeId: r.employeeId,
        name: r.employee.name || r.employee.email,
        email: r.employee.email,
        count: 0,
        averages: {
          quality: 0,
          timeliness: 0,
          communication: 0,
          initiative: 0,
          collaboration: 0,
          overall: 0,
        },
        evaluations: [],
      };
      byEmployee.set(r.employeeId, agg);
    }
    agg.count += 1;
    agg.averages.quality += r.quality;
    agg.averages.timeliness += r.timeliness;
    agg.averages.communication += r.communication;
    agg.averages.initiative += r.initiative;
    agg.averages.collaboration += r.collaboration;
    agg.averages.overall += r.overall;
    agg.evaluations.push(r);
  }

  const people = [...byEmployee.values()]
    .map((a) => ({
      employeeId: a.employeeId,
      name: a.name,
      email: a.email,
      taskCount: a.count,
      averages: {
        quality: +(a.averages.quality / a.count).toFixed(2),
        timeliness: +(a.averages.timeliness / a.count).toFixed(2),
        communication: +(a.averages.communication / a.count).toFixed(2),
        initiative: +(a.averages.initiative / a.count).toFixed(2),
        collaboration: +(a.averages.collaboration / a.count).toFixed(2),
        overall: +(a.averages.overall / a.count).toFixed(2),
      },
      evaluations: a.evaluations.map((e) => ({
        id: e.id,
        cardId: e.cardId,
        cardTitle: e.card.title,
        quality: e.quality,
        timeliness: e.timeliness,
        communication: e.communication,
        initiative: e.initiative,
        collaboration: e.collaboration,
        overall: e.overall,
        strengths: e.strengths,
        improvements: e.improvements,
        notes: e.notes,
        evaluator: e.evaluator,
        createdAt: e.createdAt,
      })),
    }))
    .sort((a, b) => b.averages.overall - a.averages.overall);

  return NextResponse.json({
    data: { year, people },
    meta: {
      canManage: scope.canTeam,
      canCompany: scope.canCompany,
      departments: scope.departments,
      departmentId,
    },
  });
}
