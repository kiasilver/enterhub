import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createOAuth2Client,
  encryptToken,
  getGoogleOAuthConfig,
  GOOGLE_SHEETS_SCOPES,
  verifyOAuthState,
} from '@/lib/google-sheets';
import { google } from 'googleapis';

/** GET /api/integrations/google/callback?code=&state= */
export async function GET(req: Request) {
  const session = await auth();
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  const base =
    process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';

  if (oauthError) {
    return NextResponse.redirect(
      `${base}/workspace?google_sheets=denied`,
    );
  }

  if (!session?.user?.id) {
    return NextResponse.redirect(`${base}/login?next=/api/integrations/google/callback`);
  }
  if (!code || !state) {
    return NextResponse.redirect(`${base}/workspace?google_sheets=error`);
  }

  const parsed = verifyOAuthState(state);
  if (!parsed || parsed.userId !== session.user.id) {
    return NextResponse.redirect(`${base}/workspace?google_sheets=invalid_state`);
  }
  if (!getGoogleOAuthConfig()) {
    return NextResponse.redirect(
      `${base}/workspace/${parsed.workspaceId}/settings/integrations?google_sheets=not_configured`,
    );
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) throw new Error('No access token');

    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const me = await oauth2.userinfo.get();
    const googleEmail = me.data.email || 'unknown@google';
    const googleAccountId = me.data.id || null;

    await prisma.googleSheetsConnection.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: parsed.workspaceId,
          userId: session.user.id,
        },
      },
      create: {
        workspaceId: parsed.workspaceId,
        userId: session.user.id,
        googleEmail,
        googleAccountId,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : null,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        scopes: (tokens.scope || GOOGLE_SHEETS_SCOPES.join(' ')).slice(0, 2000),
        isActive: true,
        lastError: null,
      },
      update: {
        googleEmail,
        googleAccountId,
        accessTokenEnc: encryptToken(tokens.access_token),
        refreshTokenEnc: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : undefined,
        tokenExpiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        scopes: (tokens.scope || GOOGLE_SHEETS_SCOPES.join(' ')).slice(0, 2000),
        isActive: true,
        lastError: null,
      },
    });

    return NextResponse.redirect(
      `${base}/workspace/${parsed.workspaceId}/settings/integrations?google_sheets=connected`,
    );
  } catch (e) {
    console.error('[google oauth]', e);
    return NextResponse.redirect(
      `${base}/workspace/${parsed.workspaceId}/settings/integrations?google_sheets=error`,
    );
  }
}
