'use client';

import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '52px',
        height: '28px',
        borderRadius: '999px',
        cursor: 'pointer',
        border: isDark ? '2px solid rgba(255,255,255,0.25)' : '2px solid rgba(0,0,0,0.15)',
        backgroundColor: isDark ? 'var(--surface)' : '#f0f0f0',
        transition: 'background-color 0.4s ease, border-color 0.4s ease',
        padding: '0 4px',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* Sliding thumb */}
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: isDark ? 'calc(100% - 24px)' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: isDark ? '#ffffff' : '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease',
          boxShadow: isDark
            ? '0 2px 8px rgba(0,0,0,0.5)'
            : '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {isDark ? (
          /* Moon icon */
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          /* Sun icon */
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </span>
    </button>
  );
}
