import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";

export const runtime = "nodejs";

/**
 * QA-historiken: användarens senaste granskningar, nyast först.
 * Hela rapporten hämtas per rad via /api/qa/[id].
 */
export async function GET() {
  try {
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    const { data, error } = await supabase
      .from("qa_runs")
      .select("id, creative_kind, creative_ref, creative_metadata, total_score, status, approved_at, created_at")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ runs: data ?? [] });
  } catch (error) {
    console.error("[qa:list] error:", error);
    return NextResponse.json({ error: "Kunde inte hämta QA-historiken" }, { status: 500 });
  }
}
