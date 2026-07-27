import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isWorkspaceMember } from "@/lib/rbac";
import { getWorkspaceQuota } from "@/lib/storage-quota";
import { planLabelEn, formatMb } from "@/lib/plans-catalog";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/usage — seats, cloud, days left */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quota = await getWorkspaceQuota(workspaceId);
  if (!quota) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      ...quota,
      labels: {
        plan: planLabelEn(quota.subscription.planTier),
        planFa: planLabelEn(quota.subscription.planTier),
        storageLabel: `${formatMb(quota.storage.usedMb)} / ${formatMb(quota.storage.limitMb)}`,
      },
      isOwner: quota.workspace.ownerId === session.user.id,
    },
  });
}
