// ── Säker yta för scenernas innehåll ──
//
// DynamicVideo räknar ut ytan (under loggan, ovanför nedre marginalen eller
// den juridiska texten) och delar den via context. Scenerna lägger text och
// grafik innanför; bakgrunder går fortfarande ut i kanten.

import { createContext, useContext } from "react";
import { useVideoConfig } from "remotion";
import { safeInsets, type SafeInsets } from "./styles";

export const SafeAreaContext = createContext<SafeInsets | null>(null);

/** Säker yta i px. Utan provider (t.ex. en scen som renderas ensam): standardvärden. */
export function useSafeArea(): SafeInsets {
  const ctx = useContext(SafeAreaContext);
  const { width, height } = useVideoConfig();
  return ctx ?? safeInsets(width, height);
}
