"use client";

// Lagerspår för den markerade canvas-scenen: ett spår per lager med dess
// keyframes. Dra en keyframe i tid, dra hela lagret, dubbelklicka för att
// lägga till en keyframe. Videon uppdateras direkt.

import { useRef } from "react";
import { useStudioStore } from "@/lib/studio/store";
import type { MotionLayer } from "@/lib/remotion/types";
import { keyframeTimes, round } from "@/lib/remotion/layers";
import { addKeyframeAt, moveKeyframeTime, removeKeyframesAt, shiftLayer } from "@/lib/studio/layer-edits";
import { useStudioPlayer, STUDIO_FPS } from "./player-context";

const SNAP = 0.05;
const snap = (t: number) => round(Math.round(t / SNAP) * SNAP);

// Varje drag räknas från lagret som det såg ut när draget började, så att
// man kan dra förbi andra keyframes utan att de påverkas på vägen.
type Drag =
  | { kind: "key"; layerId: string; original: MotionLayer; origin: number; current: number; startX: number }
  | { kind: "bar"; layerId: string; original: MotionLayer; applied: number; startX: number };

export function LayerTracks() {
  const config = useStudioStore((s) => s.config);
  const sceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const selected = useStudioStore((s) => s.selectedKeyframe);
  const selectKeyframe = useStudioStore((s) => s.selectKeyframe);
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const { frame, seekToSeconds, pause } = useStudioPlayer();
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const scene = sceneIndex !== null ? config.scenes[sceneIndex] : undefined;
  if (sceneIndex === null || !scene || scene.type !== "canvas" || !scene.layers?.length) return null;

  const layers = scene.layers;
  const duration = scene.durationSeconds;
  const sceneStart = config.scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.durationSeconds, 0);
  const localT = frame / STUDIO_FPS - sceneStart;
  const pct = (t: number) => `${Math.max(0, Math.min(1, t / duration)) * 100}%`;

  const timeFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return snap(Math.max(0, Math.min(duration, ((clientX - rect.left) / rect.width) * duration)));
  };
  const dtFromDx = (dx: number) => {
    const w = trackRef.current?.getBoundingClientRect().width ?? 1;
    return snap((dx / w) * duration);
  };

  const scrubTo = (t: number) => {
    pause();
    seekToSeconds(sceneStart + Math.min(t, duration - 1 / STUDIO_FPS));
  };

  const onKeyDown = (e: React.PointerEvent, layer: MotionLayer, t: number) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { kind: "key", layerId: layer.id, original: layer, current: t, origin: t, startX: e.clientX };
    selectKeyframe({ sceneIndex, layerId: layer.id, t });
    scrubTo(t);
  };

  const onBarDown = (e: React.PointerEvent, layer: MotionLayer) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { kind: "bar", layerId: layer.id, original: layer, applied: 0, startX: e.clientX };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dt = dtFromDx(e.clientX - d.startX);
    if (d.kind === "key") {
      const next = snap(Math.max(0, Math.min(duration, d.origin + dt)));
      if (next === d.current) return;
      updateLayer(sceneIndex, d.layerId, () => moveKeyframeTime(d.original, d.origin, next));
      d.current = next;
      selectKeyframe({ sceneIndex, layerId: d.layerId, t: next });
      scrubTo(next);
    } else if (dt !== d.applied) {
      updateLayer(sceneIndex, d.layerId, () => shiftLayer(d.original, dt, duration));
      d.applied = dt;
    }
  };

  const onUp = () => {
    drag.current = null;
  };

  const onDiamondKey = (e: React.KeyboardEvent, layer: MotionLayer, t: number) => {
    const step = e.shiftKey ? 0.25 : SNAP;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = snap(Math.max(0, Math.min(duration, t + (e.key === "ArrowRight" ? step : -step))));
      updateLayer(sceneIndex, layer.id, (l) => moveKeyframeTime(l, t, next));
      selectKeyframe({ sceneIndex, layerId: layer.id, t: next });
      scrubTo(next);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      updateLayer(sceneIndex, layer.id, (l) => removeKeyframesAt(l, t));
      selectKeyframe(null);
    }
  };

  const ticks = Array.from({ length: Math.floor(duration / 0.5) + 1 }, (_, i) => i * 0.5);

  return (
    <div className="flex-shrink-0 border-t border-nordea-border bg-white" onPointerMove={onMove} onPointerUp={onUp}>
      {/* Tidslinjal */}
      <div className="flex h-7 border-b border-nordea-hairline">
        <div className="w-36 flex-shrink-0 px-4 flex items-center text-[11px] font-medium text-nordea-text-tertiary">
          Lager · scen {sceneIndex + 1}
        </div>
        <div
          className="relative flex-1 mr-4 cursor-pointer"
          onPointerDown={(e) => scrubTo(timeFromClientX(e.clientX))}
        >
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 bottom-0 flex items-end pb-1" style={{ left: pct(t) }}>
              <div className={`w-px ${Number.isInteger(t) ? "h-2.5 bg-nordea-border-emphasis" : "h-1.5 bg-nordea-border"}`} />
              {Number.isInteger(t) && (
                <span className="absolute bottom-3 -translate-x-1/2 whitespace-nowrap text-[10px] tabular-nums text-nordea-text-faint">{t} s</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spår */}
      <div className="max-h-[132px] overflow-y-auto py-1">
        {layers.map((layer) => {
          const times = keyframeTimes(layer);
          const first = times[0] ?? 0;
          const lastT = times[times.length - 1] ?? 0;
          return (
            <div key={layer.id} className="flex h-8 items-center group">
              <div className="w-36 flex-shrink-0 px-4 truncate text-xs text-nordea-text" title={layer.id}>
                {layer.name}
              </div>
              <div
                ref={layer === layers[0] ? trackRef : undefined}
                className="relative flex-1 mr-4 h-full"
                onDoubleClick={(e) => {
                  const t = timeFromClientX(e.clientX);
                  updateLayer(sceneIndex, layer.id, (l) => addKeyframeAt(l, t));
                  selectKeyframe({ sceneIndex, layerId: layer.id, t });
                  scrubTo(t);
                }}
                title="Dubbelklicka för att lägga till en keyframe"
              >
                <div className="absolute inset-x-0 top-1/2 h-px bg-nordea-hairline" />
                {times.length > 1 && (
                  <div
                    onPointerDown={(e) => onBarDown(e, layer)}
                    className="absolute top-1/2 -translate-y-1/2 h-2.5 rounded-full bg-nordea-blue-soft hover:bg-nordea-blue/15 cursor-grab active:cursor-grabbing"
                    style={{ left: pct(first), width: `calc(${pct(lastT)} - ${pct(first)})` }}
                    title="Dra för att flytta hela rörelsen"
                  />
                )}
                {times.map((t, ti) => {
                  const isSel = selected?.sceneIndex === sceneIndex && selected.layerId === layer.id && Math.abs(selected.t - t) < 0.005;
                  return (
                    <button
                      // Index som nyckel: romben behåller sitt element (och
                      // pekarfångsten) medan den dras till nya tider.
                      key={`${layer.id}-${ti}`}
                      type="button"
                      onPointerDown={(e) => onKeyDown(e, layer, t)}
                      onKeyDown={(e) => onDiamondKey(e, layer, t)}
                      aria-label={`${layer.name} keyframe ${t.toFixed(2)} s`}
                      className={`absolute top-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rotate-45 rounded-[2px] border cursor-ew-resize outline-none focus-visible:ring-2 focus-visible:ring-nordea-blue/40 ${
                        isSel
                          ? "bg-nordea-blue border-nordea-blue scale-125"
                          : "bg-white border-nordea-blue hover:bg-nordea-blue-soft"
                      }`}
                      style={{ left: pct(t) }}
                    />
                  );
                })}
                {localT >= 0 && localT <= duration && (
                  <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-nordea-rose/70" style={{ left: pct(localT) }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
