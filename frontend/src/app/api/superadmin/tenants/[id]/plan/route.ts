import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import { invalidateMetricsCache } from "@/lib/metrics-cache";

type Ctx = { params: Promise<{ id: string }> };

const planSchema = z.object({
  planTier: z.enum(["FREE", "PRO", "ENTERPRISE"]),
});

/** PATCH /api/superadmin/tenants/[id]/plan — force upgrade/downgrade */
export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = planSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid planTier" }, { status: 400 });
  }

  const ws = await prisma.workspace.update({
    where: { id },
    data: { planTier: body.data.planTier },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: id,
    action: "superadmin.plan_force",
    metadata: { planTier: body.data.planTier },
    severity: "critical",
  });

  invalidateMetricsCache("sa:");
  return NextResponse.json({ data: ws });
}
