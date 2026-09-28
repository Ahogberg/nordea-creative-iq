// ── Remotion Design Tokens — derived from the single source of truth ──
import {
  NORDEA_COLORS,
  NORDEA_FONT_FAMILIES,
  NORDEA_DISPLAY_PALETTE,
} from "@/lib/nordea-brand-guidelines";

export const colors = {
  nordeaBlue: NORDEA_COLORS.primary.blue.hex,
  nordeaDark: NORDEA_COLORS.primary.deepBlue.hex,
  nordeaDeep: NORDEA_COLORS.primary.deepBlue.hex,
  vividBlue: NORDEA_COLORS.primary.vividBlue.hex,
  mediumBlue: NORDEA_COLORS.primary.mediumBlue.hex,
  lightBlue: NORDEA_COLORS.primary.lightBlue.hex,
  teal: NORDEA_COLORS.accent.green.hex,
  white: "#FFFFFF",
  subtext: NORDEA_DISPLAY_PALETTE.textOnBlueSecondary,
  dimText: NORDEA_DISPLAY_PALETTE.textOnBlueSecondary,
  divider: "rgba(255,255,255,0.30)",
  barOld: "rgba(255,255,255,0.45)",
  barNew: NORDEA_COLORS.accent.green.hex,
  peach: NORDEA_COLORS.pink.medium.hex,
  accentRed: NORDEA_COLORS.accent.red.hex,
  accentYellow: NORDEA_COLORS.accent.yellow.hex,
} as const;

export const fonts = {
  headline: NORDEA_FONT_FAMILIES.large.cssFamily,
  body: NORDEA_FONT_FAMILIES.small.cssFamily,
} as const;

/**
 * Rubriker behöver mer tyngd i stående format: samma pixelstorlek som i
 * 16:9 blir liten på en telefonskärm. 9:16 → ×1,35, 4:5 → ×1,2.
 */
export function headlineScale(width: number, height: number): number {
  const ratio = height / width;
  if (ratio >= 1.6) return 1.35;
  if (ratio >= 1.2) return 1.2;
  return 1;
}

// ── VIDEO DIMENSIONS ──
export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

// Format presets (HD baseline, 1080-wide design canvas)
export const FORMAT_PRESETS = {
  story: { width: 1080, height: 1920, label: "Story / Reel (9:16)" },
  feed: { width: 1080, height: 1080, label: "Feed (1:1)" },
  landscape: { width: 1920, height: 1080, label: "Landscape (16:9)" },
  vertical: { width: 1080, height: 1350, label: "Vertical (4:5)" },
} as const;

export type QualityTier = "hd" | "4k";

// 4K = 2x HD preset. Scenes are laid out against the HD width so the preview
// stays identical; we just upscale the render composition for sharper output.
export function getDimensions(
  format: keyof typeof FORMAT_PRESETS,
  quality: QualityTier = "hd"
): { width: number; height: number } {
  const preset = FORMAT_PRESETS[format] || FORMAT_PRESETS.story;
  const multiplier = quality === "4k" ? 2 : 1;
  return {
    width: preset.width * multiplier,
    height: preset.height * multiplier,
  };
}

// ── LOGGA ──
// Uppmätt i Nordeas annonser (brand-reference/, 18 videor): ordmärkets bredd
// i andel av bildbredden och glyfernas överkant i andel av bildhöjden.
// Huvudklustret per format; 16:9 saknar underlag och är härlett ur 1:1.
export const LOGO_ASPECT = 567 / 118; // public/images/nordea-logo-neg.png, tight bbox
export const LOGO_LAYOUT: Record<keyof typeof FORMAT_PRESETS, { widthPct: number; topPct: number }> = {
  story: { widthPct: 0.285, topPct: 0.157 },
  vertical: { widthPct: 0.289, topPct: 0.048 },
  feed: { widthPct: 0.231, topPct: 0.059 },
  landscape: { widthPct: 0.13, topPct: 0.059 },
};

function formatFor(width: number, height: number): keyof typeof FORMAT_PRESETS {
  const r = height / width;
  if (r >= 1.6) return "story";
  if (r >= 1.15) return "vertical";
  if (r >= 0.8) return "feed";
  return "landscape";
}

/** Loggans storlek och läge i px för en bildyta. `bottom` = underkant. */
export function logoBox(width: number, height: number) {
  const { widthPct, topPct } = LOGO_LAYOUT[formatFor(width, height)];
  const w = width * widthPct;
  const top = height * topPct;
  return { width: w, top, bottom: top + w / LOGO_ASPECT };
}

/** Där innehållet under loggan kan börja (px): loggans underkant + luft. */
export function contentTop(width: number, height: number): number {
  return logoBox(width, height).bottom + height * 0.03;
}

// Fri marginal nertill, i andel av bildhöjden. 9:16: annonserna håller nedre
// ca 20 % tomt (där ligger appens gränssnitt i stories/reels). Övriga format:
// annonsernas lägsta text ligger runt 92 % av höjden.
const BOTTOM_SAFE: Record<keyof typeof FORMAT_PRESETS, number> = {
  story: 0.2,
  vertical: 0.06,
  feed: 0.06,
  landscape: 0.06,
};

export interface SafeInsets {
  /** Fri yta överst (px) — loggan plus luft. */
  top: number;
  /** Fri yta nertill (px) — formatets marginal eller juridisk text. */
  bottom: number;
}

/**
 * Säker yta för scenernas innehåll: under loggan och ovanför formatets
 * nedre marginal eller den juridiska texten (det som ligger högst).
 */
export function safeInsets(
  width: number,
  height: number,
  opts: { showLogo?: boolean; legalReserve?: number } = {}
): SafeInsets {
  const top = opts.showLogo === false ? height * 0.06 : contentTop(width, height);
  const legal = opts.legalReserve ? opts.legalReserve + height * 0.02 : 0;
  const bottom = Math.max(BOTTOM_SAFE[formatFor(width, height)] * height, legal);
  return { top: Math.round(top), bottom: Math.round(bottom) };
}

// ── SAFE AREA ──
export const safeArea = {
  top: 300,
  bottom: 300,
  left: 110,
  right: 110,
} as const;
