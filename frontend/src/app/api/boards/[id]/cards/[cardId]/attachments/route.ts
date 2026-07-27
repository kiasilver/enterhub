import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { assertWritableSession } from "@/lib/session-guards";
import { resolveCardCapabilities } from "@/lib/card-permissions";

type Ctx = { params: Promise<{ id: string; cardId: string }> };

const uploadSchema = z.object({
  fileName: z.string().min(1).max(240),
  fileUrl: z.string().min(1).max(8_000_000),
  mimeType: z.string().max(120).optional(),
  sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024).optional(),
});

/** POST attachment on card — creator, assignee, watcher (with attach perm), or guest */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, cardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const card = await prisma.card.findFirst({
    where: { id: cardId, list: { boardId }, archivedAt: null },
    select: { id: true, createdById: true },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const caps = await resolveCardCapabilities(
    session.user.id,
    board,
    card,
    access,
  );
  if (!caps.canView || !caps.canAttach) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = uploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await prisma.attachment.create({
    data: {
      cardId,
      uploadedById: session.user.id,
      fileName: parsed.data.fileName,
      fileUrl: parsed.data.fileUrl,
      mimeType: parsed.data.mimeType || "application/octet-stream",
      sizeBytes: parsed.data.sizeBytes ?? null,
    },
  });

  return NextResponse.json({ data: row }, { status: 201 });
}
