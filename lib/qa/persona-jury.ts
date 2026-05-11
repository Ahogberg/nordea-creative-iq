// ── Persona jury simulator ──
//
// Runs the four core personas from lib/persona-library in parallel against a
// creative and aggregates their scores. When ANTHROPIC_API_KEY is missing
// (CLAUDE.md fallback path) each persona gets a neutral 50 score so the
// gate still produces a usable report instead of failing hard.

import type { PersonaJuryResult, PersonaScore, ProductCategory } from "./types";
import { getPersonaWeights } from "./thresholds";
import { getClaudeClient } from "../claude";
import { PERSONA_LIBRARY, type PersonaProfile } from "../persona-library";

interface JuryInput {
  headline?: string;
  body?: string;
  cta?: string;
  duration_s?: number;
}

export async function runPersonaJury(
  creative: JuryInput,
  productType: ProductCategory = "general"
): Promise<PersonaJuryResult> {
  const weights = getPersonaWeights(productType);
  const personaIds = Object.keys(weights);
  const personas = personaIds
    .map((id) => PERSONA_LIBRARY.find((p) => p.id === id))
    .filter((p): p is PersonaProfile => p !== undefined);

  // Run all personas in parallel — each takes ~5s, total stays ~5s.
  const scores = await Promise.all(
    personas.map((persona) => simulatePersona(persona, creative, productType))
  );

  const aggregate = scores.reduce((sum, score) => {
    const weight = weights[score.persona_id] ?? 1 / scores.length;
    return sum + score.weighted_score * weight;
  }, 0);

  return {
    scores,
    aggregate_score: Math.round(aggregate * 10) / 10,
    selection_method: productType === "general" ? "all" : "product-targeted",
  };
}

async function simulatePersona(
  persona: PersonaProfile,
  creative: JuryInput,
  productType: ProductCategory
): Promise<PersonaScore> {
  const client = getClaudeClient();
  if (!client) {
    return neutralFallback(persona, "(API-nyckel saknas — neutral baseline)");
  }

  const prompt = buildPrompt(persona, creative, productType);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      return neutralFallback(persona, "(oväntat svarsformat)");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return neutralFallback(persona, "(JSON saknas i svaret)");
    }

    const data = JSON.parse(jsonMatch[0]) as {
      hook_score: number;
      trust_score: number;
      click_intent: number;
      reaction_quote: string;
      objections?: string[];
      suggestions?: string[];
    };

    const weighted_score =
      (data.hook_score / 10) * 30 +
      (data.trust_score / 10) * 40 +
      (data.click_intent / 100) * 30;

    return {
      persona_id: persona.id,
      persona_name: persona.shortName,
      hook_score: clamp(data.hook_score, 0, 10),
      trust_score: clamp(data.trust_score, 0, 10),
      click_intent: clamp(data.click_intent, 0, 100),
      reaction_quote: data.reaction_quote || "(ingen reaktion)",
      objections: (data.objections ?? []).slice(0, 3),
      suggestions: (data.suggestions ?? []).slice(0, 3),
      weighted_score: Math.round(weighted_score * 10) / 10,
    };
  } catch (error) {
    console.error(`[qa:persona:${persona.id}] simulation failed:`, error);
    return neutralFallback(persona, "(simulering misslyckades)");
  }
}

function buildPrompt(
  persona: PersonaProfile,
  creative: JuryInput,
  productType: ProductCategory
): string {
  const ageRange = `${persona.age.min}-${persona.age.max} år`;
  const product = productType === "general" ? "banktjänst" : productType;
  return `Du är ${persona.name}, ${ageRange}, ${persona.shortName}.

Karaktärsdrag: ${persona.traits.join(", ")}
Smärtpunkter: ${persona.painPoints.join(", ")}
Mål: ${persona.goals.join(", ")}
Citat som typifierar dig: "${persona.quote}"

Du tittar på en Nordea-annons för en ${product}-produkt.

Annonsens innehåll:
- Rubrik: "${creative.headline || "(ingen rubrik)"}"
- Brödtext: "${creative.body || "(ingen brödtext)"}"
- CTA: "${creative.cta || "(ingen CTA)"}"
${creative.duration_s ? `- Videolängd: ${creative.duration_s.toFixed(1)}s` : ""}

Reagera ÄRLIGT som ${persona.shortName}. Var inte överdrivet positiv. Om något är otydligt eller känns fel, säg det.

Svara ENDAST med JSON i detta format (inget annat):
{
  "hook_score": 0-10,
  "trust_score": 0-10,
  "click_intent": 0-100,
  "reaction_quote": "Ett kort citat på max 15 ord, i din röst",
  "objections": ["max 3 invändningar, korta meningar"],
  "suggestions": ["max 3 konkreta förbättringsförslag"]
}

Värderingsguide:
- hook_score 0-10: Fångar det din uppmärksamhet?
- trust_score 0-10: Känns Nordea trovärdiga här?
- click_intent 0-100: Sannolikhet (%) att du klickar.`;
}

function neutralFallback(persona: PersonaProfile, reason: string): PersonaScore {
  return {
    persona_id: persona.id,
    persona_name: persona.shortName,
    hook_score: 5,
    trust_score: 5,
    click_intent: 50,
    reaction_quote: reason,
    objections: [],
    suggestions: [],
    weighted_score: 50,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
