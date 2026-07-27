import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createWorkspaceWithOwner, listWorkspacesForUser } from "@/lib/workspace-service";
import { AuditLogger } from "@/lib/audit-logger";

const createSchema = z.object({
  name: z.string().min(2).max(120),
  capturedDomain: z.string().max(255).optional().nullable(),
});

/** GET /api/workspaces — list memberships for current user */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await listWorkspacesForUser(session.user.id);
  return NextResponse.json({
    data: memberships.map((m) => ({
      membershipId: m.id,
      role: { id: m.role.id, name: m.role.name },
      title: m.title,
      permissions: m.role.permissions.map((rp) => rp.permission.actionName),
      workspace: m.workspace,
    })),
  });
}

/** POST /api/workspaces — create tenant; caller becomes Owner */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { workspace, roles } = await createWorkspaceWithOwner({
    name: parsed.data.name,
    ownerId: session.user.id,
    capturedDomain: parsed.data.capturedDomain,
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: workspace.id,
    action: "workspace.create",
    metadata: { name: workspace.name, slug: workspace.slug },
    severity: "info",
  });

  return NextResponse.json(
    {
      data: {
        workspace,
        systemRoles: roles,
      },
    },
    { status: 201 }
  );
}
