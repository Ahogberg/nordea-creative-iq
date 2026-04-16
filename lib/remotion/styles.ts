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

// ── VIDEO DIMENSIONS ──
export const VIDEO_FPS = 30;
export const VIDEO_WIDTH = 1080;
export const VIDEO_HEIGHT = 1920;

// Format presets
export const FORMAT_PRESETS = {
  story: { width: 1080, height: 1920, label: "Story / Reel (9:16)" },
  feed: { width: 1080, height: 1080, label: "Feed (1:1)" },
  landscape: { width: 1920, height: 1080, label: "Landscape (16:9)" },
  vertical: { width: 1080, height: 1350, label: "Vertical (4:5)" },
} as const;

// ── SAFE AREA ──
export const safeArea = {
  top: 300,
  bottom: 300,
  left: 110,
  right: 110,
} as const;
