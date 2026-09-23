import { NextRequest, NextResponse } from "next/server";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude";
import type { VideoConfig } from "@/lib/remotion/types";
import { compileCanvasScenes, stripCompiledCanvas } from "@/lib/remotion/compile";
import { withMotionCapabilities } from "@/lib/remotion/prompt-capabilities";
import {
  NORDEA_COLORS,
  NORDEA_FONT_FAMILIES,
  NORDEA_AD_COPY_RULES,
  NORDEA_TONE_OF_VOICE,
} from "@/lib/nordea-brand-guidelines";
import { withVisualGrammar } from "@/lib/brand/visual-grammar";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Du är en kreativ motion graphics-designer på Nordea. Du hjälper användare skapa animerade videos genom konversation.

Du svarar ALLTID med ett JSON-objekt med denna form:
{
  "message": "<ditt svar till användaren — kort, vänligt, beskriv vad du gjort eller ger råd>",
  "config": <VideoConfig-objekt OM du skapar/uppdaterar en video, annars null>
}

VIKTIGT:
- Svara ENBART med valid JSON — ingen markdown, inga code-fences utanför JSON-strängen.
- "message" är ALLTID med — beskriv vad du gjort, föreslå förbättringar, eller svara på frågor.
- "config" är med när du skapar en ny video eller ändrar en befintlig. Utelämna (null) om användaren bara frågar något.
- Om användaren ber dig ändra en befintlig video, utgå från currentConfig och modifiera enbart det som efterfrågas.
- Var kreativ men koncis i message — max 2-3 meningar. Nämn specifikt vad du ändrade.

═══ NORDEAS TONE OF VOICE ═══
Ledord: ${NORDEA_TONE_OF_VOICE.keywords.join(', ')}.
Kundinsikt: "${NORDEA_TONE_OF_VOICE.coreInsight}"
All text i videon ska vara: kort, varm, tydlig. Undvik bankjargong. Aktivt språk. Du/vi istället för Nordea/banken/kunden.
${NORDEA_AD_COPY_RULES.forbidden.map(r => `ALDRIG "${r.term}" → "${r.replaceWith}"`).join('. ')}.
Mjuka CTA:er: ${NORDEA_AD_COPY_RULES.preferred.softCTAs.join(', ')}.

═══ TYPOGRAFI ═══
Headlines: font-family '${NORDEA_FONT_FAMILIES.large.cssFamily}' med fontWeight 900 (Black) eller 700 (Bold).
Body/subtext: font-family '${NORDEA_FONT_FAMILIES.small.cssFamily}' med fontWeight 300 (Light) eller 400 (Regular).
CTA-text: font-family '${NORDEA_FONT_FAMILIES.small.cssFamily}' med fontWeight 500 (Medium), uppercase, letterSpacing 0.07em.

Scentyper, fält, fetstil, rubrikfärg, juridik och canvas-regler: se SCENKATALOG, TEXT, FÄRG OCH JURIDIK och ILLUSTRATIONER OCH FRI ANIMATION nedan.

Format-alternativ: "story" (9:16), "feed" (1:1), "landscape" (16:9), "vertical" (4:5)

Nordea-färger att använda:
- Bakgrund: "${NORDEA_COLORS.primary.blue.hex}" (Nordea Blue, standard)
- Accent: "${NORDEA_COLORS.accent.green.hex}" (Teal / CTA-grön)
- Alternativ bakgrund: "${NORDEA_COLORS.primary.deepBlue.hex}" (Deep Blue)
- Vivid Blue: "${NORDEA_COLORS.primary.vividBlue.hex}" (digital accent, sparsamt)
- Medium Blue: "${NORDEA_COLORS.primary.mediumBlue.hex}"
- Peach: "${NORDEA_COLORS.pink.medium.hex}" (sekundär bakgrund — text i Nordea Blue!)
- Accent Red: "${NORDEA_COLORS.accent.red.hex}" (varningar, sparsamt)
- Accent Yellow: "${NORDEA_COLORS.accent.yellow.hex}" (highlights, sparsamt)
- Grå: ${NORDEA_COLORS.gray.dark.hex} / ${NORDEA_COLORS.gray.medium.hex} / ${NORDEA_COLORS.gray.light.hex}

Regler:
- Varje scen ska ha durationSeconds (1.5-4 sekunder)
- Total video bör vara 5-12 sekunder
- Texten ska vara kort och slagkraftig — det är rörlig grafik, inte en artikel
- Avsluta med ett textkort ("title") med URL eller mjuk uppmaning; "cta"-scen (knapp) bara om användaren ber om det
- Ändrar användaren bara text eller färg i en canvas-scen: behåll tsxCode oförändrad
- Använd svenska som standard om inte annat anges
- Håll Nordeas professionella ton — korrekt men varm

Returnera ett JSON-objekt med denna struktur:
{
  "id": "generated-<timestamp>",
  "title": "<beskrivande titel>",
  "format": "story",
  "backgroundColor": "#0000A0",  // eller "#FFFFFF" för ljus variant — text blir då automatiskt Nordea Blue
  "accentColor": "#40BFA3",
  "scenes": [...],
  "showLogo": true,
  "totalDurationSeconds": <summa av alla sceners duration>
}`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentConfig, history } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt krävs" },
        { status: 400 }
      );
    }

    const client = getClaudeClient();

    if (!client) {
      const mockConfig = generateMockConfig(prompt);
      return NextResponse.json({
        config: mockConfig,
        message: `Här är en video baserad på "${prompt.slice(0, 50)}". Jag har skapat ${mockConfig.scenes.length} scener. ⚡ Mock-data (ingen API-nyckel konfigurerad).`,
        source: "mock",
      });
    }

    // Build conversation messages
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Include conversation history (last 10 turns max to stay within context)
    if (Array.isArray(history)) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Build the current user message with config context
    let userMessage = prompt;
    if (currentConfig) {
      userMessage = `Nuvarande video-konfiguration:\n${JSON.stringify(stripCompiledCanvas(currentConfig as VideoConfig), null, 2)}\n\nAnvändarens instruktion: ${prompt}`;
    }
    messages.push({ role: "user", content: userMessage });

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      // Canvas-scener bär egen kod — ge plats för flera illustrationer.
      max_tokens: 16000,
      system: withVisualGrammar(withMotionCapabilities(SYSTEM_PROMPT)),
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON response { message, config }
    let parsed: { message?: string; config?: VideoConfig };
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      parsed = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("Failed to parse Claude response:", text);
      return NextResponse.json(
        { error: "Kunde inte tolka AI-svaret", raw: text },
        { status: 500 }
      );
    }

    const assistantMessage = parsed.message || "Video uppdaterad.";
    const config = parsed.config;

    if (!config) {
      // Claude responded with just a message (no config change)
      return NextResponse.json({
        config: null,
        message: assistantMessage,
        source: "claude",
      });
    }

    // Validate basic structure
    if (!config.scenes || !Array.isArray(config.scenes)) {
      return NextResponse.json(
        { error: "Ogiltig video-konfiguration" },
        { status: 500 }
      );
    }

    config.totalDurationSeconds = config.scenes.reduce(
      (sum, s) => sum + (s.durationSeconds || 2),
      0
    );

    return NextResponse.json({
      config: await compileCanvasScenes(config),
      message: assistantMessage,
      source: "claude",
    });
  } catch (error) {
    console.error("Motion generate error:", error);
    return NextResponse.json(
      { error: "Något gick fel vid generering" },
      { status: 500 }
    );
  }
}

function generateMockConfig(prompt: string): VideoConfig {
  const lower = prompt.toLowerCase();

  // Detect topic and generate relevant content
  if (lower.includes("bolån") || lower.includes("bostad") || lower.includes("hus")) {
    return {
      id: `generated-${Date.now()}`,
      title: "Bolån kampanjvideo",
      format: "story",
      backgroundColor: "#0000A0",
      accentColor: "#40BFA3",
      scenes: [
        { type: "title", durationSeconds: 2.5, headline: "Dags att köpa\ndin första bostad?", subtitle: "Vi gör det enklare" },
        { type: "lottie", durationSeconds: 2.5, animationId: "house-keys", headline: "Ditt första hem", sizePercent: 55 },
        { type: "counter", durationSeconds: 3, label: "KONTANTINSATS FRÅN", fromValue: 0, toValue: 150000, suffix: " kr", description: "Med Nordeas bolånepaket" },
        { type: "highlight-number", durationSeconds: 2.5, number: "2,49%", label: "RÄNTA FRÅN", description: "Bunden ränta i 3 år" },
        { type: "cta", durationSeconds: 2, headline: "Beräkna ditt bolån", buttonText: "NORDEA.SE/BOLÅN", subtitle: "Få svar direkt" },
      ],
      showLogo: true,
      totalDurationSeconds: 12.5,
    };
  }

  if (lower.includes("spar") || lower.includes("fond") || lower.includes("invest")) {
    return {
      id: `generated-${Date.now()}`,
      title: "Sparande kampanjvideo",
      format: "story",
      backgroundColor: "#0000A0",
      accentColor: "#40BFA3",
      scenes: [
        { type: "title", durationSeconds: 2, headline: "Låt pengarna\njobba åt dig", subtitle: "Månadssparande i fonder" },
        { type: "lottie", durationSeconds: 2.5, animationId: "money-growth", headline: "Dina pengar växer", sizePercent: 55 },
        { type: "bars", durationSeconds: 3, title: "Avkastning senaste 5 åren", bars: [
          { label: "Sparkonto", value: 8, maxValue: 60 },
          { label: "Indexfond", value: 42, maxValue: 60 },
          { label: "Nordea Stars", value: 56, maxValue: 60, color: "#40BFA3" },
        ]},
        { type: "split", durationSeconds: 2.5, leftLabel: "Minsta insats", leftValue: "100 kr", rightLabel: "Per månad", rightValue: "500 kr" },
        { type: "cta", durationSeconds: 2, headline: "Börja spara idag", buttonText: "ÖPPNA KONTO", subtitle: "Det tar bara 3 minuter" },
      ],
      showLogo: true,
      totalDurationSeconds: 12,
    };
  }

  // Default generic mock
  return {
    id: `generated-${Date.now()}`,
    title: "Genererad video",
    format: "story",
    backgroundColor: "#0000A0",
    accentColor: "#40BFA3",
    scenes: [
      { type: "title", durationSeconds: 2.5, headline: "Nordea", subtitle: prompt.slice(0, 60) },
      { type: "text-reveal", durationSeconds: 3, lines: ["Vi finns här", "för dig", "varje dag"], highlight: "för dig" },
      { type: "icon-grid", durationSeconds: 3, title: "Våra tjänster", items: [
        { icon: "🏠", label: "Bolån", value: "Från 2,49%" },
        { icon: "💰", label: "Sparande", value: "100+ fonder" },
        { icon: "💳", label: "Kort", value: "Utan årsavgift" },
        { icon: "📱", label: "App", value: "Allt samlat" },
      ]},
      { type: "cta", durationSeconds: 2, headline: "Välkommen till Nordea", buttonText: "LÄS MER PÅ NORDEA.SE" },
    ],
    showLogo: true,
    totalDurationSeconds: 10.5,
  };
}
