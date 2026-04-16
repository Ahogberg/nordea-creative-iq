import { NextRequest, NextResponse } from "next/server";
import { getClaudeClient } from "@/lib/claude";
import type { VideoConfig, Scene } from "@/lib/remotion/types";
import { formatLibraryForPrompt } from "@/lib/remotion/lottie-library";
import { compileCanvasTsx } from "@/lib/remotion/compile";
import {
  NORDEA_COLORS,
  NORDEA_FONT_FAMILIES,
  NORDEA_AD_COPY_RULES,
  NORDEA_TONE_OF_VOICE,
} from "@/lib/nordea-brand-guidelines";

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

Tillgängliga scene-typer:
1. "title" — Headline + optional subtitle. Fält: headline (string), subtitle? (string), alignment? ("center"|"left")
2. "counter" — Animerad räknare. Fält: label (string), fromValue (number), toValue (number), suffix? (string), prefix? (string), description? (string)
3. "bars" — Stapeldiagram. Fält: title? (string), bars (array av {label, value, maxValue, color?})
4. "text-reveal" — Text som avslöjas rad för rad. Fält: lines (string[]), highlight? (string — text att highlighta i teal)
5. "icon-grid" — Rutnät med ikoner/emoji. Fält: title (string), items (array av {icon (emoji), label, value?})
6. "cta" — Call-to-action avslut. Fält: headline (string), buttonText (string), subtitle? (string)
7. "split" — Jämförelse sida vid sida. Fält: leftLabel, leftValue, rightLabel, rightValue, vsText?
8. "highlight-number" — Stort nummer med glödande ring. Fält: number (string), label (string), description? (string), accentColor?
9. "lottie" — Lottie-animation från curated bibliotek. Fält: animationId (string — MÅSTE vara en id från biblioteket nedan), headline? (string), caption? (string), sizePercent? (number 30-80, default 60), position? ("top"|"center"|"bottom"), loop? (boolean), playbackSpeed? (number)

Lottie-bibliotek (välj animationId ENDAST från denna lista):
${formatLibraryForPrompt()}

Lottie-scen används för illustrationer och ikonanimationer — välj en animationId vars "useFor" passar budskapet. Placera gärna en lottie-scen tidigt för att etablera tema, eller mitt i för att bryta av text-tunga scener.

10. "canvas" — FRIHANDSKOMPOSITION med TSX-kod. Använd när ingen mall räcker och användaren ber om något kreativt (linjer, former, custom layouts, partiklar, unika animationer). Fält:
    - tsxCode (string): En React-komponent som heter 'Scene' skriven i TSX. Se regler och exempel nedan.
    - description (string): En kort beskrivning av scenen (visas i UI:t).

Canvas-scen regler:
- Definiera komponenten som \`function Scene({ width, height, scale }) { ... }\`
- Returnera alltid en <AbsoluteFill>-rot
- ANVÄND INTE import-satser — alla primitiver finns redan i scope
- I scope: React, AbsoluteFill, Sequence, Img, useCurrentFrame, interpolate, spring, useVideoConfig, random, colors, fonts
- Animation-helpers i scope: fadeIn(frame, start, dur), fadeSlideUp(frame, start, dur, slide), easeOutExpo(t), easeInOutCubic(t), easeOutBack(t), easeOutElastic(t), scalePop(frame, start, dur, overshoot)
- Nordea-palett via colors-objektet: colors.nordeaBlue (#0000A0), colors.nordeaDeep (#00005E), colors.teal (#40BFA3), colors.white, colors.dimText
- Typsnitt via fonts: fonts.headline, fonts.body
- SKRIV INGA externa API-anrop (fetch, XMLHttpRequest), ingen eval, inga imports
- Använd useCurrentFrame() för tidsstyrda animationer
- Skala alla pixelvärden med 'scale' så det funkar i alla format (scale kommer som prop)
- SVG är perfekt för fri komposition av former och linjer
- Bakgrund: sätt backgroundColor på AbsoluteFill eller lämna transparent (video-configens bakgrund syns igenom)

EXEMPEL 1 — Diagonal linje som ritas upp, sen pulserande cirkel:
\`\`\`tsx
function Scene({ width, height, scale }) {
  const frame = useCurrentFrame();
  const drawProgress = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const pulseScale = 1 + 0.08 * Math.sin(frame * 0.2);
  const circleOpacity = fadeIn(frame, 30, 15);
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={width} height={height} viewBox={\`0 0 \${width} \${height}\`}>
        <line x1={width * 0.1} y1={height * 0.9} x2={width * 0.1 + (width * 0.75) * drawProgress} y2={height * 0.9 - (height * 0.75) * drawProgress} stroke={colors.teal} strokeWidth={8 * scale} strokeLinecap="round" />
        <circle cx={width * 0.85} cy={height * 0.15} r={60 * scale * pulseScale} fill={colors.teal} opacity={circleOpacity} />
      </svg>
    </AbsoluteFill>
  );
}
\`\`\`

EXEMPEL 2 — Roterande cirkel av prickar med centrerad text:
\`\`\`tsx
function Scene({ width, height, scale }) {
  const frame = useCurrentFrame();
  const rotation = frame * 1.5;
  const textOpacity = fadeIn(frame, 10, 20);
  const dots = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const r = 180 * scale;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, delay: i * 2 };
  });
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 400 * scale, height: 400 * scale, transform: \`rotate(\${rotation}deg)\` }}>
        {dots.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 16 * scale, height: 16 * scale, borderRadius: "50%", backgroundColor: colors.teal, transform: \`translate(\${d.x}px, \${d.y}px)\`, opacity: fadeIn(frame, d.delay, 10) }} />
        ))}
      </div>
      <div style={{ position: "absolute", fontFamily: fonts.headline, fontSize: 52 * scale, fontWeight: 900, color: colors.white, opacity: textOpacity, textAlign: "center" }}>
        Alltid i rörelse
      </div>
    </AbsoluteFill>
  );
}
\`\`\`

NÄR använda canvas-scen:
- Användaren ber om något specifikt visuellt ("rita en linje", "cirklar som roterar", "en våg")
- När ingen mall passar
- För abstrakta/dekorativa bakgrundselement
- För unika övergångar eller effekter

NÄR INTE använda canvas-scen:
- När en mall redan gör jobbet (title, counter, bars, cta, etc.) — mallarna ger bättre brand-konsekvens
- För ikon-rutnät → använd "icon-grid"
- För stapeldiagram → använd "bars"

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
      userMessage = `Nuvarande video-konfiguration:\n${JSON.stringify(currentConfig, null, 2)}\n\nAnvändarens instruktion: ${prompt}`;
    }
    messages.push({ role: "user", content: userMessage });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
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

    config.scenes = await Promise.all(
      config.scenes.map(async (scene: Scene) => {
        if (scene.type !== "canvas") return scene;
        if (!scene.tsxCode) {
          return { ...scene, compileError: "Ingen tsxCode angiven" };
        }
        const result = await compileCanvasTsx(scene.tsxCode);
        if (result.ok) {
          return { ...scene, compiledJs: result.compiledJs, compileError: undefined };
        }
        return { ...scene, compileError: result.error };
      })
    );

    return NextResponse.json({
      config,
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
