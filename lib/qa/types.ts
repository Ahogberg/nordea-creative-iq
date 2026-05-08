// ── Sprint 5: Persona-driven QA Gate types ──
//
// The gate runs four checks in parallel — Persona jury, ToV, Compliance,
// Heatmap — and aggregates them into a weighted total. ProductCategory
// reuses the existing detector in lib/product-detection so callers don't
// have to learn a second taxonomy.

import { z } from "zod";
import type { ProductCategory } from "../product-detection";

export type CreativeKind = "video" | "banner" | "copy" | "template";
export type QAStatus = "pass" | "warn" | "fail" | "running" | "error";

export type { ProductCategory };

// ── Persona jury ──

export interface PersonaScore {
  persona_id: string;
  persona_name: string;
  hook_score: number; // 0-10
  trust_score: number; // 0-10
  click_intent: number; // 0-100 (%)
  reaction_quote: string;
  objections: string[];
  suggestions: string[];
  weighted_score: number; // 0-100
}

export interface PersonaJuryResult {
  scores: PersonaScore[];
  aggregate_score: number; // 0-100
  selection_method: "all" | "product-targeted" | "manual";
}

// ── ToV ──

export interface ToVExample {
  pillar: "personlig" | "expert" | "ansvarsfull";
  issue: string;
  suggestion: string;
}

export interface ToVScores {
  personlig: number; // 0-10
  expert: number;
  ansvarsfull: number;
  weighted_score: number; // 0-100
  examples: ToVExample[];
}

// ── Compliance ──

export type ComplianceSeverity = "blocking" | "warning" | "info";

export interface ComplianceIssue {
  rule_id: string;
  rule_label: string;
  severity: ComplianceSeverity;
  passed: boolean;
  detail: string;
  paragraph?: string;
  fix_suggestion?: string;
}

export interface ComplianceResult {
  product_type: ProductCategory;
  checks: ComplianceIssue[];
  passed_count: number;
  failed_count: number;
  blocking_count: number;
  score: number; // 0-100
}

// ── Heatmap ──

export interface FocusArea {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
  label?: string;
}

export interface HeatmapResult {
  attention_score: number; // 0-100
  focus_areas: FocusArea[];
  primary_focus_label: string;
  logo_attention_pct: number;
  cta_attention_pct: number;
  warnings: string[];
}

// ── Aggregate report ──

export interface QAReport {
  id: string;
  status: QAStatus;
  total_score: number;
  product_type: ProductCategory;

  persona_jury: PersonaJuryResult;
  tov: ToVScores;
  compliance: ComplianceResult;
  heatmap: HeatmapResult | null;

  blocking_issues: string[];
  warnings: string[];
  suggestions: string[];

  duration_ms: number;
  created_at: string;
}

// ── API contract ──

export const RunQARequestSchema = z.object({
  creative_kind: z.enum(["video", "banner", "copy", "template"]),
  creative_ref: z.string(),
  product_type: z
    .enum([
      "mortgage",
      "savings",
      "loans",
      "pension",
      "insurance",
      "cards",
      "business",
      "general",
    ])
    .optional(),
  metadata: z
    .object({
      headline: z.string().optional(),
      body: z.string().optional(),
      cta: z.string().optional(),
      video_url: z.string().optional(),
      image_url: z.string().optional(),
      duration_s: z.number().optional(),
      template_id: z.string().optional(),
      production_job_id: z.string().optional(),
      has_logo: z.boolean().optional(),
      contrast_ratio: z.number().optional(),
    })
    .optional(),
});

export type RunQARequest = z.infer<typeof RunQARequestSchema>;
