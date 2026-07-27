import { auth } from '@/lib/auth';
import { isWorkspaceMember } from '@/lib/rbac';
import { subscribeUserBadges } from '@/lib/badge-bus';
import { getWorkspaceBadgeCounts } from '@/lib/workspace-badges';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/badges/stream — SSE unread badge updates */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return new Response('Forbidden', { status: 403 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const pushCounts = async () => {
        const counts = await getWorkspaceBadgeCounts(workspaceId, userId);
        send('badges', counts);
      };

      void pushCounts();

      const unsub = subscribeUserBadges(workspaceId, userId, () => {
        void pushCounts();
      });

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25000);

      const poll = setInterval(() => {
        void pushCounts();
      }, 60000);

      cleanup = () => {
        clearInterval(heartbeat);
        clearInterval(poll);
        unsub();
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
