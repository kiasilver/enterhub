'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MdEdit } from 'react-icons/md';
import {
  textPrimary,
  textMuted,
  hexToRgba,
} from '@/components/SafeDashboard/theme';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onCommit?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  isDark?: boolean;
  size?: 'title' | 'body';
  'aria-label'?: string;
};

/** Editable text — pencil icon is the only idle affordance (no blinking caret). */
export function EditableTextField({
  value,
  onChange,
  onCommit,
  disabled = false,
  placeholder,
  className = '',
  isDark: isDarkProp,
  size = 'body',
  'aria-label': ariaLabel,
}: Props) {
  const { theme, primaryColor } = useTheme();
  const isDark = isDarkProp ?? theme === 'dark';
  const accent = primaryColor || '#2563EB';
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (disabled) setFocused(false);
  }, [disabled]);

  const base: CSSProperties = {
    color: textPrimary(isDark),
    borderBottom: `1.5px ${focused ? 'solid' : 'dashed'} ${
      focused
        ? accent
        : hovered && !disabled
          ? hexToRgba(accent, 0.45)
          : 'transparent'
    }`,
    background: focused
      ? isDark
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.02)'
      : 'transparent',
    caretColor: accent,
  };

  const textClass = size === 'title' ? 'text-xl font-bold' : 'text-sm';

  return (
    <div
      className={`relative group/editfield ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          onCommit?.(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={`w-full bg-transparent outline-none rounded-md px-1.5 py-1 transition-[border-color,background] duration-150 pe-7 ${textClass} ${
          disabled ? 'opacity-80 cursor-default' : 'cursor-text'
        }`}
        style={base}
      />

      {!disabled && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={`absolute end-0.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-opacity duration-150 ${
            focused || hovered
              ? 'opacity-80'
              : 'opacity-35 group-hover/editfield:opacity-70'
          }`}
          style={{ color: textMuted(isDark) }}
          onMouseDown={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <MdEdit size={size === 'title' ? 16 : 13} />
        </button>
      )}
    </div>
  );
}
