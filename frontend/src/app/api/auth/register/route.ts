import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuditLogger } from "@/lib/audit-logger";
import { verifyEmailOtp } from "@/lib/email";
import {
  getVerificationPolicy,
  phonePlaceholderEmail,
  verifyPhoneOtp,
} from "@/lib/platform-settings";
import { normalizeIranPhone } from "@/lib/smsir";

const registerSchema = z.object({
  phone: z.string().min(10).max(16),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional().or(z.literal("")),
  hasCompany: z.boolean().optional().default(false),
  smsOtpCode: z.string().min(4).max(8).optional(),
  emailOtpCode: z.string().min(4).max(8).optional(),
});

/** POST /api/auth/register — phone-first; optional email; company via /onboarding */
export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const phone = normalizeIranPhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const emailRaw = parsed.data.email?.trim().toLowerCase() || null;
    const policy = await getVerificationPolicy();

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
    }
    if (emailRaw) {
      const existingEmail = await prisma.user.findUnique({ where: { email: emailRaw } });
      if (existingEmail) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
    }

    if (policy.smsRequired) {
      if (!parsed.data.smsOtpCode) {
        return NextResponse.json(
          { error: "SMS verification required", code: "SMS_OTP_REQUIRED" },
          { status: 400 },
        );
      }
      const ok = await verifyPhoneOtp({
        phone,
        code: parsed.data.smsOtpCode,
        purpose: "register",
      });
      if (!ok) {
        return NextResponse.json({ error: "Invalid or expired SMS code" }, { status: 400 });
      }
    }

    let emailVerifiedAt: Date | null = null;
    if (emailRaw) {
      if (policy.emailRequired) {
        if (!parsed.data.emailOtpCode) {
          return NextResponse.json(
            { error: "Email verification required", code: "EMAIL_OTP_REQUIRED" },
            { status: 400 },
          );
        }
        const ok = await verifyEmailOtp({
          email: emailRaw,
          code: parsed.data.emailOtpCode,
          purpose: "register",
        });
        if (!ok) {
          return NextResponse.json({ error: "Invalid or expired email code" }, { status: 400 });
        }
        emailVerifiedAt = new Date();
      } else {
        emailVerifiedAt = new Date();
      }
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const email = emailRaw || phonePlaceholderEmail(phone);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        phoneVerifiedAt: new Date(),
        passwordHash,
        name: parsed.data.name ?? phone,
        pendingOnboarding: Boolean(parsed.data.hasCompany),
        emailVerifiedAt,
      },
    });

    await AuditLogger.fromRequest(req, {
      userId: user.id,
      workspaceId: null,
      action: "auth.register",
      metadata: {
        phone,
        email: emailRaw,
        hasCompany: Boolean(parsed.data.hasCompany),
      },
      severity: "info",
    });

    return NextResponse.json(
      {
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            isSuperAdmin: user.isSuperAdmin,
            pendingOnboarding: user.pendingOnboarding,
          },
          /** Login identifier for credentials provider */
          login: phone,
          next: parsed.data.hasCompany ? "/onboarding/company" : null,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[register]", err);
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json(
      {
        error: "Registration failed",
        ...(process.env.NODE_ENV === "development"
          ? { detail: message.slice(0, 300) }
          : {}),
      },
      { status: 500 },
    );
  }
}
