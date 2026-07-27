import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, isWorkspaceMember } from "@/lib/rbac";
import { assertWritableSession } from "@/lib/session-guards";
import {
  canCreateCalendarEvent,
  inviteAttendeesToEvent,
} from "@/lib/calendar";
import { listAccessibleDepartmentIds } from "@/lib/departments";

type Ctx = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const;

/**
 * GET /api/workspaces/[id]/calendar
 * Unified feed: permission-scoped tasks (due dates) + calendar events.
 * Query: from, to (ISO), includeTasks=1
 */
export async function GET(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const includeTasks = url.searchParams.get("includeTasks") !== "0";

  const rangeStart = from
    ? new Date(from)
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const rangeEnd = to
    ? new Date(to)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const canCreate = await canCreateCalendarEvent(session.user.id, workspaceId);
  const canManage = await hasPermission(
    session.user.id,
    workspaceId,
    "calendar:manage",
  );

  const events = await prisma.calendarEvent.findMany({
    where: {
      workspaceId,
      startsAt: { lte: rangeEnd },
      endsAt: { gte: rangeStart },
      ...(canManage
        ? {}
        : {
            OR: [
              { createdById: session.user.id },
              { attendees: { some: { userId: session.user.id } } },
            ],
          }),
    },
    include: {
      createdBy: { select: userSelect },
      attendees: {
        include: { user: { select: userSelect } },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  let tasks: {
    id: string;
    kind: "task";
    title: string;
    startsAt: string;
    endsAt: string;
    color: string;
    boardId: string;
    boardName: string;
    priority: string;
    href: string;
  }[] = [];

  if (includeTasks) {
    const accessible = await listAccessibleDepartmentIds(
      session.user.id,
      workspaceId,
    );
    const isAdmin = accessible === "all";
    const canSeeCompany = await hasPermission(
      session.user.id,
      workspaceId,
      "analytics:company",
    );

    const seeAllTasks = isAdmin || canSeeCompany || canManage;

    const cards = await prisma.card.findMany({
      where: {
        archivedAt: null,
        dueDate: { gte: rangeStart, lte: rangeEnd },
        list: {
          archivedAt: null,
          board: {
            workspaceId,
            archivedAt: null,
            ...(seeAllTasks
              ? {}
              : accessible === "all"
                ? {}
                : {
                    OR: [
                      { departmentId: { in: accessible as string[] } },
                      {
                        lists: {
                          some: {
                            cards: {
                              some: {
                                assignees: {
                                  some: { userId: session.user.id },
                                },
                              },
                            },
                          },
                        },
                      },
                    ],
                  }),
          },
        },
        ...(seeAllTasks
          ? {}
          : { assignees: { some: { userId: session.user.id } } }),
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        startDate: true,
        priority: true,
        list: {
          select: {
            board: { select: { id: true, name: true, background: true } },
          },
        },
      },
      take: 500,
      orderBy: { dueDate: "asc" },
    });

    tasks = cards
      .filter((c) => c.dueDate)
      .map((c) => {
        const end = c.dueDate!;
        const start = c.startDate || c.dueDate!;
        return {
          id: c.id,
          kind: "task" as const,
          title: c.title,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          color: c.list.board.background || "#3b82f6",
          boardId: c.list.board.id,
          boardName: c.list.board.name,
          priority: c.priority,
          href: `/board/${c.list.board.id}?card=${c.id}`,
        };
      });
  }

  return NextResponse.json({
    data: {
      events: events.map((e) => ({
        id: e.id,
        kind: "event" as const,
        eventKind: e.kind,
        title: e.title,
        description: e.description,
        meetingMode: e.meetingMode,
        meetingUrl: e.meetingUrl,
        location: e.location,
        startsAt: e.startsAt.toISOString(),
        endsAt: e.endsAt.toISOString(),
        allDay: e.allDay,
        color: e.color,
        createdBy: {
          id: e.createdBy.id,
          name: e.createdBy.name || e.createdBy.email,
          avatarUrl: e.createdBy.avatarUrl,
        },
        attendees: e.attendees.map((a) => ({
          userId: a.userId,
          status: a.status,
          name: a.user.name || a.user.email,
          avatarUrl: a.user.avatarUrl,
        })),
        canEdit:
          e.createdById === session.user!.id || canManage,
      })),
      tasks,
    },
    meta: { canCreate, canManage },
  });
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional().nullable(),
  kind: z.enum(["MEETING", "CEREMONY", "REMINDER", "OTHER"]).default("MEETING"),
  meetingMode: z.enum(["IN_APP", "IN_PERSON", "LINK"]).default("IN_APP"),
  meetingUrl: z.string().max(2000).optional().nullable(),
  location: z.string().max(400).optional().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  allDay: z.boolean().optional(),
  color: z.string().max(20).optional(),
  attendeeIds: z.array(z.string().min(1)).max(100).optional(),
});

/** POST create event + invite */
export async function POST(req: Request, ctx: Ctx) {
  const { session, error } = await assertWritableSession();
  if (error) return error;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await isWorkspaceMember(session.user.id, workspaceId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!(await canCreateCalendarEvent(session.user.id, workspaceId))) {
    return NextResponse.json(
      { error: "Forbidden: calendar:create required" },
      { status: 403 },
    );
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (!(endsAt > startsAt)) {
    return NextResponse.json(
      { error: "End time must be after start" },
      { status: 400 },
    );
  }

  if (parsed.data.meetingMode === "LINK" && !parsed.data.meetingUrl?.trim()) {
    return NextResponse.json(
      { error: "Meeting link is required for LINK mode" },
      { status: 400 },
    );
  }
  if (
    parsed.data.meetingMode === "IN_PERSON" &&
    !parsed.data.location?.trim()
  ) {
    return NextResponse.json(
      { error: "Location is required for in-person events" },
      { status: 400 },
    );
  }

  const attendeeIds = [
    ...new Set([
      session.user.id,
      ...(parsed.data.attendeeIds || []).filter((id) => id !== session.user!.id),
    ]),
  ];

  if (attendeeIds.length) {
    const ok = await prisma.workspaceMember.count({
      where: {
        workspaceId,
        userId: { in: attendeeIds },
        status: "ACTIVE",
      },
    });
    if (ok !== attendeeIds.length) {
      return NextResponse.json(
        { error: "All attendees must be active members" },
        { status: 400 },
      );
    }
  }

  const event = await prisma.calendarEvent.create({
    data: {
      workspaceId,
      createdById: session.user.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || null,
      kind: parsed.data.kind,
      meetingMode: parsed.data.meetingMode,
      meetingUrl: parsed.data.meetingUrl?.trim() || null,
      location: parsed.data.location?.trim() || null,
      startsAt,
      endsAt,
      allDay: parsed.data.allDay ?? false,
      color: parsed.data.color || "#8B5CF6",
      attendees: {
        create: attendeeIds.map((userId) => ({
          userId,
          status: userId === session.user!.id ? "ACCEPTED" : "PENDING",
          notifiedAt: userId === session.user!.id ? new Date() : null,
        })),
      },
    },
    include: {
      createdBy: { select: userSelect },
      attendees: { include: { user: { select: userSelect } } },
    },
  });

  const invitees = attendeeIds.filter((id) => id !== session.user!.id);
  if (invitees.length) {
    await inviteAttendeesToEvent({
      workspaceId,
      eventId: event.id,
      actorId: session.user.id,
      actorName: session.user.name || session.user.email || "Someone",
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      meetingMode: event.meetingMode,
      meetingUrl: event.meetingUrl,
      location: event.location,
      attendeeIds: invitees,
    });
    await prisma.calendarEventAttendee.updateMany({
      where: { eventId: event.id, userId: { in: invitees } },
      data: { notifiedAt: new Date() },
    });
  }

  return NextResponse.json(
    {
      data: {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        meetingMode: event.meetingMode,
      },
    },
    { status: 201 },
  );
}
