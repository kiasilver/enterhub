import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { getGoogleOAuthConfig } from '@/lib/google-sheets';

type Ctx = { params: Promise<{ id: string }> };

/** GET — connection status for current user in this workspace */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const configured = !!getGoogleOAuthConfig();
  const conn = await prisma.googleSheetsConnection.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
    select: {
      id: true,
      googleEmail: true,
      isActive: true,
      lastExportAt: true,
      lastImportAt: true,
      lastError: true,
      createdAt: true,
      syncLinks: {
        select: {
          id: true,
          boardId: true,
          spreadsheetId: true,
          spreadsheetUrl: true,
          sheetName: true,
          syncMode: true,
          lastSyncedAt: true,
          board: { select: { id: true, name: true } },
        },
        take: 20,
      },
    },
  });

  return NextResponse.json({
    data: {
      configured,
      connected: !!(conn && conn.isActive),
      connection: conn && conn.isActive ? conn : null,
    },
  });
}
