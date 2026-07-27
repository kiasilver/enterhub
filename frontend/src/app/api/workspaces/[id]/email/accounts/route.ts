import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember, hasPermission } from '@/lib/rbac';
import { assertWritableSession } from '@/lib/session-guards';
import { encryptMailboxSecret } from '@/lib/mailbox-crypto';

type Ctx = { params: Promise<{ id: string }> };

/** GET connected mailboxes visible to current user */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const canManageOrg = await hasPermission(
    session.user.id,
    workspaceId,
    'workspace:update',
  );

  const rows = await prisma.connectedMailbox.findMany({
    where: {
      workspaceId,
      OR: [
        { userId: session.user.id, scope: 'PERSONAL' },
        ...(canManageOrg ? [{ scope: 'ORG' as const }] : [{ scope: 'ORG' as const, isActive: true }]),
      ],
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      scope: true,
      label: true,
      emailAddress: true,
      imapHost: true,
      imapPort: true,
      imapSecure: true,
      smtpHost: true,
      smtpPort: true,
      username: true,
      lastSyncAt: true,
      lastError: true,
      isActive: true,
      userId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: rows,
    meta: { canManageOrg },
  });
}

const createSchema = z.object({
  scope: z.enum(['PERSONAL', 'ORG']),
  label: z.string().trim().max(80).optional(),
  emailAddress: z.string().email(),
  imapHost: z.string().min(1).max(200),
  imapPort: z.number().int().min(1).max(65535).optional(),
  imapSecure: z.boolean().optional(),
  smtpHost: z.string().max(200).optional().nullable(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpSecure: z.boolean().optional(),
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(500),
});

/** POST connect a personal or org mailbox */
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

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.scope === 'ORG') {
    const ok = await hasPermission(session.user.id, workspaceId, 'workspace:update');
    if (!ok) {
      return NextResponse.json({ error: 'Org mailbox requires workspace:update' }, { status: 403 });
    }
  }

  const row = await prisma.connectedMailbox.create({
    data: {
      workspaceId,
      userId: parsed.data.scope === 'PERSONAL' ? session.user.id : session.user.id,
      scope: parsed.data.scope,
      label: parsed.data.label || null,
      emailAddress: parsed.data.emailAddress.toLowerCase(),
      imapHost: parsed.data.imapHost,
      imapPort: parsed.data.imapPort ?? 993,
      imapSecure: parsed.data.imapSecure ?? true,
      smtpHost: parsed.data.smtpHost || null,
      smtpPort: parsed.data.smtpPort ?? 587,
      smtpSecure: parsed.data.smtpSecure ?? true,
      username: parsed.data.username,
      passwordEnc: encryptMailboxSecret(parsed.data.password),
    },
  });

  return NextResponse.json(
    {
      data: {
        id: row.id,
        scope: row.scope,
        emailAddress: row.emailAddress,
        label: row.label,
      },
    },
    { status: 201 },
  );
}
