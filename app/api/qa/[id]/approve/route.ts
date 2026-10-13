import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const auth = await requireDb();
    if ("response" in auth) return auth.response;
    const { supabase, ownerId } = auth;

    // Only completed non-blocking runs can be manually approved. 'fail' (blocking compliance)
    // must be re-run after the underlying issue is fixed.
    const { data: run, error: fetchError } = await supabase
      .from("qa_runs")
      .select("status, blocking_issues, approved_at")
      .eq("id", id)
      .eq("user_id", ownerId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!run) return NextResponse.json({ error: "Granskningen hittades inte" }, { status: 404 });
    if (!["pass", "warn"].includes(run.status) || run.approved_at || (run.blocking_issues ?? []).length > 0) {
      return NextResponse.json(
        { error: "Endast avslutade granskningar utan blockerande problem kan godkännas" },
        { status: 400 }
      );
    }

    const { data: approved, error: updateError } = await supabase
      .from("qa_runs")
      .update({
        approved_by: ownerId,
        approved_at: new Date().toISOString(),
        approval_note: typeof body?.note === "string" ? body.note.slice(0, 2000) : null,
      })
      .eq("id", id)
      .eq("user_id", ownerId)
      .eq("status", run.status)
      .is("approved_at", null)
      .select("id")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!approved) return NextResponse.json({ error: "Granskningen har ändrats. Ladda om sidan." }, { status: 409 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[qa] approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
