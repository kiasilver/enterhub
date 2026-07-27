import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { canAccessBoard } from '@/lib/board-access';
import { assertWritableSession } from '@/lib/session-guards';
import {
  getAuthorizedSheetsClient,
  parseSheetRows,
  TASK_SHEET_HEADERS,
} from '@/lib/google-sheets';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  boardId: z.string().min(1),
  spreadsheetId: z.string().min(1),
  sheetName: z.string().min(1).max(100).default('Tasks'),
  /** Skip rows whose Task ID already exists on this board */
  skipExisting: z.boolean().default(true),
});

function listTitleForStatus(status: string | null): string {
  const s = (status || '').toLowerCase().trim();
  if (s === 'done' || s === 'complete' || s === 'completed') return 'Done';
  if (s === 'review' || s === 'qa') return 'Review';
  if (s === 'progress' || s === 'in progress' || s === 'doing') return 'In Progress';
  if (s === 'todo' || s === 'to do' || s === 'backlog') return 'To Do';
  return status?.trim() || 'To Do';
}

/** POST — bulk-import tasks from a Google Sheet into a board */
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
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { boardId, spreadsheetId, sheetName, skipExisting } = parsed.data;
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
        select: { id: true, title: true, order: true },
      },
    },
  });
  if (!board) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
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

  try {
    const { sheets } = await getAuthorizedSheetsClient(conn.id);
    const range = `'${sheetName}'!A1:N5000`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const values = (res.data.values || []) as string[][];
    if (values.length < 2) {
      return NextResponse.json(
        { error: 'Sheet is empty or has no data rows' },
        { status: 400 },
      );
    }

    const rows = parseSheetRows(values);
    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: `No valid rows. Expected headers: ${TASK_SHEET_HEADERS.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const listByTitle = new Map(
      board.lists.map((l) => [l.title.toLowerCase(), l]),
    );
    let defaultList = board.lists[0];
    if (!defaultList) {
      defaultList = await prisma.list.create({
        data: {
          boardId: board.id,
          title: 'To Do',
          order: 0,
        },
      });
      listByTitle.set('to do', defaultList);
    }

    const existingIds = new Set(
      (
        await prisma.card.findMany({
          where: {
            list: { boardId: board.id },
            archivedAt: null,
          },
          select: { id: true },
        })
      ).map((c) => c.id),
    );

    let created = 0;
    let skipped = 0;
    let maxOrderByList = new Map<string, number>();

    for (const list of board.lists) {
      const agg = await prisma.card.aggregate({
        where: { listId: list.id, archivedAt: null },
        _max: { order: true },
      });
      maxOrderByList.set(list.id, agg._max.order ?? -1);
    }

    for (const row of rows) {
      if (!row.title?.trim()) {
        skipped++;
        continue;
      }
      if (skipExisting && row.id && existingIds.has(row.id)) {
        skipped++;
        continue;
      }

      const targetTitle = listTitleForStatus(
        row.status || row.listTitle || null,
      );
      let list =
        listByTitle.get(targetTitle.toLowerCase()) ||
        (row.listTitle
          ? listByTitle.get(row.listTitle.toLowerCase())
          : undefined);

      if (!list) {
        const order = board.lists.length + listByTitle.size;
        list = await prisma.list.create({
          data: {
            boardId: board.id,
            title: targetTitle,
            order,
          },
        });
        listByTitle.set(list.title.toLowerCase(), list);
        maxOrderByList.set(list.id, -1);
      }

      const nextOrder = (maxOrderByList.get(list.id) ?? -1) + 1;
      maxOrderByList.set(list.id, nextOrder);

      const priority = row.priority ?? 'NONE';

      await prisma.card.create({
        data: {
          listId: list.id,
          title: row.title.trim().slice(0, 500),
          description: row.description?.trim() || null,
          order: nextOrder,
          priority,
          startDate: row.startDate ? new Date(row.startDate) : null,
          dueDate: row.dueDate ? new Date(row.dueDate) : null,
          estimatedHours:
            row.estimatedHours != null && !Number.isNaN(row.estimatedHours)
              ? row.estimatedHours
              : null,
          createdById: session.user.id,
        },
      });
      created++;
    }

    await prisma.googleSheetsConnection.update({
      where: { id: conn.id },
      data: { lastImportAt: new Date(), lastError: null },
    });

    await prisma.googleSheetSyncLink.upsert({
      where: {
        boardId_spreadsheetId: {
          boardId: board.id,
          spreadsheetId,
        },
      },
      create: {
        connectionId: conn.id,
        workspaceId,
        boardId: board.id,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        sheetName,
        syncMode: 'IMPORT_ONLY',
        lastSyncedAt: new Date(),
      },
      update: {
        sheetName,
        lastSyncedAt: new Date(),
        syncMode: 'IMPORT_ONLY',
      },
    });

    return NextResponse.json({
      data: {
        created,
        skipped,
        totalRows: rows.length,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Import failed';
    await prisma.googleSheetsConnection.update({
      where: { id: conn.id },
      data: { lastError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
