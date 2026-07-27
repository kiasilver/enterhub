import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/workspaces/[id]/search?q=
 * Global search across boards, cards, members, and activity.
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

  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 1) {
    return NextResponse.json({ data: { boards: [], cards: [], members: [] } });
  }

  const isAdmin = await hasPermission(session.user.id, workspaceId, "workspace:members");
  const visibilityFilter = isAdmin
    ? {}
    : { visibility: { in: ["WORKSPACE", "PUBLIC"] as ("WORKSPACE" | "PUBLIC")[] } };

  const [boards, cards, members] = await Promise.all([
    prisma.board.findMany({
      where: {
        workspaceId,
        archivedAt: null,
        name: { contains: q, mode: "insensitive" },
        ...visibilityFilter,
      },
      select: { id: true, name: true, visibility: true },
      take: 8,
    }),
    prisma.card.findMany({
      where: {
        archivedAt: null,
        title: { contains: q, mode: "insensitive" },
        list: {
          archivedAt: null,
          board: {
            workspaceId,
            archivedAt: null,
            ...visibilityFilter,
          },
        },
      },
      select: {
        id: true,
        title: true,
        list: { select: { board: { select: { id: true, name: true } } } },
      },
      take: 10,
    }),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        OR: [
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
          { title: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        role: { select: { name: true } },
      },
      take: 8,
    }),
  ]);

  return NextResponse.json({
    data: {
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        type: "board" as const,
        href: `/board/${b.id}`,
      })),
      cards: cards.map((c) => ({
        id: c.id,
        name: c.title,
        type: "card" as const,
        boardName: c.list.board.name,
        href: `/board/${c.list.board.id}?card=${c.id}`,
      })),
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        email: m.user.email,
        role: m.title || m.role.name,
        type: "member" as const,
        href: `/workspace/${workspaceId}/team`,
      })),
    },
  });
}
