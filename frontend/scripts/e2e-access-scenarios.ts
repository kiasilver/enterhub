/**
 * Phase 11 — Access control E2E scenarios (API/service level).
 * Run: npx tsx scripts/e2e-access-scenarios.ts
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
      update: {},
    });
  }
}

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

async function main() {
  await ensurePermissions();
  const { createWorkspaceWithOwner } = await import("../src/lib/workspace-service");
  const { hasPermission, getUserPermissions } = await import("../src/lib/rbac");
  const { canAccessBoard, redactCardForGuest } = await import("../src/lib/board-access");
  const { ensureSystemRoles } = await import("../src/lib/system-roles");

  const stamp = Date.now();
  const owner = await prisma.user.create({
    data: {
      email: `e2e.owner.${stamp}@enterhub.test`,
      name: "E2E Owner",
      passwordHash: await bcrypt.hash("Test123456!", 10),
    },
  });
  const member = await prisma.user.create({
    data: {
      email: `e2e.member.${stamp}@enterhub.test`,
      name: "E2E Member",
      passwordHash: await bcrypt.hash("Test123456!", 10),
    },
  });
  const guestUser = await prisma.user.create({
    data: {
      email: `e2e.guest.${stamp}@enterhub.test`,
      name: "E2E Guest",
      passwordHash: await bcrypt.hash("Test123456!", 10),
    },
  });
  const superAdmin = await prisma.user.create({
    data: {
      email: `e2e.sa.${stamp}@enterhub.test`,
      name: "E2E SA",
      isSuperAdmin: true,
      passwordHash: await bcrypt.hash("Test123456!", 10),
    },
  });

  const { workspace, roles } = await createWorkspaceWithOwner({
    name: `E2E WS ${stamp}`,
    ownerId: owner.id,
  });
  await ensureSystemRoles(workspace.id);

  // 11.1 Owner can invite / manage roles
  assert(await hasPermission(owner.id, workspace.id, "workspace:members"), "11.1 owner members");
  assert(await hasPermission(owner.id, workspace.id, "workspace:roles"), "11.1 owner roles");
  assert(await hasPermission(owner.id, workspace.id, "workspace:transfer_ownership"), "11.1 owner transfer");

  await prisma.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: member.id,
      roleId: roles.MEMBER.id,
      status: "ACTIVE",
    },
  });

  // 11.2 Member cannot invite
  assert(!(await hasPermission(member.id, workspace.id, "workspace:members")), "11.2 member no invite");

  const board = await prisma.board.create({
    data: { workspaceId: workspace.id, name: "E2E Board" },
  });
  const list = await prisma.list.create({
    data: { boardId: board.id, title: "Todo", order: 0 },
  });
  const cardMine = await prisma.card.create({
    data: { listId: list.id, title: "Guest card", order: 0, description: "secret body" },
  });
  await prisma.cardAssignee.create({
    data: { cardId: cardMine.id, userId: guestUser.id },
  });
  await prisma.card.create({
    data: { listId: list.id, title: "Other card", order: 1, description: "hidden" },
  });

  await prisma.boardGuest.create({
    data: {
      boardId: board.id,
      userId: guestUser.id,
      accessLevel: "ASSIGNED_ONLY",
    },
  });

  // 11.3 Guest can access invited board only
  const guestAccess = await canAccessBoard(guestUser.id, board.id);
  assert(guestAccess.ok && guestAccess.via === "guest", "11.3 guest board access");

  const otherBoard = await prisma.board.create({
    data: { workspaceId: workspace.id, name: "Secret Board" },
  });
  const guestOther = await canAccessBoard(guestUser.id, otherBoard.id);
  assert(!guestOther.ok, "11.3 guest denied other board");

  const redacted = redactCardForGuest(
    {
      id: cardMine.id,
      listId: list.id,
      title: "x",
      description: "d",
      order: 0,
      dueDate: null,
      archivedAt: null,
      timeLogs: [{ hours: 5 }],
      financialMeta: { cost: 100 },
    },
    "ASSIGNED_ONLY"
  );
  assert(redacted.timeLogs === undefined, "11.3 redact timeLogs");
  assert(redacted.financialMeta === undefined, "11.3 redact financial");

  // 11.4 Super Admin is NOT workspace member → no card/workspace perms
  assert(!(await hasPermission(superAdmin.id, workspace.id, "card:update")), "11.4 SA no card:update");
  assert(!(await hasPermission(superAdmin.id, workspace.id, "workspace:members")), "11.4 SA no members");
  const saBoard = await canAccessBoard(superAdmin.id, board.id);
  assert(!saBoard.ok, "11.4 SA cannot access tenant board via canAccessBoard");

  // Security fields exist
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { enforce2FA: true, sessionTimeoutHours: 12, ipAllowlist: ["127.0.0.1/32"] },
  });
  const ws = await prisma.workspace.findUnique({ where: { id: workspace.id } });
  assert(ws?.enforce2FA === true, "6.x enforce2FA persisted");

  const ownerPerms = await getUserPermissions(owner.id, workspace.id);
  assert(ownerPerms.length >= 20, "owner permission count");

  console.log(
    JSON.stringify(
      {
        ok: true,
        scenarios: {
          "11.1_owner": true,
          "11.2_member_403_invite": true,
          "11.3_guest_board_scoped": true,
          "11.4_superadmin_no_tenant_cards": true,
          "6_security_fields": true,
        },
        workspaceId: workspace.id,
        boardId: board.id,
        accounts: {
          owner: owner.email,
          member: member.email,
          guest: guestUser.email,
          superAdmin: superAdmin.email,
          password: "Test123456!",
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
