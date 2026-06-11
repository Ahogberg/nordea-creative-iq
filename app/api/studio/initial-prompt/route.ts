import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { z } from "zod";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import {
  DEFAULT_MOTION_CONFIG,
  type VideoConfig,
} from "@/lib/remotion/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  prompt: z.string().min(1).max(2000),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `Du är en expert på Nordeas marknadsföringsannonser och Motion Design.

Användaren har skrivit en kort brief på naturligt språk om en kampanjvideo de vill skapa.
Din uppgift: översätt briefen till en komplett VideoConfig som Motion Studios renderare kan visa direkt.

VideoConfig-schemat (alla fält obligatoriska där inget annat sägs):
{
  "id": "generated-{timestamp}",
  "title": "Kort namn på videon (svenska, max 50 tecken)",
  "format": "story" | "feed" | "landscape" | "vertical",  // välj baserat på briefens kanaler
  "backgroundColor": "#0000A0",  // Nordea blue default — byt om briefen pekar på annat
  "accentColor": "#40BFA3",  // Nordea teal default
  "scenes": [ ...3-5 scener... ],
  "showLogo": true,
  "totalDurationSeconds": <sum av scenernas durationSeconds>,
  "motion": {
    "logo": { "reveal": "spring" | "fade" | "scale" | "slide-down" | "none", "duration": 18 },
    "text": { "stagger": "word" | "character" | "line" | "none", "delayBetween": 3, "useSpring": false },
    "cta": { "reveal": "fade" | "spring" | "scale" | "slide-up", "spring": "gentle" | "standard" | "snappy" | "bouncy" | "wobbly" },
    "transitions": { "style": "cut" | "crossfade" | "blur" | "slide", "duration": 12 },
    "numbers": { "enabled": true, "duration": 45 }
  }
}

Scen-typer du kan välja mellan:
- title:    { "type": "title", "durationSeconds": 2-3, "headline": "...", "subtitle"?: "...", "alignment"?: "center"|"left" }
- counter:  { "type": "counter", "durationSeconds": 2-4, "label": "VERSALER", "fromValue": 0, "toValue": <tal>, "suffix"?: " kr", "prefix"?: "" }
- cta:      { "type": "cta", "durationSeconds": 2-3, "headline": "...", "buttonText": "VERSALER", "subtitle"?: "..." }
- highlight-number: { "type": "highlight-number", "durationSeconds": 2-3, "number": "...", "label": "..." }
- text-reveal: { "type": "text-reveal", "durationSeconds": 3-4, "lines": ["...","..."] }

REGLER:
- Skriv ALLT på svenska (om briefen inte uttryckligen begär ett annat språk)
- Behåll Nordea brand-tone: kreditkort (ej kort), bolån (ej lån), ej för säljpushigt, ingen "fixar"
- Generera 3-5 scener med naturligt flöde: title → (counter/highlight) → cta
- För "bolån" / "förstagångsköpare" / "trygghet" → premium motion (gentle spring, längre durations)
- För "story" / "tiktok" / "reel" / "ung" → energetic motion (snappy spring, kortare durations)
- Om briefen är vag: gör rimliga antaganden men producera ALLTID komplett config
- totalDurationSeconds = exakt summan av scenernas durationSeconds

Returnera ENDAST giltig JSON för VideoConfig, inga förklaringar eller markdown.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = RequestSchema.parse(body);

    const startTime = Date.now();

    if (!client) {
      return NextResponse.json({
        config: buildMockConfig(prompt),
        mock: true,
      });
    }

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Brief: "${prompt}"\n\nGenerera en VideoConfig.`,
        },
      ],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const config = JSON.parse(jsonMatch[0]) as VideoConfig;

    // Hard-fix motion fallback in case Claude omits it.
    if (!config.motion) config.motion = DEFAULT_MOTION_CONFIG;
    // Recompute totalDurationSeconds defensively — Claude sometimes gets the
    // sum slightly off and the renderer reads this value directly.
    config.totalDurationSeconds = config.scenes.reduce(
      (sum, s) => sum + (s.durationSeconds || 0),
      0
    );

    await logGeneration({
      user_id: "default-user",
      kind: "video",
      provider: "claude",
      model: CLAUDE_MODEL,
      prompt: "studio_initial_prompt",
      params: { prompt_length: prompt.length },
      cost_usd: 0.01,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[studio:initial-prompt] error:", error);
    return NextResponse.json(
      {
        error: "Failed to process prompt",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

// Mock fallback — used only when ANTHROPIC_API_KEY is missing. Produces a
// realistic config that visibly reflects the prompt so the dev/demo UX
// works without burning credits. NOT triggered by billing/auth errors —
// those raise normal 500s so the user knows something is wrong.
function buildMockConfig(prompt: string): VideoConfig {
  const trimmed = prompt.trim();
  const firstSentence = trimmed.split(/[.!?\n]/)[0].trim();
  const headline =
    firstSentence.length > 0 && firstSentence.length <= 50
      ? firstSentence
      : trimmed.slice(0, 50);

  const lower = trimmed.toLowerCase();
  const isEnergetic = /story|tiktok|reel|ung|snabb|energi/.test(lower);
  const baseDuration = isEnergetic ? 2 : 2.8;

  return {
    id: `mock-${Date.now()}`,
    title: headline.slice(0, 50) || "Ny video",
    format: /landscape|16:9|youtube/.test(lower)
      ? "landscape"
      : /feed|instagram|1:1/.test(lower)
        ? "feed"
        : "story",
    backgroundColor: "#0000A0",
    accentColor: "#40BFA3",
    scenes: [
      {
        type: "title",
        durationSeconds: baseDuration,
        headline,
        subtitle: trimmed.slice(0, 80),
        alignment: "center",
      },
      {
        type: "counter",
        durationSeconds: baseDuration + 0.5,
        label: "EXEMPELVÄRDE",
        fromValue: 0,
        toValue: 2500,
        suffix: " kr",
      },
      {
        type: "cta",
        durationSeconds: baseDuration,
        headline: "Vill du veta mer?",
        buttonText: "BOKA RÅDGIVNING",
        subtitle: "Få ett svar inom 24 timmar",
      },
    ],
    showLogo: true,
    totalDurationSeconds: baseDuration * 3 + 0.5,
    motion: {
      ...DEFAULT_MOTION_CONFIG,
      cta: {
        reveal: "spring",
        spring: isEnergetic ? "snappy" : "gentle",
      },
    },
  };
}
