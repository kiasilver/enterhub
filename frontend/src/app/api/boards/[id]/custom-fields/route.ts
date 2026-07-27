import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessBoard } from "@/lib/board-access";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { filterCustomFieldsForUser } from "@/lib/card-permissions";

type Ctx = { params: Promise<{ id: string }> };

const fieldSchema = z.object({
  name: z.string().min(1).max(80),
  fieldType: z.enum(["text", "paragraph", "checkbox", "number", "date", "dropdown"]),
  options: z.unknown().optional(),
  sortOrder: z.number().optional(),
});

/** GET/POST /api/boards/[id]/custom-fields */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId } = await ctx.params;
  const access = await canAccessBoard(session.user.id, boardId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const canFinancial =
    access.via === "member" &&
    (await hasPermission(session.user.id, board.workspaceId, "field:financial"));

  const rows = await prisma.boardCustomField.findMany({
    where: { boardId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({
    data: filterCustomFieldsForUser(rows, canFinancial),
  });
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
  if (!(await hasPermission(session.user.id, board.workspaceId, "board:settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = fieldSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const max = await prisma.boardCustomField.aggregate({
    where: { boardId },
    _max: { sortOrder: true },
  });

  const row = await prisma.boardCustomField.create({
    data: {
      boardId,
      name: parsed.data.name,
      fieldType: parsed.data.fieldType,
      options: parsed.data.options as object | undefined,
      sortOrder: parsed.data.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}

/** PUT reorder: { orderedIds: string[] } */
export async function PUT(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId } = await ctx.params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await hasPermission(session.user.id, board.workspaceId, "board:settings"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z
    .object({ orderedIds: z.array(z.string()).min(1) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await prisma.$transaction(
    body.data.orderedIds.map((fid, i) =>
      prisma.boardCustomField.updateMany({
        where: { id: fid, boardId },
        data: { sortOrder: i },
      })
    )
  );

  const rows = await prisma.boardCustomField.findMany({
    where: { boardId },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ data: rows });
}
