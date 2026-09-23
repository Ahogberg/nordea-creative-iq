// Korta etiketter för vad som ändrades mellan två VideoConfig — visas under
// AI:ns svar i chatten ("+ Illustration", "Rubrik scen 2" …).

import type { Scene, VideoConfig } from "@/lib/remotion/types";
import { stripRichText } from "@/lib/remotion/rich-text";

const SCENE_NAMES: Record<Scene["type"], string> = {
  title: "Titel",
  counter: "Räknare",
  bars: "Staplar",
  "text-reveal": "Text",
  "icon-grid": "Ikoner",
  cta: "CTA",
  split: "Jämförelse",
  "highlight-number": "Siffra",
  lottie: "Animation",
  canvas: "Illustration",
  terms: "Villkor",
};

const FORMAT_NAMES: Record<VideoConfig["format"], string> = {
  story: "9:16",
  feed: "1:1",
  landscape: "16:9",
  vertical: "4:5",
};

export function sceneName(scene: Scene): string {
  return SCENE_NAMES[scene.type] ?? scene.type;
}

/** Scenens huvudtext utan markup, för etiketter och tidslinje. */
export function sceneHeadline(scene: Scene): string {
  const raw = (() => {
    switch (scene.type) {
      case "title":
      case "cta":
        return scene.headline;
      case "canvas":
        return scene.headline ?? scene.description ?? "";
      case "lottie":
        return scene.headline ?? "";
      case "text-reveal":
        return scene.lines[0] ?? "";
      case "terms":
        return scene.heading ?? scene.body;
      case "counter":
        return scene.label;
      case "highlight-number":
        return `${scene.number} ${scene.label}`;
      case "bars":
        return scene.title ?? "";
      case "icon-grid":
        return scene.title;
      case "split":
        return `${scene.leftLabel} / ${scene.rightLabel}`;
      default:
        return "";
    }
  })();
  return stripRichText(raw).replace(/\s+/g, " ").trim();
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function describeChanges(prev: VideoConfig, next: VideoConfig): string[] {
  const out: string[] = [];

  if (prev.format !== next.format) out.push(`Format ${FORMAT_NAMES[next.format]}`);
  if (prev.backgroundColor !== next.backgroundColor) out.push("Bakgrund");
  if (prev.headlineColor !== next.headlineColor) out.push("Rubrikfärg");
  if (!same(prev.legal, next.legal)) {
    if (next.legal?.creditWarning && !prev.legal?.creditWarning) out.push("+ Varningsband");
    else if (next.legal?.riskNote && !prev.legal?.riskNote) out.push("+ Riskrad");
    else out.push("Juridisk text");
  }
  if (!same(prev.motion, next.motion)) out.push("Rörelse");

  const max = Math.max(prev.scenes.length, next.scenes.length);
  for (let i = 0; i < max; i++) {
    const a = prev.scenes[i];
    const b = next.scenes[i];
    if (!a && b) {
      out.push(`+ ${sceneName(b)}`);
      continue;
    }
    if (a && !b) {
      out.push(`− ${sceneName(a)}`);
      continue;
    }
    if (!a || !b || same(a, b)) continue;
    if (a.type !== b.type) {
      out.push(`Scen ${i + 1}: ${sceneName(b)}`);
      continue;
    }
    if (a.type === "canvas" && b.type === "canvas" && a.tsxCode !== b.tsxCode) {
      out.push(`Animation scen ${i + 1}`);
    }
    if (sceneHeadline(a) !== sceneHeadline(b)) out.push(`Text scen ${i + 1}`);
    else if (a.durationSeconds !== b.durationSeconds) out.push(`Längd scen ${i + 1}`);
    else if (!(a.type === "canvas" && b.type === "canvas" && a.tsxCode !== b.tsxCode)) {
      out.push(`Scen ${i + 1}`);
    }
  }

  // Dubbletter bort, högst sex etiketter.
  return [...new Set(out)].slice(0, 6);
}
