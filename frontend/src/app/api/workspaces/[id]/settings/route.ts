import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { assertWritableSession } from "@/lib/session-guards";
import { publishWorkspaceBranding } from "@/lib/branding-bus";
import { emitToWorkspaceRoom } from "@/lib/socket-emit";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/settings — workspace profile + capability flags */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      logoUrlDark: true,
      logoColor: true,
      showCompanyName: true,
      ownerTitle: true,
      departments: true,
      planTier: true,
      seatLimit: true,
      status: true,
      ownerId: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const [
    canUpdate,
    canMembers,
    canRoles,
    canSecurity,
    canBilling,
    canAudit,
    canTransfer,
    canLabels,
  ] = await Promise.all([
    hasPermission(userId, workspaceId, "workspace:update"),
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "workspace:roles"),
    hasPermission(userId, workspaceId, "security:policies"),
    hasPermission(userId, workspaceId, "workspace:billing"),
    hasPermission(userId, workspaceId, "workspace:audit"),
    hasPermission(userId, workspaceId, "workspace:transfer_ownership"),
    hasPermission(userId, workspaceId, "label:manage"),
  ]);

  return NextResponse.json({
    data: {
      workspace: {
        ...workspace,
        departments: Array.isArray(workspace.departments)
          ? workspace.departments
          : [],
      },
      capabilities: {
        canUpdate,
        canMembers,
        canRoles,
        canSecurity,
        canBilling,
        canAudit,
        canTransfer,
        canLabels,
        canManage:
          canUpdate ||
          canMembers ||
          canRoles ||
          canSecurity ||
          canBilling ||
          canAudit ||
          canTransfer ||
          canLabels,
      },
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  /** Light / white-mode logo (URL or data URL) */
  logoUrl: z.string().max(2_500_000).optional().nullable(),
  /** Dark-mode logo; null = auto-invert light logo in dark theme */
  logoUrlDark: z.string().max(2_500_000).optional().nullable(),
  logoColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  ownerTitle: z.string().max(80).optional().nullable(),
  showCompanyName: z.boolean().optional(),
});

/** PATCH /api/workspaces/[id]/settings — branding & name */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:update"))) {
    return NextResponse.json({ error: "Forbidden: workspace:update" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const current = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      logoUrl: true,
      logoUrlDark: true,
      showCompanyName: true,
    },
  });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextLogoUrl =
    parsed.data.logoUrl === undefined ? current.logoUrl : parsed.data.logoUrl;
  const nextLogoUrlDark =
    parsed.data.logoUrlDark === undefined ? current.logoUrlDark : parsed.data.logoUrlDark;
  const hasLogo = Boolean(nextLogoUrl || nextLogoUrlDark);
  const nextShowCompanyName = hasLogo
    ? parsed.data.showCompanyName === undefined
      ? current.showCompanyName
      : parsed.data.showCompanyName
    : true;

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: parsed.data.name,
      logoUrl: parsed.data.logoUrl === undefined ? undefined : parsed.data.logoUrl,
      logoUrlDark: parsed.data.logoUrlDark === undefined ? undefined : parsed.data.logoUrlDark,
      logoColor: parsed.data.logoColor === undefined ? undefined : parsed.data.logoColor,
      ownerTitle: parsed.data.ownerTitle === undefined ? undefined : parsed.data.ownerTitle,
      showCompanyName: nextShowCompanyName,
    },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      logoUrlDark: true,
      logoColor: true,
      ownerTitle: true,
      showCompanyName: true,
    },
  });

  publishWorkspaceBranding({
    workspaceId,
    branding: {
      id: updated.id,
      name: updated.name,
      logoUrl: updated.logoUrl,
      logoUrlDark: updated.logoUrlDark,
      logoColor: updated.logoColor,
      showCompanyName: updated.showCompanyName,
    },
  });
  emitToWorkspaceRoom(workspaceId, "workspace:branding", {
    id: updated.id,
    name: updated.name,
    logoUrl: updated.logoUrl,
    logoUrlDark: updated.logoUrlDark,
    logoColor: updated.logoColor,
    showCompanyName: updated.showCompanyName,
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "workspace.update",
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ data: updated });
}
