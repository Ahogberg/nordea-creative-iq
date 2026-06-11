"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useStudioStore } from "@/lib/studio/store";
import {
  DEFAULT_ELEMENT_TRANSFORM,
  type ElementTransform,
  type Scene,
  type SceneAsset,
} from "@/lib/remotion/types";
import { ResizeHandles } from "./resize-handles";
import { AlignmentGuides, type GuideLine } from "./alignment-guides";

// Transparent layer that sits on top of the Remotion <Player>. Handles
// selection, drag (move), resize, and drop-from-AssetPicker. Mutations
// flow through Zustand so the property panel sees changes in real time.
//
// Performance notes:
// - During an active drag we set `isDragging` in the store; LivePreview
//   reads this and pauses its debounced previewKey bump so the Remotion
//   Player doesn't re-mount mid-gesture.
// - The boundary <div> uses transform (translate) instead of left/top
//   for the anchor compensation so each drag step is GPU-composited.

interface DragState {
  elementId: string;
  mode: "move" | "resize";
  startMouseX: number;
  startMouseY: number;
  startTransform: ElementTransform;
  overlayRect: DOMRect;
}

const SNAP_POINTS = [0, 0.25, 0.5, 0.75, 1];
const SNAP_TOLERANCE = 0.02;

function snapToNearest(value: number): { value: number; snapped: boolean } {
  for (const p of SNAP_POINTS) {
    if (Math.abs(value - p) < SNAP_TOLERANCE) {
      return { value: p, snapped: true };
    }
  }
  return { value, snapped: false };
}

function collectElementIds(scene: Scene): string[] {
  // Text/element ids per scene type — matches the ids used inside the
  // scene components when they call positionedElement(scene, "<id>", ...).
  const ids: string[] = [];
  switch (scene.type) {
    case "title":
      ids.push("headline");
      if (scene.subtitle) ids.push("subtitle");
      ids.push("line");
      break;
    case "counter":
      ids.push("label", "value");
      if (scene.description) ids.push("description");
      break;
    case "cta":
      ids.push("headline", "cta");
      if (scene.subtitle) ids.push("subtitle");
      break;
    case "highlight-number":
      ids.push("number", "label");
      if (scene.description) ids.push("description");
      break;
    case "text-reveal":
      ids.push("headline");
      break;
    case "split":
      ids.push("left", "right");
      break;
    case "bars":
    case "icon-grid":
      if ("title" in scene && scene.title) ids.push("title");
      break;
    case "lottie":
      if (scene.headline) ids.push("headline");
      if (scene.caption) ids.push("caption");
      break;
    case "canvas":
      // canvas-scenes are user-coded; no standard ids to expose.
      break;
  }
  return ids;
}

function getElementTransform(
  scene: Scene,
  elementId: string
): ElementTransform {
  return {
    ...DEFAULT_ELEMENT_TRANSFORM,
    ...(scene.elementTransforms?.[elementId] ?? {}),
  };
}

interface CanvasOverlayProps {
  // Pixel dimensions of the rendered video frame inside the player wrapper.
  // Drives the boundary baseline so elements line up roughly with text.
  frameWidth: number;
  frameHeight: number;
}

export function CanvasOverlay({ frameWidth, frameHeight }: CanvasOverlayProps) {
  const config = useStudioStore((s) => s.config);
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const selectedElementId = useStudioStore((s) => s.selectedElementId);
  const hoveredElementId = useStudioStore((s) => s.hoveredElementId);
  const selectElement = useStudioStore((s) => s.selectElement);
  const hoverElement = useStudioStore((s) => s.hoverElement);
  const updateElementTransform = useStudioStore(
    (s) => s.updateElementTransform
  );
  const updateAssetTransform = useStudioStore((s) => s.updateAssetTransform);
  const addAssetToScene = useStudioStore((s) => s.addAssetToScene);
  const setDragging = useStudioStore((s) => s.setDragging);

  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);

  const scene =
    selectedSceneIndex !== null ? config.scenes[selectedSceneIndex] : null;

  // Build the list of selectable boundaries (text elements + assets).
  type Element = {
    id: string;
    layout: ElementTransform;
    label: string;
    kind: "text" | "asset";
    assetType?: SceneAsset["type"];
  };

  const elements: Element[] = (() => {
    if (!scene) return [];
    const out: Element[] = collectElementIds(scene).map((id) => ({
      id,
      layout: getElementTransform(scene, id),
      label: id,
      kind: "text",
    }));
    for (const asset of scene.assets ?? []) {
      out.push({
        id: `asset-${asset.id}`,
        layout: { ...DEFAULT_ELEMENT_TRANSFORM, ...asset.layout },
        label: asset.type,
        kind: "asset",
        assetType: asset.type,
      });
    }
    return out;
  })();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string, mode: "move" | "resize") => {
      e.stopPropagation();
      if (selectedSceneIndex === null || !scene) return;
      const overlayRect = overlayRef.current?.getBoundingClientRect();
      if (!overlayRect) return;

      let startTransform: ElementTransform;
      if (elementId.startsWith("asset-")) {
        const assetId = elementId.replace("asset-", "");
        const asset = scene.assets?.find((a) => a.id === assetId);
        startTransform = {
          ...DEFAULT_ELEMENT_TRANSFORM,
          ...(asset?.layout ?? {}),
        };
      } else {
        startTransform = getElementTransform(scene, elementId);
      }

      setDragState({
        elementId,
        mode,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startTransform,
        overlayRect,
      });
      setDragging(true);
      selectElement(elementId);
    },
    [scene, selectedSceneIndex, setDragging, selectElement]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { startMouseX, startMouseY, startTransform, overlayRect, mode } =
        dragState;
      const deltaX = (e.clientX - startMouseX) / overlayRect.width;
      const deltaY = (e.clientY - startMouseY) / overlayRect.height;

      if (mode === "move") {
        let nx = startTransform.x + deltaX;
        let ny = startTransform.y + deltaY;
        nx = Math.max(0, Math.min(1, nx));
        ny = Math.max(0, Math.min(1, ny));

        const sx = snapToNearest(nx);
        const sy = snapToNearest(ny);
        nx = sx.value;
        ny = sy.value;

        const guides: GuideLine[] = [];
        if (sx.snapped) guides.push({ axis: "vertical", position: nx });
        if (sy.snapped) guides.push({ axis: "horizontal", position: ny });
        setActiveGuides(guides);

        applyTransform(dragState.elementId, { x: nx, y: ny });
      } else {
        // Resize: use signed average of deltas (drag right+down = grow).
        const scaleDelta = (deltaX + deltaY) * 1.2;
        const newScale = Math.max(
          0.1,
          Math.min(3, startTransform.scale + scaleDelta)
        );
        applyTransform(dragState.elementId, { scale: newScale });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
      setActiveGuides([]);
      setDragging(false);
    };

    function applyTransform(
      elementId: string,
      patch: Partial<ElementTransform>
    ) {
      if (selectedSceneIndex === null) return;
      if (elementId.startsWith("asset-")) {
        const assetId = elementId.replace("asset-", "");
        updateAssetTransform(selectedSceneIndex, assetId, patch);
      } else {
        updateElementTransform(selectedSceneIndex, elementId, patch);
      }
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    selectedSceneIndex,
    setDragging,
    updateAssetTransform,
    updateElementTransform,
  ]);

  // Drop handler for AssetPicker drag-source (Sprint 11A.3).
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (selectedSceneIndex === null) return;
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    let data: { url?: string; type?: string; source?: string } | null = null;
    try {
      data = JSON.parse(e.dataTransfer.getData("application/json"));
    } catch {
      return;
    }
    if (!data?.url) return;

    const dropX = (e.clientX - overlayRect.left) / overlayRect.width;
    const dropY = (e.clientY - overlayRect.top) / overlayRect.height;

    addAssetToScene(selectedSceneIndex, {
      id: `a${Date.now().toString(36)}`,
      type: (data.type as SceneAsset["type"]) ?? "icon",
      source:
        (data.source as SceneAsset["source"]) ?? "brand_library",
      url: data.url,
      layout: {
        ...DEFAULT_ELEMENT_TRANSFORM,
        x: Math.max(0, Math.min(1, dropX)),
        y: Math.max(0, Math.min(1, dropY)),
      },
    });
  };

  return (
    <div
      ref={overlayRef}
      onMouseDown={() => selectElement(null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="absolute inset-0"
      style={{ zIndex: 10 }}
    >
      {scene &&
        elements.map((el) => (
          <ElementBoundary
            key={el.id}
            element={el}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            isSelected={selectedElementId === el.id}
            isHovered={hoveredElementId === el.id}
            onMouseDown={(e, mode) => handleMouseDown(e, el.id, mode)}
            onMouseEnter={() => hoverElement(el.id)}
            onMouseLeave={() => hoverElement(null)}
          />
        ))}

      <AlignmentGuides guides={activeGuides} />

      {scene && elements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="text-center text-sm px-3 py-2 rounded-md"
            style={{
              background: "rgba(0,0,0,0.45)",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Lägg till text eller assets via höger panel
          </div>
        </div>
      )}
    </div>
  );
}

function ElementBoundary({
  element,
  frameWidth,
  frameHeight,
  isSelected,
  isHovered,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: {
  element: {
    id: string;
    layout: ElementTransform;
    label: string;
    kind: "text" | "asset";
  };
  frameWidth: number;
  frameHeight: number;
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent, mode: "move" | "resize") => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  // Boundary baseline is a fraction of the actual rendered frame so the
  // outline doesn't drift between aspect ratios.
  const baseWidthPct =
    element.kind === "asset" ? 0.18 : element.id === "line" ? 0.07 : 0.55;
  const baseHeightPct =
    element.kind === "asset" ? 0.18 : element.id === "line" ? 0.01 : 0.12;

  const w = baseWidthPct * frameWidth * element.layout.scale;
  const h = baseHeightPct * frameHeight * element.layout.scale;
  const ax = (element.layout.anchorX ?? 0.5) * 100;
  const ay = (element.layout.anchorY ?? 0.5) * 100;

  const outline = isSelected
    ? "2px solid #40BFA3"
    : isHovered
    ? "2px dashed rgba(64, 191, 163, 0.55)"
    : "1px dashed rgba(255,255,255,0.18)";

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, "move")}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute pointer-events-auto"
      style={{
        left: `${element.layout.x * 100}%`,
        top: `${element.layout.y * 100}%`,
        width: `${w}px`,
        height: `${h}px`,
        // translate3d hints GPU compositing so drag stays smooth.
        transform: `translate3d(${-ax}%, ${-ay}%, 0)`,
        outline,
        outlineOffset: "4px",
        cursor: "move",
        borderRadius: 4,
      }}
    >
      {isSelected && (
        <>
          <ResizeHandles
            onResizeStart={(e) => onMouseDown(e, "resize")}
          />
          <div
            className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-medium rounded pointer-events-none"
            style={{
              background: "#40BFA3",
              color: "#fff",
            }}
          >
            {element.label}
          </div>
        </>
      )}
    </div>
  );
}
