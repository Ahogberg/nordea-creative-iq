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
      .select("status, approved_at")
      .eq("id", id)
      .eq("user_id", ownerId)
      .single();

    if (fetchError) throw fetchError;

    // Bara färdiga granskningar över eller strax under tröskeln kan godkännas.
    // 'fail' (blockerande compliance) ska åtgärdas och köras om.
    if (run?.status !== "pass" && run?.status !== "warn") {
      return NextResponse.json(
        { error: "Bara granskningar som är klara och inte blockerade kan godkännas." },
        { status: 400 }
      );
    }
    if (run.approved_at) {
      return NextResponse.json({ error: "Granskningen är redan godkänd." }, { status: 409 });
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
