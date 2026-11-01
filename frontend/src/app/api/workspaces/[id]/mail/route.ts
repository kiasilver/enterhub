import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isWorkspaceMember } from '@/lib/rbac';
import { assertWritableSession } from '@/lib/session-guards';
import { emitToWorkspaceRoom } from '@/lib/socket-emit';
import { publishBadgeRefresh } from '@/lib/badge-bus';

type Ctx = { params: Promise<{ id: string }> };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** GET /api/workspaces/[id]/mail — SafeEmail-shaped unified inbox */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const folder = new URL(req.url).searchParams.get('folder') || 'all';
  const uid = session.user.id;

  if (folder !== 'all') {
    const where =
      folder === 'sent'
        ? { workspaceId, fromUserId: uid, archivedAt: null }
        : folder === 'archive' || folder === 'trash'
          ? {
              workspaceId,
              archivedAt: { not: null },
              OR: [{ toUserId: uid }, { fromUserId: uid }],
            }
          : { workspaceId, toUserId: uid, archivedAt: null };

    const rows = await prisma.mailMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        fromUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
        toUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    const unread = await prisma.mailMessage.count({
      where: { workspaceId, toUserId: uid, readAt: null, archivedAt: null },
    });

    return NextResponse.json({
      data: rows.map((m) => ({
        id: m.id,
        subject: m.subject,
        body: m.body,
        createdAt: m.createdAt,
        readAt: m.readAt,
        archivedAt: m.archivedAt,
        starred: m.starred,
        category: m.category,
        priority: m.priority,
        from: {
          id: m.fromUser.id,
          name: m.fromUser.name || m.fromUser.email,
          email: m.fromUser.email,
          avatarUrl: m.fromUser.avatarUrl,
        },
        to: {
          id: m.toUser.id,
          name: m.toUser.name || m.toUser.email,
          email: m.toUser.email,
          avatarUrl: m.toUser.avatarUrl,
        },
      })),
      meta: { unread, folder },
    });
  }

  const [internal, external] = await Promise.all([
    prisma.mailMessage.findMany({
      where: {
        workspaceId,
        OR: [{ toUserId: uid }, { fromUserId: uid }],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.externalMailMessage.findMany({
      where: { workspaceId, ownerUserId: uid },
      orderBy: { receivedAt: 'desc' },
      take: 200,
    }),
  ]);

  const emails = [
    ...internal.map((m) => {
      const isSent = m.fromUserId === uid && !m.archivedAt;
      const isTrash = !!m.archivedAt;
      const isInbox = m.toUserId === uid && !m.archivedAt;
      const folderId = isTrash ? 'trash' : isSent && !isInbox ? 'sent' : 'inbox';
      const senderName = m.fromUser.name || m.fromUser.email;
      return {
        id: m.id,
        source: 'internal' as const,
        senderName,
        senderEmail: m.fromUser.email,
        senderInitials: initials(senderName),
        subject: m.subject,
        date: fmtDate(m.createdAt),
        time: fmtTime(m.createdAt),
        body: m.body,
        category: (m.category || 'general') as string,
        priority: (m.priority || 'medium') as string,
        starred: m.starred,
        folder: folderId as 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash',
        read: !!m.readAt || m.fromUserId === uid,
        toUserId: m.toUserId,
        fromUserId: m.fromUserId,
      };
    }),
    ...external.map((m) => {
      const senderName = m.fromName || m.fromEmail;
      return {
        id: `ext:${m.id}`,
        source: 'external' as const,
        externalId: m.id,
        senderName,
        senderEmail: m.fromEmail,
        senderInitials: initials(senderName),
        subject: m.subject,
        date: fmtDate(m.receivedAt),
        time: fmtTime(m.receivedAt),
        body: m.bodyText,
        category: m.category,
        priority: m.priority,
        starred: m.starred,
        folder: (m.folder || 'inbox') as 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash',
        read: !!m.readAt,
      };
    }),
  ];

  const unread =
    emails.filter((e) => e.folder === 'inbox' && !e.read).length;

  return NextResponse.json({
    data: emails,
    meta: { unread, folder: 'all' },
  });
}

const sendSchema = z.object({
  toUserId: z.string().min(1),
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(20000),
  category: z.string().max(40).optional(),
  priority: z.string().max(20).optional(),
});

/** POST send internal mail */
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

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const recipient = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: parsed.data.toUserId,
      status: 'ACTIVE',
    },
  });
  if (!recipient) {
    return NextResponse.json({ error: 'Recipient not in workspace' }, { status: 400 });
  }

  const mail = await prisma.mailMessage.create({
    data: {
      workspaceId,
      fromUserId: session.user.id,
      toUserId: parsed.data.toUserId,
      subject: parsed.data.subject.trim(),
      body: parsed.data.body.trim(),
      category: parsed.data.category || 'general',
      priority: parsed.data.priority || 'medium',
    },
  });

  emitToWorkspaceRoom(workspaceId, 'mail:new', {
    id: mail.id,
    toUserId: mail.toUserId,
    fromUserId: mail.fromUserId,
    subject: mail.subject,
  });

  try {
    const { notifyUsers } = await import('@/lib/card-permissions');
    await notifyUsers({
      userIds: [mail.toUserId],
      workspaceId,
      actorId: session.user.id,
      type: 'mail.received',
      title: mail.subject,
      body: 'New message in your inbox',
      href: `/workspace/${workspaceId}/email`,
    });
  } catch (e) {
    console.error('[mail] notify failed', e);
  }

  publishBadgeRefresh({ workspaceId, userId: mail.toUserId });

  return NextResponse.json({ data: { id: mail.id } }, { status: 201 });
}
