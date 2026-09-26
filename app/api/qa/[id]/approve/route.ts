import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    // Only 'warn' runs can be manually approved. 'fail' (blocking compliance)
    // must be re-run after the underlying issue is fixed.
    const { data: run, error: fetchError } = await supabase
      .from("qa_runs")
      .select("status")
      .eq("id", id)
      .eq("user_id", ownerId)
      .single();

    if (fetchError) throw fetchError;

    if (run?.status === "fail") {
      return NextResponse.json(
        { error: "Cannot approve a failed QA run — fix the blocking issue and re-run" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("qa_runs")
      .update({
        approved_by: ownerId,
        approved_at: new Date().toISOString(),
        approval_note: body?.note ?? null,
      })
      .eq("id", id)
      .eq("user_id", ownerId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[qa] approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
