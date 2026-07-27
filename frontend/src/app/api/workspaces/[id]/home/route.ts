import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";

type Ctx = { params: Promise<{ id: string }> };

function greetingFaEn(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isDoneList(title: string) {
  return /(done|complete|closed|shipped)/i.test(title);
}

/**
 * GET /api/workspaces/[id]/home
 * Company hub payload: welcome, up-next, recent boards, activity, exec widgets.
 */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user.id;
  const [
    workspace,
    membership,
    isAdmin,
    canAudit,
  ] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        logoColor: true,
        departments: true,
        ownerTitle: true,
        planTier: true,
      },
    }),
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: {
        role: { select: { name: true } },
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),
    hasPermission(userId, workspaceId, "workspace:members"),
    hasPermission(userId, workspaceId, "workspace:audit"),
  ]);

  if (!workspace || !membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const departments = Array.isArray(workspace.departments)
    ? (workspace.departments as string[])
    : [];

  const boards = await prisma.board.findMany({
    where: {
      workspaceId,
      archivedAt: null,
      // Non-admins: only WORKSPACE/PUBLIC boards for directory (PRIVATE needs invite — skipped for hub list)
      ...(isAdmin || canAudit
        ? {}
        : { visibility: { in: ["WORKSPACE", "PUBLIC"] } }),
    },
    select: {
      id: true,
      name: true,
      description: true,
      visibility: true,
      updatedAt: true,
      lists: {
        where: { archivedAt: null },
        select: {
          id: true,
          title: true,
          cards: {
            where: { archivedAt: null },
            select: { id: true, dueDate: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 40,
  });

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endTomorrow = new Date(startToday.getTime() + 2 * 86400000);

  const assigned = await prisma.cardAssignee.findMany({
    where: {
      userId,
      card: {
        archivedAt: null,
        list: {
          archivedAt: null,
          board: { workspaceId, archivedAt: null },
        },
      },
    },
    include: {
      card: {
        include: {
          list: {
            select: {
              id: true,
              title: true,
              board: { select: { id: true, name: true } },
            },
          },
          checklistItems: { select: { id: true, isDone: true } },
        },
      },
    },
    take: 100,
  });

  const myOpen = assigned.filter((a) => !isDoneList(a.card.list.title));
  const upNext = myOpen
    .filter((a) => {
      if (!a.card.dueDate) return true;
      const t = a.card.dueDate.getTime();
      return t < endTomorrow.getTime();
    })
    .sort((a, b) => {
      const da = a.card.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = b.card.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    })
    .slice(0, 8)
    .map((a) => {
      const checks = a.card.checklistItems;
      const overdue =
        !!a.card.dueDate &&
        a.card.dueDate.getTime() < startToday.getTime();
      return {
        id: a.card.id,
        title: a.card.title,
        dueDate: a.card.dueDate,
        overdue,
        boardId: a.card.list.board.id,
        boardName: a.card.list.board.name,
        listId: a.card.list.id,
        listTitle: a.card.list.title,
        checklist: {
          done: checks.filter((c) => c.isDone).length,
          total: checks.length,
        },
      };
    });

  const waitingToday = myOpen.filter((a) => {
    if (!a.card.dueDate) return false;
    const t = a.card.dueDate.getTime();
    return t >= startToday.getTime() && t < startToday.getTime() + 86400000;
  }).length;

  // Activity: admins see all workspace logs; others only boards they can see
  const visibleBoardIds = boards.map((b) => b.id);
  const activity = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      ...(canAudit || isAdmin
        ? {}
        : {
            OR: [
              { boardId: null },
              { boardId: { in: visibleBoardIds } },
              { userId },
            ],
          }),
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      user: { select: { id: true, name: true, email: true } },
      board: { select: { id: true, name: true } },
    },
  });

  // Exec widgets
  let overdueCompany = 0;
  let inFlow = 0;
  let done = 0;
  if (isAdmin || canAudit) {
    for (const b of boards) {
      for (const l of b.lists) {
        const doneCol = isDoneList(l.title);
        for (const c of l.cards) {
          if (doneCol) done += 1;
          else {
            inFlow += 1;
            if (c.dueDate && c.dueDate.getTime() < startToday.getTime()) {
              overdueCompany += 1;
            }
          }
        }
      }
    }
  }

  // Group boards into department folders
  const deptLabels: Record<string, string> = {
    finance: "Finance",
    it: "IT / Engineering",
    hr: "Human Resources",
    marketing: "Marketing",
    operations: "Operations",
  };
  const folders = departments.map((key) => {
    const label = deptLabels[key] || key;
    const match = boards.filter(
      (b) =>
        b.name.toLowerCase().includes(label.toLowerCase().split(" ")[0]) ||
        b.name.toLowerCase().includes(key)
    );
    return {
      key,
      label,
      boards: match.map((b) => ({
        id: b.id,
        name: b.name,
        cardCount: b.lists.reduce((n, l) => n + l.cards.length, 0),
        updatedAt: b.updatedAt,
      })),
    };
  });
  const folderBoardIds = new Set(folders.flatMap((f) => f.boards.map((b) => b.id)));
  const uncategorized = boards
    .filter((b) => !folderBoardIds.has(b.id))
    .map((b) => ({
      id: b.id,
      name: b.name,
      cardCount: b.lists.reduce((n, l) => n + l.cards.length, 0),
      updatedAt: b.updatedAt,
    }));

  const hour = now.getHours();
  const firstName =
    membership.user.name?.split(" ")[0] ||
    membership.user.email.split("@")[0] ||
    "there";

  return NextResponse.json({
    data: {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        logoUrl: workspace.logoUrl,
        logoColor: workspace.logoColor,
        planTier: workspace.planTier,
        departments,
      },
      me: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        title: membership.title || membership.role.name,
        roleName: membership.role.name,
        avatarUrl: membership.user.avatarUrl,
      },
      isManager: isAdmin || canAudit,
      welcome: {
        greeting: greetingFaEn(hour),
        firstName,
        tasksWaiting: waitingToday || myOpen.filter((a) => {
          const d = a.card.dueDate;
          if (!d) return false;
          return d.getTime() < endTomorrow.getTime();
        }).length,
        message: `${greetingFaEn(hour)} ${firstName} — at ${workspace.name}, you have ${
          waitingToday || upNext.filter((u) => u.dueDate).length
        } task(s) due soon.`,
      },
      upNext,
      recentBoards: boards.slice(0, 6).map((b) => ({
        id: b.id,
        name: b.name,
        cardCount: b.lists.reduce((n, l) => n + l.cards.length, 0),
        updatedAt: b.updatedAt,
        visibility: b.visibility,
      })),
      folders,
      uncategorized,
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        createdAt: a.createdAt,
        actor: a.user
          ? { name: a.user.name || a.user.email, email: a.user.email }
          : null,
        board: a.board,
        metadata: a.metadata,
      })),
      exec: isAdmin || canAudit
        ? {
            overdueCompany,
            inFlow,
            done,
            boardCount: boards.length,
          }
        : null,
    },
  });
}
