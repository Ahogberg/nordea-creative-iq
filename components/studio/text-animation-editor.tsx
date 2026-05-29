"use client";

import { useStudioStore } from "@/lib/studio/store";
import type { Scene, TextAnimationStyle } from "@/lib/remotion/types";

interface AnimOption {
  id: TextAnimationStyle;
  label: string;
  description: string;
}

const ANIMATION_OPTIONS: AnimOption[] = [
  { id: "fade-up", label: "Fade Up", description: "Mjukt uppåt" },
  { id: "slide-in-left", label: "Slide Left", description: "Glid från vänster" },
  { id: "slide-in-right", label: "Slide Right", description: "Glid från höger" },
  { id: "mask-reveal", label: "Mask Reveal", description: "Maskat reveal" },
  { id: "stagger-word", label: "Stagger Word", description: "Ord för ord" },
  { id: "stagger-letter", label: "Stagger Letter", description: "Bokstav för bokstav" },
  { id: "typewriter", label: "Typewriter", description: "Skrivmaskin" },
];

interface Props {
  sceneIndex: number;
  scene: Scene;
}

// Per-scene text animation override. Default value (undefined) lets the
// scene use its existing StaggeredText (motion.text). Choosing a style
// here switches the scene's headline to the new AnimatedText component.
export function TextAnimationEditor({ sceneIndex, scene }: Props) {
  const updateScene = useStudioStore((s) => s.updateScene);
  const current = scene.textAnimation?.style;

  const apply = (style: TextAnimationStyle | undefined) => {
    updateScene(sceneIndex, {
      textAnimation: style
        ? {
            style,
            durationFrames: scene.textAnimation?.durationFrames ?? 30,
          }
        : undefined,
    } as Partial<Scene>);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => apply(undefined)}
        className={`w-full p-2 rounded-md text-left text-xs border transition-colors ${
          !current
            ? "bg-nordea-bg-hover border-nordea-blue/30 text-nordea-text"
            : "bg-white border-nordea-border text-nordea-text-secondary hover:bg-nordea-bg-hover"
        }`}
      >
        <div className="font-medium">Default (Motion-config)</div>
        <div className="text-[10px] text-nordea-text-tertiary mt-0.5">
          Använd globala motion-inställningar
        </div>
      </button>

      <div className="grid grid-cols-2 gap-1.5">
        {ANIMATION_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => apply(opt.id)}
            className={`p-2 rounded-md text-left text-xs border transition-colors ${
              current === opt.id
                ? "bg-nordea-teal/10 border-nordea-teal/40 text-nordea-text"
                : "bg-white border-nordea-border text-nordea-text-secondary hover:bg-nordea-bg-hover"
            }`}
          >
            <div className="font-medium">{opt.label}</div>
            <div className="text-[10px] text-nordea-text-tertiary mt-0.5">
              {opt.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
