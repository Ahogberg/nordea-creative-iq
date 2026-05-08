// ── Nordea Tone-of-Voice scorer ──
//
// Scores copy on three pillars: personlig / expert / ansvarsfull. Returns
// concrete rewrite examples when one pillar is weak. Falls back to a
// neutral 5/10 across the board if Claude isn't reachable.

import type { ToVScores, ToVExample } from "./types";
import { getClaudeClient } from "../claude";

interface ToVInput {
  headline?: string;
  body?: string;
  cta?: string;
}

export async function runToVScorer(creative: ToVInput): Promise<ToVScores> {
  const client = getClaudeClient();
  if (!client) {
    return neutralFallback();
  }

  const prompt = `Du är en Nordea brand voice-expert. Granska följande copy mot Nordeas tre Tone of Voice-pelare:

1. PERSONLIG — Vi pratar med människor, inte till. Varmt, nära, "du" och "vi". Aldrig stelt eller distanserat.
2. EXPERT — Vi vet vad vi pratar om. Tydlig, konkret, faktabaserad. Aldrig vag eller marknadsspråk.
3. ANSVARSFULL — Vi tar ansvar för kunden. Försiktig med löften, transparent med risker. Aldrig pushigt eller manipulativt.

Copy att granska:
- Rubrik: "${creative.headline || "(ingen)"}"
- Brödtext: "${creative.body || "(ingen)"}"
- CTA: "${creative.cta || "(ingen)"}"

Granska KRITISKT. Identifiera konkreta exempel om något inte håller måttet.

Svara ENDAST med JSON:
{
  "personlig": 0-10,
  "expert": 0-10,
  "ansvarsfull": 0-10,
  "examples": [
    {
      "pillar": "personlig" | "expert" | "ansvarsfull",
      "issue": "Vad som inte håller måttet (max 12 ord)",
      "suggestion": "Konkret omformulering (max 15 ord)"
    }
  ]
}

Sätt examples till tom array om copy:n är ren.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") return neutralFallback();

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return neutralFallback();

    const data = JSON.parse(jsonMatch[0]) as {
      personlig: number;
      expert: number;
      ansvarsfull: number;
      examples?: ToVExample[];
    };

    const personlig = clamp(data.personlig, 0, 10);
    const expert = clamp(data.expert, 0, 10);
    const ansvarsfull = clamp(data.ansvarsfull, 0, 10);

    const weighted = ((personlig + expert + ansvarsfull) / 3) * 10;

    return {
      personlig,
      expert,
      ansvarsfull,
      weighted_score: Math.round(weighted * 10) / 10,
      examples: (data.examples ?? []).filter(
        (ex): ex is ToVExample =>
          !!ex &&
          (ex.pillar === "personlig" ||
            ex.pillar === "expert" ||
            ex.pillar === "ansvarsfull")
      ),
    };
  } catch (error) {
    console.error("[qa:tov] scorer failed:", error);
    return neutralFallback();
  }
}

function neutralFallback(): ToVScores {
  return {
    personlig: 5,
    expert: 5,
    ansvarsfull: 5,
    weighted_score: 50,
    examples: [],
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}
