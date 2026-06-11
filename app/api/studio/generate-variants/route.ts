import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { z } from "zod";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import type { VideoConfig } from "@/lib/remotion/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  config: z.any(),
  count: z.number().min(1).max(5).default(3),
});

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `Du är en expert på Nordeas marknadsföringsannonser och Motion Design.

Användaren har en VideoConfig som specificerar en kampanjvideo. Strukturen:
- scenes: array av Scene-objekt med fält 'type', 'durationSeconds', plus type-specifika fält (headline/subtitle, label/fromValue/toValue/suffix, buttonText, etc.)
- motion.preset finns inte — istället sätts motion.text.stagger ('word' | 'character' | 'line' | 'none'), motion.cta.spring ('gentle' | 'standard' | 'snappy' | 'bouncy' | 'wobbly'), motion.transitions.style ('cut' | 'crossfade' | 'blur' | 'slide')

Din uppgift: generera ${"${count}"} distinkta variants med olika "vinkel":
1. MER ENERGISK (kortare durationSeconds, snappy cta.spring, snabba transitions)
2. MER LUGN (längre durationSeconds, gentle cta.spring, crossfade transitions)
3. FRÅGEBASERAD (formulera rubriker/CTA som frågor — samma motion-konfig som original)

För varje variant:
- Ändra Text-content (headlines, labels, CTA-texter) men behåll Nordea brand-tone (kreditkort, inte kort; ingen "fixar"; ej för säljpushig)
- Justera scen-durations om relevant
- Justera motion-fälten om relevant (energi/lugn)
- Behåll exakt samma scen-strukturer (samma 'type' per index) och samma backgroundColor/accentColor

Returnera ENDAST giltig JSON, inga förklaringar eller markdown:
{
  "variants": [
    {
      "id": "variant_1",
      "description": "Kort beskrivning av varianten (svenska, max 60 tecken)",
      "changes": [
        { "type": "motion", "description": "Snappy spring + 12-frames transitions" },
        { "type": "text", "description": "Kortare rubrik med utropstecken" }
      ],
      "full_config": { ...komplett VideoConfig — alla fält från originalet, modifierade enligt ovan... }
    }
  ]
}`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config, count } = RequestSchema.parse(body);

    const startTime = Date.now();

    if (!client) {
      return NextResponse.json({
        variants: generateMockVariants(config as VideoConfig, count),
        mock: true,
      });
    }

    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 6000,
      system: SYSTEM_PROMPT.replace("${count}", String(count)),
      messages: [
        {
          role: "user",
          content: `Här är min nuvarande VideoConfig:\n\n${JSON.stringify(
            config,
            null,
            2
          )}\n\nGenerera ${count} varianter.`,
        },
      ],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in Claude response");

    const parsed = JSON.parse(jsonMatch[0]) as {
      variants: Array<{
        id?: string;
        description: string;
        changes?: Array<{ type: string; description: string }>;
        full_config: VideoConfig;
      }>;
    };

    await logGeneration({
      user_id: "default-user",
      kind: "video",
      provider: "claude",
      model: CLAUDE_MODEL,
      prompt: "studio_variants",
      params: { config_scenes: (config as VideoConfig).scenes.length, count },
      cost_usd: 0.01,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    return NextResponse.json({
      variants: parsed.variants.map((v, i) => ({
        id: v.id || `variant_${Date.now()}_${i}`,
        config_diff: {
          description: v.description,
          changes: v.changes || [],
        },
        full_config: v.full_config,
      })),
    });
  } catch (error) {
    console.error("[studio:variants] generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate variants",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

function generateMockVariants(config: VideoConfig, count: number) {
  const angles = [
    {
      description: "Mer energisk · snabbare scener + snappy motion",
      changes: [
        { type: "motion" as const, description: "Snappy spring för CTA" },
        { type: "duration" as const, description: "Kortare scen-durations" },
      ],
      transform: (c: VideoConfig): VideoConfig => ({
        ...c,
        scenes: c.scenes.map((s) => ({
          ...s,
          durationSeconds: Math.max(1.5, s.durationSeconds * 0.7),
        })),
        motion: {
          ...(c.motion ?? {
            logo: { reveal: "spring" as const, duration: 18 },
            text: { stagger: "word" as const, delayBetween: 3, useSpring: false },
            cta: { reveal: "spring" as const, spring: "snappy" as const },
            transitions: { style: "crossfade" as const, duration: 12 },
            numbers: { enabled: true, duration: 45 },
          }),
          cta: { reveal: "spring" as const, spring: "snappy" as const },
          transitions: { style: "crossfade" as const, duration: 8 },
          text: {
            stagger: "character" as const,
            delayBetween: 2,
            useSpring: false,
          },
        },
      }),
    },
    {
      description: "Mer lugn · längre scener + gentle motion",
      changes: [
        { type: "motion" as const, description: "Gentle spring för CTA" },
        { type: "duration" as const, description: "Längre scen-durations" },
      ],
      transform: (c: VideoConfig): VideoConfig => ({
        ...c,
        scenes: c.scenes.map((s) => ({
          ...s,
          durationSeconds: s.durationSeconds * 1.4,
        })),
        motion: {
          ...(c.motion ?? {
            logo: { reveal: "spring" as const, duration: 18 },
            text: { stagger: "word" as const, delayBetween: 3, useSpring: false },
            cta: { reveal: "spring" as const, spring: "snappy" as const },
            transitions: { style: "crossfade" as const, duration: 12 },
            numbers: { enabled: true, duration: 45 },
          }),
          cta: { reveal: "fade" as const, spring: "gentle" as const },
          transitions: { style: "crossfade" as const, duration: 18 },
          text: {
            stagger: "word" as const,
            delayBetween: 5,
            useSpring: false,
          },
        },
      }),
    },
    {
      description: "Frågebaserade rubriker",
      changes: [
        { type: "text" as const, description: "Rubriker omformulerade som frågor" },
      ],
      transform: (c: VideoConfig): VideoConfig => ({
        ...c,
        scenes: c.scenes.map((s) => {
          if (s.type === "title") {
            return {
              ...s,
              headline: s.headline.endsWith("?")
                ? s.headline
                : `Vill du ${s.headline.toLowerCase()}?`,
            };
          }
          if (s.type === "cta") {
            return {
              ...s,
              headline: s.headline.endsWith("?")
                ? s.headline
                : `${s.headline}?`,
            };
          }
          return s;
        }),
      }),
    },
  ];

  return Array.from({ length: count }, (_, i) => {
    const angle = angles[i] ?? angles[0];
    return {
      id: `mock_variant_${Date.now()}_${i}`,
      config_diff: {
        description: angle.description,
        changes: angle.changes,
      },
      full_config: angle.transform(config),
    };
  });
}
