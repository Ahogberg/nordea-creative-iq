// ── QA-poängsättning (ren) ──
//
// Viktar de fyra delresultaten till en totalpoäng, sätter status och samlar
// åtgärder. Utbruten ur gate.ts så att reglerna kan testas utan AI-anrop.
//   fail = blockerande compliance-fel ELLER total < warn-tröskeln
//   warn = under pass-tröskeln men inget blockerande
//   pass = på eller över pass-tröskeln

import type {
  QAStatus,
  PersonaJuryResult,
  ToVScores,
  ComplianceResult,
  HeatmapResult,
} from "./types";
import { DEFAULT_THRESHOLDS } from "./thresholds";

/** Uppmärksamhetspoäng som används när bara copy granskas (ingen bild). */
export const COPY_ONLY_HEATMAP_BASELINE = 75;

export interface QAParts {
  persona_jury: PersonaJuryResult;
  tov: ToVScores;
  compliance: ComplianceResult;
  heatmap: HeatmapResult | null;
}

export interface QAScore {
  status: QAStatus;
  total_score: number;
  blocking_issues: string[];
  warnings: string[];
  suggestions: string[];
}

export function scoreQA(
  { persona_jury, tov, compliance, heatmap }: QAParts,
  thresholds = DEFAULT_THRESHOLDS
): QAScore {
  const weights = thresholds.weights;
  const heatmap_score = heatmap?.attention_score ?? COPY_ONLY_HEATMAP_BASELINE;

  const total_score = Math.round(
    persona_jury.aggregate_score * weights.persona +
      tov.weighted_score * weights.tov +
      compliance.score * weights.compliance +
      heatmap_score * weights.heatmap
  );

  // Blockerande compliance vinner alltid.
  let status: QAStatus;
  if (compliance.blocking_count > 0) {
    status = "fail";
  } else if (total_score >= thresholds.pass) {
    status = "pass";
  } else if (total_score >= thresholds.warn) {
    status = "warn";
  } else {
    status = "fail";
  }

  const blocking_issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  for (const check of compliance.checks) {
    if (check.passed) continue;
    const text = check.fix_suggestion
      ? `${check.rule_label}: ${check.detail}. ${check.fix_suggestion}`
      : `${check.rule_label}: ${check.detail}`;
    if (check.severity === "blocking") blocking_issues.push(text);
    else if (check.severity === "warning") warnings.push(text);
  }

  for (const ex of tov.examples) {
    suggestions.push(`[ToV/${ex.pillar}] ${ex.issue} → ${ex.suggestion}`);
  }

  // Invändningar från personan med lägst poäng — mest användbar feedback.
  const lowest = [...persona_jury.scores].sort((a, b) => a.weighted_score - b.weighted_score)[0];
  if (lowest) {
    for (const obj of lowest.objections.slice(0, 3)) {
      suggestions.push(`[${lowest.persona_name}] ${obj}`);
    }
  }

  if (heatmap) warnings.push(...heatmap.warnings);

  return { status, total_score, blocking_issues, warnings, suggestions };
}
