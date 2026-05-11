import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  message: z.string().min(1).max(1000),
  config: z.any(),
  selected_scene_index: z.number().nullable(),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `Du är en AI-assistent i en video-editor (Motion Studio). Användare beskriver ändringar de vill göra på naturligt språk, och du översätter det till konkreta actions.

VideoConfig-strukturen:
- scenes: array av Scene-objekt. Scene-typer: 'title' (fält: headline, subtitle?, alignment?), 'counter' (label, fromValue, toValue, suffix?, prefix?, description?), 'cta' (headline, buttonText, subtitle?), 'highlight-number' (number, label, description?, accentColor?), 'text-reveal' (lines, highlight?), 'bars', 'icon-grid', 'split', 'lottie'. Alla scener har 'durationSeconds' (sekunder, ej frames).
- motion: { text: { stagger: 'word'|'character'|'line'|'none', delayBetween: number, useSpring: boolean }, cta: { reveal: 'fade'|'spring'|'scale'|'slide-up', spring: 'gentle'|'standard'|'snappy'|'bouncy'|'wobbly' }, transitions: { style: 'cut'|'crossfade'|'blur'|'slide', duration: number }, logo: { reveal: ..., duration }, numbers: { enabled, duration } }

Möjliga actions:
1. update_scene: { "type": "update_scene", "scene_index": N, "updates": { ...partial scene props med RÄTT fältnamn för scen-typen... } }
2. update_motion: { "type": "update_motion", "motion": { ...complete MotionConfig... } }
3. add_scene: { "type": "add_scene", "scene": { "type": "title"|"cta"|..., "durationSeconds": N, ...övriga obligatoriska fält... } }
4. remove_scene: { "type": "remove_scene", "scene_index": N }

REGLER:
- Om användaren refererar till "scen X" → scene_index = X-1 (0-indexed)
- Om användaren säger "denna scen" / "rubriken" / "texten" och en scen är vald → använd selected_scene_index
- Om oklart vilken scen → applicera på selected_scene_index om finns, annars 0
- Använd ALLTID rätt fältnamn (headline ej "text", durationSeconds ej "duration")
- För title-scen: headline är huvudtext, subtitle är undertitel
- För cta-scen: headline är överrad, buttonText är knapp, subtitle är underrad
- För "mer energisk" → kortare durationSeconds + cta.spring='snappy' + text.stagger='character'
- För "lugnare" / "mer premium" → längre durationSeconds + cta.spring='gentle' + transitions.duration högre
- Behåll Nordea brand-tone (kreditkort ej kort, ingen "fixar", ej för säljpushigt)

Returnera ENDAST giltig JSON, inga förklaringar eller markdown:
{
  "actions": [ ...action-objekt... ],
  "explanation": "Kort förklaring på svenska (max 60 tecken)"
}

EXEMPEL:

User: "Gör hela videon mer energisk"
Response: {"actions":[{"type":"update_motion","motion":{"logo":{"reveal":"spring","duration":12},"text":{"stagger":"character","delayBetween":2,"useSpring":false},"cta":{"reveal":"spring","spring":"snappy"},"transitions":{"style":"crossfade","duration":8},"numbers":{"enabled":true,"duration":30}}}],"explanation":"Snabbare tempo + snappy spring"}

User: "Byt rubriken på första scenen till Drömhuset väntar"
Response: {"actions":[{"type":"update_scene","scene_index":0,"updates":{"headline":"Drömhuset väntar"}}],"explanation":"Uppdaterat rubrik"}

User: "Lägg till en CTA-scen"
Response: {"actions":[{"type":"add_scene","scene":{"type":"cta","durationSeconds":2,"headline":"Kom igång idag","buttonText":"BOKA RÅDGIVNING","subtitle":"Få ett ja inom 24 timmar"}}],"explanation":"Lade till CTA-scen"}

User: "Ta bort scen 3"
Response: {"actions":[{"type":"remove_scene","scene_index":2}],"explanation":"Tog bort scen 3"}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, config, selected_scene_index } = RequestSchema.parse(body);

    const startTime = Date.now();

    if (!client) {
      return NextResponse.json({
        actions: [],
        explanation: "Chat-AI ej konfigurerad (saknar ANTHROPIC_API_KEY)",
        mock: true,
      });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Nuvarande VideoConfig:\n${JSON.stringify(
            config,
            null,
            2
          )}\n\nVald scen: ${
            selected_scene_index ?? "ingen"
          }\n\nAnvändarens meddelande: "${message}"`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const parsed = JSON.parse(jsonMatch[0]) as {
      actions?: unknown[];
      explanation?: string;
    };

    await logGeneration({
      user_id: "default-user",
      kind: "video",
      provider: "claude",
      model: "claude-sonnet-4-5-20250929",
      prompt: "studio_chat",
      params: { message_length: message.length },
      cost_usd: 0.003,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json({
      actions: parsed.actions ?? [],
      explanation: parsed.explanation ?? "Klar",
    });
  } catch (error) {
    console.error("[studio:chat] intent error:", error);
    return NextResponse.json(
      {
        error: "Chat intent failed",
        actions: [],
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
