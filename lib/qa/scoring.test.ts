import { describe, expect, it } from "vitest";
import { scoreQA, COPY_ONLY_HEATMAP_BASELINE, type QAParts } from "./scoring";
import { DEFAULT_THRESHOLDS } from "./thresholds";
import type { ComplianceIssue, PersonaScore } from "./types";

function persona(id: string, weighted: number, objections: string[] = []): PersonaScore {
  return {
    persona_id: id,
    persona_name: id,
    hook_score: 7,
    trust_score: 7,
    click_intent: 50,
    reaction_quote: "",
    objections,
    suggestions: [],
    weighted_score: weighted,
  };
}

function check(partial: Partial<ComplianceIssue> & Pick<ComplianceIssue, "severity" | "passed">): ComplianceIssue {
  return { rule_id: "r", rule_label: "Regel", detail: "detalj", ...partial };
}

/** Alla delpoäng lika — då blir totalen samma tal oavsett vikter. */
function parts(score: number, overrides: Partial<QAParts> = {}): QAParts {
  return {
    persona_jury: { scores: [persona("a", score)], aggregate_score: score, selection_method: "all" },
    tov: { personlig: 7, expert: 7, ansvarsfull: 7, weighted_score: score, examples: [] },
    compliance: {
      product_type: "mortgage",
      checks: [],
      passed_count: 0,
      failed_count: 0,
      blocking_count: 0,
      score,
    },
    heatmap: {
      attention_score: score,
      focus_areas: [],
      primary_focus_label: "rubrik",
      logo_attention_pct: 10,
      cta_attention_pct: 20,
      warnings: [],
    },
    ...overrides,
  };
}

describe("scoreQA", () => {
  it("vikterna summerar till 1, så lika delpoäng ger samma total", () => {
    const w = DEFAULT_THRESHOLDS.weights;
    expect(w.persona + w.tov + w.compliance + w.heatmap).toBeCloseTo(1, 10);
    expect(scoreQA(parts(88)).total_score).toBe(88);
  });

  it("sätter status efter trösklarna", () => {
    expect(scoreQA(parts(DEFAULT_THRESHOLDS.pass)).status).toBe("pass");
    expect(scoreQA(parts(DEFAULT_THRESHOLDS.pass - 1)).status).toBe("warn");
    expect(scoreQA(parts(DEFAULT_THRESHOLDS.warn)).status).toBe("warn");
    expect(scoreQA(parts(DEFAULT_THRESHOLDS.warn - 1)).status).toBe("fail");
  });

  it("ett blockerande compliance-fel ger fail även med hög poäng", () => {
    const base = parts(95);
    const result = scoreQA({
      ...base,
      compliance: {
        ...base.compliance,
        blocking_count: 1,
        checks: [check({ severity: "blocking", passed: false, rule_label: "Effektiv ränta", fix_suggestion: "Visa räntan." })],
      },
    });
    expect(result.status).toBe("fail");
    expect(result.blocking_issues).toEqual(["Effektiv ränta: detalj. Visa räntan."]);
  });

  it("använder baslinjen för uppmärksamhet när ingen bild granskats", () => {
    const w = DEFAULT_THRESHOLDS.weights;
    const result = scoreQA(parts(80, { heatmap: null }));
    const expected = Math.round(80 * (w.persona + w.tov + w.compliance) + COPY_ONLY_HEATMAP_BASELINE * w.heatmap);
    expect(result.total_score).toBe(expected);
  });

  it("sorterar fel till rätt lista och tar invändningar från lägsta personan", () => {
    const base = parts(85);
    const result = scoreQA({
      ...base,
      persona_jury: {
        ...base.persona_jury,
        scores: [persona("hög", 90, ["inte denna"]), persona("låg", 60, ["för snabbt", "saknar pris", "otydlig", "fjärde"])],
      },
      compliance: {
        ...base.compliance,
        checks: [
          check({ severity: "warning", passed: false, rule_label: "Kontrast" }),
          check({ severity: "info", passed: false, rule_label: "Info" }),
          check({ severity: "blocking", passed: true, rule_label: "Godkänd regel" }),
        ],
      },
      heatmap: { ...base.heatmap!, warnings: ["Loggan får lite uppmärksamhet"] },
    });
    expect(result.blocking_issues).toEqual([]);
    expect(result.warnings).toEqual(["Kontrast: detalj", "Loggan får lite uppmärksamhet"]);
    expect(result.suggestions).toEqual(["[låg] för snabbt", "[låg] saknar pris", "[låg] otydlig"]);
  });
});
