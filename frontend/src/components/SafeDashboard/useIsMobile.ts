'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true when the viewport is below `breakpoint` (default 1024px / `lg`).
 *
 * Convention for the breakpoint when swapping in a dedicated mobile screen:
 *   • Multi-pane workspace pages (Calendar / Email / Chat) use the default 1024
 *     — their 3-pane desktop layouts are too cramped on tablets.
 *   • Content / showcase pages (Basic Elements / Recharts) pass 768 — their
 *     desktop grid stays usable on tablets, so only phones need the mobile build.
 *
 * SSR-safe: renders the desktop layout on the server / first paint, then switches
 * on mount (matching the dashboard shell, which also reads `innerWidth`).
 */
export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
