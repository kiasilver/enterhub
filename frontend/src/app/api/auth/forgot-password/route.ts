import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/email";
import { sendTempPasswordSms } from "@/lib/platform-settings";
import { normalizeIranPhone } from "@/lib/smsir";

const schema = z.object({
  login: z.string().min(3).optional(),
  email: z.string().optional(),
});

/** POST /api/auth/forgot-password — always returns ok (no enumeration). */
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

  const raw = (parsed.data.login || parsed.data.email || "").trim();
  if (!raw) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  try {
    const phone = normalizeIranPhone(raw);
    if (phone) {
      await sendTempPasswordSms(phone);
    } else if (raw.includes("@")) {
      await requestPasswordReset(raw);
    }
  } catch (e) {
    console.error("[forgot-password]", e);
    return NextResponse.json(
      { error: "Could not send reset. Try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    data: {
      ok: true,
      message:
        "If that account exists, reset instructions were sent.",
    },
  });
}
