import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveHomeDashboard } from "@/lib/dashboard-role";
import { HomeClient } from "@/components/home/HomeClient";

/**
 * Individual account home — no workspace yet.
 * Shows pending invites and a CTA to create a company/workspace.
 */
export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const home = await resolveHomeDashboard({
    userId: session.user.id,
    isSuperAdmin: Boolean(session.user.isSuperAdmin),
  });
  if (home.homePath !== "/home") {
    redirect(home.homePath);
  }

  const invites = await prisma.workspaceInvite.findMany({
    where: {
      inviteeUserId: session.user.id,
      status: { in: ["PENDING_ACCEPT", "PENDING_APPROVAL"] },
    },
    include: {
      workspace: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const extraDeptIds = new Set<string>();
  for (const inv of invites) {
    if (Array.isArray(inv.departmentIds)) {
      for (const raw of inv.departmentIds) {
        const id = String(raw || "").trim();
        if (id) extraDeptIds.add(id);
      }
    }
  }
  const extraDepts =
    extraDeptIds.size > 0
      ? await prisma.department.findMany({
          where: { id: { in: Array.from(extraDeptIds) } },
          select: { id: true, name: true },
        })
      : [];
  const deptNameById = new Map(extraDepts.map((d) => [d.id, d.name]));

  return (
    <HomeClient
      userName={session.user.name || session.user.email || ""}
      invites={invites.map((i) => {
        const ids = new Set<string>();
        if (i.departmentId) ids.add(i.departmentId);
        if (Array.isArray(i.departmentIds)) {
          for (const raw of i.departmentIds) {
            const id = String(raw || "").trim();
            if (id) ids.add(id);
          }
        }
        const names = Array.from(ids)
          .map(
            (id) =>
              deptNameById.get(id) ||
              (i.department?.id === id ? i.department.name : null),
          )
          .filter(Boolean) as string[];
        return {
          id: i.id,
          status: i.status,
          workspaceId: i.workspaceId,
          workspaceName: i.workspace.name,
          departmentName:
            names.length > 0 ? names.join(", ") : (i.department?.name ?? null),
          roleName: i.role.name,
          invitedByName: i.invitedBy.name || i.invitedBy.email || "",
        };
      })}
    />
  );
}
