"use client";

import { Plus, Trash2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import type { Scene, TitleScene } from "@/lib/remotion/types";

const SCENE_TYPE_COLORS: Record<string, string> = {
  title: "#0000A0",
  counter: "#40BFA3",
  cta: "#C49327",
  "highlight-number": "#1FA084",
  "text-reveal": "#7C3AED",
  bars: "#3399FF",
  "icon-grid": "#40BFA3",
  split: "#C8575C",
  lottie: "#E2BD2C",
  canvas: "#6B7280",
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  title: "Titel",
  counter: "Räknare",
  cta: "CTA",
  "highlight-number": "Highlight",
  "text-reveal": "Text",
  bars: "Staplar",
  "icon-grid": "Ikoner",
  split: "Jämför",
  lottie: "Lottie",
  canvas: "Canvas",
};

export function Timeline() {
  const config = useStudioStore((s) => s.config);
  const selectedSceneIndex = useStudioStore((s) => s.selectedSceneIndex);
  const setSelectedScene = useStudioStore((s) => s.setSelectedScene);
  const addScene = useStudioStore((s) => s.addScene);
  const removeScene = useStudioStore((s) => s.removeScene);

  const totalDuration = config.scenes.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  );

  const handleAddScene = () => {
    const newScene: TitleScene = {
      type: "title",
      headline: "Ny scen",
      subtitle: "",
      alignment: "center",
      durationSeconds: 2.5,
    };
    addScene(newScene);
  };

  return (
    <div className="h-full px-6 py-3 flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-nordea-text-tertiary uppercase tracking-wider font-medium">
            Tidslinje
          </span>
          <span className="text-xs text-nordea-text-tertiary">
            {config.scenes.length} scener · {totalDuration.toFixed(1)}s
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddScene}
          className="nordea-btn nordea-btn-ghost nordea-btn-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Lägg till scen
        </button>
      </div>

      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto min-h-0">
        {config.scenes.map((scene, index) => {
          const duration = scene.durationSeconds || 2;
          const isSelected = selectedSceneIndex === index;
          const color = SCENE_TYPE_COLORS[scene.type] ?? "#6B7280";
          const minWidth = 80;

          return (
            <button
              type="button"
              key={index}
              onClick={() => setSelectedScene(index)}
              style={{
                flex: `${duration} 1 ${minWidth}px`,
                minWidth: `${minWidth}px`,
              }}
              className={`relative h-16 rounded-lg p-2 text-left transition-all overflow-hidden ${
                isSelected
                  ? "ring-2 ring-nordea-blue ring-offset-2 ring-offset-white"
                  : "hover:ring-1 hover:ring-nordea-blue/30"
              }`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: color }}
              />
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundColor: color }}
              />

              <div className="relative h-full flex flex-col justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-nordea-text-tertiary font-medium">
                    {SCENE_TYPE_LABELS[scene.type] ?? scene.type}
                  </div>
                  <div className="text-xs font-medium text-nordea-text truncate mt-0.5">
                    {getSceneLabel(scene)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-nordea-text-tertiary">
                    {duration.toFixed(1)}s
                  </span>
                  {isSelected && config.scenes.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Ta bort denna scen?")) {
                          removeScene(index);
                        }
                      }}
                      className="text-nordea-rose hover:text-nordea-rose/80"
                      aria-label="Ta bort scen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {config.scenes.length === 0 && (
          <button
            type="button"
            onClick={handleAddScene}
            className="flex-1 h-16 border-2 border-dashed border-nordea-border rounded-lg text-sm text-nordea-text-tertiary hover:text-nordea-text hover:border-nordea-border-emphasis transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Lägg till första scenen
          </button>
        )}
      </div>
    </div>
  );
}

function getSceneLabel(scene: Scene): string {
  switch (scene.type) {
    case "title":
      return scene.headline || "—";
    case "cta":
      return scene.headline || scene.buttonText || "—";
    case "counter":
      return scene.label || "—";
    case "highlight-number":
      return `${scene.number || "—"}${scene.label ? ` · ${scene.label}` : ""}`;
    case "text-reveal":
      return scene.lines[0] || "—";
    case "bars":
      return scene.title || "Stapeldiagram";
    case "icon-grid":
      return scene.title || "Ikonrutnät";
    case "split":
      return `${scene.leftLabel} vs ${scene.rightLabel}`;
    case "lottie":
      return scene.headline || "Lottie-animation";
    case "canvas":
      return scene.description || "Canvas-scen";
    default:
      return "—";
  }
}
