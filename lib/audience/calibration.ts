// ── Kalibrering mot Nordeas verkliga kampanjresultat ──
//
// Fokusgruppens siffror är AI:ns bedömning. För att veta hur mycket de säger
// behöver de jämföras med utfall: fyll calibration.json med kampanjer där både
// en simulering och ett verkligt resultat (CTR, VTR …) finns. När det finns
// tillräckligt många par visar gränssnittet hur väl simuleringen rangordnar
// annonserna; innan dess märks resultaten som okalibrerade.

import raw from "./calibration.json";

export interface CalibrationEntry {
  /** Annonsens namn eller fil i brand-reference/manifest.csv. */
  ad: string;
  channel: string;
  date: string;
  /** Panelens viktade klickvilja (0–100) när annonsen testades. */
  simulated: number;
  /** Verkligt utfall, t.ex. CTR i procent. */
  actual: number;
  metric: "ctr" | "vtr" | "conversion";
  source: string;
}

interface CalibrationFile {
  entries: CalibrationEntry[];
}

const DATA = raw as unknown as CalibrationFile;

/** Antal par som krävs innan en korrelation visas. */
export const MIN_CALIBRATION_PAIRS = 8;

/** Spearmans rangkorrelation — rangordnar simuleringen annonserna rätt? */
function spearman(xs: number[], ys: number[]): number {
  const rank = (v: number[]) => {
    const sorted = v.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(v.length);
    for (let i = 0; i < sorted.length; ) {
      let j = i;
      while (j + 1 < sorted.length && sorted[j + 1][0] === sorted[i][0]) j++;
      for (let k = i; k <= j; k++) r[sorted[k][1]] = (i + j) / 2 + 1;
      i = j + 1;
    }
    return r;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : 0;
}

export interface CalibrationStatus {
  pairs: number;
  /** Rangkorrelation mellan simulering och utfall, eller null om för få par. */
  correlation: number | null;
  label: string;
}

export function calibrationStatus(): CalibrationStatus {
  const entries = (DATA.entries ?? []).filter((e) => Number.isFinite(e.simulated) && Number.isFinite(e.actual));
  const pairs = entries.length;
  if (pairs < MIN_CALIBRATION_PAIRS) {
    return {
      pairs,
      correlation: null,
      label:
        pairs === 0
          ? "Okalibrerad — inga kampanjresultat inlagda än"
          : `Okalibrerad — ${pairs} av ${MIN_CALIBRATION_PAIRS} kampanjresultat inlagda`,
    };
  }
  const r = spearman(
    entries.map((e) => e.simulated),
    entries.map((e) => e.actual)
  );
  const rounded = Math.round(r * 100) / 100;
  return {
    pairs,
    correlation: rounded,
    label: `Kalibrerad mot ${pairs} kampanjer · rangkorrelation ${rounded.toFixed(2).replace(".", ",")}`,
  };
}
