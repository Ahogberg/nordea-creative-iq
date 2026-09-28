"use client";

// ── Illustrationen som statisk markup för HTML5-banners (webbläsare) ──
//
// Canvas-koden körs med en scope där Remotions hooks ger en fast tidpunkt
// (samma som reservbilden) och <Layer> blir en SVG-grupp med en CSS-klass.
// Lagrets rörelse läggs sedan på som CSS-keyframes (build.ts). Resultatet är
// ren HTML/SVG utan React.

import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { compileCanvasComponentWithScope, NO_INSETS } from "@/lib/remotion/scenes/CanvasScene";
import { sampleLayer } from "@/lib/remotion/layers-math";
import type { Box } from "../layout";
import type { DisplayIllustration } from "../types";
import type { LayerInstance, StaticIllustration } from "./build";

const FPS = 30;

type Style = React.CSSProperties | undefined;

const fillStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

export async function renderStaticIllustration(
  ill: DisplayIllustration,
  box: Box,
  canvas: { width: number; height: number }
): Promise<StaticIllustration | null> {
  const scale = Math.min(box.w / ill.designWidth, box.h / ill.designHeight);
  const width = ill.designWidth * scale;
  const height = ill.designHeight * scale;
  const frame = Math.round(ill.atSeconds * FPS);
  const byId = new Map((ill.layers ?? []).map((l) => [l.id, l]));
  const instances: LayerInstance[] = [];

  const stateAt = (id: string) => {
    const s = sampleLayer(byId.get(id), ill.atSeconds);
    return { ...s, x: s.x * scale, y: s.y * scale };
  };

  const AbsoluteFill: React.FC<{ style?: Style; className?: string; children?: React.ReactNode }> = ({ style, className, children }) => (
    <div className={className} style={{ ...fillStyle, ...style }}>
      {children}
    </div>
  );

  const Sequence: React.FC<{ from?: number; durationInFrames?: number; layout?: "none" | "absolute-fill"; children?: React.ReactNode }> = ({
    from = 0,
    durationInFrames = Infinity,
    layout,
    children,
  }) => {
    if (frame < from || frame >= from + durationInFrames) return null;
    return layout === "none" ? <>{children}</> : <AbsoluteFill>{children}</AbsoluteFill>;
  };

  const Img: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  );

  // Lagret i sitt slutläge; CSS-animationen (build.ts) spelar rörelsen fram hit.
  const Layer: React.FC<{ id: string; origin?: [number, number]; children?: React.ReactNode }> = ({ id, origin, children }) => {
    const cls = `ly${instances.length}`;
    const o: [number, number] = origin ?? [0, 0];
    instances.push({ cls, id, origin: o });
    const s = stateAt(id);
    const transform = `translate(${s.x} ${s.y}) translate(${o[0]} ${o[1]}) rotate(${s.rotation}) scale(${s.scale}) translate(${-o[0]} ${-o[1]})`;
    return (
      <g className={cls} transform={transform} opacity={s.opacity}>
        {children}
      </g>
    );
  };

  const useLayer = (id: string) => {
    const s = stateAt(id);
    return {
      ...s,
      transform: ([ox, oy]: [number, number] = [0, 0]) =>
        `translate(${s.x} ${s.y}) translate(${ox} ${oy}) rotate(${s.rotation}) scale(${s.scale}) translate(${-ox} ${-oy})`,
    };
  };

  const Component = compileCanvasComponentWithScope(ill.compiledJs, {
    useCurrentFrame: () => frame,
    useVideoConfig: () => ({ width: canvas.width, height: canvas.height, fps: FPS, durationInFrames: frame + 1, id: "html5" }),
    AbsoluteFill,
    Sequence,
    Img,
    Layer,
    useLayer,
  });
  if (!Component) return null;

  // Rendera i en frikopplad nod utanför Reacts pågående rendering.
  await new Promise((r) => setTimeout(r, 0));
  const el = document.createElement("div");
  let failed = false;
  const root = createRoot(el, {
    onUncaughtError: () => {
      failed = true;
    },
    onCaughtError: () => {
      failed = true;
    },
  });
  try {
    flushSync(() => root.render(<Component width={width} height={height} scale={scale} safe={NO_INSETS} />));
  } catch {
    failed = true;
  }
  const html = el.innerHTML;
  root.unmount();
  if (failed || !html) return null;

  // SVG-transform som attribut ersätts av CSS-animationen när den spelar; när
  // animationen inte körs (reducerad rörelse) gäller attributet = slutläget.
  return { html, layers: instances, width, height, scale };
}
