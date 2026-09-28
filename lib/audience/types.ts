// ── Svar från Motion Studios fokusgrupp (delas av API och klient) ──

import type { CompareSummary, PanelSummary, Spread } from "./aggregate";
import type { CalibrationStatus } from "./calibration";

export interface AudiencePersonaResult {
  id: string;
  name: string;
  avatar: string;
  /** Segmentets storlek med källa, om statistik finns. */
  population: string | null;
  wouldClick?: Spread;
  quote?: string;
  objections?: string[];
  suggestion?: string | null;
  firstNoticed?: string | null;
  dropOff?: string | null;
  error?: string;
}

export interface AudienceTestResponse {
  personas: AudiencePersonaResult[];
  summary: PanelSummary;
  weightSource: string | null;
  samples: number;
  /** Bildrutor personorna såg (0 = bara manus). */
  frameCount: number;
  calibration: CalibrationStatus;
}

export interface ComparePersonaResult {
  id: string;
  name: string;
  avatar: string;
  /** Andel av personans svar som valde B (0–1). */
  preferB?: number;
  votes?: { A: number; B: number; ingen: number };
  why?: string;
  error?: string;
}

export interface AudienceCompareResponse {
  personas: ComparePersonaResult[];
  summary: CompareSummary;
  weightSource: string | null;
  samples: number;
  calibration: CalibrationStatus;
}
