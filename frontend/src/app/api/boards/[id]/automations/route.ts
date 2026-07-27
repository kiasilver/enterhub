import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(120),
  definition: z.record(z.string(), z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
});

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok || access.via !== "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.boardAutomation.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: rows });
}

export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId } = await ctx.params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await hasPermission(session.user.id, board.workspaceId, "automation:manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await prisma.boardAutomation.create({
    data: {
      boardId,
      name: parsed.data.name,
      definition: (parsed.data.definition ?? { trigger: null, action: null }) as object,
      isEnabled: parsed.data.isEnabled ?? true,
    },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}
