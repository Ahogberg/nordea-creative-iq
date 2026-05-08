// ── Heatmap prediction (Sprint 5 MVP) ──
//
// Rule-based attention prediction. Returns null when there's no visual to
// analyse (copy-only). Sprint 6+ swaps this for a vision-model pass on
// frame samples — the contract (HeatmapResult) is stable across both.

import type { HeatmapResult, FocusArea } from "./types";

interface HeatmapInput {
  image_url?: string;
  video_url?: string;
  has_logo?: boolean;
  has_cta?: boolean;
  has_headline?: boolean;
  layout_hint?: "centered" | "top-heavy" | "bottom-heavy";
}

export async function runHeatmapPrediction(
  creative: HeatmapInput
): Promise<HeatmapResult | null> {
  // No visual surface → skip; gate falls back to default 75 score
  if (!creative.image_url && !creative.video_url && !creative.has_headline) {
    return null;
  }

  const focus_areas: FocusArea[] = [];

  // Headline area is the visual centre by default
  focus_areas.push({
    x: 0.35,
    y: 0.4,
    width: 0.3,
    height: 0.2,
    intensity: 0.9,
    label: "Headline area",
  });

  if (creative.has_logo) {
    focus_areas.push({
      x: 0.4,
      y: 0.05,
      width: 0.2,
      height: 0.1,
      intensity: 0.6,
      label: "Logo",
    });
  }

  if (creative.has_cta) {
    focus_areas.push({
      x: 0.3,
      y: 0.75,
      width: 0.4,
      height: 0.12,
      intensity: 0.7,
      label: "CTA",
    });
  }

  const totalIntensity = focus_areas.reduce((sum, a) => sum + a.intensity, 0);
  const logo_intensity = focus_areas.find((a) => a.label === "Logo")?.intensity ?? 0;
  const cta_intensity = focus_areas.find((a) => a.label === "CTA")?.intensity ?? 0;

  const logo_attention_pct =
    totalIntensity > 0 ? Math.round((logo_intensity / totalIntensity) * 100) : 0;
  const cta_attention_pct =
    totalIntensity > 0 ? Math.round((cta_intensity / totalIntensity) * 100) : 0;

  let attention_score = 75;
  const warnings: string[] = [];

  if (creative.has_cta && cta_attention_pct < 15) {
    warnings.push("CTA får för lite uppmärksamhet — överväg större knapp eller bättre kontrast");
    attention_score -= 15;
  }

  if (creative.has_logo && logo_attention_pct > 0 && logo_attention_pct < 8) {
    warnings.push("Logo får för lite uppmärksamhet — överväg större logo");
    attention_score -= 5;
  }

  if (focus_areas.length > 5) {
    warnings.push("För många fokuspunkter — överväg att förenkla layouten");
    attention_score -= 10;
  }

  if (!creative.has_cta) {
    warnings.push("Ingen CTA detekterad — användaren vet inte vad nästa steg är");
    attention_score -= 8;
  }

  attention_score = Math.max(0, Math.min(100, attention_score));

  return {
    attention_score,
    focus_areas,
    primary_focus_label: focus_areas[0]?.label ?? "Center",
    logo_attention_pct,
    cta_attention_pct,
    warnings,
  };
}
