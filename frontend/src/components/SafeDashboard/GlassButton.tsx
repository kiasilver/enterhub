'use client';

import React from 'react';
import { useTheme } from '../ThemeProvider/ThemeProvider';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'primary';
  hoverVariant?: 'default' | 'danger' | 'success' | 'primary';
}

export default function GlassButton({
  children,
  className = '',
  onClick,
  style,
  variant = 'default',
  hoverVariant = 'default',
  ...props
}: GlassButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const primaryBg = isDark ? 'rgba(37, 99, 235, 0.95)' : '#2563eb';
  const primaryHover = isDark ? 'rgba(59, 130, 246, 1)' : '#1d4ed8';

  const defaultStyle: React.CSSProperties = {
    background:
      variant === 'primary'
        ? primaryBg
        : isDark
          ? 'rgba(255, 255, 255, 0.04)'
          : 'rgba(0, 0, 0, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border:
      variant === 'danger'
        ? `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`
        : variant === 'success'
          ? `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`
          : variant === 'primary'
            ? '1px solid transparent'
            : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
    color:
      variant === 'danger'
        ? '#ef4444'
        : variant === 'success'
          ? '#10b981'
          : variant === 'primary'
            ? '#ffffff'
            : isDark
              ? '#ffffff'
              : '#0a0a0a',
    borderRadius: '9999px',
    padding: '8px 20px',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '0.02em',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    boxShadow:
      variant === 'primary'
        ? '0 6px 18px rgba(37, 99, 235, 0.35)'
        : '0 4px 12px rgba(0, 0, 0, 0.02)',
  };

  return (
    <button
      onClick={onClick}
      className={`active:scale-[0.97] hover:shadow-lg hover:shadow-primary/5 select-none ${className}`}
      style={{ ...defaultStyle, ...style }}
      onMouseEnter={e => {
        const btn = e.currentTarget as HTMLElement;
        const targetHover = hoverVariant !== 'default' ? hoverVariant : variant;

        if (targetHover === 'danger') {
          btn.style.background = isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)';
          btn.style.borderColor = '#ef4444';
          btn.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.15)';
          btn.style.color = '#ef4444';
        } else if (targetHover === 'success') {
          btn.style.background = isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)';
          btn.style.borderColor = '#10b981';
          btn.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.15)';
          btn.style.color = '#10b981';
        } else if (targetHover === 'primary') {
          btn.style.background = primaryHover;
          btn.style.borderColor = 'transparent';
          btn.style.boxShadow = '0 8px 22px rgba(37, 99, 235, 0.45)';
          btn.style.color = '#ffffff';
        } else {
          btn.style.background = isDark ? 'rgba(var(--primary-rgb), 0.12)' : 'rgba(var(--primary-rgb), 0.08)';
          btn.style.borderColor = 'var(--primary)';
          btn.style.boxShadow = '0 6px 16px rgba(var(--primary-rgb), 0.12)';
        }
      }}
      onMouseLeave={e => {
        const btn = e.currentTarget as HTMLElement;
        if (variant === 'primary') {
          btn.style.background = primaryBg;
          btn.style.borderColor = 'transparent';
          btn.style.color = '#ffffff';
          btn.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.35)';
          return;
        }
        btn.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)';

        if (variant === 'danger') {
          btn.style.borderColor = isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)';
          btn.style.color = '#ef4444';
        } else if (variant === 'success') {
          btn.style.borderColor = isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)';
          btn.style.color = '#10b981';
        } else {
          btn.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
          btn.style.color = isDark ? '#ffffff' : '#0a0a0a';
        }
        btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.02)';
      }}
      {...props}
    >
      {children}
    </button>
  );
}
