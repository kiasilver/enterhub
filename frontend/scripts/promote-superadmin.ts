import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "superadmin@enterhub.local";
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Super Admin",
      passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.G2oQ.YzqKxqKxq", // placeholder — set real via register
      isSuperAdmin: true,
    },
    update: { isSuperAdmin: true },
  });
  // Prefer promote latest registered owner for smoke if placeholder hash
  const recent = await prisma.user.findFirst({
    where: { email: { contains: "rbac-" } },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    await prisma.user.update({
      where: { id: recent.id },
      data: { isSuperAdmin: true },
    });
    console.log("promoted", recent.email);
  }
  console.log("sa", user.email, user.isSuperAdmin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
