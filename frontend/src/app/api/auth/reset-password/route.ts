import { NextResponse } from "next/server";
import { z } from "zod";
import { consumePasswordResetToken } from "@/lib/email";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(8),
});

/** POST /api/auth/reset-password — consume token and set new password. */
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

  const result = await consumePasswordResetToken(
    parsed.data.token,
    parsed.data.password,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Invalid or expired reset link" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: { ok: true, message: "Password updated. You can sign in now." },
  });
}
