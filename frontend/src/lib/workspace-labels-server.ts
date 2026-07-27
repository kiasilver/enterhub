import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACE_LABELS } from "@/lib/workspace-labels";

/** Seed default labels if workspace has none. Server-only. */
export async function ensureDefaultWorkspaceLabels(workspaceId: string) {
  const count = await prisma.workspaceLabel.count({ where: { workspaceId } });
  if (count > 0) return;
  await prisma.workspaceLabel.createMany({
    data: DEFAULT_WORKSPACE_LABELS.map((l) => ({
      workspaceId,
      name: l.name,
      color: l.color,
      sortOrder: l.sortOrder,
      isSystem: true,
    })),
    skipDuplicates: true,
  });
}
