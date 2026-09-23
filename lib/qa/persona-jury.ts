// ── Persona jury simulator ──
//
// Runs the personas from lib/persona-library in parallel against a creative
// and aggregates their scores. Persona identity comes from the same builder
// as Ad Studio's persona-react/persona-chat, so a persona judges the same way
// everywhere. When an image (or video frames) is supplied, each persona sees
// the actual creative, not just the copy.
//
// When ANTHROPIC_API_KEY is missing (CLAUDE.md fallback path) each persona
// gets a neutral 50 score so the gate still produces a usable report instead
// of failing hard.

import type Anthropic from "@anthropic-ai/sdk";
import type { PersonaJuryResult, PersonaScore, ProductCategory, VisualInput } from "./types";
import { getPersonaWeights } from "./thresholds";
import { getClaudeClient, CLAUDE_MODEL } from "../claude";
import { PERSONA_LIBRARY, type PersonaProfile } from "../persona-library";
import {
  buildPersonaProfileBlock,
  buildVisualInstruction,
  identityFromProfile,
} from "../ai/prompts/persona-simulation";
import { toImageBlocks } from "../ai/image-input";

interface JuryInput {
  headline?: string;
  body?: string;
  cta?: string;
  duration_s?: number;
  image_url?: string;
  frame_urls?: string[];
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

  // Convert once, share across personas.
  const { images, visual_input } = await resolveVisual(creative);

  // Run all personas in parallel — each takes ~5s, total stays ~5s.
  const scores = await Promise.all(
    personas.map((persona) =>
      simulatePersona(persona, creative, productType, images, visual_input)
    )
  );

  const aggregate = scores.reduce((sum, score) => {
    const weight = weights[score.persona_id] ?? 1 / scores.length;
    return sum + score.weighted_score * weight;
  }, 0);

  return {
    scores,
    aggregate_score: Math.round(aggregate * 10) / 10,
    selection_method: productType === "general" ? "all" : "product-targeted",
    visual_input,
  };
}

async function resolveVisual(
  creative: JuryInput
): Promise<{ images: Anthropic.ImageBlockParam[]; visual_input: VisualInput }> {
  if (creative.image_url) {
    const images = await toImageBlocks([creative.image_url], 1);
    if (images.length > 0) return { images, visual_input: "image" };
  }
  if (creative.frame_urls && creative.frame_urls.length > 0) {
    const images = await toImageBlocks(creative.frame_urls, 4);
    if (images.length > 0) return { images, visual_input: "frames" };
  }
  return { images: [], visual_input: "none" };
}

async function simulatePersona(
  persona: PersonaProfile,
  creative: JuryInput,
  productType: ProductCategory,
  images: Anthropic.ImageBlockParam[],
  visualInput: VisualInput
): Promise<PersonaScore> {
  const client = getClaudeClient();
  if (!client) {
    return neutralFallback(persona, "(API-nyckel saknas — neutral baseline)");
  }

  const prompt = buildPrompt(persona, creative, productType, visualInput);

  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [...images, { type: "text", text: prompt }],
        },
      ],
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
      first_noticed?: string;
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
      first_noticed: visualInput !== "none" ? data.first_noticed : undefined,
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
  productType: ProductCategory,
  visualInput: VisualInput
): string {
  const product = productType === "general" ? "banktjänst" : productType;
  const hasVisual = visualInput !== "none";

  return `${buildPersonaProfileBlock(identityFromProfile(persona))}

Du tittar på en Nordea-annons för en ${product}-produkt.
${hasVisual ? `\n${buildVisualInstruction(visualInput === "frames" ? "frames" : "image")}\n` : ""}
Annonsens copy:
- Rubrik: "${creative.headline || "(ingen rubrik)"}"
- Brödtext: "${creative.body || "(ingen brödtext)"}"
- CTA: "${creative.cta || "(ingen CTA)"}"
${creative.duration_s ? `- Videolängd: ${creative.duration_s.toFixed(1)}s` : ""}

Reagera ÄRLIGT som ${persona.name}. Var inte överdrivet positiv. Om något är otydligt eller känns fel, säg det.

Svara ENDAST med JSON i detta format (inget annat):
{
  "hook_score": 0-10,
  "trust_score": 0-10,
  "click_intent": 0-100,
  "reaction_quote": "Ett kort citat på max 15 ord, i din röst",${
    hasVisual
      ? `
  "first_noticed": "Vad du lade märke till först i bilden (max 10 ord)",`
      : ""
  }
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
