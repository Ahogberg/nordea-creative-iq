// ── Scentema: textfärger efter bakgrund ──
//
// Färgerna räknas ut i theme-colors.ts (rent); här finns React-kontexten som
// scenerna läser från, så att samma scen fungerar på blått och ljust.

import { createContext, useContext } from "react";
import { contrastRatio } from "./color";
import { DARK_BG_THEME, LIGHT_BG_THEME, themeColors, type SceneTheme } from "./theme-colors";

export { contrastRatio, DARK_BG_THEME, LIGHT_BG_THEME };
export type { SceneTheme };

/** Se themeColors i theme-colors.ts. */
export const themeFor = themeColors;

export const SceneThemeContext = createContext<SceneTheme>(DARK_BG_THEME);

export function useSceneTheme(): SceneTheme {
  return useContext(SceneThemeContext);
}
