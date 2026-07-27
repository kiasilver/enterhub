import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";

type Ctx = { params: Promise<{ id: string; automationId: string }> };

/** PATCH/DELETE /api/boards/[id]/automations/[automationId] */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, automationId } = await ctx.params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await hasPermission(session.user.id, board.workspaceId, "automation:manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = z
    .object({
      name: z.string().min(1).optional(),
      definition: z.record(z.string(), z.unknown()).optional(),
      isEnabled: z.boolean().optional(),
      test: z.boolean().optional(),
    })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.data.test) {
    return NextResponse.json({
      data: {
        dryRun: true,
        ok: true,
        message: "Rule would fire (dry-run — no side effects)",
        definition: body.data.definition,
      },
    });
  }

  const row = await prisma.boardAutomation.update({
    where: { id: automationId },
    data: {
      name: body.data.name,
      definition: body.data.definition as object | undefined,
      isEnabled: body.data.isEnabled,
    },
  });
  return NextResponse.json({ data: row });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId, automationId } = await ctx.params;
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await hasPermission(session.user.id, board.workspaceId, "automation:manage"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.boardAutomation.delete({ where: { id: automationId } });
  return NextResponse.json({ data: { ok: true } });
}
