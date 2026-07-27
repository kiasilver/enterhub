import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function listIsDone(title: string) {
  return /(done|complete|closed|shipped)/i.test(title);
}

/** GET /api/guest/dashboard */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guests = await prisma.boardGuest.findMany({
    where: { userId: session.user.id },
    include: {
      board: {
        select: {
          id: true,
          name: true,
          description: true,
          workspaceId: true,
          workspace: { select: { name: true } },
          lists: {
            where: { archivedAt: null },
            select: {
              title: true,
                  cards: {
                where: { archivedAt: null },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  updatedAt: true,
                  assignees: { select: { userId: true } },
                  comments: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                    select: {
                      id: true,
                      body: true,
                      createdAt: true,
                      author: { select: { name: true, email: true } },
                    },
                  },
                  attachments: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                    select: {
                      id: true,
                      fileName: true,
                      fileUrl: true,
                      mimeType: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const userId = session.user.id;

  const sharedBoards = guests.map((g) => {
    let total = 0;
    let done = 0;
    const pendingReview: { id: string; title: string; boardId: string; boardName: string }[] = [];
    const recentComments: unknown[] = [];
    const recentAttachments: unknown[] = [];
    const assignedOnly = g.accessLevel === "ASSIGNED_ONLY";

    for (const l of g.board.lists) {
      const isDone = listIsDone(l.title);
      const isReview = /review/i.test(l.title);
      for (const c of l.cards) {
        if (assignedOnly && !c.assignees.some((a) => a.userId === userId)) {
          continue;
        }
        total += 1;
        if (isDone) done += 1;
        if (isReview) {
          pendingReview.push({
            id: c.id,
            title: c.title,
            boardId: g.board.id,
            boardName: g.board.name,
          });
        }
        for (const cm of c.comments) {
          recentComments.push({
            ...cm,
            cardId: c.id,
            cardTitle: c.title,
            boardId: g.board.id,
          });
        }
        for (const at of c.attachments) {
          recentAttachments.push({
            ...at,
            cardId: c.id,
            cardTitle: c.title,
            boardId: g.board.id,
          });
        }
      }
    }

    return {
      boardId: g.board.id,
      name: g.board.name,
      description: g.board.description,
      accessLevel: g.accessLevel,
      inviterWorkspaceName: g.board.workspace.name,
      progressPercent: total ? Math.round((done / total) * 100) : 0,
      pendingReview,
      recentComments: recentComments.slice(0, 10),
      recentAttachments: recentAttachments.slice(0, 10),
    };
  });

  // Contact: first board's workspace owner as "project lead" proxy
  let contactLead: { name: string | null; email: string } | null = null;
  if (guests[0]) {
    const ws = await prisma.workspace.findUnique({
      where: { id: guests[0].board.workspaceId },
      include: { owner: { select: { name: true, email: true } } },
    });
    if (ws?.owner) contactLead = ws.owner;
  }

  return NextResponse.json({
    data: {
      sharedBoards,
      contactLead,
    },
  });
}
