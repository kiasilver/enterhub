import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export function isLocalhostRuntime(): boolean {
  if (process.env.SKIP_EMAIL_VERIFICATION === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  const appUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.APP_URL || "";
  return /localhost|127\.0\.0\.1/i.test(appUrl);
}

export function isEmailConfigured(): boolean {
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

  await sendMail({
    to: email,
    subject: `Your Enterhub code: ${code}`,
    text: `Your verification code is ${code}. It expires in ${opts.ttlMinutes ?? 10} minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in ${opts.ttlMinutes ?? 10} minutes.</p>`,
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

/** Mark email verified without OTP on localhost. */
export async function autoVerifyEmailIfLocal(userId: string) {
  if (!isLocalhostRuntime()) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
  return true;
}
