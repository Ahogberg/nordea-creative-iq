import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const db = await requireDb();
    if ("response" in db) return db.response;

    let query = db.supabase
      .from("campaigns")
      .select(
        "id, name, status, brief_id, template_ids, master_creative_ids, created_at, updated_at"
      )
      .eq("created_by", db.ownerId);
    const briefId = new URL(request.url).searchParams.get("brief_id");
    if (briefId) query = query.eq("brief_id", briefId);
    const { data, error } = await query.order("updated_at", { ascending: false });

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
