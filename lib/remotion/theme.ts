// ── Scentema: textfärger efter bakgrund ──
//
// Nordeas annonser går på blå bakgrund (vit text) eller ljus bakgrund —
// vit — där text och logotyp är Nordea Blue. Scenerna läser färger härifrån
// i stället för att hårdkoda vitt, så att samma scen fungerar på båda.

import { createContext, useContext } from "react";
import { colors } from "./styles";

export interface SceneTheme {
  isLight: boolean;
  /** Rubriker, siffror, logotyp. */
  text: string;
  /** Rubriker. Samma som `text` om ingen rubrikfärg är vald. */
  headline: string;
  /** Underrubriker, etiketter. */
  textSecondary: string;
  /** Diskret text, platshållare. */
  textMuted: string;
  /** Tunna linjer och avdelare. */
  hairline: string;
  /** Svaga ytor bakom ikoner o.d. */
  surface: string;
  /** Den "gamla"/jämförande stapeln i stapeldiagram. */
  barMuted: string;
}

export const DARK_BG_THEME: SceneTheme = {
  isLight: false,
  text: colors.white,
  headline: colors.white,
  textSecondary: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.5)",
  hairline: "rgba(255,255,255,0.22)",
  surface: "rgba(255,255,255,0.08)",
  barMuted: "rgba(255,255,255,0.45)",
};

export const LIGHT_BG_THEME: SceneTheme = {
  isLight: true,
  text: colors.nordeaBlue,
  headline: colors.nordeaBlue,
  textSecondary: "rgba(0,0,160,0.75)",
  textMuted: "rgba(0,0,160,0.55)",
  hairline: "rgba(0,0,160,0.18)",
  surface: "rgba(0,0,160,0.06)",
  barMuted: "rgba(0,0,160,0.25)",
};

/** Relativ luminans för #RGB/#RRGGBB. Null om färgen inte går att tolka. */
function luminance(hex: string): number | null {
  const m = hex.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG-kontrast mellan två hex-färger. Null om någon inte går att tolka. */
export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Stor rubriktext räcker med 3:1 (WCAG för stor text).
const MIN_HEADLINE_CONTRAST = 3;

/**
 * Ljus bakgrund (vit m.fl.) → blå text; allt annat (inkl. bilder) → vit text.
 * `headlineColor` (t.ex. persika på blått) används bara om kontrasten mot
 * bakgrunden räcker — annars faller rubriken tillbaka på textfärgen, så att
 * en persika rubrikfärg inte försvinner på en persika scen.
 */
export function themeFor(background?: string, headlineColor?: string): SceneTheme {
  const l = background ? luminance(background) : null;
  const base = l !== null && l > 0.5 ? LIGHT_BG_THEME : DARK_BG_THEME;
  if (!headlineColor || luminance(headlineColor) === null) return base;
  // Bild eller okänd bakgrund: lita på rubrikfärgen.
  const ratio = background ? contrastRatio(headlineColor, background) : null;
  if (ratio !== null && ratio < MIN_HEADLINE_CONTRAST) return base;
  return { ...base, headline: headlineColor };
}

export const SceneThemeContext = createContext<SceneTheme>(DARK_BG_THEME);

export function useSceneTheme(): SceneTheme {
  return useContext(SceneThemeContext);
}
