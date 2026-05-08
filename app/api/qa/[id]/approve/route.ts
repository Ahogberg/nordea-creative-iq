import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const supabase = await createClient();

    // Only 'warn' runs can be manually approved. 'fail' (blocking compliance)
    // must be re-run after the underlying issue is fixed.
    const { data: run, error: fetchError } = await supabase
      .from("qa_runs")
      .select("status")
      .eq("id", id)
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
        approved_by: "default-user",
        approved_at: new Date().toISOString(),
        approval_note: body?.note ?? null,
      })
      .eq("id", id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[qa] approve error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
