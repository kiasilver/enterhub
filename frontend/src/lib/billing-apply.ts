import { prisma } from "@/lib/prisma";
import {
  PLANS,
  giftSeatsFor,
  guestSeatsFor,
  includedStorageForSeats,
  type PlanCode,
} from "@/lib/plans-catalog";
import { notifyUsers } from "@/lib/card-permissions";

export async function applyPlanToWorkspace(opts: {
  workspaceId: string;
  planTier: PlanCode;
  seats: number;
  extraStorageMb?: number;
  billingCycle?: string;
  planDays?: number | null;
  actorId?: string | null;
}) {
  const def = PLANS[opts.planTier];
  const seats = Math.max(5, opts.seats);
  const gift = giftSeatsFor(opts.planTier, seats);
  const guest = guestSeatsFor(opts.planTier);
  const storageLimitMb = includedStorageForSeats(opts.planTier, seats);
  const extraStorageMb = opts.extraStorageMb ?? 0;

  let planExpiresAt: Date | null = null;
  if (opts.planTier !== "FREE") {
    const days =
      opts.planDays ??
      (opts.billingCycle === "monthly" ? 30 : 365);
    planExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  const ws = await prisma.workspace.update({
    where: { id: opts.workspaceId },
    data: {
      planTier: opts.planTier,
      seatLimit: seats,
      giftSeats: gift,
      guestSeatLimit: guest,
      storageLimitMb,
      extraStorageMb,
      billingCycle: opts.billingCycle || "yearly",
      planExpiresAt,
      status: "ACTIVE",
      suspendedAt: null,
    },
  });

  return ws;
}

export async function notifyBilling(opts: {
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actorId?: string | null;
}) {
  await notifyUsers({
    userIds: [opts.userId],
    workspaceId: opts.workspaceId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    href: `/workspace/${opts.workspaceId}/settings/billing`,
    actorId: opts.actorId || undefined,
  });
}

export function maskCard(num: string): string {
  const d = num.replace(/\D/g, "");
  if (d.length < 4) return "****";
  return `${d.slice(0, 4)} **** **** ${d.slice(-4)}`;
}
