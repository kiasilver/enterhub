import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/superadmin/tenants — filterable workspace table */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const plan = url.searchParams.get("plan");
  const status = url.searchParams.get("status");
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(5, Number(url.searchParams.get("pageSize") || 20)));

  const where = {
    status: status
      ? (status as "ACTIVE" | "SUSPENDED" | "PENDING_DELETE" | "DELETED")
      : { not: "DELETED" as const },
    ...(plan ? { planTier: plan as "FREE" | "PRO" | "ENTERPRISE" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { capturedDomain: { contains: q, mode: "insensitive" as const } },
            { owner: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.workspace.count({ where }),
    prisma.workspace.findMany({
      where,
      include: {
        owner: { select: { id: true, email: true, name: true } },
        _count: { select: { members: true, boards: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const withStorage = await Promise.all(
    rows.map(async (w) => {
      const agg = await prisma.attachment.aggregate({
        where: {
          card: { list: { board: { workspaceId: w.id } } },
        },
        _sum: { sizeBytes: true },
      });
      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        planTier: w.planTier,
        status: w.status,
        seatLimit: w.seatLimit,
        capturedDomain: w.capturedDomain,
        createdAt: w.createdAt,
        owner: w.owner,
        memberCount: w._count.members,
        boardCount: w._count.boards,
        storageBytes: agg._sum.sizeBytes ?? 0,
      };
    })
  );

  return NextResponse.json({
    data: withStorage,
    pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) },
  });
}
