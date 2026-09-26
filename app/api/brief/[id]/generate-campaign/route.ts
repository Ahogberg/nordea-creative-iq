import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/ai/anthropic";
import { requireDb, type Db } from "@/lib/supabase/db";
import { aiErrorMessage } from "@/lib/ai/error-message";
import { logGeneration } from "@/lib/ai/providers/cost-tracker";
import {
  DEFAULT_MOTION_CONFIG,
  type VideoConfig,
} from "@/lib/remotion/types";
import { withVisualGrammar } from "@/lib/brand/visual-grammar";
import { withMotionCapabilities } from "@/lib/remotion/prompt-capabilities";
import { compileCanvasScenes } from "@/lib/remotion/compile";

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
  "backgroundColor": "#0000A0",  // eller "#FFFFFF" för ljus variant — text blir då automatiskt Nordea Blue
  "accentColor": "#40BFA3",
  "headlineColor"?: "#FBD9CA",
  "legal"?: { "riskNote"?: "...", "creditWarning"?: { "fromSeconds"?: 0 } },
  "scenes": [ ...2-4 scener... ],
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

Scentyper: se SCENKATALOG nedan. Utgå från layout-arketyperna och rörelserecepten i NORDEAS VISUELLA GRAMMATIK längst ned när briefen inte säger något annat — egna idéer och fri animation (canvas) är välkomna inom varumärkets fasta ramar.

REGLER:
- Använd strategins big_idea som ledtanke för första scenen (illustrationsscen eller titel)
- Plocka EN av strategins key_messages för rubriker (välj den som passar valt format bäst)
- Använd EN av desired_action som avslut: URL eller mjuk uppmaning i ett textkort (cta-scen bara om strategin kräver en knapp)
- Kreditprodukter: legal.creditWarning och en terms-scen. Sparande: legal.riskNote.
- Om recommended_formats finns: använd första format-värdet
- totalDurationSeconds = exakt summan
- Behåll Nordea brand-tone

Returnera ENDAST giltig JSON för VideoConfig.`;

// En kampanj per brief. Finns den redan returneras den som den är — sidan
// genererar alltså inte om vid varje besök. { regenerate: true } skriver en ny
// video till samma kampanj (och samma mall/master) i stället för att skapa nya.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: briefId } = await params;
    const body = (await request.json().catch(() => null)) as { regenerate?: boolean } | null;
    const regenerate = body?.regenerate === true;

    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    const { data: brief, error: briefError } = await supabase
      .from("creative_briefs")
      .select("*")
      .eq("id", briefId)
      .eq("created_by", ownerId)
      .single();

    if (briefError || !brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    const { data: existing } = await supabase
      .from("campaigns")
      .select("*")
      .eq("brief_id", briefId)
      .eq("created_by", ownerId)
      .maybeSingle();

    if (existing?.video_config && !regenerate) {
      return NextResponse.json({ campaign: existing, created: false });
    }

    const config = await generateConfig(brief, briefId);
    const name = brief.title || "Kampanj från brief";

    // En mall och en master per kampanj — uppdateras vid omgenerering.
    const templateId = await upsertTemplate(db, existing?.template_ids?.[0] ?? null, name, brief, config);
    const masterId = await upsertMaster(db, existing?.master_creative_ids?.[0] ?? null, name, brief, config);

    let campaign: Record<string, unknown> | null = null;
    if (existing) {
      const { data, error } = await supabase
        .from("campaigns")
        .update({
          video_config: config,
          template_ids: [templateId],
          master_creative_ids: masterId ? [masterId] : [],
        })
        .eq("id", existing.id)
        .eq("created_by", ownerId)
        .select()
        .single();
      if (error) throw error;
      campaign = data;
    } else {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          name,
          brief_id: briefId,
          video_config: config,
          master_creative_ids: masterId ? [masterId] : [],
          template_ids: [templateId],
          production_job_ids: [],
          status: "draft",
          created_by: ownerId,
        })
        .select()
        .single();
      if (error?.code === "23505") {
        // Två flikar samtidigt: den andra hann skapa kampanjen — använd den.
        const { data: winner } = await supabase
          .from("campaigns")
          .select("*")
          .eq("brief_id", briefId)
          .eq("created_by", ownerId)
          .single();
        return NextResponse.json({ campaign: winner, created: false });
      }
      if (error) throw error;
      campaign = data;
    }

    // Briefen är använd — den visas inte längre under "Pågående briefer".
    await supabase
      .from("creative_briefs")
      .update({ status: "used", updated_at: new Date().toISOString() })
      .eq("id", briefId)
      .eq("created_by", ownerId);

    return NextResponse.json({ campaign, created: true });
  } catch (error) {
    console.error("[brief:generate-campaign] error:", error);
    return NextResponse.json(
      { error: aiErrorMessage(error, "Kampanjen kunde inte skapas") },
      { status: 500 }
    );
  }
}

async function generateConfig(brief: Record<string, unknown>, briefId: string): Promise<VideoConfig> {
  if (!client) return buildMockConfig(brief);
  const startTime = Date.now();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 12000,
    system: withVisualGrammar(withMotionCapabilities(CONFIG_PROMPT)),
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

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI:n svarade inte med en video");

  const config = await compileCanvasScenes(JSON.parse(jsonMatch[0]) as VideoConfig);
  if (!config.motion) config.motion = DEFAULT_MOTION_CONFIG;
  config.totalDurationSeconds = config.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  await logGeneration({
    kind: "video",
    provider: "claude",
    model: CLAUDE_MODEL,
    prompt: "brief_to_campaign",
    params: { brief_id: briefId },
    cost_usd: 0.015,
    latency_ms: Date.now() - startTime,
    status: "success",
  });
  return config;
}

async function upsertTemplate(
  { supabase, ownerId }: Db,
  id: string | null,
  name: string,
  brief: Record<string, unknown>,
  config: VideoConfig
): Promise<string> {
  const description = `[Från brief] ${typeof brief.big_idea === "string" ? brief.big_idea.slice(0, 200) : ""}`;
  if (id) {
    const { data } = await supabase
      .from("templates")
      .update({ name, description, config })
      .eq("id", id)
      .eq("user_id", ownerId)
      .select("id")
      .maybeSingle();
    if (data) return data.id;
  }
  const { data, error } = await supabase
    .from("templates")
    .insert({ user_id: ownerId, name, description, config, is_favorite: false })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertMaster(
  { supabase, ownerId }: Db,
  id: string | null,
  name: string,
  brief: Record<string, unknown>,
  config: VideoConfig
): Promise<string | null> {
  const formats = brief.recommended_formats;
  const sourceFormat = Array.isArray(formats) && typeof formats[0] === "string" ? formats[0] : config.format;
  if (id) {
    const { data } = await supabase
      .from("master_creatives")
      .update({ name, source_format: sourceFormat, master_config: config, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("created_by", ownerId)
      .select("id")
      .maybeSingle();
    if (data) return data.id;
  }
  const { data, error } = await supabase
    .from("master_creatives")
    .insert({ name, source_format: sourceFormat, master_config: config, created_by: ownerId })
    .select("id")
    .single();
  if (error) {
    console.error("[brief:generate-campaign] master kunde inte sparas:", error.message);
    return null;
  }
  return data.id;
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
