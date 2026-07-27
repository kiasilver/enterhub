import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";

type Ctx = { params: Promise<{ id: string; memberId: string }> };

/**
 * POST /api/workspaces/[id]/members/[memberId]/force-logout
 * Revokes all Session rows for that member's user.
 */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  const { id: workspaceId, memberId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "security:force_logout"))) {
    return NextResponse.json({ error: "Forbidden: security:force_logout" }, { status: 403 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const result = await prisma.session.updateMany({
    where: { userId: member.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "member.force_logout",
    metadata: {
      targetUserId: member.userId,
      email: member.user.email,
      sessionsRevoked: result.count,
    },
    severity: "critical",
  });

  return NextResponse.json({
    data: { revoked: result.count, userId: member.userId },
  });
}
