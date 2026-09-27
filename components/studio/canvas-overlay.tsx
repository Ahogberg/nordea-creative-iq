"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useStudioStore } from "@/lib/studio/store";
import {
  DEFAULT_ELEMENT_TRANSFORM,
  type ElementTransform,
  type MotionLayer,
  type Scene,
  type SceneAsset,
} from "@/lib/remotion/types";
import { FORMAT_PRESETS } from "@/lib/remotion/styles";
import { offsetLayer, scaleLayer } from "@/lib/studio/layer-edits";
import { elementLabel, LAYER_PREFIX } from "@/lib/studio/element-labels";
import { ResizeHandles } from "./resize-handles";
import { AlignmentGuides, type GuideLine } from "./alignment-guides";
import { useOptionalStudioPlayer } from "./player-context";

// Genomskinligt lager ovanpå Remotion-spelaren: markera, flytta och ändra
// storlek på det som syns i videon.
//
// Rutorna mäts i spelarens DOM i stället för att gissas — scenerna märker sina
// element med data-element (text, knapp, illustration, bilder) och canvas-koden
// sina lager med data-layer. Bara scenen som syns just nu går att ta tag i.
//
// Text och knappar flyttas med scenens elementTransforms. Första gången något
// i en scen flyttas låses alla scenens element på sina nuvarande platser, så
// att resten inte hoppar när ett element lyfts ur layouten. Canvas-lager
// flyttas genom att hela lagrets x/y-keyframes förskjuts — rörelsen behålls.

type Kind = "element" | "asset" | "layer";

interface Box {
  id: string; // "headline", "asset-<id>", "layer:<id>"
  kind: Kind;
  sceneIndex: number;
  x: number; // px i överlägget
  y: number;
  w: number;
  h: number;
  /** Lager: skärm-px per enhet i lagrets keyframes. */
  pxPerUnit?: number;
}

interface DragState {
  box: Box;
  mode: "move" | "resize";
  startMouseX: number;
  startMouseY: number;
  overlayRect: DOMRect;
  startTransform: ElementTransform;
  startLayer?: MotionLayer;
  /** Resize: avståndet från mittpunkten när greppet började. */
  startDistance: number;
  center: { x: number; y: number };
}

const SNAP_POINTS = [0, 0.25, 0.5, 0.75, 1];
const SNAP_TOLERANCE = 0.02;

function snapToNearest(value: number): { value: number; snapped: boolean } {
  for (const p of SNAP_POINTS) {
    if (Math.abs(value - p) < SNAP_TOLERANCE) return { value: p, snapped: true };
  }
  return { value, snapped: false };
}

/** Lagrets koordinater (designskala 1080) → skärm-px, via SVG-föräldern. */
function layerPxPerUnit(g: SVGGElement, compositionWidth: number, frameWidth: number): number {
  const layerScale = compositionWidth / 1080;
  const parent = g.parentNode instanceof SVGGraphicsElement ? g.parentNode : null;
  const ctm = parent?.getScreenCTM();
  const fromCtm = ctm ? Math.hypot(ctm.a, ctm.b) * layerScale : 0;
  return fromCtm > 0 ? fromCtm : frameWidth / 1080;
}

function measure(root: HTMLElement, overlay: DOMRect, compositionWidth: number): Box[] {
  const boxes: Box[] = [];
  root.querySelectorAll<HTMLElement>("[data-scene]").forEach((sceneEl) => {
    const sceneIndex = Number(sceneEl.dataset.scene);
    const push = (el: Element, id: string, kind: Kind, pxPerUnit?: number) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      boxes.push({
        id,
        kind,
        sceneIndex,
        x: r.left - overlay.left,
        y: r.top - overlay.top,
        w: r.width,
        h: r.height,
        pxPerUnit,
      });
    };
    sceneEl.querySelectorAll<HTMLElement>("[data-element]").forEach((el) => {
      const id = el.dataset.element!;
      push(el, id, id.startsWith("asset-") ? "asset" : "element");
    });
    sceneEl.querySelectorAll<SVGGElement>("g[data-layer]").forEach((g) => {
      push(g, `${LAYER_PREFIX}${g.dataset.layer}`, "layer", layerPxPerUnit(g, compositionWidth, overlay.width));
    });
  });
  return boxes;
}

const sameBoxes = (a: Box[], b: Box[]) =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.id === b[i].id &&
      x.sceneIndex === b[i].sceneIndex &&
      Math.abs(x.x - b[i].x) < 0.5 &&
      Math.abs(x.y - b[i].y) < 0.5 &&
      Math.abs(x.w - b[i].w) < 0.5 &&
      Math.abs(x.h - b[i].h) < 0.5
  );

function currentTransform(scene: Scene, box: Box): ElementTransform | undefined {
  if (box.kind === "asset") {
    const asset = scene.assets?.find((a) => `asset-${a.id}` === box.id);
    return asset ? { ...DEFAULT_ELEMENT_TRANSFORM, ...asset.layout } : undefined;
  }
  const t = scene.elementTransforms?.[box.id];
  return t ? { ...DEFAULT_ELEMENT_TRANSFORM, ...t } : undefined;
}

/** Elementets nuvarande plats som transform (mittpunkt + bredd). */
function pinFromBox(box: Box, overlay: DOMRect): ElementTransform {
  return {
    ...DEFAULT_ELEMENT_TRANSFORM,
    x: (box.x + box.w / 2) / overlay.width,
    y: (box.y + box.h / 2) / overlay.height,
    // +1 %: exakt uppmätt bredd avrundas ibland under textens egen bredd,
    // och då bryts en rad till. Omslaget är centrerat, så lite luft syns inte.
    width: Math.min(1, box.w / overlay.width + 0.01),
  };
}

export function CanvasOverlay() {
  const config = useStudioStore((s) => s.config);
  const selectedElementId = useStudioStore((s) => s.selectedElementId);
  const hoveredElementId = useStudioStore((s) => s.hoveredElementId);
  const hoverElement = useStudioStore((s) => s.hoverElement);
  const addAssetToScene = useStudioStore((s) => s.addAssetToScene);
  const setDragging = useStudioStore((s) => s.setDragging);
  const player = useOptionalStudioPlayer();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);
  const compositionWidth = (FORMAT_PRESETS[config.format] ?? FORMAT_PRESETS.story).width;

  // Mät om varje bildruta — texten animeras in, och elementet man drar i
  // följer med när spelaren ritar om med nya värden.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const overlay = overlayRef.current;
      const root = overlay?.parentElement;
      if (overlay && root) {
        const next = measure(root, overlay.getBoundingClientRect(), compositionWidth);
        setBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [compositionWidth]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, box: Box, mode: "move" | "resize") => {
      e.stopPropagation();
      const overlayRect = overlayRef.current?.getBoundingClientRect();
      const state = useStudioStore.getState();
      const scene = state.config.scenes[box.sceneIndex];
      if (!overlayRect || !scene) return;

      // Pekarfångst: pointermove/up kommer även om muspekaren lämnar fönstret.
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      player?.pause();

      if (state.selectedSceneIndex !== box.sceneIndex) state.setSelectedScene(box.sceneIndex);

      let startTransform = currentTransform(scene, box) ?? pinFromBox(box, overlayRect);
      let startLayer: MotionLayer | undefined;
      if (box.kind === "layer") {
        const layerId = box.id.slice(LAYER_PREFIX.length);
        startLayer =
          (scene.type === "canvas" ? scene.layers?.find((l) => l.id === layerId) : undefined) ??
          { id: layerId, name: layerId, keyframes: {} };
      } else if (box.kind === "element" && !scene.elementTransforms?.[box.id]) {
        // Lås scenens alla element där de ligger innan det här lyfts ur layouten.
        const pins: Record<string, ElementTransform> = {};
        for (const b of boxes) {
          if (b.sceneIndex === box.sceneIndex && b.kind === "element" && !scene.elementTransforms?.[b.id]) {
            pins[b.id] = pinFromBox(b, overlayRect);
          }
        }
        state.pinElements(box.sceneIndex, pins);
        startTransform = pins[box.id] ?? startTransform;
      }

      const center = { x: overlayRect.left + box.x + box.w / 2, y: overlayRect.top + box.y + box.h / 2 };
      setDragState({
        box,
        mode,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        overlayRect,
        startTransform,
        startLayer,
        startDistance: Math.max(8, Math.hypot(e.clientX - center.x, e.clientY - center.y)),
        center,
      });
      setDragging(true);
      state.selectElement(box.id);
    },
    [boxes, player, setDragging]
  );

  useEffect(() => {
    if (!dragState) return;
    const { box, mode, startMouseX, startMouseY, overlayRect, startTransform, startLayer } = dragState;
    const store = useStudioStore.getState;

    const handlePointerMove = (e: PointerEvent) => {
      const dxPx = e.clientX - startMouseX;
      const dyPx = e.clientY - startMouseY;

      if (mode === "resize") {
        const factor = Math.hypot(e.clientX - dragState.center.x, e.clientY - dragState.center.y) / dragState.startDistance;
        if (box.kind === "layer" && startLayer) {
          store().putLayer(box.sceneIndex, scaleLayer(startLayer, Math.max(0.1, Math.min(5, factor))));
        } else {
          apply({ scale: Math.max(0.1, Math.min(3, startTransform.scale * factor)) });
        }
        return;
      }

      if (box.kind === "layer" && startLayer) {
        const unit = box.pxPerUnit ?? overlayRect.width / 1080;
        store().putLayer(box.sceneIndex, offsetLayer(startLayer, dxPx / unit, dyPx / unit));
        return;
      }

      const sx = snapToNearest(Math.max(0, Math.min(1, startTransform.x + dxPx / overlayRect.width)));
      const sy = snapToNearest(Math.max(0, Math.min(1, startTransform.y + dyPx / overlayRect.height)));
      const guides: GuideLine[] = [];
      if (sx.snapped) guides.push({ axis: "vertical", position: sx.value });
      if (sy.snapped) guides.push({ axis: "horizontal", position: sy.value });
      setActiveGuides(guides);
      apply({ x: sx.value, y: sy.value });
    };

    function apply(patch: Partial<ElementTransform>) {
      if (box.kind === "asset") {
        store().updateAssetTransform(box.sceneIndex, box.id.replace("asset-", ""), patch);
      } else {
        store().updateElementTransform(box.sceneIndex, box.id, { ...startTransform, ...patch });
      }
    }

    const handlePointerUp = () => {
      setDragState(null);
      setActiveGuides([]);
      setDragging(false);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      // Avmonteras mitt i en dragning ska isDragging inte fastna.
      setDragging(false);
    };
  }, [dragState, setDragging]);

  // Släpp från bildbiblioteket (AssetPicker) på scenen som syns.
  const visibleScene = boxes[0]?.sceneIndex ?? useStudioStore.getState().selectedSceneIndex;
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (visibleScene === null || visibleScene === undefined) return;
    const overlayRect = overlayRef.current?.getBoundingClientRect();
    if (!overlayRect) return;
    let data: { url?: string; type?: string; source?: string } | null = null;
    try {
      data = JSON.parse(e.dataTransfer.getData("application/json"));
    } catch {
      return;
    }
    if (!data?.url) return;
    addAssetToScene(visibleScene, {
      id: `a${Date.now().toString(36)}`,
      type: (data.type as SceneAsset["type"]) ?? "icon",
      source: (data.source as SceneAsset["source"]) ?? "brand_library",
      url: data.url,
      layout: {
        ...DEFAULT_ELEMENT_TRANSFORM,
        x: Math.max(0, Math.min(1, (e.clientX - overlayRect.left) / overlayRect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - overlayRect.top) / overlayRect.height)),
      },
    });
  };

  // Lager ritas ovanpå texten i listan så att små lager går att ta tag i
  // även när de ligger inom illustrationsytan.
  const ordered = [...boxes].sort((a, b) => rank(a) - rank(b) || b.w * b.h - a.w * a.h);

  return (
    // pointer-events-none på roten: spelarens egna kontroller får klicken.
    // Rutorna och släppytan slår på pekarhändelser där de behövs.
    <div ref={overlayRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      <div
        className="absolute inset-0 pointer-events-auto"
        style={{ zIndex: 0 }}
        onPointerDown={() => useStudioStore.getState().selectElement(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      />

      {ordered.map((box) => (
        <ElementBoundary
          key={`${box.sceneIndex}-${box.id}`}
          box={box}
          label={elementLabel(config.scenes[box.sceneIndex], box.id)}
          isSelected={selectedElementId === box.id}
          isHovered={hoveredElementId === box.id}
          onPointerDown={(e, mode) => handlePointerDown(e, box, mode)}
          onMouseEnter={() => hoverElement(box.id)}
          onMouseLeave={() => hoverElement(null)}
        />
      ))}

      <AlignmentGuides guides={activeGuides} />
    </div>
  );
}

const rank = (b: Box) => (b.kind === "element" && b.id === "illustration" ? 0 : b.kind === "layer" ? 2 : 1);

function ElementBoundary({
  box,
  label,
  isSelected,
  isHovered,
  onPointerDown,
  onMouseEnter,
  onMouseLeave,
}: {
  box: Box;
  label: string;
  isSelected: boolean;
  isHovered: boolean;
  onPointerDown: (e: React.PointerEvent, mode: "move" | "resize") => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const outline = isSelected
    ? "2px solid #40BFA3"
    : isHovered
    ? "2px dashed rgba(64, 191, 163, 0.75)"
    : "1px dashed rgba(255,255,255,0.22)";

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, "move")}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute pointer-events-auto"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        outline,
        outlineOffset: "3px",
        cursor: "move",
        borderRadius: 4,
        zIndex: isSelected ? 3 : 1 + rank(box) / 10,
      }}
    >
      {(isSelected || isHovered) && (
        <div
          className="absolute -top-6 left-0 px-1.5 py-0.5 text-[10px] font-medium rounded pointer-events-none whitespace-nowrap"
          style={{ background: "#40BFA3", color: "#fff" }}
        >
          {label}
        </div>
      )}
      {isSelected && <ResizeHandles onResizeStart={(e) => onPointerDown(e, "resize")} />}
    </div>
  );
}
