// SCB (Statistics Sweden) demographic anchors for persona calibration.
//
// Static snapshots are embedded here so personas load instantly without
// a network call. The fetchLive* functions can be used in a background job
// to keep data fresh — call them from an admin route, not on the hot path.
//
// Sources:
//   SCB BO0104 — Homeownership by age
//   SCB HE0110 — Household income by age
//   SCB IT0104 — Internet/mobile bank usage by age
//   Riksbanken — Household debt-to-income ratio
//   Finansinspektionen — Bolåneundersökningen 2023

export interface DemographicAnchor {
  ageGroup: string;
  homeOwnershipRate: number;      // % som äger bostad
  avgHouseholdIncome: number;     // SEK/år (median)
  mobileBankingRate: number;      // % som använder mobilbank
  avgSavingsRate: number;         // % av inkomst som sparas
  avgMortgageAmount: number;      // SEK (median bolånebelopp, 0 om ej relevant)
  avgMonthlyRent: number;         // SEK/mån (för de som hyr)
  pensionSavingsRate: number;     // % som aktivt pensionssparar privat
}

// Statiska ankare baserade på SCB/Riksbanken 2022-2023
export const SCB_ANCHORS: Record<string, DemographicAnchor> = {
  // 19-25 år (Studenten)
  '19-25': {
    ageGroup: '19-25',
    homeOwnershipRate: 8,
    avgHouseholdIncome: 185_000,
    mobileBankingRate: 97,
    avgSavingsRate: 4,
    avgMortgageAmount: 0,
    avgMonthlyRent: 6_200,
    pensionSavingsRate: 12,
  },
  // 25-35 år (Förstagångsköpare)
  '25-35': {
    ageGroup: '25-35',
    homeOwnershipRate: 34,
    avgHouseholdIncome: 368_000,
    mobileBankingRate: 94,
    avgSavingsRate: 8,
    avgMortgageAmount: 2_450_000,
    avgMonthlyRent: 8_500,
    pensionSavingsRate: 28,
  },
  // 32-45 år (Familjeföräldern + Spararen)
  '32-45': {
    ageGroup: '32-45',
    homeOwnershipRate: 62,
    avgHouseholdIncome: 520_000,
    mobileBankingRate: 88,
    avgSavingsRate: 11,
    avgMortgageAmount: 3_100_000,
    avgMonthlyRent: 9_200,
    pensionSavingsRate: 41,
  },
  // 38-55 år (Företagaren)
  '38-55': {
    ageGroup: '38-55',
    homeOwnershipRate: 71,
    avgHouseholdIncome: 680_000,
    mobileBankingRate: 82,
    avgSavingsRate: 14,
    avgMortgageAmount: 3_600_000,
    avgMonthlyRent: 9_800,
    pensionSavingsRate: 55,
  },
  // 55-67 år (Pensionsspararen)
  '55-67': {
    ageGroup: '55-67',
    homeOwnershipRate: 78,
    avgHouseholdIncome: 490_000,
    mobileBankingRate: 68,
    avgSavingsRate: 16,
    avgMortgageAmount: 1_800_000,
    avgMonthlyRent: 8_800,
    pensionSavingsRate: 72,
  },
};

export function getAnchor(ageGroup: keyof typeof SCB_ANCHORS): DemographicAnchor {
  return SCB_ANCHORS[ageGroup];
}

// Formats a SEK amount for use in prompts: 2 450 000 → "2,4 miljoner kr"
export function formatSEK(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} miljoner kr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} tkr`;
  return `${amount} kr`;
}

// Fetches live homeownership data from SCB's open API.
// Returns null on network failure so callers can fall back to static anchors.
// Only call this server-side (API key not required — SCB is a public API).
export async function fetchLiveHomeOwnership(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(
      'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/BO/BO0104/BO0104D/BO0104T03',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: [{ code: 'Alder', selection: { filter: 'item', values: ['20-24', '25-29', '30-34', '35-44', '45-54', '55-64', '65-74'] } }],
          response: { format: 'json' },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { data: { key: string[]; values: string[] }[] };
    const result: Record<string, number> = {};
    for (const row of data.data) {
      result[row.key[0]] = parseFloat(row.values[0]);
    }
    return result;
  } catch {
    return null;
  }
}
