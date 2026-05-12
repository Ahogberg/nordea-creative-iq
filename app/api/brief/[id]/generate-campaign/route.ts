import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import {
  DEFAULT_MOTION_CONFIG,
  type VideoConfig,
} from "@/lib/remotion/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const CONFIG_PROMPT = `Du är seniör Motion Designer på Nordeas marknadsteam. Du har en färdig kampanj-strategi och ska översätta den till en konkret VideoConfig som Motion Studios renderare kan visa.

VideoConfig-schemat:
{
  "id": "generated-{timestamp}",
  "title": "Kort namn (max 50 tecken)",
  "format": "story" | "feed" | "landscape" | "vertical",
  "backgroundColor": "#0000A0",
  "accentColor": "#40BFA3",
  "scenes": [ ...3-5 scener... ],
  "showLogo": true,
  "totalDurationSeconds": <summan av durationSeconds>,
  "motion": {
    "logo": { "reveal": "spring", "duration": 18 },
    "text": { "stagger": "word"|"character"|"line"|"none", "delayBetween": 3, "useSpring": false },
    "cta": { "reveal": "fade"|"spring"|"scale"|"slide-up", "spring": "gentle"|"standard"|"snappy"|"bouncy"|"wobbly" },
    "transitions": { "style": "cut"|"crossfade"|"blur"|"slide", "duration": 12 },
    "numbers": { "enabled": true, "duration": 45 }
  }
}

Scen-typer:
- title:    { "type": "title", "durationSeconds": 2-3, "headline": "...", "subtitle"?: "...", "alignment"?: "center"|"left" }
- counter:  { "type": "counter", "durationSeconds": 2-4, "label": "VERSALER", "fromValue": 0, "toValue": <tal>, "suffix"?: " kr" }
- cta:      { "type": "cta", "durationSeconds": 2-3, "headline": "...", "buttonText": "VERSALER", "subtitle"?: "..." }
- highlight-number: { "type": "highlight-number", "durationSeconds": 2-3, "number": "...", "label": "..." }
- text-reveal: { "type": "text-reveal", "durationSeconds": 3-4, "lines": ["...","..."] }

REGLER:
- Använd strategins big_idea som ledtanke för title-scen
- Plocka EN av strategins key_messages för rubriker (välj den som passar valt format bäst)
- Använd EN av desired_action / CTAs som CTA-scen
- Om recommended_formats finns: använd första format-värdet
- totalDurationSeconds = exakt summan
- Behåll Nordea brand-tone

Returnera ENDAST giltig JSON för VideoConfig.`;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: briefId } = await params;

    const supabase = await createClient();

    const { data: brief, error: briefError } = await supabase
      .from("creative_briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    const startTime = Date.now();

    let config: VideoConfig;

    if (!client) {
      config = buildMockConfig(brief);
    } else {
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        system: CONFIG_PROMPT,
        messages: [
          {
            role: "user",
            content: `Strategi för kampanjen:\n${JSON.stringify(
              {
                big_idea: brief.big_idea,
                insight: brief.insight,
                tension: brief.tension,
                key_messages: brief.key_messages,
                value_props: brief.value_props,
                desired_action: brief.desired_action,
                tone_of_voice: brief.tone_of_voice,
                recommended_formats: brief.recommended_formats,
              },
              null,
              2
            )}\n\nGenerera en VideoConfig som passar.`,
          },
        ],
      });

      const text =
        response.content[0]?.type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in Claude response");

      config = JSON.parse(jsonMatch[0]) as VideoConfig;
      if (!config.motion) config.motion = DEFAULT_MOTION_CONFIG;
      config.totalDurationSeconds = config.scenes.reduce(
        (sum, s) => sum + (s.durationSeconds || 0),
        0
      );

      await logGeneration({
        user_id: "default-user",
        kind: "video",
        provider: "claude",
        model: "claude-sonnet-4-5-20250929",
        prompt: "brief_to_campaign",
        params: { brief_id: briefId },
        cost_usd: 0.015,
        latency_ms: Date.now() - startTime,
        status: "success",
      });
    }

    // Always save as a regular template (lives on main since Sprint 3 — safe).
    const templateName = brief.title || "Kampanj från brief";
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .insert({
        user_id: "default-user",
        name: templateName,
        description: `[Från brief] ${brief.big_idea?.slice(0, 200) || ""}`,
        config,
        is_favorite: false,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Try Master Creative (Sprint 9) — if the table is missing because that
    // sprint hasn't merged yet, treat as a soft miss and continue. The user
    // still gets a template + campaign row.
    let masterId: string | null = null;
    try {
      const sourceFormat =
        Array.isArray(brief.recommended_formats) &&
        brief.recommended_formats.length > 0
          ? brief.recommended_formats[0]
          : config.format;
      const { data: master, error: masterError } = await supabase
        .from("master_creatives")
        .insert({
          name: templateName,
          source_format: sourceFormat,
          master_config: config,
          created_by: "default-user",
        })
        .select()
        .single();
      if (!masterError && master) {
        masterId = master.id;
      }
    } catch {
      // Sprint 9 not deployed — fine.
    }

    // Create the campaign row tying brief → template (+ master if available).
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        name: templateName,
        brief_id: briefId,
        master_creative_ids: masterId ? [masterId] : [],
        template_ids: [template.id],
        production_job_ids: [],
        status: "draft",
        created_by: "default-user",
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Flip brief status so it stops showing up under "Pågående briefer".
    await supabase
      .from("creative_briefs")
      .update({ status: "used", updated_at: new Date().toISOString() })
      .eq("id", briefId);

    return NextResponse.json({
      campaign,
      template_id: template.id,
      master_id: masterId,
      config,
    });
  } catch (error) {
    console.error("[brief:generate-campaign] error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate campaign",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

function buildMockConfig(brief: Record<string, unknown>): VideoConfig {
  const bigIdea =
    typeof brief.big_idea === "string" ? brief.big_idea : "Kampanj";
  const desiredAction =
    typeof brief.desired_action === "string"
      ? brief.desired_action
      : "Kontakta oss";
  const format =
    Array.isArray(brief.recommended_formats) &&
    typeof brief.recommended_formats[0] === "string"
      ? (brief.recommended_formats[0] as VideoConfig["format"])
      : "story";

  return {
    id: `mock-${Date.now()}`,
    title: bigIdea.slice(0, 50),
    format,
    backgroundColor: "#0000A0",
    accentColor: "#40BFA3",
    scenes: [
      {
        type: "title",
        durationSeconds: 2.5,
        headline: bigIdea.slice(0, 60),
        subtitle: typeof brief.insight === "string" ? brief.insight : undefined,
        alignment: "center",
      },
      {
        type: "cta",
        durationSeconds: 2,
        headline: bigIdea.slice(0, 50),
        buttonText: desiredAction.slice(0, 30).toUpperCase(),
        subtitle: "Tillsammans",
      },
    ],
    showLogo: true,
    totalDurationSeconds: 4.5,
    motion: DEFAULT_MOTION_CONFIG,
  };
}
