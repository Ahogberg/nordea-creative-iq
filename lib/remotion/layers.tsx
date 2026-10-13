// ── Lager och keyframes i canvas-scener ──
//
// Canvas-koden ritar ett objekt inne i <Layer id="mynt" origin={[cx, cy]}>.
// Hur lagret rör sig står i scenens `layers` som keyframes — inte i koden.
// Samplingen är ren (utan React) så att samma beräkning används i
// renderaren, lagerspåret och inspektören.

import React, { createContext, useContext } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { MotionLayer } from "./types";
import { sampleLayer, type LayerState } from "./layers-math";

// Samplingen ligger i layers-math.ts (ren) — återexporteras för befintliga importer.
export {
  LAYER_PROPERTIES,
  LAYER_DEFAULTS,
  sampleKeyframes,
  sampleLayer,
  keyframeTimes,
  round,
  type LayerState,
} from "./layers-math";

// ── React: kontext + <Layer> ──

interface LayersContextValue {
  layers: MotionLayer[];
  /** px i designskala → px i ytan (width / 1080). */
  scale: number;
}

export const LayersContext = createContext<LayersContextValue>({ layers: [], scale: 1 });

/** Lagrets läge just nu, i ytans pixlar. */
export function useLayer(id: string): LayerState & { transform: (origin?: [number, number]) => string } {
  const { layers, scale } = useContext(LayersContext);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = sampleLayer(layers.find((l) => l.id === id), frame / fps);
  const x = s.x * scale;
  const y = s.y * scale;
  return {
    ...s,
    x,
    y,
    transform: ([ox, oy] = [0, 0]) =>
      `translate(${x} ${y}) translate(${ox} ${oy}) rotate(${s.rotation}) scale(${s.scale}) translate(${-ox} ${-oy})`,
  };
}

/**
 * SVG-grupp som rör sig enligt lagrets keyframes. `origin` = punkten som
 * skala och rotation sker runt (px i ytan), t.ex. objektets mittpunkt.
 */
export const Layer: React.FC<{ id: string; origin?: [number, number]; children?: React.ReactNode }> = ({
  id,
  origin,
  children,
}) => {
  const l = useLayer(id);
  return (
    <g data-layer={id} transform={l.transform(origin)} opacity={l.opacity}>
      {children}
    </g>
  );
};
