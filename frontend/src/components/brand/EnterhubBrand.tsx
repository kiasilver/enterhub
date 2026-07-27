'use client';

import Image from 'next/image';
import Link from 'next/link';

/** Dark mark — for light backgrounds */
export const ENTERHUB_LOGO_DARK = '/Logo/enterhub.logo.png';
/** Color / light mark — for dark backgrounds */
export const ENTERHUB_LOGO_LIGHT = '/Logo/enterhub.logo_white.png';

type EnterhubBrandProps = {
  isDark: boolean;
  /** Icon edge length in px */
  size?: number;
  showText?: boolean;
  text?: string;
  href?: string | null;
  className?: string;
  textClassName?: string;
  priority?: boolean;
};

export function enterhubLogoSrc(isDark: boolean) {
  return isDark ? ENTERHUB_LOGO_LIGHT : ENTERHUB_LOGO_DARK;
}

export function EnterhubBrand({
  isDark,
  size = 28,
  showText = true,
  text = 'Enterhub',
  href = '/',
  className = '',
  textClassName = '',
  priority = false,
}: EnterhubBrandProps) {
  const content = (
    <>
      <Image
        src={enterhubLogoSrc(isDark)}
        alt=""
        width={size}
        height={size}
        priority={priority}
        className="flex-shrink-0 object-contain"
        style={{ width: size, height: size }}
        aria-hidden
      />
      {showText && (
        <span
          className={`font-bold tracking-tight truncate ${textClassName}`}
          style={{ color: isDark ? '#fff' : '#0a0a0a' }}
        >
          {text}
        </span>
      )}
    </>
  );

  const sharedClass = `inline-flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity ${className}`;

  if (href) {
    return (
      <Link href={href} className={sharedClass} aria-label="Enterhub home">
        {content}
      </Link>
    );
  }

  return (
    <div className={sharedClass} aria-label="Enterhub">
      {content}
    </div>
  );
}
