import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

(async () => {
  const u = await p.user.findUnique({ where: { email: "lead@enteredge.dev" } });
  if (!u) {
    console.log("no lead user");
    return;
  }
  const m = await p.workspaceMember.findFirst({
    where: { userId: u.id, workspace: { slug: "enteredge" } },
    include: {
      role: {
        include: { permissions: { include: { permission: true } } },
      },
    },
  });
  console.log("role", m?.role.name);
  const names = m?.role.permissions.map((x) => x.permission.actionName) || [];
  console.log("has board:settings", names.includes("board:settings"));
  console.log("count", names.length);
  console.log(names.join(", "));
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
