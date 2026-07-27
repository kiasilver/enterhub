import { prisma } from "@/lib/prisma";

export const authorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

export async function assertChatRoomMember(
  userId: string,
  workspaceId: string,
  roomId: string,
) {
  return prisma.chatRoomMember.findFirst({
    where: {
      userId,
      roomId,
      room: { id: roomId, workspaceId },
    },
  });
}

type EntityMention = {
  kind: "user" | "board" | "media";
  id: string;
  label: string;
  url?: string | null;
};

type MessageRow = {
  id: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  replyToId: string | null;
  authorId: string;
  entityMentions?: unknown;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  replyTo?: {
    id: string;
    body: string;
    author: { id: string; name: string | null; email: string | null };
  } | null;
  reactions: { emoji: string; userId: string }[];
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string | null;
    sizeBytes: number;
  }[];
  mentions: { userId: string; user: { id: string; name: string | null; email: string | null } }[];
  savedBy?: { userId: string }[];
};

function parseEntityMentions(raw: unknown): EntityMention[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is EntityMention =>
        !!x &&
        typeof x === "object" &&
        typeof (x as EntityMention).id === "string" &&
        typeof (x as EntityMention).label === "string" &&
        ["user", "board", "media"].includes((x as EntityMention).kind),
    )
    .map((x) => ({
      kind: x.kind,
      id: x.id,
      label: x.label,
      url: x.url ?? null,
    }));
}

export function serializeChatMessage(m: MessageRow, viewerId: string) {
  const reactionMap = new Map<string, string[]>();
  for (const r of m.reactions) {
    const list = reactionMap.get(r.emoji) || [];
    list.push(r.userId);
    reactionMap.set(r.emoji, list);
  }
  const entityMentions = parseEntityMentions(m.entityMentions);
  return {
    id: m.id,
    body: m.deletedAt ? "" : m.body,
    createdAt: m.createdAt,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    replyToId: m.replyToId,
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          body: m.replyTo.body.slice(0, 140),
          authorName: m.replyTo.author.name || m.replyTo.author.email || "User",
        }
      : null,
    author: {
      id: m.author.id,
      name: m.author.name || m.author.email || "User",
      email: m.author.email || "",
      avatarUrl: m.author.avatarUrl,
    },
    reactions: [...reactionMap.entries()].map(([emoji, userIds]) => ({
      emoji,
      userIds,
      count: userIds.length,
      reactedByMe: userIds.includes(viewerId),
    })),
    attachments: m.attachments,
    mentions: m.mentions.map((x) => ({
      userId: x.userId,
      name: x.user.name || x.user.email || "User",
    })),
    entityMentions,
    isMine: m.authorId === viewerId,
    isSaved: (m.savedBy || []).some((s) => s.userId === viewerId),
  };
}

export const messageInclude = {
  author: { select: authorSelect },
  replyTo: {
    select: {
      id: true,
      body: true,
      author: { select: { id: true, name: true, email: true } },
    },
  },
  reactions: { select: { emoji: true, userId: true } },
  attachments: { where: { deletedAt: null } },
  mentions: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} as const;
