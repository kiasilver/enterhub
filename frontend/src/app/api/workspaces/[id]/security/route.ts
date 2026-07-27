import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  enforce2FA: z.boolean().optional(),
  sessionTimeoutHours: z.number().int().min(1).max(720).optional(),
  ipAllowlist: z.array(z.string().min(1)).nullable().optional(),
});

/** GET /api/workspaces/[id]/security */
export async function GET(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "security:policies"))) {
    return NextResponse.json({ error: "Forbidden: security:policies" }, { status: 403 });
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      enforce2FA: true,
      sessionTimeoutHours: true,
      ipAllowlist: true,
    },
  });
  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: ws });
}

/** PATCH /api/workspaces/[id]/security */
export async function PATCH(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  const { id: workspaceId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "security:policies"))) {
    return NextResponse.json({ error: "Forbidden: security:policies" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data: Prisma.WorkspaceUpdateInput = {};
  if (parsed.data.enforce2FA !== undefined) data.enforce2FA = parsed.data.enforce2FA;
  if (parsed.data.sessionTimeoutHours !== undefined) {
    data.sessionTimeoutHours = parsed.data.sessionTimeoutHours;
  }
  if (parsed.data.ipAllowlist !== undefined) {
    data.ipAllowlist =
      parsed.data.ipAllowlist === null ? Prisma.JsonNull : parsed.data.ipAllowlist;
  }

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data,
    select: {
      id: true,
      enforce2FA: true,
      sessionTimeoutHours: true,
      ipAllowlist: true,
    },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "workspace.security.update",
    metadata: parsed.data,
    severity: "warning",
  });

  return NextResponse.json({ data: updated });
}
