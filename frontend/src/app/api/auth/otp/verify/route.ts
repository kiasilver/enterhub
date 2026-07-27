import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailOtp } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
  purpose: z.enum(["register", "login", "verify_email"]).default("verify_email"),
});

/** POST /api/auth/otp/verify */
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

  const email = parsed.data.email.toLowerCase();
  const ok = await verifyEmailOtp({
    email,
    code: parsed.data.code,
    purpose: parsed.data.purpose,
  });

  if (!ok) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
  }

  if (parsed.data.purpose === "verify_email" || parsed.data.purpose === "register") {
    await prisma.user.updateMany({
      where: { email },
      data: { emailVerifiedAt: new Date() },
    });
  }

  return NextResponse.json({ data: { verified: true } });
}
