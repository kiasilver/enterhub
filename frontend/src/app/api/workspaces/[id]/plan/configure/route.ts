import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { AuditLogger } from "@/lib/audit-logger";
import {
  CLOUD_PACK_OPTIONS_MB,
  SEAT_OPTIONS,
  PLANS,
  includedStorageForSeats,
  giftSeatsFor,
  guestSeatsFor,
  yearlyPriceForSeats,
  extraCloudPriceToman,
  type PlanCode,
} from "@/lib/plans-catalog";

type Ctx = { params: Promise<{ id: string }> };

/** GET catalog + current config */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:billing"))) {
    // allow read for owner via workspace:update too
    const alt =
      (await hasPermission(session.user.id, workspaceId, "workspace:update")) ||
      (await hasPermission(session.user.id, workspaceId, "workspace:members"));
    if (!alt) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      planTier: true,
      seatLimit: true,
      giftSeats: true,
      guestSeatLimit: true,
      storageLimitMb: true,
      extraStorageMb: true,
      planExpiresAt: true,
      billingCycle: true,
    },
  });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      current: ws,
      catalog: {
        plans: Object.values(PLANS),
        seatOptions: SEAT_OPTIONS,
        cloudPackOptionsMb: CLOUD_PACK_OPTIONS_MB,
      },
    },
  });
}

const configureSchema = z.object({
  /** Change plan tier */
  planTier: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
  /** Paid seats (not including gifts) */
  seats: z.number().int().min(5).max(2000).optional(),
  /** Extra cloud MB add-on only (can update without changing plan) */
  extraStorageMb: z.number().int().min(0).max(2_000_000).optional(),
  /** If true, only update extraStorageMb — ignore plan/seats reset of included storage */
  cloudOnly: z.boolean().optional(),
  /** Simulate checkout success (no payment gateway yet) */
  activate: z.boolean().default(true),
});

/**
 * POST /api/workspaces/[id]/plan/configure
 * Flexible: change seats+plan, or only buy more cloud.
 */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:billing"))) {
    return NextResponse.json({ error: "Forbidden: workspace:billing" }, { status: 403 });
  }

  const parsed = configureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cloudOnly = parsed.data.cloudOnly === true;
  const plan = (parsed.data.planTier || current.planTier) as PlanCode;
  const seats = parsed.data.seats ?? current.seatLimit;
  const extra =
    parsed.data.extraStorageMb !== undefined
      ? parsed.data.extraStorageMb
      : current.extraStorageMb;

  let storageLimitMb = current.storageLimitMb;
  let giftSeats = current.giftSeats;
  let guestSeatLimit = current.guestSeatLimit;
  let planExpiresAt = current.planExpiresAt;
  let seatLimit = current.seatLimit;
  let planTier = current.planTier;

  if (!cloudOnly) {
    planTier = plan;
    seatLimit = plan === "FREE" ? 5 : seats;
    storageLimitMb =
      plan === "FREE" ? PLANS.FREE.includedStorageMb : includedStorageForSeats(plan, seatLimit);
    giftSeats = giftSeatsFor(plan, seatLimit);
    guestSeatLimit = guestSeatsFor(plan);
    if (plan === "FREE") {
      planExpiresAt = null;
    } else if (parsed.data.activate) {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      planExpiresAt = d;
    }
  }

  const price = cloudOnly
    ? { list: 0, sale: extraCloudPriceToman(extra) }
    : {
        ...yearlyPriceForSeats(plan, seatLimit),
        sale:
          yearlyPriceForSeats(plan, seatLimit).sale + extraCloudPriceToman(extra),
      };

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      planTier,
      seatLimit,
      giftSeats,
      guestSeatLimit,
      storageLimitMb,
      extraStorageMb: extra,
      planExpiresAt,
      billingCycle: "yearly",
    },
    select: {
      planTier: true,
      seatLimit: true,
      giftSeats: true,
      guestSeatLimit: true,
      storageLimitMb: true,
      extraStorageMb: true,
      planExpiresAt: true,
    },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: cloudOnly ? "plan.cloud_addon" : "plan.configure",
    metadata: { ...updated, estimatedToman: price.sale },
  });

  return NextResponse.json({
    data: {
      workspace: updated,
      estimate: {
        yearlyToman: price.sale,
        listToman: price.list,
        extraCloudToman: extraCloudPriceToman(extra),
        note: "Payment gateway coming soon — configuration saved for this workspace.",
      },
    },
  });
}
