import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertWritableSession } from "@/lib/session-guards";
import { z } from "zod";

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

/** GET deleted chats/files still within 6-day window */
export async function GET() {
  const session = await auth();
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const now = new Date();
  const [messages, attachments, media] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        deletedAt: { not: null },
        OR: [{ purgeAfter: null }, { purgeAfter: { gt: now } }],
      },
      include: {
        author: { select: { name: true, email: true } },
        room: { select: { name: true, workspaceId: true } },
      },
      orderBy: { deletedAt: "desc" },
      take: 50,
    }),
    prisma.attachment.findMany({
      where: {
        deletedAt: { not: null },
        OR: [{ purgeAfter: null }, { purgeAfter: { gt: now } }],
      },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        card: { select: { title: true, id: true } },
      },
      orderBy: { deletedAt: "desc" },
      take: 50,
    }),
    prisma.mediaAsset.findMany({
      where: {
        deletedAt: { not: null },
        OR: [{ purgeAfter: null }, { purgeAfter: { gt: now } }],
      },
      include: {
        uploadedBy: { select: { name: true, email: true } },
        workspace: { select: { name: true } },
      },
      orderBy: { deletedAt: "desc" },
      take: 50,
    }),
  ]);

  // purge expired
  await Promise.all([
    prisma.chatMessage.deleteMany({
      where: { purgeAfter: { lte: now }, deletedAt: { not: null } },
    }),
    prisma.chatAttachment.deleteMany({
      where: { purgeAfter: { lte: now }, deletedAt: { not: null } },
    }),
    prisma.attachment.deleteMany({
      where: { purgeAfter: { lte: now }, deletedAt: { not: null } },
    }),
    prisma.mediaAsset.deleteMany({
      where: { purgeAfter: { lte: now }, deletedAt: { not: null } },
    }),
  ]);

  return NextResponse.json({ data: { messages, attachments, media } });
}

const restoreSchema = z.object({
  kind: z.enum(["message", "attachment", "media"]),
  id: z.string().min(1),
});

export async function POST(req: Request) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = restoreSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const data = { deletedAt: null, purgeAfter: null };
  if (parsed.data.kind === "message") {
    await prisma.chatMessage.update({ where: { id: parsed.data.id }, data });
  } else if (parsed.data.kind === "attachment") {
    await prisma.attachment.update({ where: { id: parsed.data.id }, data });
  } else {
    await prisma.mediaAsset.update({ where: { id: parsed.data.id }, data });
  }
  return NextResponse.json({ data: { ok: true } });
}
