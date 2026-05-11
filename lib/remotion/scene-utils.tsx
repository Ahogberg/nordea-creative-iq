import React from "react";
import type { ElementTransform, SceneBase } from "./types";

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

  return (
    <div
      key={`pos-${id}`}
      style={{
        position: "absolute",
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        transform: `translate(-50%, -50%) rotate(${transform.rotation ?? 0}deg) scale(${transform.scale})`,
        transformOrigin: "center center",
        zIndex: 2,
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
  };
}
