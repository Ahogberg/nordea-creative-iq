import { NextRequest, NextResponse } from "next/server";
import { getClaudeClient } from "@/lib/claude";
import type { VideoConfig } from "@/lib/remotion/types";
import { DEFAULT_VIDEO_CONFIG } from "@/lib/remotion/types";

const SYSTEM_PROMPT = `Du är en kreativ motion graphics-designer på Nordea. Du genererar JSON-konfigurationer för animerade videos.

VIKTIGT: Du returnerar ENBART valid JSON — ingen markdown, inga code-fences, ingen förklaring.

Tillgängliga scene-typer:
1. "title" — Headline + optional subtitle. Fält: headline (string), subtitle? (string), alignment? ("center"|"left")
2. "counter" — Animerad räknare. Fält: label (string), fromValue (number), toValue (number), suffix? (string), prefix? (string), description? (string)
3. "bars" — Stapeldiagram. Fält: title? (string), bars (array av {label, value, maxValue, color?})
4. "text-reveal" — Text som avslöjas rad för rad. Fält: lines (string[]), highlight? (string — text att highlighta i teal)
5. "icon-grid" — Rutnät med ikoner/emoji. Fält: title (string), items (array av {icon (emoji), label, value?})
6. "cta" — Call-to-action avslut. Fält: headline (string), buttonText (string), subtitle? (string)
7. "split" — Jämförelse sida vid sida. Fält: leftLabel, leftValue, rightLabel, rightValue, vsText?
8. "highlight-number" — Stort nummer med glödande ring. Fält: number (string), label (string), description? (string), accentColor?

Format-alternativ: "story" (9:16), "feed" (1:1), "landscape" (16:9), "vertical" (4:5)

Nordea-färger att använda:
- Bakgrund: "#0000A0" (Nordea Blue, standard)
- Accent: "#40BFA3" (Teal)
- Alternativ bakgrund: "#00005E" (Deep Blue)

Regler:
- Varje scen ska ha durationSeconds (1.5-4 sekunder)
- Total video bör vara 5-12 sekunder
- Texten ska vara kort och slagkraftig — det är rörlig grafik, inte en artikel
- Avsluta alltid med en CTA-scen om det passar
- Använd svenska som standard om inte annat anges
- Håll Nordeas professionella ton — korrekt men varm

Returnera ett JSON-objekt med denna struktur:
{
  "id": "generated-<timestamp>",
  "title": "<beskrivande titel>",
  "format": "story",
  "backgroundColor": "#0000A0",
  "accentColor": "#40BFA3",
  "scenes": [...],
  "showLogo": true,
  "totalDurationSeconds": <summa av alla sceners duration>
}`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentConfig } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt krävs" },
        { status: 400 }
      );
    }

    const client = getClaudeClient();

    if (!client) {
      // Fallback: return a mock config based on the prompt
      const mockConfig = generateMockConfig(prompt);
      return NextResponse.json({ config: mockConfig, source: "mock" });
    }

    const userMessage = currentConfig
      ? `Nuvarande video-konfiguration:\n${JSON.stringify(currentConfig, null, 2)}\n\nAnvändarens instruktion: ${prompt}`
      : prompt;

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON from Claude's response
    let config: VideoConfig;
    try {
      // Try to extract JSON if wrapped in code fences
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [
        null,
        text,
      ];
      config = JSON.parse(jsonMatch[1]!.trim());
    } catch {
      console.error("Failed to parse Claude response:", text);
      return NextResponse.json(
        { error: "Kunde inte tolka AI-svaret", raw: text },
        { status: 500 }
      );
    }

    // Validate basic structure
    if (!config.scenes || !Array.isArray(config.scenes)) {
      return NextResponse.json(
        { error: "Ogiltig video-konfiguration" },
        { status: 500 }
      );
    }

    // Ensure totalDurationSeconds is correct
    config.totalDurationSeconds = config.scenes.reduce(
      (sum, s) => sum + (s.durationSeconds || 2),
      0
    );

    return NextResponse.json({ config, source: "claude" });
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
        { type: "counter", durationSeconds: 3, label: "KONTANTINSATS FRÅN", fromValue: 0, toValue: 150000, suffix: " kr", description: "Med Nordeas bolånepaket" },
        { type: "highlight-number", durationSeconds: 2.5, number: "2,49%", label: "RÄNTA FRÅN", description: "Bunden ränta i 3 år" },
        { type: "cta", durationSeconds: 2, headline: "Beräkna ditt bolån", buttonText: "NORDEA.SE/BOLÅN", subtitle: "Få svar direkt" },
      ],
      showLogo: true,
      totalDurationSeconds: 10,
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
        { type: "bars", durationSeconds: 3, title: "Avkastning senaste 5 åren", bars: [
          { label: "Sparkonto", value: 8, maxValue: 60 },
          { label: "Indexfond", value: 42, maxValue: 60 },
          { label: "Nordea Stars", value: 56, maxValue: 60, color: "#40BFA3" },
        ]},
        { type: "split", durationSeconds: 2.5, leftLabel: "Minsta insats", leftValue: "100 kr", rightLabel: "Per månad", rightValue: "500 kr" },
        { type: "cta", durationSeconds: 2, headline: "Börja spara idag", buttonText: "ÖPPNA KONTO", subtitle: "Det tar bara 3 minuter" },
      ],
      showLogo: true,
      totalDurationSeconds: 9.5,
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
