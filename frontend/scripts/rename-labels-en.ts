import { PrismaClient } from "@prisma/client";

const MAP: Record<string, string> = {
  گزارش: "Report",
  "فکر شود": "Needs thought",
  مشورت: "Consult",
  "اولویت فوری": "Urgent",
  "در انتظار": "Waiting",
  مسدود: "Blocked",
};

const p = new PrismaClient();

(async () => {
  const labels = await p.workspaceLabel.findMany();
  let n = 0;
  for (const l of labels) {
    const next = MAP[l.name];
    if (!next || next === l.name) continue;
    await p.workspaceLabel.update({ where: { id: l.id }, data: { name: next } });
    n += 1;
    console.log(`${l.name} -> ${next}`);
  }
  console.log(`updated ${n} labels`);
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
