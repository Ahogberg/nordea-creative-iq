// ── Scentema: textfärger efter bakgrund (rent, utan React) ──
//
// Nordeas annonser går på blå bakgrund (vit text) eller ljus bakgrund —
// vit — där text och logotyp är Nordea Blue. Används av renderaren
// (via theme.ts), displaybanners och HTML5-banners.

import { colors } from "./styles";
import { contrastRatio, luminance } from "./color";

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

// Stor rubriktext räcker med 3:1 (WCAG för stor text).
const MIN_HEADLINE_CONTRAST = 3;

/**
 * Ljus bakgrund (vit m.fl.) → blå text; allt annat (inkl. bilder) → vit text.
 * `headlineColor` (t.ex. persika på blått) används bara om kontrasten mot
 * bakgrunden räcker — annars faller rubriken tillbaka på textfärgen, så att
 * en persika rubrikfärg inte försvinner på en persika scen.
 */
export function themeColors(background?: string, headlineColor?: string): SceneTheme {
  const l = background ? luminance(background) : null;
  const base = l !== null && l > 0.5 ? LIGHT_BG_THEME : DARK_BG_THEME;
  if (!headlineColor || luminance(headlineColor) === null) return base;
  // Bild eller okänd bakgrund: lita på rubrikfärgen.
  const ratio = background ? contrastRatio(headlineColor, background) : null;
  if (ratio !== null && ratio < MIN_HEADLINE_CONTRAST) return base;
  return { ...base, headline: headlineColor };
}
