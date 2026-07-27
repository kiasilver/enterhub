import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isWorkspaceMember, hasPermission } from '@/lib/rbac';
import {
  buildGoogleAuthUrl,
  getGoogleOAuthConfig,
  signOAuthState,
} from '@/lib/google-sheets';

type Ctx = { params: Promise<{ id: string }> };

/** GET — start Google OAuth for Sheets (redirects to Google) */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const canManage =
    (await hasPermission(session.user.id, workspaceId, 'workspace:update')) ||
    (await hasPermission(session.user.id, workspaceId, 'board:create'));
  if (!canManage) {
    return NextResponse.json(
      { error: 'Forbidden: need workspace update or board create permission' },
      { status: 403 },
    );
  }

  if (!getGoogleOAuthConfig()) {
    return NextResponse.json(
      {
        error:
          'Google Sheets is not configured on this server. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      },
      { status: 503 },
    );
  }

  const state = signOAuthState(workspaceId, session.user.id);
  const url = buildGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
