import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireDb } from "@/lib/supabase/db";
import type { VideoConfig } from "@/lib/remotion/types";
import { compileCanvasScenes, stripCompiledCanvas } from "@/lib/remotion/compile";
import { DisplaySetSchema } from "@/lib/display/schema";

export const runtime = "nodejs";

// En kampanj med sitt material: videon (Motion Studio) och displaypaketet.

const BRIEF_FIELDS =
  "id, title, big_idea, insight, tension, key_message, key_messages, desired_action, audience_description, audience_personas, recommended_formats, recommended_channels, tone_of_voice";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .eq("created_by", ownerId)
      .maybeSingle();
    if (error) throw error;
    if (!campaign) return NextResponse.json({ error: "Kampanjen finns inte" }, { status: 404 });

    // Äldre kampanjer har videon bara i mallen.
    if (!campaign.video_config && campaign.template_ids?.[0]) {
      const { data: template } = await supabase
        .from("templates")
        .select("config")
        .eq("id", campaign.template_ids[0])
        .maybeSingle();
      campaign.video_config = template?.config ?? null;
    }

    let brief = null;
    if (campaign.brief_id) {
      const { data } = await supabase
        .from("creative_briefs")
        .select(BRIEF_FIELDS)
        .eq("id", campaign.brief_id)
        .eq("created_by", ownerId)
        .maybeSingle();
      brief = data;
    }

    return NextResponse.json({ campaign, brief });
  } catch (error) {
    console.error("[campaigns:get] error:", error);
    return NextResponse.json({ error: "Kunde inte hämta kampanjen" }, { status: 500 });
  }
}

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["draft", "in_review", "approved", "live"]).optional(),
  approval_notes: z.string().max(2000).nullable().optional(),
  video_config: z.custom<VideoConfig>((v) => !!v && Array.isArray((v as VideoConfig).scenes)).optional(),
  display_set: DisplaySetSchema.nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    const body = PatchSchema.parse(await request.json());
    const updates: Record<string, unknown> = { ...body };
    // Canvas-koden kompileras om på servern — klientens compiledJs lagras aldrig.
    if (body.video_config) updates.video_config = await compileCanvasScenes(stripCompiledCanvas(body.video_config));

    const { data, error } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .eq("created_by", ownerId)
      .select("id, name, status, updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Kampanjen finns inte" }, { status: 404 });
    return NextResponse.json({ campaign: data });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Ogiltiga ändringar" }, { status: 400 });
    console.error("[campaigns:patch] error:", error);
    return NextResponse.json({ error: "Kunde inte spara kampanjen" }, { status: 500 });
  }
}
