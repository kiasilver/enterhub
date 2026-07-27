import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publishTicketEvent } from '@/lib/support-bus';

/** GET /api/account/tickets */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ data: tickets });
}

const createSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  category: z.string().trim().min(1).max(60).default('general'),
  body: z.string().trim().min(3).max(8000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  workspaceId: z.string().optional().nullable(),
});

/** POST /api/account/tickets */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid ticket' }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      workspaceId: parsed.data.workspaceId || null,
      subject: parsed.data.subject,
      category: parsed.data.category,
      priority: parsed.data.priority || 'MEDIUM',
      messages: {
        create: {
          authorId: session.user.id,
          authorRole: 'USER',
          body: parsed.data.body,
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  publishTicketEvent({
    type: 'message',
    ticketId: ticket.id,
    payload: ticket.messages[0],
  });

  return NextResponse.json({ data: ticket }, { status: 201 });
}
