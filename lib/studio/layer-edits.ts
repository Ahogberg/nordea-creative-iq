// Rena redigeringar av ett lagers keyframes — används av lagerspåret och
// inspektören i Motion Studio. Tider avrundas till hundradelar.

import type { Keyframe, KeyframeEase, LayerProperty, MotionLayer } from "@/lib/remotion/types";
import { LAYER_PROPERTIES, round, sampleLayer } from "@/lib/remotion/layers";

const same = (a: number, b: number) => Math.abs(a - b) < 0.005;

function mapKeyframes(layer: MotionLayer, fn: (prop: LayerProperty, frames: Keyframe[]) => Keyframe[]): MotionLayer {
  const keyframes: MotionLayer["keyframes"] = {};
  for (const prop of LAYER_PROPERTIES) {
    const frames = layer.keyframes[prop];
    if (!frames) continue;
    const next = fn(prop, frames);
    if (next.length > 0) keyframes[prop] = next.sort((a, b) => a.t - b.t);
  }
  return { ...layer, keyframes };
}

/** Flyttar alla keyframes vid tiden `from` till `to` (alla egenskaper). */
export function moveKeyframeTime(layer: MotionLayer, from: number, to: number): MotionLayer {
  const target = round(to);
  return mapKeyframes(layer, (_p, frames) => {
    const moving = frames.filter((k) => same(k.t, from));
    if (moving.length === 0) return frames;
    // Hamnar den flyttade på en befintlig keyframe ersätter den flyttade den.
    const rest = frames.filter((k) => !same(k.t, from) && !same(k.t, target));
    return [...rest, ...moving.map((k) => ({ ...k, t: target }))];
  });
}

/** Förskjuter hela lagrets rörelse i tid, inom [0, duration]. */
export function shiftLayer(layer: MotionLayer, dt: number, duration: number): MotionLayer {
  const times = LAYER_PROPERTIES.flatMap((p) => (layer.keyframes[p] ?? []).map((k) => k.t));
  if (times.length === 0) return layer;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const d = Math.max(-min, Math.min(duration - max, dt));
  return mapKeyframes(layer, (_p, frames) => frames.map((k) => ({ ...k, t: round(k.t + d) })));
}

/** Sätter värdet för en egenskap vid tiden t (skapar keyframen om den saknas). */
export function setKeyframeValue(layer: MotionLayer, prop: LayerProperty, t: number, v: number): MotionLayer {
  const frames = layer.keyframes[prop] ?? [];
  const exists = frames.some((k) => same(k.t, t));
  const next = exists ? frames.map((k) => (same(k.t, t) ? { ...k, v } : k)) : [...frames, { t: round(t), v }];
  return { ...layer, keyframes: { ...layer.keyframes, [prop]: next.sort((a, b) => a.t - b.t) } };
}

/** Sätter kurvan fram till nästa keyframe för alla egenskaper vid tiden t. */
export function setKeyframeEase(layer: MotionLayer, t: number, ease: KeyframeEase): MotionLayer {
  return mapKeyframes(layer, (_p, frames) => frames.map((k) => (same(k.t, t) ? { ...k, ease } : k)));
}

/** Tar bort alla keyframes vid tiden t. */
export function removeKeyframesAt(layer: MotionLayer, t: number): MotionLayer {
  return mapKeyframes(layer, (_p, frames) => frames.filter((k) => !same(k.t, t)));
}

/**
 * Lägger till en keyframe vid tiden t för varje animerad egenskap, med
 * värdet lagret har just då — så att rörelsen inte ändras förrän man
 * justerar värdet. Utan animerade egenskaper: x och y.
 */
export function addKeyframeAt(layer: MotionLayer, t: number): MotionLayer {
  const state = sampleLayer(layer, t);
  const animated = LAYER_PROPERTIES.filter((p) => (layer.keyframes[p]?.length ?? 0) > 0);
  const props: LayerProperty[] = animated.length > 0 ? animated : ["x", "y"];
  let next = layer;
  for (const p of props) next = setKeyframeValue(next, p, t, round(state[p], 3));
  return next;
}

/** Egenskaper som har en keyframe vid tiden t. */
export function propsAt(layer: MotionLayer, t: number): LayerProperty[] {
  return LAYER_PROPERTIES.filter((p) => (layer.keyframes[p] ?? []).some((k) => same(k.t, t)));
}

export function easeAt(layer: MotionLayer, t: number): KeyframeEase {
  for (const p of LAYER_PROPERTIES) {
    const k = (layer.keyframes[p] ?? []).find((f) => same(f.t, t));
    if (k) return k.ease ?? "ease-out";
  }
  return "ease-out";
}
