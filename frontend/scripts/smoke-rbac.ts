/**
 * Smoke test Phase 1–4 services without HTTP session.
 * Run: npx tsx scripts/smoke-rbac.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PERMISSION_CATALOG } from "../src/lib/permissions-catalog";

const prisma = new PrismaClient();

async function ensurePermissions() {
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { actionName: p.actionName },
      create: { actionName: p.actionName, description: `[${p.group}] ${p.description}` },
      update: { description: `[${p.group}] ${p.description}` },
    });
  }
}

async function main() {
  await ensurePermissions();

  // Dynamic import after permissions exist (uses same prisma via lib)
  const { createWorkspaceWithOwner } = await import("../src/lib/workspace-service");
  const { ensureSystemRoles } = await import("../src/lib/system-roles");
  const { getUserPermissions } = await import("../src/lib/rbac");

  const email = `owner.smoke.${Date.now()}@enterhub.test`;
  const user = await prisma.user.create({
    data: {
      email,
      name: "Smoke Owner",
      passwordHash: await bcrypt.hash("Test123456!", 10),
    },
  });

  const { workspace, roles } = await createWorkspaceWithOwner({
    name: `Smoke Co ${Date.now()}`,
    ownerId: user.id,
  });

  const roleNames = Object.keys(roles);
  const perms = await getUserPermissions(user.id, workspace.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        password: "Test123456!",
        workspaceId: workspace.id,
        systemRoles: roleNames,
        ownerPermissionCount: perms.length,
        hasBoardAdmin: Boolean(roles.BOARD_ADMIN),
      },
      null,
      2
    )
  );

  // re-run ensure is idempotent
  await ensureSystemRoles(workspace.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
