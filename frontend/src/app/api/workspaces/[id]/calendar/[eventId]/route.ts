import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import {
  canManageCalendarEvent,
  inviteAttendeesToEvent,
} from "@/lib/calendar";

type Ctx = { params: Promise<{ id: string; eventId: string }> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, eventId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, workspaceId },
    include: {
      createdBy: { select: userSelect },
      attendees: { include: { user: { select: userSelect } } },
    },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAttendee = event.attendees.some((a) => a.userId === session.user!.id);
  const canManage = await canManageCalendarEvent(
    session.user.id,
    workspaceId,
    event.createdById,
  );
  if (!isAttendee && !canManage && event.createdById !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: event });
}

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  kind: z.enum(["MEETING", "CEREMONY", "REMINDER", "OTHER"]).optional(),
  meetingMode: z.enum(["IN_APP", "IN_PERSON", "LINK"]).optional(),
  meetingUrl: z.string().max(2000).optional().nullable(),
  location: z.string().max(400).optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  color: z.string().max(20).optional(),
  attendeeIds: z.array(z.string().min(1)).max(100).optional(),
  myStatus: z.enum(["PENDING", "ACCEPTED", "DECLINED"]).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, eventId } = await ctx.params;

  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, workspaceId },
    include: { attendees: true },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  // RSVP only
  if (parsed.data.myStatus) {
    await prisma.calendarEventAttendee.updateMany({
      where: { eventId, userId: session.user.id },
      data: { status: parsed.data.myStatus },
    });
    return NextResponse.json({ ok: true });
  }

  if (
    !(await canManageCalendarEvent(
      session.user.id,
      workspaceId,
      event.createdById,
    ))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startsAt = parsed.data.startsAt
    ? new Date(parsed.data.startsAt)
    : event.startsAt;
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : event.endsAt;
  if (!(endsAt > startsAt)) {
    return NextResponse.json(
      { error: "End time must be after start" },
      { status: 400 },
    );
  }

  const updated = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title: parsed.data.title?.trim(),
      description:
        parsed.data.description === undefined
          ? undefined
          : parsed.data.description?.trim() || null,
      kind: parsed.data.kind,
      meetingMode: parsed.data.meetingMode,
      meetingUrl:
        parsed.data.meetingUrl === undefined
          ? undefined
          : parsed.data.meetingUrl?.trim() || null,
      location:
        parsed.data.location === undefined
          ? undefined
          : parsed.data.location?.trim() || null,
      startsAt,
      endsAt,
      allDay: parsed.data.allDay,
      color: parsed.data.color,
    },
  });

  if (parsed.data.attendeeIds) {
    const nextIds = [...new Set(parsed.data.attendeeIds)];
    const prev = new Set(event.attendees.map((a) => a.userId));
    const toAdd = nextIds.filter((id) => !prev.has(id));
    const toRemove = [...prev].filter(
      (id) => !nextIds.includes(id) && id !== event.createdById,
    );

    if (toRemove.length) {
      await prisma.calendarEventAttendee.deleteMany({
        where: { eventId, userId: { in: toRemove } },
      });
    }
    if (toAdd.length) {
      await prisma.calendarEventAttendee.createMany({
        data: toAdd.map((userId) => ({ eventId, userId })),
        skipDuplicates: true,
      });
      await inviteAttendeesToEvent({
        workspaceId,
        eventId,
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || "Someone",
        title: updated.title,
        startsAt: updated.startsAt,
        endsAt: updated.endsAt,
        meetingMode: updated.meetingMode,
        meetingUrl: updated.meetingUrl,
        location: updated.location,
        attendeeIds: toAdd,
      });
    }
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId, eventId } = await ctx.params;
  const event = await prisma.calendarEvent.findFirst({
    where: { id: eventId, workspaceId },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (
    !(await canManageCalendarEvent(
      session.user.id,
      workspaceId,
      event.createdById,
    ))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.calendarEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ ok: true });
}
