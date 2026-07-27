import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withMetricsCache } from "@/lib/metrics-cache";

const FIVE_MIN = 5 * 60 * 1000;

/** GET /api/superadmin/metrics — SaaS telemetry */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin required" }, { status: 403 });
  }

  const data = await withMetricsCache("sa:metrics:v3", FIVE_MIN, async () => {
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const since1 = new Date();
    since1.setDate(since1.getDate() - 1);

    const [
      totalWorkspaces,
      byPlan,
      byStatus,
      newUsersLast30Days,
      totalActiveBoards,
      dau,
      mau,
      churned30,
      mem,
      signupsToday,
      pendingC2c,
      totalUsers,
    ] = await Promise.all([
      prisma.workspace.count({ where: { status: { not: "DELETED" } } }),
      prisma.workspace.groupBy({
        by: ["planTier"],
        where: { status: "ACTIVE" },
        _count: true,
      }),
      prisma.workspace.groupBy({
        by: ["status"],
        where: { status: { not: "DELETED" } },
        _count: true,
      }),
      prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      prisma.board.count({
        where: { archivedAt: null, workspace: { status: "ACTIVE" } },
      }),
      prisma.user.count({ where: { lastLoginAt: { gte: since1 } } }),
      prisma.user.count({ where: { lastLoginAt: { gte: since30 } } }),
      prisma.workspace.count({
        where: {
          status: { in: ["SUSPENDED", "PENDING_DELETE"] },
          updatedAt: { gte: since30 },
        },
      }),
      Promise.resolve(process.memoryUsage()),
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.planPurchaseRequest.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.user.count(),
    ]);

    const activeWs = await prisma.workspace.findMany({
      where: { status: { not: "DELETED" } },
      select: { id: true, name: true },
      take: 40,
    });
    const topStorageTenants = (
      await Promise.all(
        activeWs.map(async (w) => {
          const agg = await prisma.attachment.aggregate({
            where: { card: { list: { board: { workspaceId: w.id } } } },
            _sum: { sizeBytes: true },
          });
          return { workspaceId: w.id, name: w.name, bytes: agg._sum.sizeBytes ?? 0 };
        })
      )
    )
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5);

    const activeStart = Math.max(totalWorkspaces, 1);
    const churnRate = Math.round((churned30 / activeStart) * 1000) / 10;

    return {
      totalWorkspaces,
      totalUsers,
      newUsersLast30Days,
      signupsToday,
      pendingC2c,
      totalActiveBoards,
      planBreakdown: Object.fromEntries(byPlan.map((p) => [p.planTier, p._count])),
      statusBreakdown: Object.fromEntries(byStatus.map((p) => [p.status, p._count])),
      dau,
      mau,
      churnRate,
      churned30,
      mrrDemo: null as number | null,
      arrDemo: null as number | null,
      topStorageTenants,
      telemetry: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
        note: "Process-local estimates — not cluster CPU/RAM",
      },
      generatedAt: new Date().toISOString(),
    };
  });

  return NextResponse.json({ data });
}
