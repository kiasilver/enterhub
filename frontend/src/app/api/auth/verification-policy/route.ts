import { NextResponse } from "next/server";
import { getVerificationPolicy } from "@/lib/platform-settings";

/** GET /api/auth/verification-policy */
export async function GET() {
  const policy = await getVerificationPolicy();
  return NextResponse.json({
    data: {
      smsRequired: policy.smsRequired,
      emailRequired: policy.emailRequired,
      googleEnabled: policy.googleEnabled,
      smsConfigured: policy.smsConfigured,
      emailConfigured: policy.emailConfigured,
    },
  });
}
