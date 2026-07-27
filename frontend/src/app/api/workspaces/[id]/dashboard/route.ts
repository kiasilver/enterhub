import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { withMetricsCache } from "@/lib/metrics-cache";

type Ctx = { params: Promise<{ id: string }> };

function listBucket(title: string): "todo" | "progress" | "review" | "done" | "other" {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return "done";
  if (/(review|qa|test)/.test(t)) return "review";
  if (/(progress|doing|active|wip)/.test(t)) return "progress";
  if (/(todo|backlog|ready|inbox)/.test(t)) return "todo";
  return "other";
}

/** GET /api/workspaces/[id]/dashboard — Org Admin home */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await withMetricsCache(`ws:${workspaceId}:dashboard`, 60_000, async () => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        planTier: true,
        seatLimit: true,
        enforce2FA: true,
        status: true,
      },
    });
    if (!workspace) return null;

    const [activeMembers, pendingInvites, boards, membersNo2fa] = await Promise.all([
      prisma.workspaceMember.count({
        where: { workspaceId, status: "ACTIVE" },
      }),
      prisma.workspaceMember.count({
        where: { workspaceId, status: "INVITED" },
      }).catch(() => 0),
      prisma.board.findMany({
        where: { workspaceId, archivedAt: null },
        select: {
          id: true,
          name: true,
          visibility: true,
          updatedAt: true,
          lists: {
            where: { archivedAt: null },
            select: {
              title: true,
              cards: {
                where: { archivedAt: null },
                select: { id: true, dueDate: true },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          status: "ACTIVE",
          user: { twoFactorEnabled: false },
        },
        include: { user: { select: { id: true, email: true, name: true } } },
        take: 20,
      }),
    ]);

    let inFlow = 0;
    let done = 0;
    let overdue = 0;
    const now = Date.now();

    for (const b of boards) {
      for (const l of b.lists) {
        const bucket = listBucket(l.title);
        for (const c of l.cards) {
          if (bucket === "done") done += 1;
          else inFlow += 1;
          if (c.dueDate && c.dueDate.getTime() < now && bucket !== "done") overdue += 1;
        }
      }
    }

    return {
      workspace,
      seats: { used: activeMembers, limit: workspace.seatLimit },
      boardCount: boards.length,
      tasks: { inFlow, done, overdue },
      pendingInvites,
      membersWithout2FA: membersNo2fa.map((m) => ({
        membershipId: m.id,
        user: m.user,
      })),
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        visibility: b.visibility,
        updatedAt: b.updatedAt,
        cardCount: b.lists.reduce((n, l) => n + l.cards.length, 0),
      })),
      canBilling: await hasPermission(session.user.id, workspaceId, "workspace:billing"),
      canSecurity: await hasPermission(session.user.id, workspaceId, "security:policies"),
    };
  });

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
