// ── En Motion Studio-video som stimulus för fokusgruppen (server) ──
//
// Personorna får samma sak som en människa i flödet: bildrutor ur filmen i
// tidsordning plus ett manus med vad som står i varje scen och när.

import type Anthropic from "@anthropic-ai/sdk";
import type { Scene, VideoConfig } from "@/lib/remotion/types";
import { stripRichText } from "@/lib/remotion/rich-text";
import { compileCanvasScenes, stripCompiledCanvas } from "@/lib/remotion/compile";
import { renderPreviewFrames } from "@/lib/remotion/preview-frames";
import type { AdStimulus } from "./react";

const FORMAT_CHANNEL: Record<VideoConfig["format"], string> = {
  story: "Instagram/Facebook Stories eller Reels (9:16)",
  vertical: "Instagram/Facebook-flödet (4:5)",
  feed: "Instagram/Facebook-flödet (1:1)",
  landscape: "YouTube eller webb (16:9)",
};

function sceneText(s: Scene): string {
  const t = (v: string | undefined) => (v ? stripRichText(v) : "");
  switch (s.type) {
    case "title":
      return [t(s.headline), t(s.subtitle)].filter(Boolean).join(" — ");
    case "cta":
      return [t(s.headline), t(s.subtitle), s.buttonText ? `[knapp: ${s.buttonText}]` : ""].filter(Boolean).join(" — ");
    case "counter":
      return `${t(s.label)}: räknar till ${s.prefix ?? ""}${s.toValue}${s.suffix ?? ""}${s.description ? ` — ${t(s.description)}` : ""}`;
    case "highlight-number":
      return `${s.number} ${t(s.label)}${s.description ? ` — ${t(s.description)}` : ""}`;
    case "bars":
      return `${t(s.title)} (stapeldiagram: ${s.bars.map((b) => `${b.label} ${b.value}`).join(", ")})`;
    case "text-reveal":
      return s.lines.map(t).join(" / ");
    case "icon-grid":
      return `${t(s.title)}: ${s.items.map((i) => i.label).join(", ")}`;
    case "split":
      return `${s.leftLabel} ${s.leftValue} ${s.vsText ?? "vs"} ${s.rightLabel} ${s.rightValue}`;
    case "canvas":
      return [t(s.headline), t(s.subtitle), s.description ? `(bild: ${s.description})` : "(animerad illustration)"]
        .filter(Boolean)
        .join(" — ");
    case "lottie":
      return [t(s.headline), t(s.caption), "(animation)"].filter(Boolean).join(" — ");
    case "terms":
      return `Villkor: ${[t(s.heading), t(s.body)].filter(Boolean).join(" ")}`;
  }
}

/** Manus med tider, t.ex. "0,0–2,5 s: Drömhuset väntar — Räkna på ditt bolån". */
export function videoScript(config: VideoConfig): string {
  let start = 0;
  const lines = config.scenes.map((s) => {
    const end = start + s.durationSeconds;
    const line = `${start.toFixed(1).replace(".", ",")}–${end.toFixed(1).replace(".", ",")} s: ${sceneText(s)}`;
    start = end;
    return line;
  });
  if (config.legal?.creditWarning) lines.push("Varningsband nertill: Att låna kostar pengar!");
  if (config.legal?.riskNote) lines.push(`Riskrad nertill: ${config.legal.riskNote}`);
  return lines.join("\n");
}

/** Copy-fälten: första rubriken, mellanliggande text och sista CTA:n. */
function copyFrom(config: VideoConfig): AdStimulus["copy"] {
  const texts = config.scenes.map(sceneText).filter(Boolean);
  const cta = [...config.scenes].reverse().find((s): s is Extract<Scene, { type: "cta" }> => s.type === "cta");
  return {
    headline: texts[0] ?? config.title,
    body: texts.slice(1, cta ? -1 : undefined).join(" / "),
    cta: cta?.buttonText ?? "",
  };
}

export interface VideoStimulus {
  stimulus: AdStimulus;
  /** Antal bildrutor personorna ser (0 = bara manus). */
  frameCount: number;
}

/** Renderar bildrutor (om en renderare finns) och bygger stimulus för personorna. */
export async function videoStimulus(input: VideoConfig): Promise<VideoStimulus> {
  // Koden kompileras om på servern — klientens compiledJs körs aldrig här.
  const config = await compileCanvasScenes(stripCompiledCanvas(input));
  const frames = (await renderPreviewFrames(config)) ?? [];
  const images: Anthropic.ImageBlockParam[] = frames.map((f) => ({
    type: "image",
    source: { type: "base64", media_type: "image/jpeg", data: f.jpegBase64 },
  }));
  return {
    stimulus: {
      copy: copyFrom(config),
      channel: FORMAT_CHANNEL[config.format] ?? "sociala medier",
      images,
      isVideo: true,
      description: `${videoScript(config)}\nTotal längd: ${config.totalDurationSeconds.toFixed(1).replace(".", ",")} s, utan ljud.`,
    },
    frameCount: frames.length,
  };
}
