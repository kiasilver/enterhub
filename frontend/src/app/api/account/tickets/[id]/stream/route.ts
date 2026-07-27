import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { subscribeTicket } from '@/lib/support-bus';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/account/tickets/[id]/stream — SSE */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const { id } = await ctx.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!ticket) {
    return new Response('Not found', { status: 404 });
  }
  if (ticket.userId !== session.user.id && !session.user.isSuperAdmin) {
    return new Response('Forbidden', { status: 403 });
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

      send('ready', { ticketId: id, at: new Date().toISOString() });

      const unsub = subscribeTicket(id, (evt) => {
        send(evt.type, evt.payload);
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
