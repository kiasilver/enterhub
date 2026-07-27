import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listWorkspacesForUser } from "@/lib/workspace-service";
import { resolveHomeDashboard } from "@/lib/dashboard-role";
import { prisma } from "@/lib/prisma";

/** GET /api/auth/me */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [memberships, dbUser, home] = await Promise.all([
    listWorkspacesForUser(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pendingOnboarding: true, emailVerifiedAt: true },
    }),
    resolveHomeDashboard({
      userId: session.user.id,
      isSuperAdmin: session.user.isSuperAdmin,
    }),
  ]);

  return NextResponse.json({
    data: {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isSuperAdmin: session.user.isSuperAdmin,
        pendingOnboarding: Boolean(dbUser?.pendingOnboarding),
        emailVerifiedAt: dbUser?.emailVerifiedAt ?? null,
      },
      home,
      workspaces: memberships.map((m) => ({
        membershipId: m.id,
        role: { id: m.role.id, name: m.role.name },
        title: m.title,
        permissions: m.role.permissions.map((rp) => rp.permission.actionName),
        workspace: {
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          planTier: m.workspace.planTier,
          status: m.workspace.status,
          logoUrl: m.workspace.logoUrl,
          logoColor: m.workspace.logoColor,
        },
      })),
    },
  });
}
