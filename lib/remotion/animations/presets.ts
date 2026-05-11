import type { MotionConfig } from "../types";
import { DEFAULT_MOTION_CONFIG } from "../types";

/**
 * Curated "Nordea Motion Language" presets — pick one in the Motion-tab or
 * fork into custom mode. DEFAULT_MOTION_CONFIG (from ../types) is the same
 * payload as MOTION_PRESETS.nordea_standard so backward-compat fallbacks
 * resolve to a recognisable look.
 */
export const MOTION_PRESETS: Record<string, MotionConfig> = {
  // Default — varm men professionell. Speglar DEFAULT_MOTION_CONFIG.
  nordea_standard: DEFAULT_MOTION_CONFIG,

  // Energisk — snappy spring physics, för yngre målgrupper
  energetic: {
    logo: { reveal: "scale", duration: 14 },
    text: { stagger: "word", delayBetween: 2, useSpring: true },
    cta: { reveal: "spring", spring: "bouncy" },
    transitions: { style: "slide", duration: 10 },
    numbers: { enabled: true, duration: 35 },
  },

  // Lugn — för financial services / bolån
  calm: {
    logo: { reveal: "fade", duration: 24 },
    text: { stagger: "line", delayBetween: 8, useSpring: false },
    cta: { reveal: "fade", spring: "gentle" },
    transitions: { style: "crossfade", duration: 18 },
    numbers: { enabled: true, duration: 60 },
  },

  // Minimalistisk — rent och snabbt
  minimal: {
    logo: { reveal: "fade", duration: 12 },
    text: { stagger: "none", delayBetween: 0, useSpring: false },
    cta: { reveal: "fade", spring: "gentle" },
    transitions: { style: "cut", duration: 0 },
    numbers: { enabled: false, duration: 30 },
  },

  // Premium — lyx-känsla, för Premium-kortskampanjer
  premium: {
    logo: { reveal: "slide-down", duration: 20 },
    text: { stagger: "word", delayBetween: 4, useSpring: true },
    cta: { reveal: "scale", spring: "gentle" },
    transitions: { style: "blur", duration: 15 },
    numbers: { enabled: true, duration: 50 },
  },
};

export type MotionPresetKey = keyof typeof MOTION_PRESETS;

export function getPresetDescription(key: string): string {
  switch (key) {
    case "nordea_standard":
      return "Varm men professionell — default";
    case "energetic":
      return "Snappy spring physics, för yngre målgrupper";
    case "calm":
      return "Lugn fade, perfekt för bolån och sparande";
    case "minimal":
      return "Rent och snabbt, ingen stagger";
    case "premium":
      return "Lyxig blur-transition, för Premium-kort";
    default:
      return "";
  }
}

export { DEFAULT_MOTION_CONFIG };
