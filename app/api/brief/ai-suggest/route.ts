import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { z } from "zod";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import { defaultPersonas } from "@/lib/constants/personas";
import {
  NORDEA_BRAND_CONTEXT,
  NORDEA_COPY_EXAMPLES,
  NORDIC_INSPIRATION,
} from "@/lib/brand/nordea-context";

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

const PERSONA_REFERENCE = defaultPersonas.map((p) => ({
  id: p.name.toLowerCase().replace(/\s+/g, "_").replace(/[åä]/g, "a").replace(/ö/g, "o"),
  name: p.name,
  age_range: `${p.age_min}-${p.age_max}`,
  life_stage: p.life_stage,
  traits: p.traits.slice(0, 4),
  pain_points: p.pain_points.slice(0, 3),
  goals: p.goals.slice(0, 3),
}));

const STAGE_PROMPTS: Record<string, string> = {
  problem: `${NORDEA_BRAND_CONTEXT}

${NORDIC_INSPIRATION}

DIN ROLL: Du är seniör creative strateg på Nordeas marknadsteam med 15 års erfarenhet av svenska bankkampanjer.

SITUATION: En kollega beskriver en utmaning eller möjlighet de behöver kommunicera kring.

DIN UPPGIFT: Generera 3 insiktsfulla observationer om marknaden eller målgruppens situation. Tänk som en seniör strateg.

VARJE INSIGHT SKA:
- Vara på 1-2 meningar
- Tillföra perspektiv kollegan kanske inte sett
- Vara konkret, baserat på svensk marknadssituation (2026)
- Vara empatisk mot målgruppen (aldrig nedlåtande)
- Undvika klyschor om "den digitala världen" eller "framtiden"

UNDVIK:
- Generiska konsultfraser
- Påståenden utan stöd
- Onödig komplexitet

Returnera ENDAST JSON: {
  "insights": ["insight1", "insight2", "insight3"],
  "thinking": "1-2 meningar om vad du fokuserade på"
}`,

  audience: `${NORDEA_BRAND_CONTEXT}

DIN ROLL: Expert på Nordeas målgrupper och personor.

PERSONAS:
${JSON.stringify(PERSONA_REFERENCE, null, 2)}

SITUATION: Kollegan beskriver målgruppen för en kampanj.

DIN UPPGIFT:
1. Matcha mot 2-3 av Nordeas befintliga personor
2. Identifiera HUR de skiljer sig från målgruppsbeskrivningen (om de gör)
3. Föreslå om fler personor borde inkluderas

VAR ÄRLIG: Om match är dålig, säg det.

Returnera ENDAST JSON: {
  "personas": [
    {
      "id": "...",
      "name": "...",
      "match": 85,
      "rationale": "...",
      "concerns": "Om något inte stämmer perfekt"
    }
  ],
  "thinking": "Hur tänkte du kring matchningen?"
}`,

  perception: `${NORDEA_BRAND_CONTEXT}

${NORDIC_INSPIRATION}

DIN ROLL: Insight-strateg med expertis i konsumentpsykologi.

SITUATION: Kollegan beskriver målgruppens nuvarande mindset.

DIN UPPGIFT: Identifiera:
1. INSIGHT — Det som ÄR sant om målgruppen, ofta omedvetet
2. TENSION — Den emotionella konflikten som driver beteende

INSIGHTSREGLER:
- Inte vad de SÄGER, utan vad de FAKTISKT känner
- Specifikt, inte generiskt
- Något som målgruppen själva nickar igenkännande mot
- Empatisk, aldrig dömande

TENSIONREGLER:
- En verklig spänning mellan två saker (vill vs gör, känner vs visar)
- Ger en "creative opening" — något att kommunicera mot
- Inte uppfunnen friction

EXEMPEL PÅ BRA INSIGHTS:
- "Förstagångsköpare litar mer på sina föräldrar än sin bank — för att de tror banken bara säljer."
- "Människor som sparar för pension känner sig dumma att inte ha börjat tidigare — vilket gör att de skjuter upp det ytterligare."

Returnera ENDAST JSON: {
  "insight": "1-2 meningar om vad som ÄR sant",
  "tension": "1-2 meningar om den inre konflikten",
  "thinking": "Resonemang om vad du fokuserade på"
}`,

  message: `${NORDEA_BRAND_CONTEXT}

REFERENS — Bra Nordea-copy:
${NORDEA_COPY_EXAMPLES.map(
    (ex) => `
[${ex.context}]
Headline: "${ex.headline}"
Body: "${ex.body}"
Varför funkar det: ${ex.why_good}
`
  ).join("\n")}

DIN ROLL: Creative strateg + copywriter.

SITUATION: Kollegan har definierat problem, målgrupp och insight. Nu behöver de hitta key messages.

DIN UPPGIFT: Föreslå 3 DISTINKTA strategiska vinklar.

VARJE VINKEL SKA HA:
- "angle": Strategisk vinkel (2-4 ord, t.ex. "Trygghet i stormen")
- "headline": Konkret exempelrubrik (Nordea-tonalitet, frågeformat OK)
- "body": Stödjande mening (1-2 meningar)
- "rationale": Varför denna vinkel funkar för MÅLGRUPPEN

VARIATION:
- Vinkel 1: Mest rationell/produkt-fokuserad
- Vinkel 2: Mest emotionell/relationell
- Vinkel 3: Insight-driven (utgår från tension)

TONALITET-REGLER (kritiskt):
- "kreditkort" (aldrig "kort")
- ALDRIG "fixar"
- Inga klyschor från NORDIC_INSPIRATION-listan
- "Du" inte "ni"

Returnera ENDAST JSON: {
  "key_messages": [
    { "angle": "...", "headline": "...", "body": "...", "rationale": "..." }
  ],
  "thinking": "Vad guidade dig?"
}`,

  action: `${NORDEA_BRAND_CONTEXT}

DIN ROLL: Conversion-strateg + UX-tänkare.

SITUATION: Strategi är på plats. Nu behöver vi CTA + value props.

DIN UPPGIFT:

1. CTAs (2-3 alternativ):
   - Konkreta, låg friktion
   - "Boka rådgivning" är OK men inte spännande
   - Bättre: "Räkna på ditt bolån", "Se din pension idag", "Beräkna din månadsbetalning"

2. Value props (4-5 stycken):
   - Bevisbara fakta, inte påståenden
   - "Genomsnittlig räntehöjning 0.1% sedan 2020" (bra — specifikt)
   - "Sveriges bästa rådgivning" (dåligt — kan inte bevisa)

VARJE VALUE PROP:
- "prop": Själva propet (kort)
- "evidence": Hur det kan bevisas (kort)
- "importance": "primary" (1-2) eller "secondary" (resten)

KPI-FÖRSLAG (3 stycken):
- "metric": Vad mäts
- "target": Realistiskt mål (siffra eller spann)
- "measurement": Hur det mäts

Returnera ENDAST JSON: {
  "ctas": ["CTA1", "CTA2"],
  "value_props": [
    { "prop": "...", "evidence": "...", "importance": "primary" }
  ],
  "kpis": [
    { "metric": "...", "target": "...", "measurement": "..." }
  ],
  "thinking": "Vad guidade dig?"
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
      model: CLAUDE_MODEL,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `KONTEXT FRÅN TIDIGARE STAGES:\n${JSON.stringify(
            context,
            null,
            2
          )}\n\nMITT NUVARANDE SVAR:\n${currentAnswer}\n\nGenerera ditt svar.`,
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
      model: CLAUDE_MODEL,
      prompt: `brief_${stage}_v2`,
      params: { stage, answer_length: currentAnswer.length },
      cost_usd: 0.01,
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
      thinking:
        "Jag letade efter spänningar mellan vad målgruppen säger och vad de faktiskt gör.",
    },
    audience: {
      personas: [
        {
          id: "ung_forstagangskopare",
          name: "Ung Förstagångsköpare",
          match: 92,
          rationale: "Direkt matchning på livsfas och osäkerhet kring första köpet",
          concerns: "Yngre skiktet (25-27) är ännu mer skeptiskt än personan",
        },
        {
          id: "spararen",
          name: "Spararen",
          match: 64,
          rationale: "Relevant för kontantinsats-buildup men sekundär målgrupp",
        },
      ],
      thinking:
        "Primär persona styrde matchningen; jag lade till en sekundär där sparbeteendet överlappar.",
    },
    perception: {
      insight:
        "Målgruppen längtar efter en bank som inte överraskar dem med ändringar i villkor",
      tension:
        "De vill agera men är rädda att fatta fel beslut just när räntorna rör sig",
      thinking:
        "Fokuserade på rädslan för att fatta beslut i osäkerhet, inte själva osäkerheten.",
    },
    message: {
      key_messages: [
        {
          angle: "Stabilitet",
          headline: "Räntor som inte överraskar",
          body: "Vi visar villkoren i förväg så du kan räkna utan obehagliga överraskningar.",
          rationale: "Adresserar kärnoron direkt",
        },
        {
          angle: "Rådgivning",
          headline: "Vi går igenom siffrorna tillsammans",
          body: "Boka 30 minuter — vi förklarar vad du faktiskt har råd med.",
          rationale: "Bygger förtroende genom transparens",
        },
        {
          angle: "Tid",
          headline: "När du är redo — inte tidigare",
          body: "Det finns ingen press att fatta beslut snabbt. Vi finns kvar.",
          rationale: "Tar bort upplevd försäljningsfriktion",
        },
      ],
      thinking:
        "Tre olika ingångar: rationell, relationell och insight-driven — så användaren kan välja tonalitet.",
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
      kpis: [
        {
          metric: "Klick till bolåneräknaren",
          target: "+25%",
          measurement: "GA4 event tracking",
        },
        {
          metric: "Rådgivningsbokningar",
          target: "+15%",
          measurement: "CRM-data, månadsuppföljning",
        },
        {
          metric: "Brand consideration",
          target: "+5pp",
          measurement: "Kvartalsvis brand tracking",
        },
      ],
      thinking:
        "Konkreta CTAs över generiska. Value props med bevisbara siffror.",
    },
  };
  return mocks[stage] || {};
}
