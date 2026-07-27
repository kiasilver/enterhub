import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";

const startSchema = z.object({
  userId: z.string().min(1),
});

/**
 * POST /api/superadmin/impersonate
 * Starts read-only impersonation via session update token fields.
 * Client must call `await getSession({ update: { impersonateUserId } })` —
 * this endpoint validates + audits and returns the target profile.
 *
 * Mutating APIs must reject `session.user.impersonating`.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isSuperAdmin || session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: Super Admin required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: {
      id: true,
      email: true,
      name: true,
      isSuperAdmin: true,
    },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.isSuperAdmin) {
    return NextResponse.json({ error: "Cannot impersonate another Super Admin" }, { status: 400 });
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    action: "auth.impersonate.start",
    metadata: {
      targetUserId: target.id,
      targetEmail: target.email,
      mode: "read_only",
    },
    severity: "critical",
  });

  return NextResponse.json({
    data: {
      target,
      mode: "read_only",
      /** Client: update({ impersonateUserId: target.id }) */
      instruction: "Call next-auth session update with { impersonateUserId }",
    },
  });
}

/** DELETE /api/superadmin/impersonate — audit stop (client clears via session update) */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actorId = session.user.impersonatorId || session.user.id;

  await AuditLogger.fromRequest(req, {
    userId: actorId,
    action: "auth.impersonate.stop",
    metadata: {
      wasImpersonating: session.user.impersonating,
      viewedUserId: session.user.impersonating ? session.user.id : null,
    },
    severity: "critical",
  });

  return NextResponse.json({
    ok: true,
    instruction: "Call next-auth session update with { stopImpersonation: true }",
  });
}
