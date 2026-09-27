// ── QA Gate orchestrator ──
//
// Runs the four checks in parallel and assembles the QAReport. Status
// drives export-block: 'fail' = blocking compliance issue OR total < warn,
// 'warn' = below pass but no blocking, 'pass' = above pass threshold.

import type {
  QAReport,
  RunQARequest,
  ProductCategory,
} from "./types";
import { runPersonaJury } from "./persona-jury";
import { runToVScorer } from "./tov-scorer";
import { runComplianceCheck } from "./compliance";
import { runHeatmapPrediction } from "./heatmap";
import { scoreQA } from "./scoring";
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

  const { status, total_score, blocking_issues, warnings, suggestions } = scoreQA({
    persona_jury,
    tov,
    compliance,
    heatmap,
  });

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
