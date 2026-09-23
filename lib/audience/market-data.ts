// ── Marknadsstatistik för personorna ──
//
// Verifierade siffror (SCB, Finansinspektionen m.fl.) per kundsegment, med
// källa, år och länk per värde. Används till tre saker:
//  1. personornas underlag till AI:n — så att reaktionerna utgår från hur
//     segmentet faktiskt ser ut, inte bara från en handskriven profil
//  2. vikter i fokusgruppen — segmentets storlek i befolkningen
//  3. öppen redovisning i gränssnittet (källor syns)
//
// Viktigt: statistiken grundar VILKA personorna är. Hur de reagerar på en
// annons är fortfarande en simulering tills den kalibreras mot Nordeas egna
// kampanjresultat (se calibration.ts).

import raw from "./market-data.json";

export interface MarketFact {
  label: string;
  value: number;
  unit: string;
  scope: string;
  year: number | string;
  source: string;
  url: string;
  table_id?: string;
  note?: string;
}

export interface SegmentData {
  population?: MarketFact;
  facts: MarketFact[];
}

export interface MarketData {
  collected_at: string | null;
  sweden?: { adults_18plus?: MarketFact; population_total?: MarketFact };
  segments: Record<string, SegmentData>;
}

export const MARKET_DATA = raw as unknown as MarketData;

export function segmentData(personaId: string | undefined): SegmentData | undefined {
  return personaId ? MARKET_DATA.segments[personaId] : undefined;
}

const fmt = (n: number) => n.toLocaleString("sv-SE", { maximumFractionDigits: 1 });

export function formatFact(f: MarketFact): string {
  const value = f.unit === "%" ? `${fmt(f.value)} %` : `${fmt(f.value)} ${f.unit}`;
  return `${f.label}: ${value} (${f.scope}; ${f.source}, ${f.year})`;
}

/**
 * Faktablock till personans systemprompt. Tomt om segmentet saknar data.
 * AI:n instrueras att använda siffrorna som bakgrund och inte hitta på fler.
 */
export function marketFactsBlock(personaId: string | undefined): string {
  const seg = segmentData(personaId);
  if (!seg) return "";
  const lines = [seg.population, ...seg.facts].filter((f): f is MarketFact => !!f).map((f) => `- ${formatFact(f)}`);
  if (lines.length === 0) return "";
  return [
    "",
    "VERKLIG STATISTIK OM DITT SEGMENT (Sverige — använd som bakgrund för hur du lever och tänker; hitta inte på fler siffror):",
    ...lines,
  ].join("\n");
}

/**
 * Vikter för fokusgruppen: segmentets andel av befolkningen i de valda
 * segmentens åldersband. Segmenten överlappar i ålder — vikten beskriver
 * hur stor varje målgrupp är, inte en uppdelning av befolkningen.
 * Saknas data för något segment används lika vikter för alla.
 */
export function populationWeights(personaIds: string[]): { weights: Record<string, number>; source: string | null } {
  const pops = personaIds.map((id) => segmentData(id)?.population?.value ?? 0);
  if (personaIds.length === 0 || pops.some((p) => p <= 0)) {
    return { weights: Object.fromEntries(personaIds.map((id) => [id, 1 / Math.max(1, personaIds.length)])), source: null };
  }
  const total = pops.reduce((s, p) => s + p, 0);
  const sources = [
    ...new Set(
      personaIds.map((id) => {
        const p = segmentData(id)?.population;
        return p ? `${p.source}, ${p.year}` : "";
      })
    ),
  ].filter(Boolean);
  return {
    weights: Object.fromEntries(personaIds.map((id, i) => [id, pops[i] / total])),
    source: sources.join("; ") || null,
  };
}
