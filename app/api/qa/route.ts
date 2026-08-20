import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/qa — latest QA runs for the list rail on the QA page.
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("qa_runs")
      .select(
        "id, creative_kind, creative_ref, creative_metadata, total_score, persona_score, tov_score, compliance_score, heatmap_score, status, persona_results, tov_results, compliance_results, heatmap_results, suggestions, warnings, blocking_issues, approved_by, approved_at, created_at, completed_at"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ runs: data ?? [] });
  } catch (error) {
    console.error("[qa] error listing runs:", error);
    return NextResponse.json({ runs: [] });
  }
}
