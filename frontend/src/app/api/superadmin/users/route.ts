import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { AuditLogger } from "@/lib/audit-logger";

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      isSuperAdmin: true,
      blockedAt: true,
      blockedReason: true,
      createdAt: true,
      lastLoginAt: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      _count: { select: { memberships: true, ownedWorkspaces: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ data: users });
}

const actionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum([
    "block",
    "unblock",
    "reset_password",
    "force_verify",
    "set_superadmin",
  ]),
  reason: z.string().max(500).optional(),
  password: z.string().min(8).optional(),
  isSuperAdmin: z.boolean().optional(),
});

export async function POST(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session) || !session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = actionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { userId, action } = parsed.data;
  let result: Record<string, unknown> = { ok: true };

  if (action === "block") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        blockedAt: new Date(),
        blockedReason: parsed.data.reason || "Blocked by Super Admin",
      },
    });
  } else if (action === "unblock") {
    await prisma.user.update({
      where: { id: userId },
      data: { blockedAt: null, blockedReason: null },
    });
  } else if (action === "reset_password") {
    const pwd = parsed.data.password || `Tmp${Math.random().toString(36).slice(2, 10)}!`;
    const passwordHash = await bcrypt.hash(pwd, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    result = { ok: true, temporaryPassword: pwd };
  } else if (action === "force_verify") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
      },
    });
  } else if (action === "set_superadmin") {
    await prisma.user.update({
      where: { id: userId },
      data: { isSuperAdmin: Boolean(parsed.data.isSuperAdmin) },
    });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: null,
    action: `sa.user.${action}`,
    metadata: { targetUserId: userId },
    severity: "warning",
  });

  return NextResponse.json({ data: result });
}
