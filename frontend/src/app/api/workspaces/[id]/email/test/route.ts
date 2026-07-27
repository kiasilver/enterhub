import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { createEmailOtp, isEmailConfigured, isLocalhostRuntime } from "@/lib/email";

const schema = z.object({
  to: z.string().email().optional(),
});

/**
 * POST /api/workspaces/[id]/email/test
 * Sends a test OTP-style mail (or logs on localhost) using platform SMTP (Shetaban / env).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:update"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty ok */
  }
  const parsed = schema.safeParse(body);
  const to = parsed.success && parsed.data.to ? parsed.data.to : session.user.email;
  if (!to) {
    return NextResponse.json({ error: "No recipient email" }, { status: 400 });
  }

  const result = await createEmailOtp({
    email: to,
    userId: session.user.id,
    purpose: "verify_email",
  });

  return NextResponse.json({
    data: {
      to,
      smtpConfigured: isEmailConfigured(),
      localhost: isLocalhostRuntime(),
      skipped: result.skipped,
      ...(isLocalhostRuntime() && result.code ? { devCode: result.code } : {}),
      message: result.skipped
        ? "SMTP not used on localhost — code logged on server"
        : "Test email sent via SMTP",
    },
  });
}

/** GET — SMTP readiness for this deployment */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: workspaceId } = await ctx.params;
  if (!(await hasPermission(session.user.id, workspaceId, "workspace:read"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    data: {
      smtpConfigured: isEmailConfigured(),
      localhost: isLocalhostRuntime(),
      skipVerification: process.env.SKIP_EMAIL_VERIFICATION === "true" || isLocalhostRuntime(),
      host: process.env.SMTP_HOST || null,
      from: process.env.EMAIL_FROM || null,
      hint: "Set SMTP_* in .env from your Shetaban Host email product (mail.yourdomain.com:587).",
    },
  });
}
