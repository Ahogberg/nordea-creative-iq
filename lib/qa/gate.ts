// ── QA Gate orchestrator ──
//
// Runs the four checks in parallel and assembles the QAReport. Status
// drives export-block: 'fail' = blocking compliance issue OR total < warn,
// 'warn' = below pass but no blocking, 'pass' = above pass threshold.

import type {
  QAReport,
  QAStatus,
  RunQARequest,
  ProductCategory,
} from "./types";
import { runPersonaJury } from "./persona-jury";
import { runToVScorer } from "./tov-scorer";
import { runComplianceCheck } from "./compliance";
import { runHeatmapPrediction } from "./heatmap";
import { DEFAULT_THRESHOLDS } from "./thresholds";
import { detectProductFromText } from "../product-detection";

type ReportPayload = Omit<QAReport, "id" | "created_at">;

export async function runQAGate(request: RunQARequest): Promise<ReportPayload> {
  const startTime = Date.now();
  const meta = request.metadata ?? {};

  // Resolve product type: prefer caller-supplied, else auto-detect from copy
  const productType: ProductCategory =
    request.product_type ??
    detectProductFromText(meta.headline ?? "", meta.body ?? "", meta.cta ?? "")
      .category;

  const has_logo = meta.has_logo ?? true;
  const has_cta = !!meta.cta;
  const has_headline = !!meta.headline;

  const [persona_jury, tov, compliance, heatmap] = await Promise.all([
    runPersonaJury(meta, productType),
    runToVScorer(meta),
    runComplianceCheck(
      {
        headline: meta.headline,
        body: meta.body,
        cta: meta.cta,
        duration_s: meta.duration_s,
        has_logo,
        contrast_ratio: meta.contrast_ratio,
      },
      productType
    ),
    runHeatmapPrediction({
      image_url: meta.image_url,
      video_url: meta.video_url,
      has_logo,
      has_cta,
      has_headline,
    }),
  ]);

  const weights = DEFAULT_THRESHOLDS.weights;
  const heatmap_score = heatmap?.attention_score ?? 75; // copy-only baseline

  const total_score = Math.round(
    persona_jury.aggregate_score * weights.persona +
      tov.weighted_score * weights.tov +
      compliance.score * weights.compliance +
      heatmap_score * weights.heatmap
  );

  // Status: blocking compliance always wins
  let status: QAStatus;
  if (compliance.blocking_count > 0) {
    status = "fail";
  } else if (total_score >= DEFAULT_THRESHOLDS.pass) {
    status = "pass";
  } else if (total_score >= DEFAULT_THRESHOLDS.warn) {
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

  // Suggestions from the lowest-scoring persona (most actionable feedback)
  const sortedPersonas = [...persona_jury.scores].sort(
    (a, b) => a.weighted_score - b.weighted_score
  );
  const lowest = sortedPersonas[0];
  if (lowest) {
    for (const obj of lowest.objections.slice(0, 3)) {
      suggestions.push(`[${lowest.persona_name}] ${obj}`);
    }
  }

  if (heatmap) warnings.push(...heatmap.warnings);

  return {
    status,
    total_score,
    product_type: productType,
    persona_jury,
    tov,
    compliance,
    heatmap,
    blocking_issues,
    warnings,
    suggestions,
    duration_ms: Date.now() - startTime,
  };
}
