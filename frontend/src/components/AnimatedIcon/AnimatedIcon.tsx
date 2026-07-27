'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface AnimatedIconProps {
  src: string; // e.g. "/alertCircle.json" or "/settings.json"
  loop?: boolean;
  autoplay?: boolean;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
  hoverTrigger?: boolean; // If true, play on hover, else autoplay
}

export default function AnimatedIcon({
  src,
  loop = true,
  autoplay = true,
  width = 16,
  height = 16,
  style,
  className,
  hoverTrigger = false,
}: AnimatedIconProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay && !hoverTrigger);

  useEffect(() => {
    // Fetch the JSON dynamically from the public folder
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => setAnimationData(data))
      .catch((err) => console.warn(`Could not load Lottie from ${src}:`, err));
  }, [src]);

  if (!animationData) {
    // Render placeholder div with matching dimensions
    return <div style={{ width, height, ...style }} className={className} />;
  }

  return (
    <div
      style={{ width, height, ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      className={className}
      onMouseEnter={() => {
        if (hoverTrigger) setIsPlaying(true);
      }}
      onMouseLeave={() => {
        if (hoverTrigger) setIsPlaying(false);
      }}
    >
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={isPlaying}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
