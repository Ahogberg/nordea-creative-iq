import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { parseCampaignChoices } from "@/lib/campaign-options";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;
    const briefId = new URL(request.url).searchParams.get("briefId");

    let query = supabase
      .from("campaigns")
      .select(
        "id, name, status, brief_id, channels, formats, template_ids, master_creative_ids, created_at, updated_at"
      )
      .order("updated_at", { ascending: false });
    if (briefId) query = query.eq("brief_id", briefId);
    const { data, error } = await query;

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
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { user, supabase } = auth;
    const body = await request.json().catch(() => null);
    const choices = parseCampaignChoices(body);
    if (!choices || typeof body.briefId !== "string") {
      return NextResponse.json({ error: "Välj en brief, kanal och format." }, { status: 400 });
    }
    const { data: brief, error: briefError } = await supabase
      .from("creative_briefs")
      .select("id, title")
      .eq("id", body.briefId)
      .single();
    if (briefError || !brief) {
      return NextResponse.json({ error: "Briefen hittades inte." }, { status: 404 });
    }
    const { data: existing, error: lookupError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("brief_id", brief.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    const fields = { channels: choices.channels, formats: choices.formats, updated_at: new Date().toISOString() };
    const result = existing
      ? await supabase.from("campaigns").update(fields).eq("id", existing.id).select().single()
      : await supabase.from("campaigns").insert({
          name: brief.title,
          brief_id: brief.id,
          channels: choices.channels,
          formats: choices.formats,
          template_ids: [],
          master_creative_ids: [],
          production_job_ids: [],
          status: "draft",
          created_by: user.id,
        }).select().single();
    if (result.error) throw result.error;
    return NextResponse.json({ campaign: result.data });
  } catch (error) {
    console.error("[campaigns:save] error:", error);
    return NextResponse.json({ error: "Kunde inte spara kampanjen." }, { status: 500 });
  }
}
