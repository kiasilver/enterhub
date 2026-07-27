import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isSmsirConfigured, normalizeIranPhone, sendSmsirVerifyCode } from "@/lib/smsir";
import { isLocalhostRuntime } from "@/lib/email";

export type PlatformSettingsRow = {
  id: string;
  smsOtpEnabled: boolean;
  emailVerifyEnabled: boolean;
  googleAuthEnabled: boolean;
  smsirTemplateId: number | null;
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

  const smsRequired =
    settings.smsOtpEnabled && isSmsirConfigured() && !isLocalhostRuntime();

  const emailRequired =
    settings.emailVerifyEnabled && smtpReady && !skipEmail;

  const googleEnabled =
    settings.googleAuthEnabled &&
    Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());

  return {
    smsRequired,
    emailRequired,
    googleEnabled,
    smsConfigured: isSmsirConfigured(),
    emailConfigured: smtpReady,
    settings,
  };
}

function hashOtp(code: string) {
  return bcrypt.hash(code, 10);
}

export async function requestPhoneOtp(opts: {
  phone: string;
  purpose: string;
  userId?: string | null;
}): Promise<{ ok: true; codeDev?: string } | { ok: false; error: string }> {
  const phone = normalizeIranPhone(opts.phone);
  if (!phone) return { ok: false, error: "Invalid phone number" };

  const policy = await getVerificationPolicy();
  if (!policy.smsRequired) {
    return { ok: true, codeDev: "SKIP" };
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
  );
  if (!sent.ok) {
    return { ok: false, error: sent.error || "Failed to send SMS" };
  }

  return {
    ok: true,
    ...(process.env.NODE_ENV === "development" ? { codeDev: code } : {}),
  };
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
