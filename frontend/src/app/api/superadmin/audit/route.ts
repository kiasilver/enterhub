import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/superadmin/audit — platform-wide ActivityLog */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") || 40)));
  const severity = url.searchParams.get("severity");

  const logs = await prisma.activityLog.findMany({
    where: severity ? { severity } : undefined,
    include: {
      user: { select: { id: true, email: true, name: true } },
      workspace: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    data: logs.map((l) => ({
      id: l.id,
      action: l.action,
      severity: l.severity,
      ipAddress: l.ipAddress,
      userAgent: l.userAgent,
      metadata: l.metadata,
      createdAt: l.createdAt,
      user: l.user,
      workspace: l.workspace,
    })),
  });
}
