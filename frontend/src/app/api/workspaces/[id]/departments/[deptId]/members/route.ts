import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageDepartments,
  isDepartmentSupervisor,
} from "@/lib/departments";

type Ctx = { params: Promise<{ id: string; deptId: string }> };

/**
 * GET /api/workspaces/[id]/departments/[deptId]/members
 */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, deptId } = await ctx.params;
  const dept = await prisma.department.findFirst({
    where: { id: deptId, workspaceId },
  });
  if (!dept) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const canManage = await canManageDepartments(session.user.id, workspaceId);
  const supervisor = await isDepartmentSupervisor(session.user.id, deptId);
  if (!canManage && !supervisor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.departmentMember.findMany({
    where: { departmentId: deptId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
  return NextResponse.json({
    data: members.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: m.user,
    })),
  });
}

const putSchema = z.object({
  members: z
    .array(
      z.object({
        userId: z.string().min(1),
        role: z.enum(["MANAGER", "SUPERVISOR", "MEMBER"]),
      }),
    )
    .max(200),
});

/**
 * PUT — replace department roster (supervisor or admin).
 */
export async function PUT(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id: workspaceId, deptId } = await ctx.params;
  const dept = await prisma.department.findFirst({
    where: { id: deptId, workspaceId },
  });
  if (!dept) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const canManage = await canManageDepartments(session.user.id, workspaceId);
  const supervisor = await isDepartmentSupervisor(session.user.id, deptId);
  if (!canManage && !supervisor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const userIds = parsed.data.members.map((m) => m.userId);
  const wsMembers = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      userId: { in: userIds },
      status: "ACTIVE",
    },
    select: { userId: true },
  });
  const ok = new Set(wsMembers.map((m) => m.userId));
  for (const id of userIds) {
    if (!ok.has(id)) {
      return NextResponse.json(
        { error: "All members must be active workspace members" },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.departmentMember.deleteMany({ where: { departmentId: deptId } });
    if (parsed.data.members.length) {
      await tx.departmentMember.createMany({
        data: parsed.data.members.map((m) => ({
          departmentId: deptId,
          userId: m.userId,
          role: m.role,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
