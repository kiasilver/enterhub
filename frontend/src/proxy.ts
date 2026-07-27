import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Next.js 16+ Proxy (replaces deprecated middleware.ts).
 * Protects /superadmin, /workspace, /board — membership/guest checked in pages/APIs.
 * Runtime is Node.js (not Edge).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env["AUTH_SECRET"] || process.env["NEXTAUTH_SECRET"];

  const token = await getToken({ req, secret });

  const isSuperAdminPath = pathname.startsWith("/superadmin");
  const isWorkspacePath = pathname.startsWith("/workspace");
  const isBoardPath = pathname.startsWith("/board");

  if (!isSuperAdminPath && !isWorkspacePath && !isBoardPath) {
    return NextResponse.next();
  }

  if (!token?.sub || token.error === "SessionRevoked") {
    const login = new URL("/signin", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (isSuperAdminPath && token.isSuperAdmin !== true) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("x-user-id", String(token.sub));
  return res;
}

export const config = {
  matcher: ["/superadmin/:path*", "/workspace/:path*", "/board/:path*"],
};
