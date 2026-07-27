import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/audit?action=&limit= */
export async function GET(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  const can =
    (await hasPermission(session.user.id, workspaceId, "workspace:audit")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:roles"));
  if (!can) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  const logs = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      ...(action ? { action: { contains: action } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({ data: logs });
}
