import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/chat/mention-suggests?q=
 * People, projects (boards), and media files for @ / # mention picker.
 */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();

  const [members, boards, media] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId, status: "ACTIVE" },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        role: { select: { name: true } },
      },
      take: 80,
    }),
    prisma.board.findMany({
      where: { workspaceId, archivedAt: null },
      select: { id: true, name: true, background: true },
      orderBy: { name: "asc" },
      take: 80,
    }),
    prisma.mediaAsset.findMany({
      where: { workspaceId },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        mimeType: true,
        sizeBytes: true,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  const people = members
    .map((m) => ({
      kind: "user" as const,
      id: m.user.id,
      label: m.user.name || m.user.email,
      sub: m.role.name,
      avatarUrl: m.user.avatarUrl,
    }))
    .filter((p) => !q || p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q));

  const projects = boards
    .map((b) => ({
      kind: "board" as const,
      id: b.id,
      label: b.name,
      sub: "Project",
      color: b.background,
      url: `/board/${b.id}`,
    }))
    .filter((p) => !q || p.label.toLowerCase().includes(q));

  const files = media
    .map((f) => ({
      kind: "media" as const,
      id: f.id,
      label: f.fileName,
      sub: f.mimeType || "File",
      url: f.fileUrl,
      sizeBytes: f.sizeBytes,
    }))
    .filter((p) => !q || p.label.toLowerCase().includes(q));

  return NextResponse.json({
    data: {
      people: people.slice(0, 12),
      projects: projects.slice(0, 12),
      files: files.slice(0, 12),
    },
  });
}
