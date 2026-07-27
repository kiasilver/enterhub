'use client';

import dynamic from 'next/dynamic';
import { useTheme } from '@/components/ThemeProvider/ThemeProvider';

const Plasma = dynamic(() => import('@/components/Plasma/Plasma'), { ssr: false });

interface PlasmaWrapperProps {
  fullscreen?: boolean;
}

export default function PlasmaWrapper({ fullscreen = false }: PlasmaWrapperProps) {
  const { theme } = useTheme();

  const plasmaColor = theme === 'dark' ? '#9d9696' : '#6b6060';

  return (
    <div
      style={{
        width: '100%',
        height: fullscreen ? '100%' : '600px',
        position: 'relative',
      }}
    >
      <Plasma
        color={plasmaColor}
        speed={1}
        direction="forward"
        scale={1}
        opacity={theme === 'dark' ? 1 : 0.7}
        mouseInteractive={false}
      />
    </div>
  );
}
