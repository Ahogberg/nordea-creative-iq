// ── Displayinnehåll ur en Motion Studio-video (mastern) ──
//
// Plockar budskapet, knappen, illustrationen och juridiken ur videons
// scener så att displaypaketet utgår från samma kreativa idé.

import type { CanvasScene, CtaScene, Scene, VideoConfig } from "@/lib/remotion/types";
import { FORMAT_PRESETS, safeInsets } from "@/lib/remotion/styles";
import type { DisplayContent, DisplayIllustration } from "./types";

const DEFAULT_CTA = "Läs mer";
const isHex = (v: string | undefined): v is string => !!v && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());

function headlineOf(s: Scene): { headline: string; subline?: string } | null {
  switch (s.type) {
    case "title":
      return s.headline ? { headline: s.headline, subline: s.subtitle } : null;
    case "canvas":
      return s.headline ? { headline: s.headline, subline: s.subtitle } : null;
    case "highlight-number":
      return { headline: `**${s.number}** ${s.label}`, subline: s.description };
    case "text-reveal":
      return s.lines.length ? { headline: s.lines.join(" ") } : null;
    case "lottie":
      return s.headline ? { headline: s.headline, subline: s.caption } : null;
    case "cta":
      return s.headline ? { headline: s.headline, subline: s.subtitle } : null;
    default:
      return null;
  }
}

/** Illustrationsytans höjd i designskala (1080 bred), som i CanvasScene. */
function illustrationDesignHeight(config: VideoConfig, scene: CanvasScene): number {
  const preset = FORMAT_PRESETS[config.format] ?? FORMAT_PRESETS.story;
  const s = preset.width / 1080;
  const safe = safeInsets(preset.width, preset.height, { showLogo: config.showLogo });
  const available = preset.height - safe.top - safe.bottom;
  const pct = Math.min(70, Math.max(20, scene.illustrationHeightPercent ?? 48));
  const px = Math.min((preset.height * pct) / 100, available * 0.62);
  return Math.round(px / s);
}

function illustrationOf(config: VideoConfig): DisplayIllustration | null {
  // Bara illustrationsscener (med rubrik): i helbildsscener ritar koden även
  // text och bakgrund, som inte går att flytta in i en banner.
  const scene = config.scenes.find(
    (s): s is CanvasScene => s.type === "canvas" && !!s.compiledJs && !s.compileError && !!s.headline
  );
  if (!scene?.compiledJs) return null;
  return {
    tsxCode: scene.tsxCode,
    compiledJs: scene.compiledJs,
    layers: scene.layers,
    // Nära slutet av scenen: allt har landat.
    atSeconds: Math.max(0, scene.durationSeconds * 0.9),
    designWidth: 1080,
    designHeight: illustrationDesignHeight(config, scene),
  };
}

export function displayContentFromVideo(config: VideoConfig): DisplayContent {
  // Illustrationsscenens rubrik först — den hör ihop med bilden.
  const illustrated = config.scenes.find((s): s is CanvasScene => s.type === "canvas" && !!s.headline && !!s.compiledJs);
  const message = (illustrated && headlineOf(illustrated)) ?? config.scenes.map(headlineOf).find(Boolean) ?? null;
  const cta = [...config.scenes].reverse().find((s): s is CtaScene => s.type === "cta");
  const firstBg = config.scenes[0]?.background;

  return {
    headline: message?.headline ?? config.title,
    subline: message?.subline,
    cta: cta?.buttonText?.trim() || DEFAULT_CTA,
    background: isHex(firstBg) ? firstBg : isHex(config.backgroundColor) ? config.backgroundColor : "#0000A0",
    headlineColor: config.headlineColor,
    illustration: illustrationOf(config),
    legal: config.legal
      ? { creditWarning: !!config.legal.creditWarning, riskNote: config.legal.riskNote }
      : undefined,
  };
}
