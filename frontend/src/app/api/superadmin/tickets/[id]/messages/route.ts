import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publishTicketEvent } from '@/lib/support-bus';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  body: z.string().trim().min(1).max(8000),
});

/** POST /api/superadmin/tickets/[id]/messages */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !session.user.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await ctx.params;

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorId: session.user.id,
        authorRole: 'SUPERADMIN',
        body: parsed.data.body,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    }),
    prisma.supportTicket.update({
      where: { id },
      data: {
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
        updatedAt: new Date(),
      },
    }),
  ]);

  publishTicketEvent({ type: 'message', ticketId: id, payload: message });

  return NextResponse.json({ data: message }, { status: 201 });
}
