import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { assertWritableSession } from '@/lib/session-guards';
import { publishBadgeRefresh } from '@/lib/badge-bus';

type Ctx = { params: Promise<{ id: string; mailId: string }> };

/** PATCH mark read / archive / star — supports internal ids and ext:{id} */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId, mailId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = z
    .object({
      read: z.boolean().optional(),
      archive: z.boolean().optional(),
      starred: z.boolean().optional(),
      folder: z.enum(['inbox', 'sent', 'drafts', 'spam', 'trash']).optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (mailId.startsWith('ext:')) {
    const extId = mailId.slice(4);
    const mail = await prisma.externalMailMessage.findFirst({
      where: { id: extId, workspaceId, ownerUserId: session.user.id },
    });
    if (!mail) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.externalMailMessage.update({
      where: { id: extId },
      data: {
        ...(parsed.data.read === true ? { readAt: new Date() } : {}),
        ...(parsed.data.read === false ? { readAt: null } : {}),
        ...(parsed.data.starred !== undefined ? { starred: parsed.data.starred } : {}),
        ...(parsed.data.folder
          ? { folder: parsed.data.folder }
          : parsed.data.archive === true
            ? { folder: 'trash' }
            : parsed.data.archive === false
              ? { folder: 'inbox' }
              : {}),
      },
    });
    publishBadgeRefresh({ workspaceId, userId: session.user.id });
    return NextResponse.json({ data: updated });
  }

  const mail = await prisma.mailMessage.findFirst({
    where: {
      id: mailId,
      workspaceId,
      OR: [{ toUserId: session.user.id }, { fromUserId: session.user.id }],
    },
  });
  if (!mail) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.mailMessage.update({
    where: { id: mailId },
    data: {
      ...(parsed.data.read === true ? { readAt: new Date() } : {}),
      ...(parsed.data.read === false ? { readAt: null } : {}),
      ...(parsed.data.starred !== undefined ? { starred: parsed.data.starred } : {}),
      ...(parsed.data.archive === true || parsed.data.folder === 'trash'
        ? { archivedAt: new Date() }
        : {}),
      ...(parsed.data.archive === false || parsed.data.folder === 'inbox'
        ? { archivedAt: null }
        : {}),
    },
  });
  publishBadgeRefresh({ workspaceId, userId: session.user.id });
  return NextResponse.json({ data: updated });
}
