import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET /api/account/profile */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      birthday: true,
      phone: true,
      avatarUrl: true,
      presenceStatus: true,
      createdAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let firstName = user.firstName;
  let lastName = user.lastName;
  if (!firstName && !lastName && user.name) {
    const parts = user.name.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  return NextResponse.json({
    data: {
      ...user,
      firstName: firstName || '',
      lastName: lastName || '',
      birthday: user.birthday?.toISOString().slice(0, 10) || null,
    },
  });
}

const patchSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

/** PATCH /api/account/profile */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { firstName, lastName, birthday, phone } = parsed.data;
  const name = `${firstName} ${lastName}`.trim();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      name,
      phone: phone === undefined ? undefined : phone || null,
      birthday:
        birthday === undefined
          ? undefined
          : birthday
            ? new Date(`${birthday}T00:00:00.000Z`)
            : null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      birthday: true,
      phone: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({
    data: {
      ...user,
      birthday: user.birthday?.toISOString().slice(0, 10) || null,
    },
  });
}
