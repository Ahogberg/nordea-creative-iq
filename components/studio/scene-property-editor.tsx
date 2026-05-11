"use client";

import { useStudioStore } from "@/lib/studio/store";
import type {
  Scene,
  TitleScene,
  CounterScene,
  CtaScene,
  HighlightNumberScene,
  TextRevealScene,
} from "@/lib/remotion/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const TYPE_LABELS: Record<string, string> = {
  title: "Titel-scen",
  counter: "Räknar-scen",
  cta: "CTA-scen",
  "highlight-number": "Highlight-scen",
  "text-reveal": "Textavslöjande",
  bars: "Stapeldiagram",
  "icon-grid": "Ikonrutnät",
  split: "Jämförelse",
  lottie: "Lottie-animation",
  canvas: "Canvas",
};

interface Props {
  scene: Scene;
  index: number;
}

export function ScenePropertyEditor({ scene, index }: Props) {
  const updateScene = useStudioStore((s) => s.updateScene);

  return (
    <div className="space-y-3">
      <div className="text-xs text-nordea-text-tertiary uppercase tracking-wider font-medium">
        {TYPE_LABELS[scene.type] ?? "Scen"}
      </div>

      {/* Duration — every scene type uses durationSeconds */}
      <div>
        <Label className="text-xs">Längd</Label>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.1}
            value={scene.durationSeconds || 2}
            onChange={(e) =>
              updateScene(index, {
                durationSeconds: parseFloat(e.target.value),
              } as Partial<Scene>)
            }
            className="flex-1"
          />
          <span className="text-sm font-mono text-nordea-text-secondary min-w-[3rem] text-right">
            {(scene.durationSeconds || 2).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Type-specific fields */}
      {scene.type === "title" && (
        <TitleSceneFields scene={scene} index={index} />
      )}
      {scene.type === "counter" && (
        <CounterSceneFields scene={scene} index={index} />
      )}
      {scene.type === "cta" && <CtaSceneFields scene={scene} index={index} />}
      {scene.type === "highlight-number" && (
        <HighlightNumberFields scene={scene} index={index} />
      )}
      {scene.type === "text-reveal" && (
        <TextRevealFields scene={scene} index={index} />
      )}
      {["bars", "icon-grid", "split", "lottie", "canvas"].includes(
        scene.type
      ) && (
        <p className="text-xs text-nordea-text-tertiary py-2 italic">
          Egen editor för denna scen-typ kommer i 8b. Använd tidslinjen för att
          ta bort / byta typ tills vidare.
        </p>
      )}
    </div>
  );
}

function TitleSceneFields({
  scene,
  index,
}: {
  scene: TitleScene;
  index: number;
}) {
  const updateScene = useStudioStore((s) => s.updateScene);

  return (
    <>
      <div>
        <Label className="text-xs">Rubrik</Label>
        <Input
          value={scene.headline ?? ""}
          onChange={(e) =>
            updateScene(index, { headline: e.target.value } as Partial<Scene>)
          }
          placeholder="Skriv rubrik..."
          className="mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs">Underrubrik</Label>
        <Input
          value={scene.subtitle ?? ""}
          onChange={(e) =>
            updateScene(index, { subtitle: e.target.value } as Partial<Scene>)
          }
          placeholder="Underrubrik (valfri)..."
          className="mt-1.5"
        />
      </div>
    </>
  );
}

function CounterSceneFields({
  scene,
  index,
}: {
  scene: CounterScene;
  index: number;
}) {
  const updateScene = useStudioStore((s) => s.updateScene);

  return (
    <>
      <div>
        <Label className="text-xs">Etikett</Label>
        <Input
          value={scene.label ?? ""}
          onChange={(e) =>
            updateScene(index, { label: e.target.value } as Partial<Scene>)
          }
          placeholder="T.ex. 'Sparat'"
          className="mt-1.5"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Från</Label>
          <Input
            type="number"
            value={scene.fromValue ?? 0}
            onChange={(e) =>
              updateScene(index, {
                fromValue: parseFloat(e.target.value) || 0,
              } as Partial<Scene>)
            }
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs">Till</Label>
          <Input
            type="number"
            value={scene.toValue ?? 100}
            onChange={(e) =>
              updateScene(index, {
                toValue: parseFloat(e.target.value) || 0,
              } as Partial<Scene>)
            }
            className="mt-1.5"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Suffix</Label>
        <Input
          value={scene.suffix ?? ""}
          onChange={(e) =>
            updateScene(index, { suffix: e.target.value } as Partial<Scene>)
          }
          placeholder="T.ex. '%', 'kr', 'st'"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs">Beskrivning</Label>
        <Input
          value={scene.description ?? ""}
          onChange={(e) =>
            updateScene(index, {
              description: e.target.value,
            } as Partial<Scene>)
          }
          placeholder="Valfri beskrivning..."
          className="mt-1.5"
        />
      </div>
    </>
  );
}

function CtaSceneFields({ scene, index }: { scene: CtaScene; index: number }) {
  const updateScene = useStudioStore((s) => s.updateScene);

  return (
    <>
      <div>
        <Label className="text-xs">Rubrik</Label>
        <Input
          value={scene.headline ?? ""}
          onChange={(e) =>
            updateScene(index, { headline: e.target.value } as Partial<Scene>)
          }
          placeholder="T.ex. 'Räkna på ditt bolån'"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs">Knapptext</Label>
        <Input
          value={scene.buttonText ?? ""}
          onChange={(e) =>
            updateScene(index, {
              buttonText: e.target.value,
            } as Partial<Scene>)
          }
          placeholder="T.ex. 'KOM IGÅNG'"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs">Underrubrik</Label>
        <Input
          value={scene.subtitle ?? ""}
          onChange={(e) =>
            updateScene(index, { subtitle: e.target.value } as Partial<Scene>)
          }
          placeholder="Valfri..."
          className="mt-1.5"
        />
      </div>
    </>
  );
}

function HighlightNumberFields({
  scene,
  index,
}: {
  scene: HighlightNumberScene;
  index: number;
}) {
  const updateScene = useStudioStore((s) => s.updateScene);

  return (
    <>
      <div>
        <Label className="text-xs">Siffra</Label>
        <Input
          value={scene.number ?? ""}
          onChange={(e) =>
            updateScene(index, { number: e.target.value } as Partial<Scene>)
          }
          placeholder="T.ex. '4,5%' eller '1 miljon'"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs">Etikett</Label>
        <Input
          value={scene.label ?? ""}
          onChange={(e) =>
            updateScene(index, { label: e.target.value } as Partial<Scene>)
          }
          placeholder="T.ex. 'Snitträntan idag'"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label className="text-xs">Beskrivning</Label>
        <Input
          value={scene.description ?? ""}
          onChange={(e) =>
            updateScene(index, {
              description: e.target.value,
            } as Partial<Scene>)
          }
          placeholder="Valfri beskrivning..."
          className="mt-1.5"
        />
      </div>
    </>
  );
}

function TextRevealFields({
  scene,
  index,
}: {
  scene: TextRevealScene;
  index: number;
}) {
  const updateScene = useStudioStore((s) => s.updateScene);
  const linesText = scene.lines.join("\n");

  return (
    <>
      <div>
        <Label className="text-xs">Textrader (en per rad)</Label>
        <textarea
          value={linesText}
          onChange={(e) =>
            updateScene(index, {
              lines: e.target.value.split("\n"),
            } as Partial<Scene>)
          }
          placeholder="Första raden\nAndra raden\n..."
          rows={4}
          className="nordea-input w-full mt-1.5 py-2 resize-none"
        />
      </div>
      <div>
        <Label className="text-xs">Markerad text (valfri)</Label>
        <Input
          value={scene.highlight ?? ""}
          onChange={(e) =>
            updateScene(index, {
              highlight: e.target.value,
            } as Partial<Scene>)
          }
          placeholder="Ord som ska accent-färgas..."
          className="mt-1.5"
        />
      </div>
    </>
  );
}
