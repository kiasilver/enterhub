import { prisma } from '@/lib/prisma';
import type { WorkspaceBadgeCounts } from '@/lib/badge-bus';

/** Aggregate unread counts for sidebar badges. */
export async function getWorkspaceBadgeCounts(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceBadgeCounts> {
  const memberships = await prisma.chatRoomMember.findMany({
    where: { userId, room: { workspaceId } },
    select: { roomId: true, lastReadAt: true },
  });

  let chat = 0;
  for (const m of memberships) {
    const n = await prisma.chatMessage.count({
      where: {
        roomId: m.roomId,
        createdAt: m.lastReadAt ? { gt: m.lastReadAt } : undefined,
        NOT: { authorId: userId },
      },
    });
    chat += n;
  }

  const [mentions, letters, internalMail, externalMail] = await Promise.all([
    prisma.notification.count({
      where: {
        workspaceId,
        userId,
        readAt: null,
        type: { in: ['mention', 'chat.mention'] },
      },
    }),
    prisma.workspaceLetter.count({
      where: {
        workspaceId,
        toUserId: userId,
        readAt: null,
        parentId: null,
      },
    }),
    prisma.mailMessage.count({
      where: {
        workspaceId,
        toUserId: userId,
        readAt: null,
        archivedAt: null,
      },
    }),
    prisma.externalMailMessage.count({
      where: {
        workspaceId,
        ownerUserId: userId,
        readAt: null,
        folder: 'inbox',
      },
    }),
  ]);

  const email = internalMail + externalMail;
  const chatTotal = chat + mentions + letters;

  return { chat, email, mentions, letters, chatTotal };
}
