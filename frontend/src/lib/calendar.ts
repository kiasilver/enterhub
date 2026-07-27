import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";
import { notifyUsers } from "@/lib/card-permissions";
import { emitToWorkspaceRoom } from "@/lib/socket-emit";

export async function canCreateCalendarEvent(
  userId: string,
  workspaceId: string,
) {
  return (
    (await hasPermission(userId, workspaceId, "calendar:create")) ||
    (await hasPermission(userId, workspaceId, "calendar:manage")) ||
    (await hasPermission(userId, workspaceId, "department:manage"))
  );
}

export async function canManageCalendarEvent(
  userId: string,
  workspaceId: string,
  createdById: string,
) {
  if (createdById === userId) return true;
  return (
    (await hasPermission(userId, workspaceId, "calendar:manage")) ||
    (await hasPermission(userId, workspaceId, "department:manage"))
  );
}

/** Post invite summary into a DM with each attendee + notify. */
export async function inviteAttendeesToEvent(input: {
  workspaceId: string;
  eventId: string;
  actorId: string;
  actorName: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  meetingMode: string;
  meetingUrl?: string | null;
  location?: string | null;
  attendeeIds: string[];
}) {
  const when = `${input.startsAt.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })} – ${input.endsAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const modeLabel =
    input.meetingMode === "IN_PERSON"
      ? `In person${input.location ? ` · ${input.location}` : ""}`
      : input.meetingMode === "LINK"
        ? `Online link${input.meetingUrl ? ` · ${input.meetingUrl}` : ""}`
        : "In-app meeting";

  const href = `/workspace/${input.workspaceId}/calendar?event=${input.eventId}`;
  const body = `${input.actorName} invited you to “${input.title}”\n${when}\n${modeLabel}\nOpen calendar: ${href}`;

  await notifyUsers({
    userIds: input.attendeeIds,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    calendarEventId: input.eventId,
    href,
    type: "calendar.invite",
    title: `Calendar invite: ${input.title}`,
    body: `${when} · ${modeLabel}`,
  });

  for (const uid of input.attendeeIds) {
    if (uid === input.actorId) continue;
    try {
      const existing = await prisma.chatRoom.findMany({
        where: {
          workspaceId: input.workspaceId,
          type: "DIRECT",
          AND: [
            { members: { some: { userId: input.actorId } } },
            { members: { some: { userId: uid } } },
          ],
        },
        include: { members: true },
      });
      let room = existing.find((r) => r.members.length === 2);
      if (!room) {
        room = await prisma.chatRoom.create({
          data: {
            workspaceId: input.workspaceId,
            type: "DIRECT",
            members: {
              create: [{ userId: input.actorId }, { userId: uid }],
            },
          },
          include: { members: true },
        });
      }
      await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          authorId: input.actorId,
          body,
          entityMentions: [
            {
              kind: "board",
              id: input.eventId,
              label: input.title,
              url: href,
            },
          ],
        },
      });
      await prisma.chatRoom.update({
        where: { id: room.id },
        data: { updatedAt: new Date() },
      });
    } catch (err) {
      console.error("[calendar chat invite] failed", err);
    }
  }

  emitToWorkspaceRoom(input.workspaceId, "calendar:invite", {
    eventId: input.eventId,
    attendeeIds: input.attendeeIds,
  });
}
