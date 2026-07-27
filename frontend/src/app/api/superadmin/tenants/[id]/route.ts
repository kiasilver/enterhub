import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/superadmin/tenants/[id] */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const w = await prisma.workspace.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      _count: { select: { members: true, boards: true } },
    },
  });
  if (!w || w.status === "DELETED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const agg = await prisma.attachment.aggregate({
    where: { card: { list: { board: { workspaceId: w.id } } } },
    _sum: { sizeBytes: true },
  });

  return NextResponse.json({
    data: {
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
    },
  });
}
