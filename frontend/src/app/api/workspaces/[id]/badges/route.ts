import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isWorkspaceMember } from '@/lib/rbac';
import { getWorkspaceBadgeCounts } from '@/lib/workspace-badges';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/badges — unread chat/email/mention/letter counts */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const counts = await getWorkspaceBadgeCounts(workspaceId, session.user.id);
  return NextResponse.json({ data: counts });
}
