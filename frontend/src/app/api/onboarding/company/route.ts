import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createWorkspaceWithOwner } from "@/lib/workspace-service";
import { AuditLogger } from "@/lib/audit-logger";
import { prisma } from "@/lib/prisma";
import { DEPARTMENTS, type DepartmentKey } from "@/lib/enterprise-positions";

const deptKeys = DEPARTMENTS.map((d) => d.key) as [DepartmentKey, ...DepartmentKey[]];

const schema = z.object({
  name: z.string().min(2).max(120),
  logoUrl: z.string().max(500_000).optional().nullable(),
  employeeBand: z.enum(["SOLO", "SMALL", "MEDIUM", "LARGE"]),
  departments: z.array(z.enum(deptKeys)).min(1),
  positionKeys: z.array(z.string()).min(1),
  customPositions: z
    .array(z.object({ name: z.string().min(2).max(80), description: z.string().max(200).optional() }))
    .max(20)
    .optional(),
  ownerTitle: z.string().min(2).max(60).default("Founder"),
  seedBoards: z.boolean().optional().default(true),
});

/** POST /api/onboarding/company — complete company wizard for current user */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const domain = session.user.email?.split("@")[1] || null;

  const { workspace, enterpriseRoles, boards } = await createWorkspaceWithOwner({
    name: parsed.data.name,
    ownerId: session.user.id,
    capturedDomain: domain && !["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(domain)
      ? domain
      : null,
    logoUrl: parsed.data.logoUrl,
    employeeBand: parsed.data.employeeBand,
    departments: parsed.data.departments,
    positionKeys: parsed.data.positionKeys,
    customPositions: parsed.data.customPositions,
    ownerTitle: parsed.data.ownerTitle,
    seedBoards: parsed.data.seedBoards,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pendingOnboarding: false },
  });

  await AuditLogger.fromRequest(req, {
    userId: session.user.id,
    workspaceId: workspace.id,
    action: "onboarding.company_complete",
    metadata: {
      name: workspace.name,
      departments: parsed.data.departments,
      positions: parsed.data.positionKeys,
      band: parsed.data.employeeBand,
    },
    severity: "info",
  });

  return NextResponse.json(
    {
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          logoUrl: workspace.logoUrl,
          logoColor: workspace.logoColor,
        },
        enterpriseRoles,
        boards: boards.map((b) => ({ id: b.id, name: b.name })),
      },
    },
    { status: 201 }
  );
}
