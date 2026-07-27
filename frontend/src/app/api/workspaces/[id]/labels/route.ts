import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import { ensureDefaultWorkspaceLabels } from "@/lib/workspace-labels-server";

type Ctx = { params: Promise<{ id: string }> };

const createSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#3B82F6"),
});

const patchSchema = z.object({
  labelId: z.string().min(1),
  name: z.string().min(1).max(60).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().optional(),
});

/** GET /api/workspaces/[id]/labels */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureDefaultWorkspaceLabels(workspaceId);

  const labels = await prisma.workspaceLabel.findMany({
    where: { workspaceId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { cards: true } },
    },
  });

  const canManage = await hasPermission(session.user.id, workspaceId, "label:manage");

  return NextResponse.json({
    data: labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      isSystem: l.isSystem,
      sortOrder: l.sortOrder,
      createdBy: l.createdBy,
      cardCount: l._count.cards,
    })),
    canManage,
  });
}

/** POST — create label (label:manage) */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "label:manage"))) {
    return NextResponse.json({ error: "Forbidden: label:manage" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const max = await prisma.workspaceLabel.aggregate({
    where: { workspaceId },
    _max: { sortOrder: true },
  });

  try {
    const label = await prisma.workspaceLabel.create({
      data: {
        workspaceId,
        name: parsed.data.name.trim(),
        color: parsed.data.color,
        createdById: session.user.id,
        isSystem: false,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
    });
    return NextResponse.json({ data: label }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Label name already exists" }, { status: 409 });
  }
}

/** PATCH — update label */
export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "label:manage"))) {
    return NextResponse.json({ error: "Forbidden: label:manage" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const existing = await prisma.workspaceLabel.findFirst({
    where: { id: parsed.data.labelId, workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const label = await prisma.workspaceLabel.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name?.trim(),
        color: parsed.data.color,
        sortOrder: parsed.data.sortOrder,
      },
    });
    return NextResponse.json({ data: label });
  } catch {
    return NextResponse.json({ error: "Label name already exists" }, { status: 409 });
  }
}

/** DELETE ?labelId= */
export async function DELETE(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "label:manage"))) {
    return NextResponse.json({ error: "Forbidden: label:manage" }, { status: 403 });
  }

  const labelId = new URL(req.url).searchParams.get("labelId");
  if (!labelId) {
    return NextResponse.json({ error: "labelId required" }, { status: 400 });
  }

  const existing = await prisma.workspaceLabel.findFirst({
    where: { id: labelId, workspaceId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workspaceLabel.delete({ where: { id: labelId } });
  return NextResponse.json({ data: { ok: true } });
}
