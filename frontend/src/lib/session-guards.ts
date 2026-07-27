import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/** Block write operations while Super Admin is impersonating (read-only). */
export async function assertWritableSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (session.user.impersonating) {
    return {
      session,
      error: NextResponse.json(
        { error: "Forbidden: read-only impersonation session" },
        { status: 403 }
      ),
    };
  }
  return { session, error: null };
}
