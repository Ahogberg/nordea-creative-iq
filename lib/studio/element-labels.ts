// Visningsnamn för flyttbara element på videon (id → svenska).
// Id:n är desamma som scenerna ger inlineElement/positionedElement.

import type { Scene } from "@/lib/remotion/types";

const ELEMENT_LABELS: Record<string, string> = {
  headline: "Rubrik",
  subtitle: "Underrubrik",
  title: "Rubrik",
  button: "Knapp",
  line: "Linje",
  label: "Etikett",
  value: "Siffra",
  description: "Beskrivning",
  caption: "Bildtext",
  illustration: "Illustration",
};

const ASSET_LABELS: Record<string, string> = {
  image: "Bild",
  illustration: "Illustration",
  icon: "Ikon",
  lottie: "Animation",
};

/** Lager i canvas-koden väljs som "layer:<id>". */
export const LAYER_PREFIX = "layer:";

export function elementLabel(scene: Scene | undefined, id: string): string {
  if (id.startsWith(LAYER_PREFIX)) {
    const layerId = id.slice(LAYER_PREFIX.length);
    const layer = scene?.type === "canvas" ? scene.layers?.find((l) => l.id === layerId) : undefined;
    return layer?.name ?? layerId;
  }
  if (id.startsWith("asset-")) {
    const asset = scene?.assets?.find((a) => `asset-${a.id}` === id);
    return asset ? ASSET_LABELS[asset.type] ?? "Bild" : "Bild";
  }
  return ELEMENT_LABELS[id] ?? id;
}
