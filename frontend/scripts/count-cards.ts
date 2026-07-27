import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const n = await p.card.count({
  where: { list: { board: { workspace: { slug: "enteredge" } } } },
});
console.log("cards", n);
await p.$disconnect();
