import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { resolveAnalyticsScope } from "@/lib/analytics-access";

type Ctx = { params: Promise<{ id: string }> };

type EmployeeTrend = {
  employeeId: string;
  name: string;
  email: string;
  departmentNames: string[];
  extensionRequested: number;
  extensionApproved: number;
  extensionRejected: number;
  totalAddedHours: number;
  totalAddedDays: number;
  avgAddedHours: number;
  avgAddedDays: number;
  chargedDelays: number;
  waivedDelays: number;
  openDelays: number;
  completedOnTime: number;
  delayRatePct: number;
  delayScore: number;
  tasksApproved: number;
};

type CreatorTrend = {
  creatorId: string;
  name: string;
  email: string;
  tasksCreated: number;
  extensionsOnCreatedTasks: number;
  approvedExtensions: number;
  totalAddedHours: number;
  totalAddedDays: number;
  chargedOnCreatedTasks: number;
  signal: "ok" | "watch" | "weak_estimate";
};

type Acc = EmployeeTrend & {
  _addedH: number;
  _addedD: number;
  _extApproved: number;
};

/**
 * GET /api/workspaces/[id]/work-trends?year=&departmentId=
 * Scoped by analytics:company | analytics:team | dept manager/supervisor.
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
  const year = Number(url.searchParams.get("year") || new Date().getFullYear());
  const departmentId = url.searchParams.get("departmentId") || null;
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

  if (!scope.canTeam) {
    const mine = await buildEmployeeTrends(workspaceId, from, to, [
      session.user.id,
    ]);
    return NextResponse.json({
      data: {
        year,
        employees: mine,
        creators: [],
        scope: "self" as const,
      },
      meta: {
        canManage: false,
        canCompany: false,
        canTeam: false,
        departments: [],
      },
    });
  }

  if (
    scope.mode === "team" &&
    !departmentId &&
    scope.employeeUserIds?.length === 0
  ) {
    return NextResponse.json({
      data: {
        year,
        employees: [],
        creators: [],
        scope: "team",
      },
      meta: {
        canManage: true,
        canCompany: scope.canCompany,
        canTeam: scope.canTeam,
        departments: scope.departments,
        departmentId: null,
        mode: "team",
        needsDepartment: true,
      },
    });
  }

  if (departmentId && scope.employeeUserIds?.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [employees, creators] = await Promise.all([
    buildEmployeeTrends(workspaceId, from, to, scope.employeeUserIds),
    buildCreatorTrends(workspaceId, from, to, departmentId, scope),
  ]);

  return NextResponse.json({
    data: {
      year,
      employees,
      creators,
      scope: scope.mode,
    },
    meta: {
      canManage: true,
      canCompany: scope.canCompany,
      canTeam: scope.canTeam,
      departments: scope.departments,
      departmentId,
      mode: scope.mode,
      needsDepartment: false,
    },
  });
}

async function buildEmployeeTrends(
  workspaceId: string,
  from: Date,
  to: Date,
  scopeUserIds: string[] | null,
): Promise<EmployeeTrend[]> {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      status: "ACTIVE",
      ...(scopeUserIds ? { userId: { in: scopeUserIds } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    take: 500,
  });

  const userIds = members.map((m) => m.userId);
  if (!userIds.length) return [];

  const deptMemberships = await prisma.departmentMember.findMany({
    where: {
      userId: { in: userIds },
      department: { workspaceId },
    },
    include: {
      department: { select: { name: true } },
    },
  });
  const deptsByUser = new Map<string, string[]>();
  for (const dm of deptMemberships) {
    const list = deptsByUser.get(dm.userId) || [];
    list.push(dm.department.name);
    deptsByUser.set(dm.userId, list);
  }

  const userFilter = { in: userIds };

  const [extensions, changes, incidents, approvedCards, delayReschedules] =
    await Promise.all([
      prisma.cardExtensionRequest.findMany({
        where: {
          workspaceId,
          createdAt: { gte: from, lt: to },
          requestedById: userFilter,
        },
        include: {
          requestedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.cardScheduleChange.findMany({
        where: {
          workspaceId,
          createdAt: { gte: from, lt: to },
          source: "EXTENSION_APPROVED",
          extensionRequest: { requestedById: userFilter },
        },
        include: {
          extensionRequest: { select: { requestedById: true } },
        },
      }),
      prisma.cardDelayIncident.findMany({
        where: {
          workspaceId,
          overdueAt: { gte: from, lt: to },
          employeeId: userFilter,
        },
        include: {
          employee: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.card.findMany({
        where: {
          list: { board: { workspaceId } },
          workflowStatus: "APPROVED",
          approvedAt: { gte: from, lt: to },
          assignees: { some: { userId: userFilter } },
        },
        select: {
          dueDate: true,
          submittedAt: true,
          approvedAt: true,
          assignees: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, email: true } },
            },
            take: 1,
          },
        },
        take: 2000,
      }),
      prisma.cardScheduleChange.findMany({
        where: {
          workspaceId,
          createdAt: { gte: from, lt: to },
          source: "DELAY_RESCHEDULE",
        },
        select: {
          cardId: true,
          addedDays: true,
          addedHours: true,
        },
      }),
    ]);

  const rescheduleCardIds = delayReschedules.map((r) => r.cardId);
  const rescheduleAssignees =
    rescheduleCardIds.length > 0
      ? await prisma.cardAssignee.findMany({
          where: {
            cardId: { in: rescheduleCardIds },
            userId: userFilter,
          },
          select: {
            cardId: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })
      : [];
  const primaryByCard = new Map<
    string,
    { id: string; name: string; email: string }
  >();
  for (const a of rescheduleAssignees) {
    if (!primaryByCard.has(a.cardId)) {
      primaryByCard.set(a.cardId, {
        id: a.user.id,
        name: a.user.name || a.user.email,
        email: a.user.email,
      });
    }
  }

  const map = new Map<string, Acc>();

  function ensure(id: string, name: string, email: string): Acc {
    let row = map.get(id);
    if (!row) {
      row = {
        employeeId: id,
        name,
        email,
        departmentNames: deptsByUser.get(id) || [],
        extensionRequested: 0,
        extensionApproved: 0,
        extensionRejected: 0,
        totalAddedHours: 0,
        totalAddedDays: 0,
        avgAddedHours: 0,
        avgAddedDays: 0,
        chargedDelays: 0,
        waivedDelays: 0,
        openDelays: 0,
        completedOnTime: 0,
        delayRatePct: 0,
        delayScore: 0,
        tasksApproved: 0,
        _addedH: 0,
        _addedD: 0,
        _extApproved: 0,
      };
      map.set(id, row);
    }
    return row;
  }

  for (const m of members) {
    ensure(m.user.id, m.user.name || m.user.email, m.user.email);
  }

  for (const e of extensions) {
    const row = ensure(
      e.requestedById,
      e.requestedBy.name || e.requestedBy.email,
      e.requestedBy.email,
    );
    row.extensionRequested += 1;
    if (e.status === "APPROVED") row.extensionApproved += 1;
    if (e.status === "REJECTED") row.extensionRejected += 1;
  }

  for (const c of changes) {
    const empId = c.extensionRequest?.requestedById;
    if (!empId) continue;
    const row = map.get(empId);
    if (!row) continue;
    row._addedH += c.addedHours;
    row._addedD += c.addedDays;
    row._extApproved += 1;
  }

  for (const r of delayReschedules) {
    const emp = primaryByCard.get(r.cardId);
    if (!emp) continue;
    const row = map.get(emp.id);
    if (!row) continue;
    row._addedH += r.addedHours;
    row._addedD += r.addedDays;
  }

  for (const i of incidents) {
    const row = ensure(
      i.employeeId,
      i.employee.name || i.employee.email,
      i.employee.email,
    );
    if (i.status === "CHARGED") {
      row.chargedDelays += 1;
      row.delayScore -= 1;
    } else if (i.status === "WAIVED") {
      row.waivedDelays += 1;
    } else if (i.status === "OPEN") {
      row.openDelays += 1;
    }
  }

  for (const c of approvedCards) {
    const a = c.assignees[0];
    if (!a || !map.has(a.user.id)) continue;
    const row = ensure(
      a.user.id,
      a.user.name || a.user.email,
      a.user.email,
    );
    row.tasksApproved += 1;
    const finish = c.submittedAt || c.approvedAt;
    if (!finish) continue;
    if (c.dueDate && finish.getTime() > c.dueDate.getTime()) continue;
    row.completedOnTime += 1;
  }

  return [...map.values()]
    .map((r) => {
      const denom = r.chargedDelays + r.completedOnTime;
      const delayRatePct =
        denom > 0 ? Math.round((r.chargedDelays / denom) * 1000) / 10 : 0;
      const avgAddedHours =
        r._extApproved > 0
          ? Math.round((r._addedH / r._extApproved) * 100) / 100
          : 0;
      const avgAddedDays =
        r._extApproved > 0
          ? Math.round((r._addedD / r._extApproved) * 100) / 100
          : 0;
      return {
        employeeId: r.employeeId,
        name: r.name,
        email: r.email,
        departmentNames: r.departmentNames,
        extensionRequested: r.extensionRequested,
        extensionApproved: r.extensionApproved,
        extensionRejected: r.extensionRejected,
        totalAddedHours: Math.round(r._addedH * 100) / 100,
        totalAddedDays: Math.round(r._addedD * 100) / 100,
        avgAddedHours,
        avgAddedDays,
        chargedDelays: r.chargedDelays,
        waivedDelays: r.waivedDelays,
        openDelays: r.openDelays,
        completedOnTime: r.completedOnTime,
        delayRatePct,
        delayScore: r.delayScore,
        tasksApproved: r.tasksApproved,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function buildCreatorTrends(
  workspaceId: string,
  from: Date,
  to: Date,
  departmentId: string | null,
  scope: Awaited<ReturnType<typeof resolveAnalyticsScope>>,
): Promise<CreatorTrend[]> {
  const boardFilter = departmentId
    ? { workspaceId, departmentId }
    : !scope.canCompany && scope.departments.length
      ? {
          workspaceId,
          departmentId: { in: scope.departments.map((d) => d.id) },
        }
      : { workspaceId };

  const cards = await prisma.card.findMany({
    where: {
      list: { board: boardFilter },
      createdAt: { gte: from, lt: to },
      createdById: { not: null },
    },
    select: {
      id: true,
      createdById: true,
      createdBy: { select: { id: true, name: true, email: true } },
    },
    take: 5000,
  });

  const cardIds = cards.map((c) => c.id);
  if (!cardIds.length) return [];

  const [extensions, changes, incidents] = await Promise.all([
    prisma.cardExtensionRequest.findMany({
      where: {
        workspaceId,
        cardId: { in: cardIds },
        createdAt: { gte: from, lt: to },
      },
      select: { cardId: true, status: true },
    }),
    prisma.cardScheduleChange.findMany({
      where: {
        workspaceId,
        cardId: { in: cardIds },
        source: "EXTENSION_APPROVED",
        createdAt: { gte: from, lt: to },
      },
      select: { cardId: true, addedHours: true, addedDays: true },
    }),
    prisma.cardDelayIncident.findMany({
      where: {
        workspaceId,
        cardId: { in: cardIds },
        status: "CHARGED",
        overdueAt: { gte: from, lt: to },
      },
      select: { cardId: true },
    }),
  ]);

  const cardToCreator = new Map(
    cards
      .filter((c) => c.createdById && c.createdBy)
      .map((c) => [c.id, c.createdBy!] as const),
  );

  const map = new Map<string, CreatorTrend>();

  for (const c of cards) {
    if (!c.createdById || !c.createdBy) continue;
    let row = map.get(c.createdById);
    if (!row) {
      row = {
        creatorId: c.createdById,
        name: c.createdBy.name || c.createdBy.email,
        email: c.createdBy.email,
        tasksCreated: 0,
        extensionsOnCreatedTasks: 0,
        approvedExtensions: 0,
        totalAddedHours: 0,
        totalAddedDays: 0,
        chargedOnCreatedTasks: 0,
        signal: "ok",
      };
      map.set(c.createdById, row);
    }
    row.tasksCreated += 1;
  }

  for (const e of extensions) {
    const creator = cardToCreator.get(e.cardId);
    if (!creator) continue;
    const row = map.get(creator.id);
    if (!row) continue;
    row.extensionsOnCreatedTasks += 1;
    if (e.status === "APPROVED") row.approvedExtensions += 1;
  }

  for (const ch of changes) {
    const creator = cardToCreator.get(ch.cardId);
    if (!creator) continue;
    const row = map.get(creator.id);
    if (!row) continue;
    row.totalAddedHours += ch.addedHours;
    row.totalAddedDays += ch.addedDays;
  }

  for (const i of incidents) {
    const creator = cardToCreator.get(i.cardId);
    if (!creator) continue;
    const row = map.get(creator.id);
    if (!row) continue;
    row.chargedOnCreatedTasks += 1;
  }

  return [...map.values()]
    .map((r) => {
      const extRate =
        r.tasksCreated > 0 ? r.approvedExtensions / r.tasksCreated : 0;
      let signal: CreatorTrend["signal"] = "ok";
      if (extRate >= 0.35 || r.totalAddedDays >= r.tasksCreated) {
        signal = "weak_estimate";
      } else if (extRate >= 0.15 || r.approvedExtensions >= 3) {
        signal = "watch";
      }
      return {
        ...r,
        totalAddedHours: Math.round(r.totalAddedHours * 100) / 100,
        totalAddedDays: Math.round(r.totalAddedDays * 100) / 100,
        signal,
      };
    })
    .sort((a, b) => b.approvedExtensions - a.approvedExtensions);
}
