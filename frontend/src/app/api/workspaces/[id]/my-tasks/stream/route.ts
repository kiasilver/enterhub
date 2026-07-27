import { auth } from '@/lib/auth';
import { isWorkspaceMember } from '@/lib/rbac';
import {
  subscribeMyTasks,
  type ChecklistToggleEvent,
} from '@/lib/my-tasks-bus';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/workspaces/[id]/my-tasks/stream — SSE checklist / task live updates */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return new Response('Forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* closed */
        }
      };

      send('ready', { ok: true });

      const unsub = subscribeMyTasks(workspaceId, (ev: ChecklistToggleEvent) => {
        send('checklist', ev);
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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
