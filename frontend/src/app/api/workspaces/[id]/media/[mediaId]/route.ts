import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { retentionPurgeAfter } from "@/lib/platform-settings";

type Ctx = { params: Promise<{ id: string; mediaId: string }> };

/** DELETE /api/workspaces/[id]/media/[mediaId]?kind=media|attachment — soft delete, 6-day recovery */
export async function DELETE(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, mediaId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const kind = new URL(req.url).searchParams.get("kind") || "media";
  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  const isOwner = ws?.ownerId === session.user.id;
  const canManage =
    (await hasPermission(session.user.id, workspaceId, "workspace:members")) ||
    (await hasPermission(session.user.id, workspaceId, "workspace:update"));

  const now = new Date();
  const purgeAfter = retentionPurgeAfter(now);

  if (kind === "attachment") {
    const row = await prisma.attachment.findFirst({
      where: {
        id: mediaId,
        deletedAt: null,
        card: { list: { board: { workspaceId } } },
      },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!isOwner && !canManage && row.uploadedById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.attachment.update({
      where: { id: mediaId },
      data: { deletedAt: now, purgeAfter },
    });
    return NextResponse.json({ ok: true, freedBytes: row.sizeBytes || 0 });
  }

  const row = await prisma.mediaAsset.findFirst({
    where: { id: mediaId, workspaceId, deletedAt: null },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isOwner && !canManage && row.uploadedById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.mediaAsset.update({
    where: { id: mediaId },
    data: { deletedAt: now, purgeAfter },
  });
  return NextResponse.json({ ok: true, freedBytes: row.sizeBytes });
}
