import { prisma } from "@/lib/prisma";
import { sendGatewayMail } from "@/lib/mail-gateway";
import { isEmailConfigured, isLocalhostRuntime } from "@/lib/email";
import { filterUsersForEmail } from "@/lib/notification-prefs";

function appBaseUrl() {
  return (
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://enterhub.org"
  ).replace(/\/$/, "");
}

/** Email assignees when a task is created or they are newly assigned. */
export async function emailUsersTaskAssigned(opts: {
  userIds: string[];
  actorId?: string | null;
  boardId: string;
  cardId: string;
  cardTitle: string;
  workspaceId: string;
}): Promise<void> {
  if (!isEmailConfigured() || isLocalhostRuntime()) return;
  const candidates = [...new Set(opts.userIds)].filter(
    (id) => id && id !== opts.actorId,
  );
  if (!candidates.length) return;

  const recipients = await filterUsersForEmail(
    prisma,
    candidates,
    "assignment",
  );
  if (!recipients.length) return;

  const users = await prisma.user.findMany({
    where: { id: { in: recipients }, email: { not: null } },
    select: { id: true, email: true, name: true, firstName: true },
  });

  const link = `${appBaseUrl()}/board/${opts.boardId}?card=${opts.cardId}`;
  await Promise.all(
    users.map(async (u) => {
      if (!u.email) return;
      try {
        await sendGatewayMail({
          to: u.email,
          subject: `New assignment · ${opts.cardTitle}`,
          template: "notification",
          vars: {
            name: u.firstName || u.name || u.email.split("@")[0] || "there",
            title: "You’ve been assigned a new task",
            body: `“${opts.cardTitle}” is waiting for you on the board.`,
            link,
          },
        });
      } catch (e) {
        console.error("[task-email]", u.email, e);
      }
    }),
  );
}

/** Email invite link whenever invitee has a real email on file. */
export async function emailInviteLink(opts: {
  toEmail: string;
  name?: string | null;
  inviteToken: string;
  workspaceLabel: string;
}): Promise<void> {
  if (!isEmailConfigured() || isLocalhostRuntime()) return;
  const email = opts.toEmail.trim().toLowerCase();
  if (!email.includes("@") || email.endsWith("@users.enterhub.local")) return;
  const link = `${appBaseUrl()}/join/${opts.inviteToken}`;
  await sendGatewayMail({
    to: email,
    subject: `You’re invited to join ${opts.workspaceLabel || "a workspace"} on Enterhub`,
    template: "invite",
    vars: {
      name: opts.name || email.split("@")[0] || "there",
      link,
      workspace: opts.workspaceLabel || "workspace",
    },
  });
}
