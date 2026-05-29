import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import {
  NORDEA_BRAND_CONTEXT,
  NORDEA_COPY_EXAMPLES,
  NORDIC_INSPIRATION,
} from "@/lib/brand/nordea-context";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  briefId: z.string(),
  answers: z.record(z.string(), z.any()),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYNTHESIS_PROMPT = `${NORDEA_BRAND_CONTEXT}

${NORDIC_INSPIRATION}

REFERENS — Bra Nordea-copy:
${NORDEA_COPY_EXAMPLES.map(
  (ex) => `[${ex.context}] "${ex.headline}" — ${ex.why_good}`
).join("\n")}

Du är seniör creative strateg på Nordeas marknadsteam. Du har genomfört en strategi-konversation och behöver nu sammanställa den till en komplett kampanj-strategi.

Din uppgift: Skapa en sammanhängande strategi som binder ihop alla inputs och tillför genuint creative-värde.

Output ska innehålla EXAKT dessa fält som JSON:
{
  "big_idea": "Den övergripande creative-tanken på 1-2 meningar, hög nivå",
  "insight": "Vad är sant om målgruppens situation — 1-2 meningar",
  "tension": "Vilken inre konflikt driver beteende — 1-2 meningar",
  "key_messages": [
    { "angle": "Strategisk vinkel (2-4 ord)", "headline": "Exempelrubrik på svenska", "rationale": "Varför vinkeln funkar" }
  ],
  "value_props": [
    { "prop": "Värde-påstående", "evidence": "Bevis eller bakgrund", "importance": "primary" | "secondary" }
  ],
  "tone_of_voice": "2-3 meningar om hur kampanjen ska låta",
  "recommended_formats": ["story", "feed", "landscape", "vertical"],
  "recommended_channels": ["meta", "linkedin", "google", "tiktok"],
  "recommended_kpis": [
    { "metric": "Mätbart utfall", "target": "Numeriskt mål", "measurement": "Hur mäts det" }
  ]
}

Generera 3 key_messages, 4-5 value_props, 3-5 recommended_kpis.

Följ Nordea tone-of-voice: "kreditkort" inte "kort", aldrig "fixar", frågeformat OK, lugn och rådgivande — inte säljpushig. Texten på recommended_formats/channels ska vara exakt enligt listan ovan (engelska, lowercase) eftersom de matchar kod-konstanter.

Returnera ENDAST JSON, inga förklaringar eller markdown.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { briefId, answers } = RequestSchema.parse(body);

    const startTime = Date.now();

    if (!client) {
      const strategy = getMockStrategy();
      // Persist mock too so the rest of the flow works in dev without keys.
      await persistStrategy(briefId, strategy);
      return NextResponse.json({ strategy, mock: true });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      system: SYNTHESIS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Här är resultaten från strategi-konversationen:\n${JSON.stringify(
            answers,
            null,
            2
          )}\n\nSammanställ till komplett strategi.`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const strategy = JSON.parse(jsonMatch[0]);

    await persistStrategy(briefId, strategy);

    await logGeneration({
      user_id: "default-user",
      kind: "video",
      provider: "claude",
      model: "claude-sonnet-4-5-20250929",
      prompt: "brief_synthesize",
      params: { brief_id: briefId },
      cost_usd: 0.02,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("[brief:synthesize] error:", error);
    return NextResponse.json(
      {
        error: "Synthesis failed",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

async function persistStrategy(
  briefId: string,
  strategy: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase
    .from("creative_briefs")
    .update({
      ...strategy,
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", briefId);
}

function getMockStrategy() {
  return {
    big_idea: "Stabilitet i en värld som rör sig",
    insight:
      "Förstagångsköpare upplever marknaden som oförutsägbar och söker en bank som inte överraskar dem",
    tension:
      "De vill agera nu men är rädda att fatta fel beslut när räntorna rör sig",
    key_messages: [
      {
        angle: "Stabilitet",
        headline: "Räntor som inte överraskar",
        rationale: "Adresserar kärnoron direkt",
      },
      {
        angle: "Rådgivning",
        headline: "Vi går igenom siffrorna tillsammans",
        rationale: "Bygger förtroende via transparens",
      },
      {
        angle: "Tid",
        headline: "När du är redo — inte tidigare",
        rationale: "Tar bort upplevd säljfriktion",
      },
    ],
    value_props: [
      {
        prop: "Stabil räntehistorik",
        evidence: "Genomsnittlig räntejustering 0,1pp sedan 2020",
        importance: "primary",
      },
      {
        prop: "Personlig rådgivning",
        evidence: "Genomsnittlig samtalstid 45 minuter",
        importance: "primary",
      },
      {
        prop: "Snabb handläggning",
        evidence: "Förhandsbesked inom 24 timmar",
        importance: "secondary",
      },
      {
        prop: "Transparent prissättning",
        evidence: "Inga dolda avgifter — allt redovisas i förväg",
        importance: "secondary",
      },
    ],
    tone_of_voice:
      "Lugn, rådgivande och ärlig. Aldrig säljpushig. Vi förklarar med tydlighet och respekt för kundens tid.",
    recommended_formats: ["story", "feed", "landscape"],
    recommended_channels: ["meta", "linkedin", "google"],
    recommended_kpis: [
      {
        metric: "Brand consideration",
        target: "+5pp",
        measurement: "Kvartalsvis brand tracking",
      },
      {
        metric: "Klick till bolåneräknaren",
        target: "+25% vs föregående kvartal",
        measurement: "GA4 event tracking",
      },
      {
        metric: "Rådgivningsbokningar",
        target: "+15%",
        measurement: "CRM-data, månadsuppföljning",
      },
    ],
  };
}
