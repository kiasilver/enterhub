import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { yearlyPriceForSeats, type PlanCode } from "@/lib/plans-catalog";
import { applyPlanToWorkspace, notifyBilling } from "@/lib/billing-apply";
import { AuditLogger } from "@/lib/audit-logger";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  planTier: z.enum(["FREE", "PRO", "ENTERPRISE"]),
  seats: z.number().int().min(5).max(2000).default(10),
  billingCycle: z.enum(["monthly", "yearly"]).default("yearly"),
  cloudPackMb: z.number().int().min(0).default(0),
  currency: z.enum(["IRR", "USD"]).default("IRR"),
});

/** GET workspace purchase requests */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:billing"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await prisma.planPurchaseRequest.findMany({
    where: { workspaceId },
    include: { receipt: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ data: rows });
}

/** POST create purchase request (C2C) */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:billing"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const method = await prisma.paymentMethod.findUnique({ where: { kind: "C2C" } });
  if (method && !method.enabled) {
    // ensure default method exists
  }
  await prisma.paymentMethod.upsert({
    where: { kind: "C2C" },
    create: { kind: "C2C", enabled: true },
    update: {},
  });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const plan = parsed.data.planTier as PlanCode;
  const price = yearlyPriceForSeats(plan, parsed.data.seats);
  const amount =
    parsed.data.billingCycle === "monthly"
      ? Math.round(price.sale / 10)
      : price.sale;

  const row = await prisma.planPurchaseRequest.create({
    data: {
      workspaceId,
      userId: session.user.id,
      planTier: plan,
      billingCycle: parsed.data.billingCycle,
      amount,
      currency: parsed.data.currency,
      seats: parsed.data.seats,
      cloudPackMb: parsed.data.cloudPackMb,
      planDays: parsed.data.billingCycle === "monthly" ? 30 : 365,
      status: "PENDING_RECEIPT",
    },
  });

  return NextResponse.json({ data: row }, { status: 201 });
}
