import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";

const bodySchema = z.object({
  suspend: z.boolean(),
  reason: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/superadmin/workspaces/[id]/suspend
 * Soft-suspend (or reactivate) a tenant.
 */
export async function POST(req: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: Super Admin required" }, { status: 403 });
  }

  const { id: workspaceId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace || workspace.status === "DELETED") {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: parsed.data.suspend
      ? { status: "SUSPENDED", suspendedAt: new Date() }
      : { status: "ACTIVE", suspendedAt: null },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: parsed.data.suspend ? "workspace.suspend" : "workspace.unsuspend",
    metadata: { reason: parsed.data.reason ?? null },
    severity: "critical",
  });

  return NextResponse.json({ data: updated });
}
