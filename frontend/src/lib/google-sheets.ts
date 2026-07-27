import { createHmac } from 'crypto';
import { google, type sheets_v4 } from 'googleapis';
import { encryptMailboxSecret, decryptMailboxSecret } from '@/lib/mailbox-crypto';
import { prisma } from '@/lib/prisma';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'openid',
  'email',
  'profile',
] as const;

export const TASK_SHEET_HEADERS = [
  'Card ID',
  'Title',
  'Description',
  'List',
  'Status',
  'Priority',
  'Assignees',
  'Labels',
  'Start Date',
  'Due Date',
  'Estimated Hours',
  'Checklist Done',
  'Checklist Total',
  'Board',
] as const;

type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getGoogleOAuthConfig(): OAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    'http://localhost:3000';
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${base.replace(/\/$/, '')}/api/integrations/google/callback`;
  return { clientId, clientSecret, redirectUri };
}

export function createOAuth2Client() {
  const cfg = getGoogleOAuthConfig();
  if (!cfg) {
    throw new Error(
      'Google Sheets is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    );
  }
  return new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
}

export function buildGoogleAuthUrl(state: string) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [...GOOGLE_SHEETS_SCOPES],
    state,
  });
}

export function encryptToken(plain: string) {
  return encryptMailboxSecret(plain);
}

export function decryptToken(blob: string) {
  return decryptMailboxSecret(blob);
}

/** Signed OAuth state: workspaceId.userId.exp.sig */
export function signOAuthState(workspaceId: string, userId: string): string {
  const exp = Date.now() + 15 * 60 * 1000;
  const payload = `${workspaceId}.${userId}.${exp}`;
  const secret =
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'enterhub-dev';
  const sig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 24);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyOAuthState(
  state: string,
): { workspaceId: string; userId: string } | null {
  try {
    const raw = Buffer.from(state, 'base64url').toString('utf8');
    const [workspaceId, userId, expStr, sig] = raw.split('.');
    if (!workspaceId || !userId || !expStr || !sig) return null;
    if (Number(expStr) < Date.now()) return null;
    const secret =
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'enterhub-dev';
    const payload = `${workspaceId}.${userId}.${expStr}`;
    const expect = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .slice(0, 24);
    if (expect !== sig) return null;
    return { workspaceId, userId };
  } catch {
    return null;
  }
}

export async function getAuthorizedSheetsClient(
  connectionId: string,
): Promise<{ sheets: sheets_v4.Sheets; connectionId: string }> {
  const row = await prisma.googleSheetsConnection.findUnique({
    where: { id: connectionId },
  });
  if (!row || !row.isActive) throw new Error('Google Sheets is not connected');

  const client = createOAuth2Client();
  client.setCredentials({
    access_token: decryptToken(row.accessTokenEnc),
    refresh_token: row.refreshTokenEnc
      ? decryptToken(row.refreshTokenEnc)
      : undefined,
    expiry_date: row.tokenExpiresAt?.getTime(),
  });

  client.on('tokens', async (tokens) => {
    try {
      const data: {
        accessTokenEnc?: string;
        refreshTokenEnc?: string;
        tokenExpiresAt?: Date | null;
      } = {};
      if (tokens.access_token) {
        data.accessTokenEnc = encryptToken(tokens.access_token);
      }
      if (tokens.refresh_token) {
        data.refreshTokenEnc = encryptToken(tokens.refresh_token);
      }
      if (tokens.expiry_date) {
        data.tokenExpiresAt = new Date(tokens.expiry_date);
      }
      if (Object.keys(data).length) {
        await prisma.googleSheetsConnection.update({
          where: { id: connectionId },
          data,
        });
      }
    } catch {
      /* ignore refresh persist errors */
    }
  });

  // Force refresh if expired
  if (row.tokenExpiresAt && row.tokenExpiresAt.getTime() < Date.now() + 60_000) {
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    if (credentials.access_token) {
      await prisma.googleSheetsConnection.update({
        where: { id: connectionId },
        data: {
          accessTokenEnc: encryptToken(credentials.access_token),
          refreshTokenEnc: credentials.refresh_token
            ? encryptToken(credentials.refresh_token)
            : undefined,
          tokenExpiresAt: credentials.expiry_date
            ? new Date(credentials.expiry_date)
            : null,
        },
      });
    }
  }

  return { sheets: google.sheets({ version: 'v4', auth: client }), connectionId };
}

export type ExportTaskRow = {
  id: string;
  title: string;
  description: string | null;
  listTitle: string;
  status: string;
  priority: string;
  assignees: string;
  labels: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  checklistDone: number;
  checklistTotal: number;
  boardName: string;
};

export function tasksToSheetValues(rows: ExportTaskRow[]): string[][] {
  return [
    [...TASK_SHEET_HEADERS],
    ...rows.map((r) => [
      r.id,
      r.title,
      r.description || '',
      r.listTitle,
      r.status,
      r.priority,
      r.assignees,
      r.labels,
      r.startDate || '',
      r.dueDate || '',
      r.estimatedHours != null ? String(r.estimatedHours) : '',
      String(r.checklistDone),
      String(r.checklistTotal),
      r.boardName,
    ]),
  ];
}

export async function createTasksSpreadsheet(
  sheets: sheets_v4.Sheets,
  title: string,
  rows: ExportTaskRow[],
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Tasks' } }],
    },
  });
  const spreadsheetId = created.data.spreadsheetId;
  if (!spreadsheetId) throw new Error('Failed to create spreadsheet');

  const values = tasksToSheetValues(rows);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Tasks!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  // Freeze header row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: 0, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount',
          },
        },
        {
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.15, green: 0.39, blue: 0.92 },
              },
            },
            fields: 'userEnteredFormat(textFormat,backgroundColor)',
          },
        },
      ],
    },
  });

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  return { spreadsheetId, spreadsheetUrl };
}

export type ImportTaskDraft = {
  id?: string;
  title: string;
  description?: string | null;
  listTitle?: string;
  status?: string | null;
  priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string | null;
  startDate?: string | null;
  estimatedHours?: number | null;
  assignees?: string[];
  labels?: string[];
};

export function parseSheetRows(values: string[][]): ImportTaskDraft[] {
  if (!values.length) return [];
  const header = values[0]!.map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) =>
    header.findIndex((h) => names.some((n) => h === n || h.includes(n)));

  const titleI = idx(['title', 'task', 'name']);
  if (titleI < 0) throw new Error('Sheet must include a Title column');
  const idI = idx(['card id', 'task id', 'id']);
  const descI = idx(['description', 'desc', 'body']);
  const listI = idx(['list', 'column', 'status column']);
  const statusI = idx(['status']);
  const prioI = idx(['priority']);
  const dueI = idx(['due date', 'due']);
  const startI = idx(['start date', 'start']);
  const hoursI = idx(['estimated hours', 'estimate', 'hours']);
  const assignI = idx(['assignees', 'assignee', 'owners']);
  const labelsI = idx(['labels', 'tags']);

  const out: ImportTaskDraft[] = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r] || [];
    const title = (row[titleI] || '').trim();
    if (!title) continue;
    const priorityRaw = (prioI >= 0 ? row[prioI] || '' : '').trim().toUpperCase();
    const priority = (
      ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
    ).includes(priorityRaw as 'NONE')
      ? (priorityRaw as ImportTaskDraft['priority'])
      : 'NONE';
    const hoursStr = hoursI >= 0 ? (row[hoursI] || '').trim() : '';
    out.push({
      id: idI >= 0 ? (row[idI] || '').trim() || undefined : undefined,
      title,
      description: descI >= 0 ? (row[descI] || '').trim() || null : null,
      listTitle: listI >= 0 ? (row[listI] || '').trim() || undefined : undefined,
      status: statusI >= 0 ? (row[statusI] || '').trim() || null : null,
      priority,
      dueDate: dueI >= 0 ? (row[dueI] || '').trim() || null : null,
      startDate: startI >= 0 ? (row[startI] || '').trim() || null : null,
      estimatedHours: hoursStr ? Number(hoursStr) || null : null,
      assignees:
        assignI >= 0
          ? (row[assignI] || '')
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      labels:
        labelsI >= 0
          ? (row[labelsI] || '')
              .split(/[,;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
    });
  }
  return out;
}
