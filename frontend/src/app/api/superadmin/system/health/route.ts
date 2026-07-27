import { NextResponse } from "next/server";
import os from "os";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireSa(session: { user?: { isSuperAdmin?: boolean } } | null) {
  return Boolean(session?.user?.isSuperAdmin);
}

export async function GET() {
  const session = await auth();
  if (!requireSa(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpus = os.cpus();
  const load = os.loadavg();

  let disk: { total?: number; free?: number } = {};
  try {
    // Node 18.15+ / 19+
    const fs = await import("fs");
    if (typeof (fs as { statfsSync?: (p: string) => { bsize: number; blocks: number; bavail: number } }).statfsSync === "function") {
      const st = (fs as unknown as { statfsSync: (p: string) => { bsize: number; blocks: number; bavail: number } }).statfsSync(process.cwd());
      disk = {
        total: st.bsize * st.blocks,
        free: st.bsize * st.bavail,
      };
    }
  } catch {
    /* windows / older node */
  }

  const [users, workspaces, pendingC2c, signupsToday] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count({ where: { status: "ACTIVE" } }),
    prisma.planPurchaseRequest.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.user.count({
      where: {
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ]);

  return NextResponse.json({
    data: {
      process: {
        uptimeSec: Math.round(process.uptime()),
        node: process.version,
        pid: process.pid,
        platform: process.platform,
      },
      memory: {
        totalMb: Math.round(totalMem / 1024 / 1024),
        freeMb: Math.round(freeMem / 1024 / 1024),
        usedMb: Math.round((totalMem - freeMem) / 1024 / 1024),
      },
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model,
        loadavg: load,
      },
      disk: {
        totalMb: disk.total != null ? Math.round(disk.total / 1024 / 1024) : null,
        freeMb: disk.free != null ? Math.round(disk.free / 1024 / 1024) : null,
      },
      counts: { users, workspaces, pendingC2c, signupsToday },
    },
  });
}
