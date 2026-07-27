import { PrismaClient, type ChatRoomType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSION_CATALOG } from "../src/lib/permissions-catalog";
import { ensureSystemRoles } from "../src/lib/system-roles";
import { seedEnterprisePositions } from "../src/lib/seed-enterprise";
import { ensureDefaultWorkspaceLabels } from "../src/lib/workspace-labels-server";

const prisma = new PrismaClient();

/** Shared password for all demo accounts */
export const DEMO_PASSWORD = "Demo1234!";

const DEPARTMENTS = ["finance", "it", "hr", "marketing", "operations"] as const;

type DemoUser = {
  email: string;
  name: string;
  title: string;
  roleKey: "OWNER" | "ORG_ADMIN" | "BOARD_ADMIN" | "MEMBER";
  positionKey?: string;
  isSuperAdmin?: boolean;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "owner@enteredge.dev",
    name: "Reza Founder",
    title: "CEO",
    roleKey: "OWNER",
    isSuperAdmin: true,
  },
  {
    email: "admin@enteredge.dev",
    name: "Sara Org Admin",
    title: "Org Admin",
    roleKey: "ORG_ADMIN",
  },
  {
    email: "lead@enteredge.dev",
    name: "Nima Tech Lead",
    title: "Engineering Lead",
    roleKey: "BOARD_ADMIN",
    positionKey: "it_supervisor",
  },
  // IT
  {
    email: "ali.dev@enteredge.dev",
    name: "Ali Mohammadi",
    title: "Senior Developer",
    roleKey: "MEMBER",
    positionKey: "developer",
  },
  {
    email: "mina.dev@enteredge.dev",
    name: "Mina Karimi",
    title: "Frontend Developer",
    roleKey: "MEMBER",
    positionKey: "developer",
  },
  {
    email: "pouya.dev@enteredge.dev",
    name: "Pouya Ahmadi",
    title: "Backend Developer",
    roleKey: "MEMBER",
    positionKey: "developer",
  },
  // Finance
  {
    email: "finance@enteredge.dev",
    name: "Leila Finance",
    title: "Finance Manager",
    roleKey: "BOARD_ADMIN",
    positionKey: "finance_manager",
  },
  {
    email: "accountant@enteredge.dev",
    name: "Hassan Accountant",
    title: "Accountant",
    roleKey: "MEMBER",
    positionKey: "accountant",
  },
  // HR
  {
    email: "hr@enteredge.dev",
    name: "Maryam HR",
    title: "HR Manager",
    roleKey: "BOARD_ADMIN",
    positionKey: "hr_manager",
  },
  {
    email: "recruiter@enteredge.dev",
    name: "Kiana Recruiter",
    title: "Recruiter",
    roleKey: "MEMBER",
    positionKey: "recruiter",
  },
  // Marketing
  {
    email: "marketing@enteredge.dev",
    name: "Omar Marketing",
    title: "Marketing Manager",
    roleKey: "BOARD_ADMIN",
    positionKey: "marketing_manager",
  },
  {
    email: "content@enteredge.dev",
    name: "Yasmin Content",
    title: "Content Specialist",
    roleKey: "MEMBER",
    positionKey: "marketer",
  },
  // Operations
  {
    email: "ops@enteredge.dev",
    name: "Dariush Ops",
    title: "Operations Manager",
    roleKey: "BOARD_ADMIN",
    positionKey: "ops_manager",
  },
  {
    email: "ops.coord@enteredge.dev",
    name: "Nina Coordinator",
    title: "Ops Specialist",
    roleKey: "MEMBER",
    positionKey: "ops_specialist",
  },
];

const BOARD_TEMPLATES: Record<string, string[]> = {
  finance: [
    "Q3 Budget Planning",
    "Payroll & Benefits",
    "Vendor Invoices",
    "Audit Prep 2026",
  ],
  it: [
    "Momentum V2 Backend",
    "Platform Infrastructure",
    "Mobile App Sprint",
    "Security Hardening",
    "API Gateway Migration",
  ],
  hr: ["Hiring Pipeline", "Onboarding Playbook", "Policy Handbook"],
  marketing: ["Product Launch Campaign", "Content Calendar", "Website Refresh"],
  operations: ["Facility Ops", "Vendor SLAs", "Process Improvement"],
};

function listBucketTitles() {
  return [
    { title: "To Do", order: 0 },
    { title: "In Progress", order: 1 },
    { title: "Review", order: 2 },
    { title: "Done", order: 3 },
  ];
}

async function seedPermissions() {
  for (const p of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { actionName: p.actionName },
      create: {
        actionName: p.actionName,
        description: `[${p.group}] ${p.description}`,
      },
      update: {
        description: `[${p.group}] ${p.description}`,
      },
    });
  }
}

async function upsertUser(u: DemoUser, passwordHash: string) {
  return prisma.user.upsert({
    where: { email: u.email },
    create: {
      email: u.email,
      name: u.name,
      passwordHash,
      isSuperAdmin: !!u.isSuperAdmin,
      emailVerifiedAt: new Date(),
      pendingOnboarding: false,
      lastLoginAt: new Date(Date.now() - Math.random() * 3 * 3600_000),
    },
    update: {
      name: u.name,
      passwordHash,
      isSuperAdmin: !!u.isSuperAdmin,
      emailVerifiedAt: new Date(),
      pendingOnboarding: false,
    },
  });
}

async function main() {
  console.log("\n🌱 ENTERHUB demo seed — Enteredge\n");
  await seedPermissions();
  console.log("✓ Permission catalog");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const users = [];
  for (const u of DEMO_USERS) {
    users.push({ meta: u, row: await upsertUser(u, passwordHash) });
  }
  console.log(`✓ ${users.length} users (password: ${DEMO_PASSWORD})`);

  const owner = users.find((u) => u.meta.roleKey === "OWNER")!.row;

  let workspace = await prisma.workspace.findUnique({ where: { slug: "enteredge" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Enteredge",
        slug: "enteredge",
        ownerId: owner.id,
        planTier: "PRO",
        status: "ACTIVE",
        departments: [...DEPARTMENTS],
        employeeBand: "MEDIUM",
        seatLimit: 25,
        storageLimitMb: 5120,
        ownerTitle: "CEO",
        logoColor: "#2563EB",
        capturedDomain: "enteredge.dev",
        onboardingCompletedAt: new Date(),
      },
    });
  } else {
    workspace = await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        name: "Enteredge",
        ownerId: owner.id,
        departments: [...DEPARTMENTS],
        planTier: "PRO",
        status: "ACTIVE",
        onboardingCompletedAt: new Date(),
      },
    });
  }
  console.log(`✓ Workspace ${workspace.name} (${workspace.id})`);

  const systemRoles = await ensureSystemRoles(workspace.id);
  await seedEnterprisePositions(workspace.id, {
    departments: [...DEPARTMENTS],
    positionKeys: [
      "it_supervisor",
      "developer",
      "finance_manager",
      "accountant",
      "hr_manager",
      "recruiter",
      "marketing_manager",
      "marketer",
      "ops_manager",
      "ops_specialist",
    ],
  });
  await ensureDefaultWorkspaceLabels(workspace.id);

  const positionRoles = await prisma.role.findMany({
    where: { workspaceId: workspace.id, isSystem: false },
  });
  const positionByKey = new Map<string, (typeof positionRoles)[0]>();
  for (const r of positionRoles) {
    const slug = r.name.toLowerCase();
    // Match specific titles first — avoid substring traps like "recruiter".includes("it")
    if (slug.includes("developer")) positionByKey.set("developer", r);
    if (
      slug.includes("it supervisor") ||
      slug.includes("engineering lead") ||
      slug.includes("engineering supervisor") ||
      slug === "it" ||
      slug.startsWith("it ")
    ) {
      positionByKey.set("it_supervisor", r);
    }
    if (slug.includes("finance manager")) positionByKey.set("finance_manager", r);
    if (slug.includes("accountant")) positionByKey.set("accountant", r);
    if (slug.includes("hr manager")) positionByKey.set("hr_manager", r);
    if (slug.includes("recruiter")) positionByKey.set("recruiter", r);
    if (slug.includes("marketing manager")) positionByKey.set("marketing_manager", r);
    if (slug.includes("marketing specialist") || slug.includes("content"))
      positionByKey.set("marketer", r);
    if (slug.includes("operations manager")) positionByKey.set("ops_manager", r);
    if (slug.includes("ops specialist") || slug.includes("operations specialist"))
      positionByKey.set("ops_specialist", r);
  }

  for (const { meta, row } of users) {
    let roleId = systemRoles[meta.roleKey].id;
    if (meta.positionKey) {
      const pos = positionByKey.get(meta.positionKey);
      if (pos) roleId = pos.id;
      else if (meta.roleKey !== "OWNER") {
        roleId = systemRoles[meta.roleKey].id;
      }
    }
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: row.id },
      },
      create: {
        workspaceId: workspace.id,
        userId: row.id,
        roleId,
        status: "ACTIVE",
        title: meta.title,
      },
      update: {
        roleId,
        status: "ACTIVE",
        title: meta.title,
      },
    });
  }
  console.log("✓ Workspace memberships");

  // Departments + membership from position keys
  const { ensureWorkspaceDepartments, backfillBoardDepartments } = await import(
    "../src/lib/departments"
  );
  const { POSITION_TEMPLATES } = await import("../src/lib/enterprise-positions");
  const deptRows = await ensureWorkspaceDepartments(workspace.id, [...DEPARTMENTS]);
  const deptByKey = new Map(deptRows.map((d) => [d.key, d]));

  for (const { meta, row } of users) {
    // Org Owner / Org Admin get company-wide access via permissions —
    // do NOT mark them MANAGER of every department (that made every card look all-managers).
    if (meta.roleKey === "OWNER" || meta.roleKey === "ORG_ADMIN") {
      continue;
    }
    const tpl = meta.positionKey
      ? POSITION_TEMPLATES.find((t) => t.key === meta.positionKey)
      : undefined;
    const deptKey =
      tpl && tpl.department !== "leadership" ? tpl.department : null;
    if (!deptKey) continue;
    const dept = deptByKey.get(deptKey);
    if (!dept) continue;
    const isManager =
      meta.positionKey?.includes("manager") ||
      (meta.roleKey === "BOARD_ADMIN" && meta.positionKey !== "it_supervisor");
    const isSupervisor =
      meta.positionKey?.includes("supervisor") ||
      meta.positionKey === "it_supervisor";
    const deptRole = isManager
      ? "MANAGER"
      : isSupervisor
        ? "SUPERVISOR"
        : "MEMBER";
    await prisma.departmentMember.upsert({
      where: {
        departmentId_userId: { departmentId: dept.id, userId: row.id },
      },
      create: {
        departmentId: dept.id,
        userId: row.id,
        role: deptRole,
      },
      update: {
        role: deptRole,
      },
    });
  }
  console.log(`✓ ${deptRows.length} departments + memberships`);

  // Boards per department
  let boardCount = 0;
  let cardCount = 0;
  const boardIds: string[] = [];
  const memberUserIds = users.map((u) => u.row.id);

  for (const dept of DEPARTMENTS) {
    const deptRow = deptByKey.get(dept);
    const titles = BOARD_TEMPLATES[dept] || [`${dept} Board`];
    for (const name of titles) {
      const existing = await prisma.board.findFirst({
        where: { workspaceId: workspace.id, name },
      });
      if (existing) {
        if (deptRow && !existing.departmentId) {
          await prisma.board.update({
            where: { id: existing.id },
            data: { departmentId: deptRow.id, background: deptRow.color },
          });
        }
        boardIds.push(existing.id);
        boardCount += 1;
        continue;
      }
      const board = await prisma.board.create({
        data: {
          workspaceId: workspace.id,
          departmentId: deptRow?.id,
          name,
          description: `${dept.toUpperCase()} · ${name}`,
          visibility: "WORKSPACE",
          background: deptRow?.color,
          lists: {
            create: listBucketTitles(),
          },
        },
        include: { lists: true },
      });
      boardIds.push(board.id);
      boardCount += 1;

      const lists = board.lists.sort((a, b) => a.order - b.order);
      const taskSeeds = [
        "Implement auth flow",
        "Fix payment webhook",
        "Write API docs",
        "Design dashboard widgets",
        "QA regression pass",
        "Deploy staging",
        "Sync CRM contacts",
        "Prepare weekly report",
      ];
      for (let i = 0; i < 8; i++) {
        const list = lists[i % lists.length];
        const assignee = memberUserIds[(i + boardCount) % memberUserIds.length];
        const due = new Date();
        due.setDate(due.getDate() + (i % 5) - 1);
        const card = await prisma.card.create({
          data: {
            listId: list.id,
            title: `${taskSeeds[i % taskSeeds.length]} (${name.split(" ")[0]})`,
            description: `Seeded task for ${name}`,
            order: i,
            dueDate: due,
            createdById: owner.id,
            estimatedHours: 2 + (i % 4),
            priority: i % 4 === 0 ? "HIGH" : i % 3 === 0 ? "MEDIUM" : "NONE",
            checklistItems: {
              create: [
                { title: "Start task", order: 0 },
                { title: "End of task", order: 1 },
              ],
            },
            assignees: { create: [{ userId: assignee }] },
          },
        });
        cardCount += 1;
        void card;
      }
    }
  }
  await backfillBoardDepartments(workspace.id);
  console.log(`✓ ${boardCount} boards · ${cardCount} cards`);

  // Chat: General + Engineering + a DM
  const allMemberIds = memberUserIds;
  async function ensureChannel(name: string, memberIds: string[]) {
    const found = await prisma.chatRoom.findFirst({
      where: { workspaceId: workspace!.id, type: "CHANNEL", name },
    });
    if (found) return found;
    return prisma.chatRoom.create({
      data: {
        workspaceId: workspace!.id,
        type: "CHANNEL" as ChatRoomType,
        name,
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
  }

  const general = await ensureChannel("general", allMemberIds);
  const eng = await ensureChannel(
    "engineering",
    users
      .filter((u) => /dev|lead|owner|admin/i.test(u.meta.email))
      .map((u) => u.row.id),
  );

  const msgCount = await prisma.chatMessage.count({ where: { roomId: general.id } });
  if (msgCount === 0) {
    const samples = [
      { author: owner.id, body: "Welcome to Enteredge on ENTERHUB 👋" },
      {
        author: users.find((u) => u.meta.email.startsWith("lead"))!.row.id,
        body: "Standup at 10:00 — please update your board cards.",
      },
      {
        author: users.find((u) => u.meta.email.startsWith("ali"))!.row.id,
        body: "Momentum V2 API PR is ready for review.",
      },
      {
        author: users.find((u) => u.meta.email.startsWith("hr"))!.row.id,
        body: "New hire onboarding checklist is in the HR board.",
      },
    ];
    for (const s of samples) {
      await prisma.chatMessage.create({
        data: { roomId: general.id, authorId: s.author, body: s.body },
      });
    }
    await prisma.chatMessage.create({
      data: {
        roomId: eng.id,
        authorId: users.find((u) => u.meta.email.startsWith("lead"))!.row.id,
        body: "Please keep Review column moving — QA is the bottleneck this week.",
      },
    });
  }
  console.log("✓ Chat rooms + messages");

  // Internal mail
  const mailCount = await prisma.mailMessage.count({
    where: { workspaceId: workspace.id },
  });
  if (mailCount === 0) {
    const lead = users.find((u) => u.meta.email.startsWith("lead"))!.row;
    const ali = users.find((u) => u.meta.email.startsWith("ali"))!.row;
    const hr = users.find((u) => u.meta.email.startsWith("hr"))!.row;
    await prisma.mailMessage.createMany({
      data: [
        {
          workspaceId: workspace.id,
          fromUserId: owner.id,
          toUserId: lead.id,
          subject: "Q3 delivery priorities",
          body: "Nima — focus Momentum V2 and Security Hardening this sprint. Ping me if you need more headcount.",
        },
        {
          workspaceId: workspace.id,
          fromUserId: lead.id,
          toUserId: ali.id,
          subject: "API review checklist",
          body: "Ali, please walk through auth + webhook edge cases before marking Done.",
        },
        {
          workspaceId: workspace.id,
          fromUserId: hr.id,
          toUserId: owner.id,
          subject: "Offer letter — Frontend hire",
          body: "Candidate accepted. Onboarding starts Monday. Details in Hiring Pipeline board.",
          readAt: new Date(),
        },
        {
          workspaceId: workspace.id,
          fromUserId: users.find((u) => u.meta.email.startsWith("finance"))!.row.id,
          toUserId: owner.id,
          subject: "Budget variance — cloud costs",
          body: "Infra spend is 12% over plan. Shared the Audit Prep board for details.",
        },
      ],
    });
  }
  console.log("✓ Internal mail");

  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      smsOtpEnabled: true,
      emailVerifyEnabled: true,
      googleAuthEnabled: true,
      zarinpalSandbox: true,
    },
    update: {},
  });
  await prisma.paymentMethod.upsert({
    where: { kind: "C2C" },
    create: { kind: "C2C", enabled: true },
    update: { enabled: true },
  });
  await prisma.paymentMethod.upsert({
    where: { kind: "ZARINPAL" },
    create: { kind: "ZARINPAL", enabled: false },
    update: {},
  });
  console.log("✓ PlatformSettings + PaymentMethod (C2C on, Zarinpal stub off)");

  console.log("\n════════════════════════════════════════");
  console.log(" DEMO LOGIN CREDENTIALS");
  console.log(" Password for ALL users:", DEMO_PASSWORD);
  console.log(" Super Admin:", "owner@enteredge.dev");
  console.log(" Workspace slug: enteredge");
  console.log(" URL: /workspace/" + workspace.id);
  console.log("────────────────────────────────────────");
  for (const { meta } of users) {
    console.log(`  ${meta.email.padEnd(32)}  ${meta.name} (${meta.title})`);
  }
  console.log("════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
