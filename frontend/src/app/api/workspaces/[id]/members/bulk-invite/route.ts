import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";
import { SYSTEM_ROLE_META } from "@/lib/permissions-catalog";

type Ctx = { params: Promise<{ id: string }> };

const bulkSchema = z.object({
  csv: z.string().min(1),
  defaultRoleId: z.string().min(1),
});

/** POST /api/workspaces/[id]/members/bulk-invite — CSV: email,name? */
export async function POST(req: Request, context: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await context.params;

  if (!(await hasPermission(session.user.id, workspaceId, "workspace:members"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const role = await prisma.role.findFirst({
    where: { id: parsed.data.defaultRoleId, workspaceId },
  });
  if (!role || role.name === SYSTEM_ROLE_META.OWNER.name) {
    return NextResponse.json({ error: "Invalid default role" }, { status: 400 });
  }

  const lines = parsed.data.csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const line of lines) {
    if (line.toLowerCase().startsWith("email")) continue; // header
    const [emailRaw, nameRaw] = line.split(",").map((s) => s?.trim());
    const email = emailRaw?.toLowerCase();
    if (!email || !email.includes("@")) {
      results.push({ email: emailRaw || "", ok: false, error: "invalid email" });
      continue;
    }
    try {
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: nameRaw || email.split("@")[0],
            passwordHash: await bcrypt.hash(`invite-${Date.now()}`, 10),
          },
        });
      }
      const exists = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: user.id } },
      });
      if (exists) {
        results.push({ email, ok: false, error: "already member" });
        continue;
      }
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: user.id,
          roleId: role.id,
          status: "INVITED",
        },
      });
      results.push({ email, ok: true });
    } catch (e) {
      results.push({ email, ok: false, error: e instanceof Error ? e.message : "failed" });
    }
  }

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId,
    action: "member.bulk_invite",
    metadata: { total: results.length, ok: results.filter((r) => r.ok).length },
    severity: "info",
  });

  return NextResponse.json({ data: results }, { status: 201 });
}
