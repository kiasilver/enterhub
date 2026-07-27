import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    error?: string;
    user: DefaultSession["user"] & {
      id: string;
      isSuperAdmin: boolean;
      impersonating?: boolean;
      impersonatorId?: string;
      /** App session id (DB Session.jti) — not Auth.js JWT `jti`. */
      sessionJti?: string;
    };
  }

  interface User {
    isSuperAdmin?: boolean;
    sessionJti?: string;
    sessionExpiresAt?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isSuperAdmin?: boolean;
    /** Persisted Session.jti for force-logout — do not use reserved JWT claim `jti`. */
    sessionJti?: string;
    sessionExpiresAt?: string;
    impersonating?: boolean;
    impersonatorId?: string;
    error?: string;
  }
}
