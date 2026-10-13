// ── Lagrens keyframes: sampling (ren, utan React) ──
//
// Samma beräkning används i renderaren (<Layer>), lagerspåret, inspektören
// och HTML5-banners (där den blir CSS-keyframes).

import type { Keyframe, KeyframeEase, LayerProperty, MotionLayer } from "./types";

export const LAYER_PROPERTIES: LayerProperty[] = ["x", "y", "scale", "rotation", "opacity"];

export const LAYER_DEFAULTS: Record<LayerProperty, number> = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
};

export interface LayerState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

function ease(kind: KeyframeEase | undefined, p: number): number {
  switch (kind ?? "ease-out") {
    case "linear":
      return p;
    case "ease-in":
      return p * p * p;
    case "ease-in-out":
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    case "ease-out":
    default:
      return 1 - Math.pow(1 - p, 3);
  }
}

/** Värdet för en egenskap vid tiden t (sekunder från scenstart). */
export function sampleKeyframes(frames: Keyframe[] | undefined, t: number, fallback: number): number {
  if (!frames || frames.length === 0) return fallback;
  const sorted = [...frames].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return sorted[0].v;
  const last = sorted[sorted.length - 1];
  if (t >= last.t) return last.v;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const p = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      return a.v + (b.v - a.v) * ease(a.ease, p);
    }
  }
  return last.v;
}

export function sampleLayer(layer: MotionLayer | undefined, t: number): LayerState {
  const k = layer?.keyframes ?? {};
  return {
    x: sampleKeyframes(k.x, t, LAYER_DEFAULTS.x),
    y: sampleKeyframes(k.y, t, LAYER_DEFAULTS.y),
    scale: sampleKeyframes(k.scale, t, LAYER_DEFAULTS.scale),
    rotation: sampleKeyframes(k.rotation, t, LAYER_DEFAULTS.rotation),
    opacity: sampleKeyframes(k.opacity, t, LAYER_DEFAULTS.opacity),
  };
}

/** Alla tidpunkter med minst en keyframe, sorterade. */
export function keyframeTimes(layer: MotionLayer): number[] {
  const times = new Set<number>();
  for (const prop of LAYER_PROPERTIES) for (const kf of layer.keyframes[prop] ?? []) times.add(round(kf.t));
  return [...times].sort((a, b) => a - b);
}

export const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
