'use client';

export function landingSurface(isDark: boolean) {
  return {
    backgroundColor: isDark ? 'var(--surface)' : 'rgba(255,255,255,0.78)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    boxShadow: isDark ? '0 16px 40px rgba(0,0,0,0.35)' : '0 16px 40px rgba(0,0,0,0.06)',
  } as const;
}

export function landingText(isDark: boolean) {
  return {
    primary: isDark ? '#ffffff' : '#0a0a0a',
    secondary: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.62)',
    muted: isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)',
    accent: isDark ? '#60a5fa' : '#2563eb',
  } as const;
}
