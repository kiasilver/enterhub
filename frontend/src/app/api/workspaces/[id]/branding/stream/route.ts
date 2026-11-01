import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { subscribeWorkspaceBranding } from "@/lib/branding-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function loadBranding(workspaceId: string) {
  return prisma.workspace.findUnique({
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
}

/** GET /api/workspaces/[id]/branding/stream — SSE company logo / name */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const push = async () => {
        const branding = await loadBranding(workspaceId);
        if (branding) send("branding", branding);
      };

      void push();

      const unsub = subscribeWorkspaceBranding(workspaceId, (event) => {
        send("branding", event.branding);
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsub();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
