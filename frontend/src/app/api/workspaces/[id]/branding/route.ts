import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/branding — live chrome logo + name */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      logoUrlDark: true,
      logoColor: true,
      showCompanyName: true,
    },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: workspace });
}
