import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeIranPhone } from "@/lib/smsir";
import { phonePlaceholderEmail } from "@/lib/platform-settings";

export type InviteContact =
  | { kind: "email"; email: string; phone?: undefined }
  | { kind: "phone"; phone: string; email: string };

/**
 * Parse invite form input as Iranian mobile or email.
 */
export function parseInviteContact(raw: string): InviteContact | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const phone = normalizeIranPhone(trimmed);
  if (phone) {
    return { kind: "phone", phone, email: phonePlaceholderEmail(phone) };
  }
  const email = trimmed.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (email.endsWith("@users.enterhub.local")) return null;
  return { kind: "email", email };
}

/**
 * Resolve invitee: prefer existing phone/email user; create stub only when missing.
 * Phone invites never create a duplicate when the phone already exists.
 */
export async function findOrCreateInvitee(input: {
  contact: InviteContact;
  name?: string | null;
}): Promise<{ user: { id: string; email: string | null; phone: string | null; name: string | null }; contact: InviteContact }> {
  const { contact } = input;

  if (contact.kind === "phone") {
    let user = await prisma.user.findUnique({ where: { phone: contact.phone } });
    if (!user) {
      const byPlaceholder = await prisma.user.findUnique({
        where: { email: contact.email },
      });
      if (byPlaceholder) {
        user = await prisma.user.update({
          where: { id: byPlaceholder.id },
          data: {
            phone: byPlaceholder.phone || contact.phone,
            phoneVerifiedAt: byPlaceholder.phoneVerifiedAt || new Date(),
            name: input.name?.trim() || byPlaceholder.name,
          },
        });
      } else {
        const tempHash = await bcrypt.hash(
          `invite-${Date.now()}-${Math.random()}`,
          10,
        );
        user = await prisma.user.create({
          data: {
            email: contact.email,
            phone: contact.phone,
            phoneVerifiedAt: null,
            name: input.name?.trim() || contact.phone,
            passwordHash: tempHash,
            pendingOnboarding: false,
          },
        });
      }
    }
    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
      },
      contact: {
        kind: "phone",
        phone: contact.phone,
        email: (user.email || contact.email).toLowerCase(),
      },
    };
  }

  let user = await prisma.user.findUnique({ where: { email: contact.email } });
  if (!user) {
    const tempHash = await bcrypt.hash(
      `invite-${Date.now()}-${Math.random()}`,
      10,
    );
    user = await prisma.user.create({
      data: {
        email: contact.email,
        name: input.name?.trim() || contact.email.split("@")[0],
        passwordHash: tempHash,
        pendingOnboarding: false,
      },
    });
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
    },
    contact,
  };
}
