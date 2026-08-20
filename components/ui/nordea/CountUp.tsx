'use client';

import { useEffect, useRef, useState } from 'react';

// Animerad siffra som räknar upp till value med ease-out (rAF-baserad).
interface CountUpProps {
  value: number;
  durationMs?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({ value, durationMs = 1200, suffix = '', className }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return (
    <span className={className}>
      {display}
      {suffix}
    </span>
  );
}
