import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { ensureSystemRoles } from "@/lib/system-roles";
import { SYSTEM_ROLE_META } from "@/lib/permissions-catalog";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  newOwnerUserId: z.string().min(1),
});

/** POST /api/workspaces/[id]/transfer-ownership */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:transfer_ownership"))) {
    return NextResponse.json({ error: "Forbidden: workspace:transfer_ownership" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const roles = await ensureSystemRoles(workspaceId);
  const newOwnerMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: parsed.data.newOwnerUserId },
    },
  });
  if (!newOwnerMember || newOwnerMember.status !== "ACTIVE") {
    return NextResponse.json({ error: "New owner must be an active member" }, { status: 400 });
  }

  const currentOwnerMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  await prisma.$transaction([
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { ownerId: parsed.data.newOwnerUserId },
    }),
    prisma.workspaceMember.update({
      where: { id: newOwnerMember.id },
      data: { roleId: roles.OWNER.id },
    }),
    ...(currentOwnerMember
      ? [
          prisma.workspaceMember.update({
            where: { id: currentOwnerMember.id },
            data: { roleId: roles.ORG_ADMIN.id },
          }),
        ]
      : []),
  ]);

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "workspace.transfer_ownership",
    metadata: {
      from: session.user.id,
      to: parsed.data.newOwnerUserId,
      demotedTo: SYSTEM_ROLE_META.ORG_ADMIN.name,
    },
    severity: "critical",
  });

  return NextResponse.json({ ok: true });
}
