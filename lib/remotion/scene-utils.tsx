import React from "react";
import type { ElementTransform, SceneBase, SceneAsset } from "./types";

/**
 * Wraps a scene element so it can be repositioned / resized / rotated via
 * `scene.elementTransforms[id]`. When no transform exists, the element
 * renders inline (so the scene's default flex layout is preserved).
 *
 * When a transform exists, the element is absolutely positioned at the
 * transform coordinates (0-1 fractions of canvas) and scaled around its
 * center.
 */
export function positionedElement(
  scene: Pick<SceneBase, "elementTransforms">,
  id: string,
  node: React.ReactNode
): React.ReactNode {
  const transform = scene.elementTransforms?.[id];
  // Caller already renders the inline copy via `isInline()`; if no transform
  // exists we must return null so we don't render a second copy on top.
  // Returning `node` here was a duplicate-render bug visible as bold/blurred
  // text on every scene without a custom layout.
  if (!transform) return null;

  const ax = (transform.anchorX ?? 0.5) * 100;
  const ay = (transform.anchorY ?? 0.5) * 100;
  return (
    <div
      key={`pos-${id}`}
      style={{
        position: "absolute",
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        transform: `translate(${-ax}%, ${-ay}%) rotate(${transform.rotation ?? 0}deg) scale(${transform.scale})`,
        transformOrigin: "center center",
        zIndex: 2 + (transform.z ?? 0),
      }}
    >
      {node}
    </div>
  );
}

/** True when this element should render inline in the default layout. */
export function isInline(
  scene: Pick<SceneBase, "elementTransforms">,
  id: string
): boolean {
  return !scene.elementTransforms?.[id];
}

/** Merge a partial transform with sensible defaults (center, 1x scale). */
export function resolveTransform(
  transform: ElementTransform | undefined,
  defaults: Partial<ElementTransform> = {}
): ElementTransform {
  return {
    x: transform?.x ?? defaults.x ?? 0.5,
    y: transform?.y ?? defaults.y ?? 0.5,
    scale: transform?.scale ?? defaults.scale ?? 1,
    rotation: transform?.rotation ?? defaults.rotation ?? 0,
    anchorX: transform?.anchorX ?? defaults.anchorX ?? 0.5,
    anchorY: transform?.anchorY ?? defaults.anchorY ?? 0.5,
    z: transform?.z ?? defaults.z ?? 0,
  };
}

// Sprint 11A: Render asset overlays (icons / illustrations) on top of a
// scene's main content. Renderer-side only — drag/resize lives in the
// Studio CanvasOverlay. Defensive: missing scene.assets renders nothing.
export function renderSceneAssets(
  scene: Pick<SceneBase, "assets">,
  scale: number = 1
): React.ReactNode {
  const assets = scene.assets;
  if (!assets || assets.length === 0) return null;
  return assets.map((asset: SceneAsset) => {
    const t = asset.layout;
    const ax = (t.anchorX ?? 0.5) * 100;
    const ay = (t.anchorY ?? 0.5) * 100;
    // 200px base size (at scale 1) feels right for icons. Illustrations
    // typically have larger natural size — the layout.scale handles that.
    const baseSize = (asset.type === "illustration" ? 320 : 160) * scale;
    return (
      <div
        key={asset.id}
        style={{
          position: "absolute",
          left: `${t.x * 100}%`,
          top: `${t.y * 100}%`,
          transform: `translate(${-ax}%, ${-ay}%) rotate(${
            t.rotation ?? 0
          }deg) scale(${t.scale})`,
          transformOrigin: "center center",
          width: baseSize,
          height: baseSize,
          zIndex: 5 + (t.z ?? 0),
          pointerEvents: "none",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.url}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    );
  });
}
