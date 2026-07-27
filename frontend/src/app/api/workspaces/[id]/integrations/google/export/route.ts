import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { canAccessBoard } from '@/lib/board-access';
import { assertWritableSession } from '@/lib/session-guards';
import {
  createTasksSpreadsheet,
  getAuthorizedSheetsClient,
  type ExportTaskRow,
} from '@/lib/google-sheets';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  boardId: z.string().min(1).optional(),
  source: z.enum(['board', 'my-tasks']).default('board'),
  title: z.string().min(1).max(200).optional(),
});

function listStatus(title: string) {
  const t = title.toLowerCase();
  if (/(done|complete|closed|shipped)/.test(t)) return 'done';
  if (/(review|qa|test)/.test(t)) return 'review';
  if (/(progress|doing|active|wip)/.test(t)) return 'progress';
  if (/(todo|backlog|ready|inbox)/.test(t)) return 'todo';
  return 'open';
}

type CardLike = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  list: { title: string; board: { name: string } };
  assignees: { user: { name: string | null; email: string } }[];
  labels: { label: { name: string } }[];
  checklistItems: { isDone: boolean }[];
};

function toExportRow(card: CardLike): ExportTaskRow {
  const checks = card.checklistItems;
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    listTitle: card.list.title,
    status: listStatus(card.list.title),
    priority: card.priority,
    assignees: card.assignees
      .map((x) => x.user.name || x.user.email)
      .join(', '),
    labels: card.labels.map((l) => l.label.name).join(', '),
    startDate: card.startDate?.toISOString().slice(0, 10) ?? null,
    dueDate: card.dueDate?.toISOString().slice(0, 10) ?? null,
    estimatedHours: card.estimatedHours,
    checklistDone: checks.filter((c) => c.isDone).length,
    checklistTotal: checks.length,
    boardName: card.list.board.name,
  };
}

const cardInclude = {
  list: {
    select: {
      title: true,
      board: { select: { name: true } },
    },
  },
  assignees: {
    include: { user: { select: { name: true, email: true } } },
  },
  labels: { include: { label: { select: { name: true } } } },
  checklistItems: { select: { isDone: true } },
} as const;

/** POST — create a Google Sheet from board or my tasks */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const conn = await prisma.googleSheetsConnection.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });
  if (!conn || !conn.isActive) {
    return NextResponse.json(
      { error: 'Connect Google Sheets first in Settings → Integrations' },
      { status: 400 },
    );
  }

  let rows: ExportTaskRow[] = [];
  let sheetTitle = parsed.data.title || 'Enterhub Tasks Export';
  let boardIdForLink: string | null = null;

  if (parsed.data.source === 'my-tasks') {
    const assigned = await prisma.cardAssignee.findMany({
      where: {
        userId: session.user.id,
        card: {
          archivedAt: null,
          list: {
            archivedAt: null,
            board: { workspaceId, archivedAt: null },
          },
        },
      },
      take: 500,
      include: { card: { include: cardInclude } },
    });
    sheetTitle =
      parsed.data.title || `My Tasks — ${new Date().toLocaleDateString()}`;
    rows = assigned.map((a) => toExportRow(a.card as CardLike));
  } else {
    const boardId = parsed.data.boardId;
    if (!boardId) {
      return NextResponse.json({ error: 'boardId required' }, { status: 400 });
    }
    const access = await canAccessBoard(session.user.id, boardId);
    if (!access.ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const board = await prisma.board.findFirst({
      where: { id: boardId, workspaceId, archivedAt: null },
      include: {
        lists: {
          where: { archivedAt: null },
          orderBy: { order: 'asc' },
          include: {
            cards: {
              where: { archivedAt: null },
              orderBy: { order: 'asc' },
              include: {
                assignees: {
                  include: {
                    user: { select: { name: true, email: true } },
                  },
                },
                labels: { include: { label: { select: { name: true } } } },
                checklistItems: { select: { isDone: true } },
              },
            },
          },
        },
      },
    });
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }
    boardIdForLink = board.id;
    sheetTitle =
      parsed.data.title || `${board.name} — ${new Date().toLocaleDateString()}`;
    for (const list of board.lists) {
      for (const card of list.cards) {
        rows.push(
          toExportRow({
            ...card,
            list: { title: list.title, board: { name: board.name } },
          }),
        );
      }
    }
  }

  try {
    const { sheets } = await getAuthorizedSheetsClient(conn.id);
    const created = await createTasksSpreadsheet(sheets, sheetTitle, rows);

    if (boardIdForLink) {
      await prisma.googleSheetSyncLink.upsert({
        where: {
          boardId_spreadsheetId: {
            boardId: boardIdForLink,
            spreadsheetId: created.spreadsheetId,
          },
        },
        create: {
          connectionId: conn.id,
          workspaceId,
          boardId: boardIdForLink,
          spreadsheetId: created.spreadsheetId,
          spreadsheetUrl: created.spreadsheetUrl,
          syncMode: 'EXPORT_ONLY',
          lastSyncedAt: new Date(),
        },
        update: {
          spreadsheetUrl: created.spreadsheetUrl,
          lastSyncedAt: new Date(),
        },
      });
    }

    await prisma.googleSheetsConnection.update({
      where: { id: conn.id },
      data: { lastExportAt: new Date(), lastError: null },
    });

    return NextResponse.json({
      data: {
        spreadsheetId: created.spreadsheetId,
        spreadsheetUrl: created.spreadsheetUrl,
        rowCount: rows.length,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Export failed';
    await prisma.googleSheetsConnection.update({
      where: { id: conn.id },
      data: { lastError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
