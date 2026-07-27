import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";

type Ctx = { params: Promise<{ id: string }> };

const inviteGuestSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  accessLevel: z.enum(["READ_ONLY", "COMMENT_ONLY", "ASSIGNED_ONLY"]).default("READ_ONLY"),
});

/** GET /api/boards/[id]/guests */
export async function GET(_req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId } = await context.params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { workspaceId: true },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (!(await hasPermission(session.user.id, board.workspaceId, "board:invite_guest"))) {
    return NextResponse.json({ error: "Forbidden: board:invite_guest" }, { status: 403 });
  }

  const guests = await prisma.boardGuest.findMany({
    where: { boardId },
    include: {
      user: { select: { id: true, email: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: guests });
}

/** POST /api/boards/[id]/guests */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boardId } = await context.params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, workspaceId: true, name: true },
  });
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (session.user.impersonating) {
    return NextResponse.json({ error: "Forbidden: read-only impersonation" }, { status: 403 });
  }

  if (!(await hasPermission(session.user.id, board.workspaceId, "board:invite_guest"))) {
    return NextResponse.json({ error: "Forbidden: board:invite_guest" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteGuestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name ?? email.split("@")[0],
        passwordHash: await bcrypt.hash(`guest-${Date.now()}`, 10),
      },
    });
  }

  // Guests should not already be full ACTIVE workspace members with org visibility confusion —
  // still allow BoardGuest row; membership can coexist but access helper prefers member.
  const guest = await prisma.boardGuest.upsert({
    where: { boardId_userId: { boardId, userId: user.id } },
    create: {
      boardId,
      userId: user.id,
      accessLevel: parsed.data.accessLevel,
    },
    update: { accessLevel: parsed.data.accessLevel },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: board.workspaceId,
    boardId,
    action: "board.guest.invite",
    metadata: { email, accessLevel: parsed.data.accessLevel },
    severity: "info",
  });

  return NextResponse.json({ data: guest }, { status: 201 });
}
