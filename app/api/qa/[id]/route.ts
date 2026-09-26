import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    const { data, error } = await supabase
      .from("qa_runs")
      .select("*")
      .eq("id", id)
      .eq("user_id", ownerId)
      .single();

    if (error) throw error;

    return NextResponse.json({ run: data });
  } catch (error) {
    console.error("[qa] error fetching run:", error);
    return NextResponse.json({ error: "Failed to fetch QA run" }, { status: 500 });
  }
}
