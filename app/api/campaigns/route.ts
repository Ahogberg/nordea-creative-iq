import { NextResponse } from "next/server";
import { z } from "zod";
import { parseCampaignChoices } from "@/lib/campaign-options";
import { requireDb } from "@/lib/supabase/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const db = await requireDb();
    if ("response" in db) return db.response;

    let query = db.supabase
      .from("campaigns")
      .select(
        "id, name, status, brief_id, channels, formats, template_ids, master_creative_ids, video_config, display_set, created_at, updated_at"
      )
      .eq("created_by", db.ownerId);
    const briefId = new URL(request.url).searchParams.get("brief_id");
    if (briefId) query = query.eq("brief_id", briefId);
    const { data, error } = await query.order("updated_at", { ascending: false }).limit(100);

    if (error) throw error;
    return NextResponse.json({ campaigns: data ?? [] });
  } catch (error) {
    console.error("[campaigns:list] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireDb();
    if ("response" in auth) return auth.response;
    const { ownerId, supabase } = auth;
    const body = await request.json().catch(() => null);
    const choices = parseCampaignChoices(body);
    if (!choices || !z.string().uuid().safeParse(body.briefId).success) {
      return NextResponse.json({ error: "Välj en brief, kanal och format." }, { status: 400 });
    }
    const { data: brief, error: briefError } = await supabase
      .from("creative_briefs")
      .select("id, title")
      .eq("id", body.briefId)
      .eq("created_by", ownerId)
      .single();
    if (briefError || !brief) {
      return NextResponse.json({ error: "Briefen hittades inte." }, { status: 404 });
    }
    const { data: existing, error: lookupError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("brief_id", brief.id)
      .eq("created_by", ownerId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    const fields = { channels: choices.channels, formats: choices.formats, updated_at: new Date().toISOString() };
    const result = existing
      ? await supabase.from("campaigns").update(fields).eq("id", existing.id).eq("created_by", ownerId).select().single()
      : await supabase.from("campaigns").insert({
          name: brief.title,
          brief_id: brief.id,
          channels: choices.channels,
          formats: choices.formats,
          template_ids: [],
          master_creative_ids: [],
          production_job_ids: [],
          status: "draft",
          created_by: ownerId,
        }).select().single();
    if (result.error) throw result.error;
    return NextResponse.json({ campaign: result.data });
  } catch (error) {
    console.error("[campaigns:save] error:", error);
    return NextResponse.json({ error: "Kunde inte spara kampanjen." }, { status: 500 });
  }
}
