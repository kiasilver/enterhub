import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPhoneOtp } from "@/lib/platform-settings";
import { normalizeIranPhone } from "@/lib/smsir";

const schema = z.object({
  phone: z.string().min(10).max(16),
  purpose: z.enum(["register", "login", "verify_phone"]).default("register"),
});

/** POST /api/auth/otp/sms/request */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const phone = normalizeIranPhone(parsed.data.phone);
    if (!phone) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const result = await requestPhoneOtp({
      phone,
      purpose: parsed.data.purpose,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        skipped: result.codeDev === "SKIP",
        message:
          result.codeDev === "SKIP"
            ? "SMS OTP not required"
            : "Verification code sent",
        ...(result.codeDev && result.codeDev !== "SKIP"
          ? { devCode: result.codeDev }
          : {}),
      },
    });
  } catch (e) {
    console.error("[sms otp request]", e);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
