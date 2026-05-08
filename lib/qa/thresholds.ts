// ── QA Gate thresholds & rules ──
//
// Code-level source of truth for Sprint 5. The qa_thresholds DB table is
// reserved for future per-product overrides without redeploys; for now,
// reading these constants is the single path.

import type { ProductCategory } from "../product-detection";
import type { ComplianceSeverity } from "./types";

export const DEFAULT_THRESHOLDS = {
  pass: 80,
  warn: 70,
  weights: {
    persona: 0.35,
    tov: 0.2,
    compliance: 0.3,
    heatmap: 0.15,
  },
};

/** Score below this blocks export. Same as warn threshold; kept as a named
 *  constant so the UI can reference it without depending on the warn value. */
export const EXPORT_BLOCK_THRESHOLD = 70;

// ── Persona jury weights ──
//
// Keys are persona IDs from lib/persona-library.ts. We weight only the four
// core personas; `foretagaren` and `studenten` are added with a small weight
// for product types where they're relevant (business, general).

const CORE_PERSONA_IDS = [
  "forstagangskopare",
  "spararen",
  "familjeforaldern",
  "pensionsspararen",
] as const;

export type CorePersonaId = (typeof CORE_PERSONA_IDS)[number];

export function getCorePersonaIds(): readonly CorePersonaId[] {
  return CORE_PERSONA_IDS;
}

/**
 * Per-product weights for persona scores. Lookups fall back to an even split
 * across the four core personas if the category isn't explicitly mapped.
 */
export function getPersonaWeights(
  productType: ProductCategory = "general"
): Record<string, number> {
  switch (productType) {
    case "mortgage":
      return {
        forstagangskopare: 0.4,
        familjeforaldern: 0.3,
        spararen: 0.2,
        pensionsspararen: 0.1,
      };
    case "savings":
      return {
        spararen: 0.4,
        pensionsspararen: 0.3,
        familjeforaldern: 0.2,
        forstagangskopare: 0.1,
      };
    case "loans":
      return {
        forstagangskopare: 0.4,
        familjeforaldern: 0.3,
        spararen: 0.2,
        pensionsspararen: 0.1,
      };
    case "pension":
      return {
        pensionsspararen: 0.5,
        spararen: 0.25,
        familjeforaldern: 0.15,
        forstagangskopare: 0.1,
      };
    case "insurance":
      return {
        familjeforaldern: 0.4,
        pensionsspararen: 0.3,
        spararen: 0.2,
        forstagangskopare: 0.1,
      };
    case "cards":
      return {
        forstagangskopare: 0.3,
        familjeforaldern: 0.3,
        spararen: 0.25,
        pensionsspararen: 0.15,
      };
    case "business":
      // Business is the one category where foretagaren matters; we still
      // sample a couple of consumer personas so brand-tone reads survive.
      return {
        foretagaren: 0.6,
        spararen: 0.2,
        familjeforaldern: 0.2,
      };
    case "general":
    default:
      return {
        forstagangskopare: 0.25,
        spararen: 0.25,
        familjeforaldern: 0.25,
        pensionsspararen: 0.25,
      };
  }
}

// ── Compliance rules ──

export interface ComplianceRule {
  id: string;
  label: string;
  severity: ComplianceSeverity;
  paragraph?: string;
}

const SHARED_RULES: ComplianceRule[] = [
  { id: "wcag_contrast", label: "WCAG kontrast (≥4.5:1)", severity: "warning", paragraph: "WCAG 2.1 AA" },
  { id: "logo_present", label: "Logo närvarande", severity: "blocking" },
  { id: "subtitles_present", label: "Captions för video (>15s)", severity: "warning", paragraph: "WCAG 2.1 AA" },
];

export const COMPLIANCE_RULES: Record<ProductCategory, ComplianceRule[]> = {
  general: SHARED_RULES,

  mortgage: [
    { id: "effective_interest_rate", label: "Effektiv ränta visas", severity: "blocking", paragraph: "§ 6.2.1 Konsumentkreditlagen" },
    { id: "amortization_info", label: "Amorteringskrav nämns", severity: "warning", paragraph: "FFFS 2016:16" },
    { id: "disclaimer_time", label: "Tid för disclaimer (≥2s i video)", severity: "warning", paragraph: "FI MarkF" },
    ...SHARED_RULES,
  ],

  savings: [
    { id: "risk_warning", label: "Riskvarning närvarande", severity: "blocking", paragraph: "FFFS 2008:11" },
    { id: "past_performance_disclaimer", label: "Historisk avkastning-varning", severity: "blocking", paragraph: "FFFS 2017:2" },
    ...SHARED_RULES,
  ],

  loans: [
    { id: "effective_interest_rate", label: "Effektiv ränta visas", severity: "blocking", paragraph: "§ 6.2.1 Konsumentkreditlagen" },
    { id: "total_cost", label: "Total kostnad nämns", severity: "blocking", paragraph: "§ 6.2.1 Konsumentkreditlagen" },
    ...SHARED_RULES,
  ],

  pension: [
    { id: "risk_warning", label: "Riskvarning närvarande", severity: "blocking", paragraph: "FFFS 2008:11" },
    { id: "past_performance_disclaimer", label: "Historisk avkastning-varning", severity: "warning", paragraph: "FFFS 2017:2" },
    ...SHARED_RULES,
  ],

  insurance: [
    { id: "coverage_terms", label: "Försäkringsvillkor refereras", severity: "warning", paragraph: "FFFS 2018:10" },
    ...SHARED_RULES,
  ],

  cards: [
    { id: "interest_rate", label: "Ränta visas (om kredit)", severity: "blocking", paragraph: "§ 6.2.1 Konsumentkreditlagen" },
    { id: "annual_fee", label: "Årsavgift visas", severity: "warning" },
    ...SHARED_RULES,
  ],

  business: SHARED_RULES,
};
