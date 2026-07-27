import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmailOtp, isLocalhostRuntime } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  purpose: z.enum(["register", "login", "verify_email"]).default("register"),
});

/** POST /api/auth/otp/request — send (or log) a 6-digit code */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const result = await createEmailOtp({
    email: parsed.data.email,
    purpose: parsed.data.purpose,
  });

  return NextResponse.json({
    data: {
      sent: !result.skipped,
      skipped: result.skipped,
      expiresAt: result.expiresAt.toISOString(),
      // Only expose code on localhost for DX — never in production
      ...(isLocalhostRuntime() && result.code ? { devCode: result.code } : {}),
      message: result.skipped
        ? "Email skipped on localhost — check server logs for code"
        : "Verification code sent",
    },
  });
}
