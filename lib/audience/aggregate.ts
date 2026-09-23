// ── Sammanställning av fokusgruppens svar (ren — används av server och klient) ──

export interface Spread {
  mean: number;
  min: number;
  max: number;
  /** Standardavvikelse mellan upprepade svar från samma persona. */
  sd: number;
  n: number;
}

export function summarize(values: number[]): Spread {
  const n = values.length;
  if (n === 0) return { mean: 0, min: 0, max: 0, sd: 0, n: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const sd = n > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)) : 0;
  return { mean: Math.round(mean), min: Math.min(...values), max: Math.max(...values), sd: Math.round(sd), n };
}

export interface PanelEntry {
  personaId: string;
  wouldClick: Spread;
}

export interface PanelSummary {
  /** Viktat efter segmentvikter (t.ex. befolkningsstorlek). */
  weighted: number;
  /** Rakt snitt över personorna. */
  unweighted: number;
  /** Personor vars snitt är minst 50. */
  clickers: number;
  responded: number;
  /** Största spridningen hos någon persona — hur osäker panelen är. */
  maxSd: number;
}

export function aggregatePanel(entries: PanelEntry[], weights: Record<string, number>): PanelSummary {
  const responded = entries.length;
  if (responded === 0) return { weighted: 0, unweighted: 0, clickers: 0, responded: 0, maxSd: 0 };
  const wSum = entries.reduce((s, e) => s + (weights[e.personaId] ?? 0), 0);
  const weighted =
    wSum > 0
      ? entries.reduce((s, e) => s + e.wouldClick.mean * (weights[e.personaId] ?? 0), 0) / wSum
      : entries.reduce((s, e) => s + e.wouldClick.mean, 0) / responded;
  return {
    weighted: Math.round(weighted),
    unweighted: Math.round(entries.reduce((s, e) => s + e.wouldClick.mean, 0) / responded),
    clickers: entries.filter((e) => e.wouldClick.mean >= 50).length,
    responded,
    maxSd: Math.max(...entries.map((e) => e.wouldClick.sd)),
  };
}

export interface CompareEntry {
  personaId: string;
  /** Andel av upprepade svar som föredrog B (0–1). "ingen" räknas som 0,5. */
  preferB: number;
  n: number;
}

export interface CompareSummary {
  /** Viktad andel som föredrar B, 0–100. */
  weightedPreferB: number;
  /** Segment som föredrar A respektive B (> 0,5). */
  segmentsA: number;
  segmentsB: number;
  responded: number;
}

export function aggregateCompare(entries: CompareEntry[], weights: Record<string, number>): CompareSummary {
  const wSum = entries.reduce((s, e) => s + (weights[e.personaId] ?? 0), 0);
  const weighted =
    wSum > 0
      ? entries.reduce((s, e) => s + e.preferB * (weights[e.personaId] ?? 0), 0) / wSum
      : entries.reduce((s, e) => s + e.preferB, 0) / Math.max(1, entries.length);
  return {
    weightedPreferB: Math.round(weighted * 100),
    segmentsA: entries.filter((e) => e.preferB < 0.5).length,
    segmentsB: entries.filter((e) => e.preferB > 0.5).length,
    responded: entries.length,
  };
}
