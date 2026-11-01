import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendGatewayMail } from "@/lib/mail-gateway";
import { createHash, randomBytes } from "crypto";

export function isLocalhostRuntime(): boolean {
  if (process.env.SKIP_EMAIL_VERIFICATION === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  const appUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.APP_URL || "";
  return /localhost|127\.0\.0\.1/i.test(appUrl);
}

export function isEmailConfigured(): boolean {
  if (process.env.MAIL_GATEWAY_URL && process.env.MAIL_GATEWAY_KEY) return true;
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type OtpPurpose = "register" | "login" | "verify_email";

/**
 * Create OTP. On localhost / when SKIP_EMAIL_VERIFICATION: does not send mail;
 * returns the plaintext code for logs (never in production response to clients).
 */
export async function createEmailOtp(opts: {
  email: string;
  userId?: string | null;
  purpose: OtpPurpose;
  ttlMinutes?: number;
}): Promise<{ skipped: boolean; code?: string; expiresAt: Date }> {
  const email = opts.email.toLowerCase();
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (opts.ttlMinutes ?? 10) * 60_000);

  await prisma.emailOtp.updateMany({
    where: { email, purpose: opts.purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.emailOtp.create({
    data: {
      email,
      userId: opts.userId ?? null,
      codeHash,
      purpose: opts.purpose,
      expiresAt,
    },
  });

  if (isLocalhostRuntime() || !isEmailConfigured()) {
    console.info(`[email-otp] ${opts.purpose} for ${email}: ${code} (not sent — local/dev)`);
    return { skipped: true, code, expiresAt };
  }

  await sendGatewayMail({
    to: email,
    subject: "Your Enterhub verification code",
    template: "otp",
    text: `Your verification code is ${code}. It expires in ${opts.ttlMinutes ?? 10} minutes.`,
    vars: {
      code,
      minutes: String(opts.ttlMinutes ?? 10),
    },
  });

  return { skipped: false, expiresAt };
}

export async function verifyEmailOtp(opts: {
  email: string;
  code: string;
  purpose: OtpPurpose;
}): Promise<boolean> {
  const email = opts.email.toLowerCase();
  const row = await prisma.emailOtp.findFirst({
    where: {
      email,
      purpose: opts.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;

  const ok = await bcrypt.compare(opts.code.trim(), row.codeHash);
  if (!ok) return false;

  await prisma.emailOtp.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return true;
}

async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const gateway = process.env.MAIL_GATEWAY_URL?.replace(/\/$/, "");
  const gatewayKey = process.env.MAIL_GATEWAY_KEY;
  if (gateway && gatewayKey) {
    await sendGatewayMail(opts);
    return;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "noreply@enterhub.app";

  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  // Dynamic import so local builds work without nodemailer installed until production setup
  let nodemailer: typeof import("nodemailer");
  try {
    nodemailer = await import("nodemailer");
  } catch {
    console.warn("[email] nodemailer not installed — logging mail instead");
    console.info(`[email] To: ${opts.to} | ${opts.subject}\n${opts.text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Create + email a password-reset link. Always returns ok to avoid email enumeration. */
export async function requestPasswordReset(emailRaw: string): Promise<{ ok: true }> {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true, name: true, firstName: true },
  });
  if (!user?.email) return { ok: true };

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  if (isLocalhostRuntime() || !isEmailConfigured()) {
    console.info(`[password-reset] ${email}: ${token} (not sent — local/dev)`);
    return { ok: true };
  }

  const base = (
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "https://enterhub.org"
  ).replace(/\/$/, "");
  const link = `${base}/reset-password?token=${token}`;

  await sendGatewayMail({
    to: email,
    subject: "Secure link to reset your Enterhub password",
    template: "password_reset",
    vars: {
      name: user.firstName || user.name || email.split("@")[0] || "there",
      link,
    },
  });

  return { ok: true };
}

export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  const tokenHash = hashToken(token);
  const row = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!row) return { ok: false, error: "Invalid or expired reset link" };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return { ok: true };
}

/** Mark email verified without OTP on localhost. */
export async function autoVerifyEmailIfLocal(userId: string) {
  if (!isLocalhostRuntime()) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  return true;
}
