import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";

const patchSchema = z.object({
  key: z.string().min(1).optional(),
  isEnabledGlobally: z.boolean().optional(),
  canaryPercent: z.number().int().min(0).max(100).optional(),
  description: z.string().optional(),
  create: z
    .object({
      key: z.string().min(1),
      description: z.string().optional(),
      isEnabledGlobally: z.boolean().optional(),
    })
    .optional(),
});

/** GET /api/superadmin/feature-flags */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ data: flags });
}

/** PATCH /api/superadmin/feature-flags */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (parsed.data.create) {
    const flag = await prisma.featureFlag.upsert({
      where: { key: parsed.data.create.key },
      create: {
        key: parsed.data.create.key,
        description: parsed.data.create.description,
        isEnabledGlobally: parsed.data.create.isEnabledGlobally ?? false,
      },
      update: {
        description: parsed.data.create.description,
        isEnabledGlobally: parsed.data.create.isEnabledGlobally,
      },
    });
    await AuditLogger.fromRequest(req, {
      userId: session.user.id,
      action: "superadmin.feature_flag_upsert",
      metadata: { key: flag.key },
      severity: "warning",
    });
    return NextResponse.json({ data: flag });
  }

  if (!parsed.data.key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  const flag = await prisma.featureFlag.update({
    where: { key: parsed.data.key },
    data: {
      isEnabledGlobally: parsed.data.isEnabledGlobally,
      canaryPercent: parsed.data.canaryPercent,
      description: parsed.data.description,
    },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    action: "superadmin.feature_flag_update",
    metadata: { key: flag.key, isEnabledGlobally: flag.isEnabledGlobally },
    severity: "warning",
  });

  return NextResponse.json({ data: flag });
}
