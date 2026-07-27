'use client';

import { companyInitial, letterAvatarColor } from '@/lib/enterprise-positions';

type Props = {
  name: string;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  logoColor?: string | null;
  isDark: boolean;
  size?: number;
  className?: string;
  rounded?: string;
};

/**
 * Theme-aware workspace mark.
 * - Light: uses logoUrl (light/white-mode asset)
 * - Dark: uses logoUrlDark when set; otherwise inverts the light logo colors
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

  return (
    <div
      className={`${rounded} flex items-center justify-center overflow-hidden flex-shrink-0 font-black ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.35)),
        background: src ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : color,
        color: '#fff',
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain p-0.5"
          style={
            invertLightLogo
              ? {
                  filter: 'invert(1) hue-rotate(180deg)',
                  // Keeps soft logos readable on dark chrome
                  mixBlendMode: 'normal',
                }
              : undefined
          }
        />
      ) : (
        initial
      )}
    </div>
  );
}
