import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  isSmsirReady,
  normalizeIranPhone,
  sendSmsirVerify,
  sendSmsirVerifyCode,
  type SmsirTemplateKind,
} from "@/lib/smsir";
import { isLocalhostRuntime } from "@/lib/email";

export type PlatformSettingsRow = {
  id: string;
  smsOtpEnabled: boolean;
  emailVerifyEnabled: boolean;
  googleAuthEnabled: boolean;
  smsirTemplateId: number | null;
  smsirApiKey: string | null;
  smsirTemplatesJson: unknown;
  zarinpalMerchantId: string | null;
  zarinpalSandbox: boolean;
  plansCatalogJson: unknown;
  notes: string | null;
};

export async function getPlatformSettings(): Promise<PlatformSettingsRow> {
  const row = await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
  return row as PlatformSettingsRow;
}

export async function getVerificationPolicy() {
  const settings = await getPlatformSettings();
  const smtpReady = Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
  const skipEmail =
    process.env.SKIP_EMAIL_VERIFICATION === "true" || isLocalhostRuntime();

  const smsReady = await isSmsirReady();
  const smsRequired =
    settings.smsOtpEnabled && smsReady && !isLocalhostRuntime();

  const emailRequired =
    settings.emailVerifyEnabled && smtpReady && !skipEmail;

  const googleEnabled =
    settings.googleAuthEnabled &&
    Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());

  return {
    smsRequired,
    emailRequired,
    googleEnabled,
    smsConfigured: smsReady,
    emailConfigured: smtpReady,
    settings,
  };
}

function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

function otpKind(purpose: string): SmsirTemplateKind {
  if (purpose === "register") return "register";
  return "login";
}

export async function requestPhoneOtp(opts: {
  phone: string;
  purpose: string;
  userId?: string | null;
  /** Login OTP must target an existing account. */
  requireExistingUser?: boolean;
}): Promise<{ ok: true; codeDev?: string } | { ok: false; error: string }> {
  const phone = normalizeIranPhone(opts.phone);
  if (!phone) return { ok: false, error: "Invalid phone number" };

  const policy = await getVerificationPolicy();
  if (!policy.smsRequired) {
    return { ok: true, codeDev: "SKIP" };
  }

  if (opts.requireExistingUser || opts.purpose === "login") {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, blockedAt: true },
    });
    if (!user || user.blockedAt) {
      // Anti-enumeration: pretend success
      return { ok: true };
    }
    opts.userId = opts.userId || user.id;
  }

  const recent = await prisma.phoneOtp.findFirst({
    where: {
      phone,
      purpose: opts.purpose,
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return { ok: false, error: "Please wait before requesting another code" };
  }

  const code = String(randomInt(100000, 999999));
  const codeHash = await hashOtp(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.phoneOtp.create({
    data: {
      phone,
      userId: opts.userId || null,
      codeHash,
      purpose: opts.purpose,
      expiresAt,
    },
  });

  const sent = await sendSmsirVerifyCode(
    phone,
    code,
    policy.settings.smsirTemplateId,
    otpKind(opts.purpose),
  );
  if (!sent.ok) {
    return { ok: false, error: sent.error || "Failed to send SMS" };
  }

  return {
    ok: true,
    ...(process.env.NODE_ENV === "development" ? { codeDev: code } : {}),
  };
}

function randomTempPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[randomInt(0, alphabet.length)];
  return out;
}

/** SMS a temporary password and force change on next login. Always ok to caller. */
export async function sendTempPasswordSms(phoneRaw: string): Promise<{ ok: true }> {
  const phone = normalizeIranPhone(phoneRaw);
  if (!phone) return { ok: true };

  const policy = await getVerificationPolicy();
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, blockedAt: true },
  });
  if (!user || user.blockedAt || !policy.smsRequired) return { ok: true };

  const recent = await prisma.phoneOtp.findFirst({
    where: {
      phone,
      purpose: "temp_password",
      createdAt: { gt: new Date(Date.now() - 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) return { ok: true };

  const password = randomTempPassword();
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: true },
  });
  await prisma.phoneOtp.create({
    data: {
      phone,
      userId: user.id,
      codeHash: await hashOtp("sent"),
      purpose: "temp_password",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      consumedAt: new Date(),
    },
  });
  await sendSmsirVerify({
    mobile: phone,
    kind: "temp_pass",
    parameters: [{ name: "PASS", value: password }],
  });
  return { ok: true };
}

export async function verifyPhoneOtp(opts: {
  phone: string;
  code: string;
  purpose: string;
}): Promise<boolean> {
  const phone = normalizeIranPhone(opts.phone);
  if (!phone) return false;

  const policy = await getVerificationPolicy();
  if (!policy.smsRequired) return true;

  const rows = await prisma.phoneOtp.findMany({
    where: {
      phone,
      purpose: opts.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  for (const row of rows) {
    const match = await bcrypt.compare(opts.code, row.codeHash);
    if (match) {
      await prisma.phoneOtp.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      });
      return true;
    }
  }
  return false;
}

/** Stable synthetic email for phone-only accounts (keeps unique email index happy where needed). */
export function phonePlaceholderEmail(phone: string): string {
  const n = normalizeIranPhone(phone) || phone.replace(/\D/g, "");
  const h = createHash("sha256").update(n).digest("hex").slice(0, 12);
  return `phone.${h}@users.enterhub.local`;
}

export function retentionPurgeAfter(from = new Date()): Date {
  return new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000);
}
