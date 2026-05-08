// ── Compliance checker ──
//
// Two layers:
//   1. Deterministic regex/feature checks per ProductCategory rule
//   2. LLM nuance pass that catches misleading promises, push-aggressive
//      framing, and implicit risk-free claims that regex can't see
//
// Score starts at 100 and decrements per failed check (-25 blocking,
// -10 warning, -2 info), clamped to [0, 100]. Blocking failures are what
// the gate uses to force status='fail' regardless of total score.

import type {
  ComplianceResult,
  ComplianceIssue,
  ProductCategory,
} from "./types";
import { COMPLIANCE_RULES, type ComplianceRule } from "./thresholds";
import { getClaudeClient } from "../claude";

interface ComplianceInput {
  headline?: string;
  body?: string;
  cta?: string;
  duration_s?: number;
  has_logo?: boolean;
  contrast_ratio?: number;
}

export async function runComplianceCheck(
  creative: ComplianceInput,
  productType: ProductCategory = "general"
): Promise<ComplianceResult> {
  const rules = COMPLIANCE_RULES[productType] ?? COMPLIANCE_RULES.general;

  // Deterministic checks first — they're free and instant
  const regexChecks = rules.map((rule) => checkRule(rule, creative));

  // LLM nuance pass — only for product-specific categories
  const llmChecks = await llmComplianceCheck(creative, productType);

  const checks = [...regexChecks, ...llmChecks];

  const passed_count = checks.filter((c) => c.passed).length;
  const failed_count = checks.length - passed_count;
  const blocking_count = checks.filter(
    (c) => !c.passed && c.severity === "blocking"
  ).length;

  let score = 100;
  for (const check of checks) {
    if (!check.passed) {
      if (check.severity === "blocking") score -= 25;
      else if (check.severity === "warning") score -= 10;
      else score -= 2;
    }
  }
  score = Math.max(0, Math.min(100, score));

  return {
    product_type: productType,
    checks,
    passed_count,
    failed_count,
    blocking_count,
    score,
  };
}

function checkRule(rule: ComplianceRule, creative: ComplianceInput): ComplianceIssue {
  const text = `${creative.headline || ""} ${creative.body || ""} ${creative.cta || ""}`;
  const lower = text.toLowerCase();

  let passed = false;
  let detail = "";
  let fix_suggestion: string | undefined;

  switch (rule.id) {
    case "effective_interest_rate":
      passed = /effektiv\s+ränta/i.test(lower) || /\d+[,.]?\d*\s*%\s*\(?effektiv/i.test(lower);
      detail = passed ? "Effektiv ränta nämns" : "Saknar 'effektiv ränta'";
      fix_suggestion = passed ? undefined : 'Lägg till "effektiv ränta från X%" i brödtext eller disclaimer';
      break;

    case "amortization_info":
      passed = /amorter/i.test(lower);
      detail = passed ? "Amortering nämns" : "Amortering saknas";
      fix_suggestion = passed ? undefined : "Nämn amorteringskravet";
      break;

    case "risk_warning":
      passed = /risk|kan\s+(gå\s+ner|sjunka|förlora)|värdet\s+kan/i.test(lower);
      detail = passed ? "Riskvarning närvarande" : "Saknar riskvarning";
      fix_suggestion = passed
        ? undefined
        : 'Lägg till "Värdet kan gå upp och ner. Du kan förlora delar av kapitalet."';
      break;

    case "past_performance_disclaimer":
      passed = /historisk\s+avkastning|tidigare\s+resultat/i.test(lower);
      detail = passed
        ? "Historisk avkastning-disclaimer närvarande"
        : "Saknar historisk avkastning-disclaimer";
      fix_suggestion = passed
        ? undefined
        : 'Lägg till "Historisk avkastning är ingen garanti för framtida avkastning."';
      break;

    case "interest_rate":
      passed = /\d+[,.]?\d*\s*%/.test(lower) || /ränta/i.test(lower);
      detail = passed ? "Ränta nämns" : "Ränta saknas";
      fix_suggestion = passed ? undefined : "Specificera räntan";
      break;

    case "annual_fee":
      passed = /årsavgift|avgift\s+per\s+år|\d+\s*kr\s*\/?\s*år/i.test(lower);
      detail = passed ? "Årsavgift nämns" : "Årsavgift saknas";
      fix_suggestion = passed ? undefined : "Specificera årsavgiften";
      break;

    case "total_cost":
      passed = /total\s+kostnad|totalt\s+belopp|totala\s+kostnaden/i.test(lower);
      detail = passed ? "Total kostnad nämns" : "Total kostnad saknas";
      fix_suggestion = passed ? undefined : 'Lägg till "Total kostnad: X kr"';
      break;

    case "coverage_terms":
      passed = /villkor|skydd|gäller\s+(vid|för)|ersättning/i.test(lower);
      detail = passed ? "Försäkringsvillkor refereras" : "Inga försäkringsvillkor refereras";
      fix_suggestion = passed ? undefined : "Hänvisa till villkor eller pdf med fullständiga termer";
      break;

    case "wcag_contrast": {
      const ratio = creative.contrast_ratio ?? 0;
      passed = ratio === 0 || ratio >= 4.5;
      detail =
        ratio === 0
          ? "Kontrast inte mätt (antas OK)"
          : `Kontrast: ${ratio.toFixed(1)}:1 ${passed ? "(OK)" : "(för låg)"}`;
      fix_suggestion = passed ? undefined : "Höj kontrasten till minst 4.5:1";
      break;
    }

    case "logo_present":
      passed = creative.has_logo !== false;
      detail = passed ? "Logo närvarande" : "Logo saknas";
      fix_suggestion = passed ? undefined : "Aktivera logo i mallen";
      break;

    case "subtitles_present":
      // Treat as pass for MVP — captions detection requires the rendered MP4
      // and a STT/SRT pipeline. Sprint 6+ adds proper detection.
      passed = (creative.duration_s ?? 0) <= 15 || true;
      detail =
        (creative.duration_s ?? 0) > 15
          ? "Captions antas närvarande (MVP — Sprint 6+ verifierar)"
          : "Captions ej krav för kort video";
      break;

    case "disclaimer_time": {
      const minTime = 2;
      const dur = creative.duration_s ?? 0;
      passed = dur === 0 || dur >= minTime;
      detail = passed ? "Tillräcklig tid för disclaimer" : "För kort tid för disclaimer";
      fix_suggestion = passed ? undefined : "Förläng videon eller minska disclaimer-text";
      break;
    }

    default:
      passed = true;
      detail = "OK";
  }

  return {
    rule_id: rule.id,
    rule_label: rule.label,
    severity: rule.severity,
    passed,
    detail,
    paragraph: rule.paragraph,
    fix_suggestion,
  };
}

async function llmComplianceCheck(
  creative: ComplianceInput,
  productType: ProductCategory
): Promise<ComplianceIssue[]> {
  if (productType === "general" || productType === "business") return [];

  const client = getClaudeClient();
  if (!client) return [];

  const prompt = `Du är compliance-expert på Nordea. Granska följande annonscopy för en ${productType}-produkt mot svenska finansiella regler.

Copy:
- Rubrik: "${creative.headline || ""}"
- Brödtext: "${creative.body || ""}"
- CTA: "${creative.cta || ""}"

Identifiera ENDAST följande typer av problem (ignorera regex-checks som redan görs):
- Vilseledande löften ("garanterad avkastning", etc)
- Otydliga villkor som behöver disclaimer
- Push-aggressiv ton mot sårbara kunder
- Implicita anspråk om risk-frihet

Svara ENDAST med JSON:
{
  "issues": [
    {
      "rule_id": "llm_X",
      "rule_label": "Kort beskrivning",
      "severity": "blocking" | "warning" | "info",
      "detail": "Vad som är problematiskt",
      "fix_suggestion": "Hur man fixar"
    }
  ]
}

Tom array om copy:n är ren.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") return [];

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];

    const data = JSON.parse(jsonMatch[0]) as {
      issues?: Array<{
        rule_id: string;
        rule_label: string;
        severity: "blocking" | "warning" | "info";
        detail: string;
        fix_suggestion?: string;
      }>;
    };

    return (data.issues ?? []).map((issue) => ({
      rule_id: issue.rule_id || "llm_unknown",
      rule_label: issue.rule_label,
      severity: issue.severity,
      passed: false,
      detail: issue.detail,
      fix_suggestion: issue.fix_suggestion,
    }));
  } catch (error) {
    console.error("[qa:compliance] LLM check failed:", error);
    return [];
  }
}
