import { randomUUID } from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isIpAllowed } from "@/lib/ip-allowlist";
import { normalizeIranPhone } from "@/lib/smsir";
import { getVerificationPolicy, verifyPhoneOtp } from "@/lib/platform-settings";

const credentialsSchema = z.object({
  /** Email or Iranian phone */
  login: z.string().min(3),
  password: z.string().optional(),
  otp: z.string().optional(),
}).refine(
  (d) =>
    Boolean(d.otp && d.otp.replace(/\D/g, "").length >= 4) ||
    Boolean(d.password && d.password.length >= 8),
  { message: "password_or_otp_required" },
);

async function findUserByLogin(login: string) {
  const trimmed = login.trim();
  const phone = normalizeIranPhone(trimmed);
  if (phone) {
    return prisma.user.findUnique({ where: { phone } });
  }
  return prisma.user.findUnique({
    where: { email: trimmed.toLowerCase() },
  });
}

/**
 * NextAuth — Credentials (phone or email) + optional Google.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  // Cookie/JWT lifetime — keep in sync with DB session (1 week)
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Phone or email", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "SMS code", type: "text" },
        // backward compat
        email: { label: "Email", type: "email" },
      },
      async authorize(raw, request) {
        const loginRaw = String(raw?.login || raw?.email || "");
        const parsed = credentialsSchema.safeParse({
          login: loginRaw,
          password: raw?.password,
          otp: raw?.otp,
        });
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request?.headers?.get("x-real-ip") ||
          null;
        const userAgent = request?.headers?.get("user-agent") || null;

        const logAttempt = async (
          email: string,
          success: boolean,
          userId?: string | null,
        ) => {
          try {
            await prisma.loginAttempt.create({
              data: {
                email: email.toLowerCase().slice(0, 190),
                success,
                userId: userId || null,
                ip,
                userAgent,
              },
            });
          } catch {
            /* non-fatal */
          }
        };

        if (!parsed.success) {
          await logAttempt(loginRaw || "unknown", false);
          return null;
        }

        const user = await findUserByLogin(parsed.data.login);
        if (!user) {
          await logAttempt(parsed.data.login, false);
          return null;
        }

        if (user.blockedAt) {
          await logAttempt(parsed.data.login, false, user.id);
          throw new Error("ACCOUNT_BLOCKED");
        }

        const otp = (parsed.data.otp || "").replace(/\D/g, "");
        if (otp) {
          const phone = normalizeIranPhone(parsed.data.login) || user.phone;
          if (!phone) {
            await logAttempt(parsed.data.login, false, user.id);
            return null;
          }
          const ok = await verifyPhoneOtp({
            phone,
            code: otp,
            purpose: "login",
          });
          if (!ok) {
            await logAttempt(parsed.data.login, false, user.id);
            return null;
          }
        } else {
          if (!user.passwordHash) {
            await logAttempt(parsed.data.login, false, user.id);
            return null;
          }
          const valid = await bcrypt.compare(
            parsed.data.password || "",
            user.passwordHash,
          );
          if (!valid) {
            await logAttempt(parsed.data.login, false, user.id);
            return null;
          }
        }

        const strictWs = await prisma.workspaceMember.findFirst({
          where: {
            userId: user.id,
            status: "ACTIVE",
            workspace: { status: "ACTIVE", enforce2FA: true },
          },
        });
        if (strictWs && !user.twoFactorEnabled) {
          await logAttempt(parsed.data.login, false, user.id);
          throw new Error("2FA_REQUIRED");
        }

        const memberships = await prisma.workspaceMember.findMany({
          where: { userId: user.id, status: "ACTIVE", workspace: { status: "ACTIVE" } },
          include: {
            workspace: {
              select: { ipAllowlist: true, sessionTimeoutHours: true, name: true },
            },
          },
        });

        for (const m of memberships) {
          if (!isIpAllowed(ip, m.workspace.ipAllowlist)) {
            await logAttempt(parsed.data.login, false, user.id);
            throw new Error("IP_NOT_ALLOWED");
          }
        }

        const minTimeoutHours = memberships.reduce(
          (min, m) => Math.min(min, m.workspace.sessionTimeoutHours || 168),
          168,
        );

        const sessionJti = randomUUID();
        const expiresAt = new Date(Date.now() + minTimeoutHours * 60 * 60 * 1000);

        await prisma.session.create({
          data: {
            userId: user.id,
            jti: sessionJti,
            userAgent,
            ipAddress: ip,
            expiresAt,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await logAttempt(user.email || parsed.data.login, true, user.id);

        return {
          id: user.id,
          email: user.email || user.phone || user.id,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
          sessionJti,
          sessionExpiresAt: expiresAt.toISOString(),
          mustChangePassword: Boolean(user.mustChangePassword),
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const policy = await getVerificationPolicy();
      if (!policy.googleEnabled) return false;

      const email = (user.email || profile?.email || "").toLowerCase();
      if (!email) return false;

      const googleId = account.providerAccountId;
      let row =
        (await prisma.user.findFirst({ where: { googleId } })) ||
        (await prisma.user.findUnique({ where: { email } }));

      if (row?.blockedAt) return false;

      if (!row) {
        row = await prisma.user.create({
          data: {
            email,
            googleId,
            name: user.name || email.split("@")[0],
            emailVerifiedAt: new Date(),
            passwordHash: null,
            pendingOnboarding: false,
          },
        });
      } else if (!row.googleId) {
        await prisma.user.update({
          where: { id: row.id },
          data: {
            googleId,
            emailVerifiedAt: row.emailVerifiedAt || new Date(),
          },
        });
      }

      user.id = row.id;
      (user as { isSuperAdmin?: boolean }).isSuperAdmin = row.isSuperAdmin;
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.isSuperAdmin = Boolean(
          (user as { isSuperAdmin?: boolean }).isSuperAdmin,
        );
        token.sessionJti = (user as { sessionJti?: string }).sessionJti;
        token.sessionExpiresAt = (user as { sessionExpiresAt?: string }).sessionExpiresAt;
        token.mustChangePassword = Boolean(
          (user as { mustChangePassword?: boolean }).mustChangePassword,
        );
        token.impersonating = false;
        token.impersonatorId = undefined;
        delete token.error;
      }

      if (account?.provider === "google" && token.sub) {
        const sessionJti = randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.session.create({
          data: {
            userId: String(token.sub),
            jti: sessionJti,
            expiresAt,
          },
        });
        token.sessionJti = sessionJti;
        token.sessionExpiresAt = expiresAt.toISOString();
        const dbUser = await prisma.user.findUnique({
          where: { id: String(token.sub) },
        });
        token.isSuperAdmin = Boolean(dbUser?.isSuperAdmin);
        await prisma.user.update({
          where: { id: String(token.sub) },
          data: { lastLoginAt: new Date() },
        });
      }

      if (trigger === "update" && session && token.isSuperAdmin) {
        if (session.impersonateUserId) {
          token.impersonatorId = token.sub;
          token.sub = session.impersonateUserId as string;
          token.impersonating = true;
        }
        if (session.stopImpersonation && token.impersonatorId) {
          token.sub = token.impersonatorId as string;
          token.impersonating = false;
          token.impersonatorId = undefined;
        }
      }

      if (token.sessionJti) {
        const row = await prisma.session.findUnique({
          where: { jti: String(token.sessionJti) },
        });
        if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now()) {
          return { ...token, sub: undefined, error: "SessionRevoked" };
        }
      }

      if (token.sub) {
        const u = await prisma.user.findUnique({
          where: { id: String(token.sub) },
          select: {
            blockedAt: true,
            avatarUrl: true,
            name: true,
            mustChangePassword: true,
          },
        });
        if (u?.blockedAt) {
          return { ...token, sub: undefined, error: "AccountBlocked" };
        }
        token.picture = u?.avatarUrl || null;
        if (u?.name) token.name = u.name;
        token.mustChangePassword = Boolean(u?.mustChangePassword);
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === "SessionRevoked" || token.error === "AccountBlocked" || !token.sub) {
        return { ...session, user: undefined as never, error: token.error || "SessionRevoked" };
      }
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.isSuperAdmin =
          Boolean(token.isSuperAdmin) && !token.impersonating;
        session.user.impersonating = Boolean(token.impersonating);
        session.user.impersonatorId = token.impersonatorId as string | undefined;
        session.user.sessionJti = token.sessionJti as string | undefined;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.image = (token.picture as string | null | undefined) || null;
        if (token.name) session.user.name = String(token.name);
      }
      return session;
    },
  },
});
