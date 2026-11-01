'use client';

import { companyInitial, letterAvatarColor } from '@/lib/enterprise-positions';

type Props = {
  name: string;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  logoColor?: string | null;
  isDark: boolean;
  /** Height of the mark. Width is auto when a logo image is set. */
  size?: number;
  className?: string;
  rounded?: string;
};

/**
 * Theme-aware workspace mark.
 * - Light: uses logoUrl (light/white-mode asset)
 * - Dark: uses logoUrlDark when set; otherwise inverts the light logo colors
 * - Image logos: transparent, height-fixed, width auto
 * - No logo: square letter avatar
 */
export function WorkspaceLogo({
  name,
  logoUrl,
  logoUrlDark,
  logoColor,
  isDark,
  size = 32,
  className = '',
  rounded = 'rounded-lg',
}: Props) {
  const color = logoColor || letterAvatarColor(name);
  const initial = companyInitial(name);

  const src = isDark ? logoUrlDark || logoUrl : logoUrl;
  const invertLightLogo = Boolean(isDark && !logoUrlDark && logoUrl);

  if (src) {
    return (
      <div
        className={`${rounded} flex items-center justify-center overflow-visible flex-shrink-0 ${className}`}
        style={{
          height: size,
          width: 'auto',
          maxWidth: Math.max(size * 5, 160),
          background: 'transparent',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="block object-contain"
          style={{
            height: size,
            width: 'auto',
            maxHeight: size,
            maxWidth: Math.max(size * 5, 160),
            background: 'transparent',
            ...(invertLightLogo
              ? {
                  filter: 'invert(1) hue-rotate(180deg)',
                  mixBlendMode: 'normal' as const,
                }
              : {}),
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${rounded} flex items-center justify-center overflow-hidden flex-shrink-0 font-black ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.35)),
        background: color,
        color: '#fff',
      }}
    >
      {initial}
    </div>
  );
}
