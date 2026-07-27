import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { applyPlanToWorkspace } from "@/lib/billing-apply";
import { AuditLogger } from "@/lib/audit-logger";
import type { PlanCode } from "@/lib/plans-catalog";

type Ctx = { params: Promise<{ id: string }> };

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

const actionSchema = z.object({
  action: z.enum([
    "force_plan",
    "add_bonus_days",
    "add_storage",
    "reset_storage_extra",
    "suspend",
    "unsuspend",
    "purge_company",
    "create_department",
  ]),
  planTier: z.enum(["FREE", "PRO", "ENTERPRISE"]).optional(),
  seats: z.number().int().optional(),
  extraStorageMb: z.number().int().optional(),
  bonusDays: z.number().int().min(1).max(90).optional(),
  note: z.string().max(500).optional(),
  deptKey: z.string().optional(),
  deptName: z.string().optional(),
});

export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session) || !session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId } = await ctx.params;
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action } = parsed.data;

  if (action === "force_plan") {
    await applyPlanToWorkspace({
      workspaceId,
      planTier: (parsed.data.planTier || ws.planTier) as PlanCode,
      seats: parsed.data.seats || ws.seatLimit,
      extraStorageMb: parsed.data.extraStorageMb ?? ws.extraStorageMb,
      billingCycle: ws.billingCycle,
      actorId: session.user.id,
    });
    if (parsed.data.note) {
      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { customPlanNote: parsed.data.note },
      });
    }
  } else if (action === "add_bonus_days") {
    const days = parsed.data.bonusDays || 3;
    const base = ws.planExpiresAt && ws.planExpiresAt > new Date()
      ? ws.planExpiresAt
      : new Date();
    const planExpiresAt = new Date(base.getTime() + days * 86400000);
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        bonusDays: ws.bonusDays + days,
        planExpiresAt,
        customPlanNote: parsed.data.note || ws.customPlanNote,
      },
    });
  } else if (action === "add_storage") {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        extraStorageMb: ws.extraStorageMb + (parsed.data.extraStorageMb || 0),
      },
    });
  } else if (action === "reset_storage_extra") {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { extraStorageMb: 0 },
    });
  } else if (action === "suspend") {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: "SUSPENDED", suspendedAt: new Date() },
    });
  } else if (action === "unsuspend") {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: "ACTIVE", suspendedAt: null },
    });
  } else if (action === "purge_company") {
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        status: "PENDING_DELETE",
        pendingDeleteAt: new Date(),
        deletedAt: new Date(),
      },
    });
  } else if (action === "create_department") {
    const key = (parsed.data.deptKey || "custom").toLowerCase().replace(/\s+/g, "_");
    const name = parsed.data.deptName || key;
    await prisma.department.upsert({
      where: { workspaceId_key: { workspaceId, key } },
      create: { workspaceId, key, name },
      update: { name },
    });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: `sa.tenant.${action}`,
    metadata: parsed.data,
    severity: "warning",
  });

  return NextResponse.json({ data: { ok: true } });
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId } = await ctx.params;
  const [ws, usage, members, audit] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        departmentRows: true,
      },
    }),
    prisma.mediaAsset.aggregate({
      where: { workspaceId, deletedAt: null },
      _sum: { sizeBytes: true },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, blockedAt: true } },
        role: { select: { name: true } },
      },
      take: 50,
    }),
    prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    data: {
      workspace: ws,
      storageUsedMb: Math.round((usage._sum.sizeBytes || 0) / (1024 * 1024)),
      members,
      audit,
    },
  });
}
