import { interpolate } from "remotion";

// ── EASING FUNCTIONS ──

export const easeOutExpo = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutBack = (t: number, overshoot = 1.70158): number => {
  if (t >= 1) return 1;
  if (t <= 0) return 0;
  const t1 = t - 1;
  return t1 * t1 * ((overshoot + 1) * t1 + overshoot) + 1;
};

export const easeOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;
  const p = 0.35;
  const s = p / 4;
  return Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1;
};

// ── FORMAT ──
export function formatSEK(n: number): string {
  return Math.round(n).toLocaleString("sv-SE") + " kr";
}

// ── ANIMATION HELPERS ──

export function counterValue(
  frame: number,
  startFrame: number,
  durationFrames: number,
  from: number,
  to: number
): number {
  if (frame < startFrame) return from;
  const t = Math.min((frame - startFrame) / durationFrames, 1);
  return from + (to - from) * easeOutExpo(t);
}

export function fadeSlideUp(
  frame: number,
  startFrame: number,
  durationFrames = 15,
  slideDistance = 44
): { opacity: number; transform: string } {
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const y = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [slideDistance, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return { opacity, transform: `translateY(${y}px)` };
}

export function fadeIn(
  frame: number,
  startFrame: number,
  durationFrames = 12
): number {
  return interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
}

export function barGrow(
  frame: number,
  startFrame: number,
  durationFrames: number,
  fromPct: number,
  toPct: number
): number {
  if (frame < startFrame) return fromPct;
  const t = Math.min((frame - startFrame) / durationFrames, 1);
  return fromPct + (toPct - fromPct) * easeInOutCubic(t);
}

export function scalePop(
  frame: number,
  startFrame: number,
  durationFrames = 18,
  overshoot = 1.12
): number {
  if (frame < startFrame) return 0;
  const t = Math.min((frame - startFrame) / durationFrames, 1);
  return easeOutBack(t, (overshoot - 1) * 10);
}

export function s2f(seconds: number, fps = 30): number {
  return Math.round(seconds * fps);
}
