"use client";

// Scenkort längst ned i Motion Studio. Bredden speglar scenens längd, ett
// klick markerar scenen och spolar dit, spelhuvudet följer uppspelningen.

import { Plus, Trash2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import type { Scene, TitleScene } from "@/lib/remotion/types";
import { sceneHeadline, sceneName } from "@/lib/studio/describe-changes";
import { useStudioPlayer, STUDIO_FPS } from "./player-context";

// Diskreta typfärger — accentlinje överst på kortet.
const TYPE_ACCENT: Partial<Record<Scene["type"], string>> = {
  canvas: "#3D9BF5",
  title: "#0000A0",
  "text-reveal": "#0000A0",
  terms: "#00005E",
  cta: "#40BFA3",
};

export function SceneStrip() {
  const scenes = useStudioStore((s) => s.config.scenes);
  const selected = useStudioStore((s) => s.selectedSceneIndex);
  const setSelectedScene = useStudioStore((s) => s.setSelectedScene);
  const addScene = useStudioStore((s) => s.addScene);
  const removeScene = useStudioStore((s) => s.removeScene);
  const setInspectorTab = useStudioStore((s) => s.setInspectorTab);
  const { frame, seekToSeconds } = useStudioPlayer();

  const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((sum, s) => sum + (s.durationSeconds || 0), 0));
  // Spelhuvudet ritas i kortet som spelas, på rätt andel av kortets bredd.
  const t = frame / STUDIO_FPS;
  const playingIndex = scenes.findIndex((s, i) => t >= starts[i] && t < starts[i] + (s.durationSeconds || 0));
  const localProgress =
    playingIndex >= 0 ? (t - starts[playingIndex]) / (scenes[playingIndex].durationSeconds || 1) : 0;

  const handleAdd = () => {
    const scene: TitleScene = { type: "title", headline: "Ny scen", durationSeconds: 2.5, alignment: "center" };
    addScene(scene);
    setInspectorTab("scene");
  };

  return (
    <div className="h-[104px] flex-shrink-0 border-t border-nordea-border bg-white px-4 py-3 flex gap-2">
      <div className="flex-1 min-w-0 flex gap-2">
        {scenes.map((scene, i) => {
          const isSelected = selected === i;
          const accent = TYPE_ACCENT[scene.type] ?? "#9CA3AF";
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedScene(i);
                seekToSeconds(starts[i]);
              }}
              onDoubleClick={() => setInspectorTab("scene")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedScene(i);
                  seekToSeconds(starts[i]);
                }
              }}
              style={{ flex: `${scene.durationSeconds || 1} 1 0`, minWidth: 96 }}
              className={`group relative rounded-lg border bg-white px-3 py-2 text-left cursor-pointer overflow-hidden outline-none transition-all focus-visible:ring-2 focus-visible:ring-nordea-blue ${
                isSelected
                  ? "border-nordea-blue shadow-[0_0_0_3px_rgba(0,0,160,0.10)]"
                  : "border-nordea-border hover:border-nordea-border-emphasis"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accent }} />
              {playingIndex === i && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-nordea-blue/70"
                  style={{ left: `${localProgress * 100}%` }}
                />
              )}
              <div className="flex items-center justify-between gap-2 text-[11px] text-nordea-text-tertiary">
                <span className="truncate">
                  <span className="tabular-nums">{i + 1}</span> · {sceneName(scene)}
                </span>
                <span className="tabular-nums flex-shrink-0">{(scene.durationSeconds || 0).toFixed(1).replace(".", ",")} s</span>
              </div>
              <div className="mt-1 text-[13px] font-medium text-nordea-text leading-snug line-clamp-2">
                {sceneHeadline(scene) || "—"}
              </div>
              {isSelected && scenes.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Ta bort denna scen?")) removeScene(i);
                  }}
                  aria-label="Ta bort scen"
                  className="absolute bottom-1.5 right-1.5 p-1 rounded text-nordea-text-faint hover:text-nordea-rose hover:bg-nordea-rose-soft"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        aria-label="Lägg till scen"
        title="Lägg till scen"
        className="w-11 flex-shrink-0 rounded-lg border border-dashed border-nordea-border-emphasis text-nordea-text-tertiary hover:text-nordea-blue hover:border-nordea-blue/40 hover:bg-nordea-bg-hover flex items-center justify-center transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
