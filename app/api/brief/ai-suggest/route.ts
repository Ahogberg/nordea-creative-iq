import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import { defaultPersonas } from "@/lib/constants/personas";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  stage: z.enum(["problem", "audience", "perception", "message", "action"]),
  context: z.any(),
  currentAnswer: z.string(),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Build the persona reference from the actual codebase (defaultPersonas in
// lib/constants/personas.ts). Spec assumed PERSONA_LIBRARY but the real export
// uses {name, age_min, age_max, life_stage, traits, pain_points}.
const PERSONA_REFERENCE = defaultPersonas.map((p) => ({
  name: p.name,
  age_range: `${p.age_min}-${p.age_max}`,
  life_stage: p.life_stage,
  traits: p.traits.slice(0, 4),
  pain_points: p.pain_points.slice(0, 3),
}));

const STAGE_PROMPTS: Record<string, string> = {
  problem: `Du är seniör creative strateg på Nordeas marknadsteam. Användaren beskriver en utmaning eller möjlighet de behöver kommunicera kring.

Din uppgift: Generera 3 insiktsfulla observationer om vad som händer i marknaden eller målgruppens situation. Tänk som en strateg som har sett liknande utmaningar förut.

Varje insight ska:
- Vara på 1-2 meningar
- Tillföra perspektiv användaren kanske inte sett
- Vara konkret, inte generisk
- Vara relevant för svensk marknad och Nordeas position

Returnera ENDAST JSON: {"insights": ["insight1", "insight2", "insight3"]}`,

  audience: `Du är expert på Nordeas målgrupper. Användaren beskriver vem de vill nå.

Tillgängliga personor:
${JSON.stringify(PERSONA_REFERENCE, null, 2)}

Din uppgift: Matcha användarens beskrivning mot 2-3 av Nordeas befintliga personor. Ge en match-procent (0-100) + rationale på 1-2 meningar för varför just denna persona passar.

Returnera ENDAST JSON:
{
  "personas": [
    { "id": "persona_namn_slug", "name": "Persona-namn", "match": 85, "rationale": "Kort förklaring" }
  ]
}`,

  perception: `Du är insight-strateg. Användaren beskriver hur målgruppen tänker idag.

Din uppgift: Identifiera den underliggande INSIGHT (vad är sant om deras situation som de själva kanske inte uttryckt) och TENSION (vilken konflikt eller frustration finns).

Insight ska vara empatisk och konkret. Tension ska vara den emotionella konflikten som driver beteende.

Returnera ENDAST JSON:
{
  "insight": "1-2 meningar om vad som ÄR sant",
  "tension": "1-2 meningar om vilken inre konflikt målgruppen lever med"
}`,

  message: `Du är creative strateg. Användaren har definierat problem, målgrupp och insight. Nu behöver de hitta key message.

Din uppgift: Föreslå 3 distinkta vinklar för budskap, var och en med:
- angle (strategisk vinkel, 2-4 ord)
- headline (exempelrubrik på svenska)
- rationale (varför denna vinkel funkar)

Variation ska finnas mellan vinklarna — rationell vs emotionell, problem vs lösning, etc.

Följ Nordeas tonalitet: "kreditkort" inte "kort", aldrig "fixar", frågeformat OK, lugn och rådgivande, inte säljpushig.

Returnera ENDAST JSON:
{
  "key_messages": [
    { "angle": "...", "headline": "...", "rationale": "..." }
  ]
}`,

  action: `Du är conversion-strateg. Användaren har definierat strategin. Nu behöver de bestämma CTA + value props.

Din uppgift: Föreslå:
- 2-3 alternativa CTAs (Call to Action) — korta, action-drivna, svenska
- 3-5 value props som backar budskapet

CTA ska vara konkret och låg-friktion. Value props ska vara bevisbara och relevanta för Nordeas målgrupp.

Returnera ENDAST JSON:
{
  "ctas": ["CTA1", "CTA2"],
  "value_props": [
    { "prop": "...", "evidence": "...", "importance": "primary" }
  ]
}`,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stage, context, currentAnswer } = RequestSchema.parse(body);

    const startTime = Date.now();

    if (!client) {
      return NextResponse.json({ ...getMockResponse(stage), mock: true });
    }

    const systemPrompt = STAGE_PROMPTS[stage];

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Kontext från tidigare stages:\n${JSON.stringify(
            context,
            null,
            2
          )}\n\nAnvändarens nuvarande svar:\n${currentAnswer}`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const parsed = JSON.parse(jsonMatch[0]);

    await logGeneration({
      user_id: "default-user",
      kind: "video",
      provider: "claude",
      model: "claude-sonnet-4-5-20250929",
      prompt: `brief_${stage}`,
      params: { stage, answer_length: currentAnswer.length },
      cost_usd: 0.005,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[brief:ai-suggest] error:", error);
    return NextResponse.json(
      {
        error: "AI suggestion failed",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

function getMockResponse(stage: string) {
  const mocks: Record<string, unknown> = {
    problem: {
      insights: [
        "Marknadsoro skapar paralys hos förstagångsköpare — de väntar trots att timingen är rätt",
        "Banker uppfattas som en monolitisk grupp; ingen särskiljs på trygghet",
        "Generationsskillnad: yngre köpare jämför villkor mer än sina föräldrar gjorde",
      ],
    },
    audience: {
      personas: [
        {
          id: "ung_forstagangskopare",
          name: "Ung Förstagångsköpare",
          match: 92,
          rationale: "Direkt matchning på livsfas och osäkerhet kring första köpet",
        },
        {
          id: "spararen",
          name: "Spararen",
          match: 64,
          rationale: "Relevant för kontantinsats-buildup men sekundär målgrupp",
        },
      ],
    },
    perception: {
      insight:
        "Målgruppen längtar efter en bank som inte överraskar dem med ändringar i villkor",
      tension:
        "De vill agera men är rädda att fatta fel beslut just när räntorna rör sig",
    },
    message: {
      key_messages: [
        {
          angle: "Stabilitet",
          headline: "Räntor som inte överraskar",
          rationale: "Adresserar kärnoron direkt",
        },
        {
          angle: "Rådgivning",
          headline: "Vi går igenom siffrorna tillsammans",
          rationale: "Bygger förtroende genom transparens",
        },
        {
          angle: "Tid",
          headline: "När du är redo — inte tidigare",
          rationale: "Tar bort upplevd försäljningsfriktion",
        },
      ],
    },
    action: {
      ctas: ["Räkna på ditt bolån", "Boka rådgivning", "Få ett ja inom 24h"],
      value_props: [
        {
          prop: "Stabil räntehistorik",
          evidence: "Genomsnittlig räntejustering 0,1pp sedan 2020",
          importance: "primary",
        },
        {
          prop: "Personlig rådgivning",
          evidence: "Genomsnittlig samtalstid 45 min",
          importance: "primary",
        },
        {
          prop: "Snabb handläggning",
          evidence: "Förhandsbesked inom 24 timmar",
          importance: "secondary",
        },
      ],
    },
  };
  return mocks[stage] || {};
}
