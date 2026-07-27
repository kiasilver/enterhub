"use client";

import { SessionProvider } from "next-auth/react";

/** Must wrap every tree that calls useSession (workspace / SA shells). */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}
