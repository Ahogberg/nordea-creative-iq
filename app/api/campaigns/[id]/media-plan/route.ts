import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/lib/supabase/db";
import { MediaPlanSchema } from "@/lib/campaigns/media-plan";
export const runtime = "nodejs";

async function ownedCampaign(id: string) {
  if (!z.uuid().safeParse(id).success) return { response: NextResponse.json({ error: "Ogiltig kampanj" }, { status: 400 }) };
  const db = await requireDb();
  if ("response" in db) return db;
  if (db.isDemo) return { response: NextResponse.json({ error: "Sparad mediaplanering kräver ett inloggat Nordea-konto. I demoläget kan du beräkna och exportera budgeten." }, { status: 503 }) };
  const { data, error } = await db.supabase.from("campaigns").select("id, name").eq("id", id).eq("created_by", db.ownerId).maybeSingle();
  if (error) throw error;
  if (!data) return { response: NextResponse.json({ error: "Kampanjen finns inte" }, { status: 404 }) };
  return { ...db, campaign: data };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await ownedCampaign(id);
    if ("response" in db) return db.response;
    // One linked plan uses the campaign's UUID as its own primary key.
    const { data, error } = await db.supabase.from("campaign_plans").select("budget, duration_days, channel_mix, audience").eq("id", id).eq("user_id", db.ownerId).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ plan: data ? MediaPlanSchema.parse({ ...data, budget: Number(data.budget) }) : null });
  } catch (error) {
    console.error("[campaign-media-plan:get]", error);
    return NextResponse.json({ error: "Budgetplanen kunde inte hämtas" }, { status: 500 });
  }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await ownedCampaign(id);
    if ("response" in db) return db.response;
    const result = MediaPlanSchema.safeParse(await request.json());
    if (!result.success) return NextResponse.json({ error: result.error.issues[0]?.message ?? "Ogiltig budgetplan" }, { status: 400 });
    const { error } = await db.supabase.from("campaign_plans").upsert({ id, user_id: db.ownerId, name: db.campaign.name, ...result.data, updated_at: new Date().toISOString() }, { onConflict: "id" });
    if (error) throw error;
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[campaign-media-plan:save]", error);
    return NextResponse.json({ error: "Budgetplanen kunde inte sparas" }, { status: 500 });
  }
}
