"use client";

// Inspektörens redigering av lager och keyframes i en canvas-scen.

import { Plus, Trash2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import type { CanvasScene, KeyframeEase, LayerProperty } from "@/lib/remotion/types";
import { LAYER_PROPERTIES, keyframeTimes, round, sampleLayer } from "@/lib/remotion/layers";
import { addKeyframeAt, easeAt, propsAt, removeKeyframesAt, setKeyframeEase, setKeyframeValue } from "@/lib/studio/layer-edits";
import { useStudioPlayer, STUDIO_FPS } from "./player-context";

const PROP_LABELS: Record<LayerProperty, { label: string; unit: string; step: number }> = {
  x: { label: "Förflyttning x", unit: "px", step: 10 },
  y: { label: "Förflyttning y", unit: "px", step: 10 },
  scale: { label: "Skala", unit: "×", step: 0.05 },
  rotation: { label: "Rotation", unit: "°", step: 5 },
  opacity: { label: "Opacitet", unit: "", step: 0.1 },
};

const EASES: Array<{ id: KeyframeEase; label: string }> = [
  { id: "ease-out", label: "Mjuk inbromsning" },
  { id: "ease-in-out", label: "Mjuk start och stopp" },
  { id: "ease-in", label: "Accelererar" },
  { id: "linear", label: "Jämn" },
];

export function KeyframeEditor({ scene, sceneIndex }: { scene: CanvasScene; sceneIndex: number }) {
  const selected = useStudioStore((s) => s.selectedKeyframe);
  const selectKeyframe = useStudioStore((s) => s.selectKeyframe);
  const updateLayer = useStudioStore((s) => s.updateLayer);
  const config = useStudioStore((s) => s.config);
  const { frame } = useStudioPlayer();

  const layers = scene.layers ?? [];
  const sceneStart = config.scenes.slice(0, sceneIndex).reduce((s, sc) => s + sc.durationSeconds, 0);
  const playheadT = round(Math.max(0, Math.min(scene.durationSeconds, frame / STUDIO_FPS - sceneStart)));

  const sel = selected?.sceneIndex === sceneIndex ? selected : null;
  const layer = sel ? layers.find((l) => l.id === sel.layerId) : undefined;
  const t = sel?.t ?? 0;
  const props = layer ? propsAt(layer, t) : [];
  const unused = layer ? LAYER_PROPERTIES.filter((p) => !props.includes(p)) : [];

  return (
    <div className="space-y-4">
      {layer && sel ? (
        <div className="rounded-lg border border-nordea-blue/20 bg-nordea-blue-soft/40 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-nordea-text">{layer.name}</div>
              <div className="text-[11px] text-nordea-text-tertiary tabular-nums">Keyframe vid {t.toFixed(2).replace(".", ",")} s</div>
            </div>
            <button
              type="button"
              onClick={() => {
                updateLayer(sceneIndex, layer.id, (l) => removeKeyframesAt(l, t));
                selectKeyframe(null);
              }}
              aria-label="Ta bort keyframe"
              className="p-1.5 rounded-md text-nordea-text-tertiary hover:text-nordea-rose hover:bg-nordea-rose-soft"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {props.map((p) => {
            const kf = layer.keyframes[p]?.find((k) => Math.abs(k.t - t) < 0.005);
            const meta = PROP_LABELS[p];
            return (
              <label key={p} className="flex items-center justify-between gap-3 text-xs text-nordea-text-secondary">
                <span>{meta.label}</span>
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step={meta.step}
                    value={kf?.v ?? 0}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v)) updateLayer(sceneIndex, layer.id, (l) => setKeyframeValue(l, p, t, v));
                    }}
                    className="nordea-input w-20 h-8 text-right tabular-nums"
                  />
                  <span className="w-4 text-nordea-text-faint">{meta.unit}</span>
                </span>
              </label>
            );
          })}

          <label className="flex items-center justify-between gap-3 text-xs text-nordea-text-secondary">
            <span>Kurva till nästa</span>
            <select
              value={easeAt(layer, t)}
              onChange={(e) => updateLayer(sceneIndex, layer.id, (l) => setKeyframeEase(l, t, e.target.value as KeyframeEase))}
              className="nordea-input h-8 text-xs"
            >
              {EASES.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>

          {unused.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {unused.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    updateLayer(sceneIndex, layer.id, (l) => setKeyframeValue(l, p, t, round(sampleLayer(l, t)[p], 3)))
                  }
                  className="inline-flex items-center gap-1 text-[11px] text-nordea-text-secondary border border-nordea-border rounded-full px-2 py-0.5 hover:border-nordea-blue/30 hover:text-nordea-blue"
                >
                  <Plus className="w-3 h-3" />
                  {PROP_LABELS[p].label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-nordea-text-tertiary">
          Klicka på en keyframe i lagerspåret för att ändra den. Dra den för att flytta i tid, dubbelklicka på ett spår för att lägga till en.
        </p>
      )}

      <div className="space-y-1.5">
        {layers.map((l) => (
          <div key={l.id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-nordea-text truncate">
              {l.name}
              <span className="text-nordea-text-faint"> · {keyframeTimes(l).length} keyframes</span>
            </span>
            <button
              type="button"
              onClick={() => {
                updateLayer(sceneIndex, l.id, (x) => addKeyframeAt(x, playheadT));
                selectKeyframe({ sceneIndex, layerId: l.id, t: playheadT });
              }}
              className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] text-nordea-blue hover:underline"
              title="Lägg till en keyframe där spelhuvudet står"
            >
              <Plus className="w-3 h-3" />
              Vid {playheadT.toFixed(1).replace(".", ",")} s
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
