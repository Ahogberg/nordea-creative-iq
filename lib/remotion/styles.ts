// ── Remotion Design Tokens (adapted from nordea-motion) ──

export const colors = {
  nordeaBlue: "#0000A0",
  nordeaDark: "#000080",
  nordeaDeep: "#00005E",
  teal: "#40BFA3",
  white: "#FFFFFF",
  subtext: "rgba(255,255,255,0.85)",
  dimText: "rgba(255,255,255,0.75)",
  divider: "rgba(255,255,255,0.30)",
  barOld: "rgba(255,255,255,0.45)",
  barNew: "#40BFA3",
  peach: "#FFB4A2",
  accentRed: "#FC6161",
  accentYellow: "#FFE183",
} as const;

export const fonts = {
  headline: "'Nordea Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  body: "'Nordea Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
