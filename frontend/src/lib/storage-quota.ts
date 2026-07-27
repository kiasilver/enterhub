import { prisma } from "@/lib/prisma";

export function totalStorageLimitMb(ws: {
  storageLimitMb: number;
  extraStorageMb: number;
}): number {
  return (ws.storageLimitMb || 0) + (ws.extraStorageMb || 0);
}

export function daysRemaining(planExpiresAt: Date | null | undefined): number | null {
  if (!planExpiresAt) return null; // forever
  const ms = planExpiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

/** Sum card attachments + media assets for a workspace (bytes). */
export async function computeStorageUsedBytes(workspaceId: string): Promise<number> {
  const [att, media] = await Promise.all([
    prisma.attachment.aggregate({
      where: {
        card: {
          list: { board: { workspaceId, archivedAt: null } },
        },
      },
      _sum: { sizeBytes: true },
    }),
    prisma.mediaAsset.aggregate({
      where: { workspaceId },
      _sum: { sizeBytes: true },
    }),
  ]);
  return (att._sum.sizeBytes || 0) + (media._sum.sizeBytes || 0);
}

export async function getWorkspaceQuota(workspaceId: string) {
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      planTier: true,
      seatLimit: true,
      giftSeats: true,
      guestSeatLimit: true,
      storageLimitMb: true,
      extraStorageMb: true,
      planExpiresAt: true,
      billingCycle: true,
      ownerId: true,
    },
  });
  if (!ws) return null;

  const [usedBytes, seatsUsed] = await Promise.all([
    computeStorageUsedBytes(workspaceId),
    prisma.workspaceMember.count({
      where: { workspaceId, status: { in: ["ACTIVE", "INVITED"] } },
    }),
  ]);

  const limitMb = totalStorageLimitMb(ws);
  const limitBytes = limitMb * 1024 * 1024;
  const usedMb = usedBytes / (1024 * 1024);
  const remainingBytes = Math.max(0, limitBytes - usedBytes);
  const pct = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 100;
  const days = daysRemaining(ws.planExpiresAt);

  return {
    workspace: ws,
    seats: {
      used: seatsUsed,
      limit: ws.seatLimit,
      gift: ws.giftSeats,
      guests: ws.guestSeatLimit,
      totalCapacity: ws.seatLimit + ws.giftSeats,
    },
    storage: {
      usedBytes,
      usedMb: Math.round(usedMb * 10) / 10,
      limitMb,
      includedMb: ws.storageLimitMb,
      extraMb: ws.extraStorageMb,
      remainingBytes,
      remainingMb: Math.round((remainingBytes / (1024 * 1024)) * 10) / 10,
      percentUsed: Math.round(pct * 10) / 10,
      isFull: usedBytes >= limitBytes,
    },
    subscription: {
      planTier: ws.planTier,
      forever: !ws.planExpiresAt,
      planExpiresAt: ws.planExpiresAt,
      daysRemaining: days,
      billingCycle: ws.billingCycle,
    },
  };
}

export async function assertStorageAvailable(
  workspaceId: string,
  additionalBytes: number
): Promise<{ ok: true } | { ok: false; error: string; remainingBytes: number }> {
  const q = await getWorkspaceQuota(workspaceId);
  if (!q) return { ok: false, error: "Workspace not found", remainingBytes: 0 };
  if (q.storage.remainingBytes < additionalBytes) {
    return {
      ok: false,
      error:
        "Cloud storage is full. Delete photos or buy more cloud space in Billing.",
      remainingBytes: q.storage.remainingBytes,
    };
  }
  return { ok: true };
}
