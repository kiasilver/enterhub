import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { applyPlanToWorkspace, notifyBilling } from "@/lib/billing-apply";
import { AuditLogger } from "@/lib/audit-logger";
import type { PlanCode } from "@/lib/plans-catalog";

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

/** GET C2C queue */
export async function GET(req: Request) {
  const session = await auth();
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "PENDING_REVIEW";
  const rows = await prisma.planPurchaseRequest.findMany({
    where: status === "all" ? undefined : { status: status as never },
    include: {
      receipt: { include: { bankCard: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          planTier: true,
          planExpiresAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ data: rows });
}

const decideSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(2000).optional(),
});

/** POST approve / reject */
export async function POST(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session) || !session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = decideSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await prisma.planPurchaseRequest.findUnique({
    where: { id: parsed.data.requestId },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.decision === "reject") {
    const reason = parsed.data.reason?.trim() || "Payment could not be verified";
    await prisma.planPurchaseRequest.update({
      where: { id: row.id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });
    await notifyBilling({
      workspaceId: row.workspaceId,
      userId: row.userId,
      type: "billing.c2c_rejected",
      title: "Card-to-card payment rejected",
      body: reason,
      actorId: session.user.id,
    });
    await AuditLogger.fromRequest(req, {
      userId: session.user.id,
      workspaceId: row.workspaceId,
      action: "billing.c2c.reject",
      metadata: { requestId: row.id, reason },
      severity: "warning",
    });
    return NextResponse.json({ data: { ok: true, status: "REJECTED" } });
  }

  await applyPlanToWorkspace({
    workspaceId: row.workspaceId,
    planTier: row.planTier as PlanCode,
    seats: row.seats,
    extraStorageMb: row.cloudPackMb,
    billingCycle: row.billingCycle,
    planDays: row.planDays,
    actorId: session.user.id,
  });

  await prisma.planPurchaseRequest.update({
    where: { id: row.id },
    data: {
      status: "APPROVED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
  });

  await notifyBilling({
    workspaceId: row.workspaceId,
    userId: row.userId,
    type: "billing.c2c_approved",
    title: "Payment approved",
    body: `Your ${row.planTier} plan is now active.`,
    actorId: session.user.id,
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: row.workspaceId,
    action: "billing.c2c.approve",
    metadata: { requestId: row.id, planTier: row.planTier },
    severity: "info",
  });

  return NextResponse.json({ data: { ok: true, status: "APPROVED" } });
}
