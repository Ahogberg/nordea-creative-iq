"use client";

import { useStudioStore } from "@/lib/studio/store";
import {
  DEFAULT_ELEMENT_TRANSFORM,
  type ElementTransform,
  type SceneAsset,
} from "@/lib/remotion/types";
import { Move, Maximize2, Layers, Trash2, X } from "lucide-react";

// Sprint 11A.5: numerisk styrning + z-order för element som är valt i canvas.
// Synkar mot store i båda riktningarna — dra i canvas uppdaterar dessa
// fields direkt, och vice versa.
export function SelectedElementPanel() {
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const selectedElementId = useStudioStore((s) => s.selectedElementId);
  const config = useStudioStore((s) => s.config);
  const updateElementTransform = useStudioStore(
    (s) => s.updateElementTransform
  );
  const updateAssetTransform = useStudioStore((s) => s.updateAssetTransform);
  const removeAssetFromScene = useStudioStore((s) => s.removeAssetFromScene);
  const selectElement = useStudioStore((s) => s.selectElement);

  if (selectedSceneIndex === null || !selectedElementId) return null;
  const scene = config.scenes[selectedSceneIndex];
  if (!scene) return null;

  const isAsset = selectedElementId.startsWith("asset-");
  let layout: ElementTransform;
  let asset: SceneAsset | undefined;

  if (isAsset) {
    const assetId = selectedElementId.replace("asset-", "");
    asset = scene.assets?.find((a) => a.id === assetId);
    if (!asset) return null;
    layout = { ...DEFAULT_ELEMENT_TRANSFORM, ...asset.layout };
  } else {
    layout = {
      ...DEFAULT_ELEMENT_TRANSFORM,
      ...(scene.elementTransforms?.[selectedElementId] ?? {}),
    };
  }

  const patch = (next: Partial<ElementTransform>) => {
    if (isAsset && asset) {
      updateAssetTransform(selectedSceneIndex, asset.id, next);
    } else {
      updateElementTransform(selectedSceneIndex, selectedElementId, next);
    }
  };

  const handleRemove = () => {
    if (isAsset && asset) {
      removeAssetFromScene(selectedSceneIndex, asset.id);
      selectElement(null);
    }
  };

  const adjustZ = (delta: number) => {
    patch({ z: (layout.z ?? 0) + delta });
  };

  return (
    <div className="bg-white border border-nordea-teal/30 rounded-lg p-3 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-nordea-teal">
            Valt: {isAsset ? asset?.type ?? "asset" : selectedElementId}
          </span>
        </div>
        <button
          type="button"
          onClick={() => selectElement(null)}
          className="text-nordea-text-tertiary hover:text-nordea-text"
          title="Avmarkera"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Position */}
      <div>
        <div className="flex items-center gap-1 text-[10px] text-nordea-text-tertiary uppercase tracking-wider mb-1.5">
          <Move className="w-3 h-3" />
          Position
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="X"
            value={layout.x}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patch({ x: v })}
          />
          <NumberField
            label="Y"
            value={layout.y}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => patch({ y: v })}
          />
        </div>
      </div>

      {/* Scale */}
      <div>
        <div className="flex items-center gap-1 text-[10px] text-nordea-text-tertiary uppercase tracking-wider mb-1.5">
          <Maximize2 className="w-3 h-3" />
          Skala
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.05}
            value={layout.scale}
            onChange={(e) => patch({ scale: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <span className="text-xs font-mono text-nordea-text-secondary min-w-[2.5rem] text-right">
            {layout.scale.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Z-order */}
      <div>
        <div className="flex items-center gap-1 text-[10px] text-nordea-text-tertiary uppercase tracking-wider mb-1.5">
          <Layers className="w-3 h-3" />
          Lager (z = {layout.z ?? 0})
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => adjustZ(-1)}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm flex-1"
          >
            Bakåt
          </button>
          <button
            type="button"
            onClick={() => adjustZ(+1)}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm flex-1"
          >
            Framåt
          </button>
        </div>
      </div>

      {/* Reset / Remove */}
      <div className="flex gap-1.5 pt-1 border-t border-nordea-hairline">
        <button
          type="button"
          onClick={() =>
            patch({
              x: 0.5,
              y: 0.5,
              scale: 1,
              z: 0,
              anchorX: 0.5,
              anchorY: 0.5,
            })
          }
          className="nordea-btn nordea-btn-ghost nordea-btn-sm flex-1"
        >
          Återställ
        </button>
        {isAsset && (
          <button
            type="button"
            onClick={handleRemove}
            className="nordea-btn nordea-btn-destructive nordea-btn-sm"
            title="Ta bort asset"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] text-nordea-text-tertiary">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value.toFixed(2)}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
        }}
        className="w-full mt-0.5 px-2 py-1 text-xs font-mono bg-white border border-nordea-border rounded focus:outline-none focus:border-nordea-blue/40"
      />
    </label>
  );
}
