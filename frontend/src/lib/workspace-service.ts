import { prisma } from "@/lib/prisma";
import { ensureSystemRoles } from "@/lib/system-roles";
import {
  letterAvatarColor,
  seatLimitForBand,
  type DepartmentKey,
  type EmployeeBand,
} from "@/lib/enterprise-positions";
import { seedDepartmentBoards, seedEnterprisePositions } from "@/lib/seed-enterprise";
import { ensureDefaultWorkspaceLabels } from "@/lib/workspace-labels-server";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "workspace";
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let i = 0;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

export type CreateWorkspaceInput = {
  name: string;
  ownerId: string;
  capturedDomain?: string | null;
  logoUrl?: string | null;
  logoColor?: string | null;
  employeeBand?: EmployeeBand | null;
  departments?: DepartmentKey[];
  positionKeys?: string[];
  customPositions?: { name: string; description?: string }[];
  ownerTitle?: string | null;
  seedBoards?: boolean;
};

/**
 * Create tenant + system roles + Owner membership (+ optional enterprise positions).
 */
export async function createWorkspaceWithOwner(input: CreateWorkspaceInput) {
  const slug = await uniqueSlug(input.name);
  const name = input.name.trim();
  const logoColor = input.logoColor || letterAvatarColor(name);
  const band = input.employeeBand ?? null;
  const seatLimit = band ? seatLimitForBand(band) : 5;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      ownerId: input.ownerId,
      planTier: "FREE",
      status: "ACTIVE",
      capturedDomain: input.capturedDomain?.toLowerCase() || null,
      logoUrl: input.logoUrl || null,
      logoColor,
      employeeBand: band,
      departments: input.departments ?? [],
      ownerTitle: input.ownerTitle || "Founder",
      seatLimit,
      storageLimitMb: 150,
      extraStorageMb: 0,
      giftSeats: 0,
      guestSeatLimit: 0,
      planExpiresAt: null,
      billingCycle: "yearly",
      onboardingCompletedAt: input.departments ? new Date() : null,
    },
  });

  const roles = await ensureSystemRoles(workspace.id);
  await ensureDefaultWorkspaceLabels(workspace.id);

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: input.ownerId,
      roleId: roles.OWNER.id,
      status: "ACTIVE",
      title: input.ownerTitle || "Founder",
    },
  });

  let enterpriseRoles: { id: string; name: string; key: string }[] = [];
  if (input.departments?.length && input.positionKeys?.length) {
    enterpriseRoles = await seedEnterprisePositions(workspace.id, {
      departments: input.departments,
      positionKeys: input.positionKeys,
      customPositions: input.customPositions,
    });
  }

  let boards: Awaited<ReturnType<typeof seedDepartmentBoards>> = [];
  if (input.seedBoards !== false && input.departments?.length) {
    boards = await seedDepartmentBoards(workspace.id, input.departments);
  }

  return { workspace, roles, enterpriseRoles, boards };
}

export async function listWorkspacesForUser(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId, status: "ACTIVE", workspace: { status: "ACTIVE" } },
    include: {
      workspace: true,
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}
