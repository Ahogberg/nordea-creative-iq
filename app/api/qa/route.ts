import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { data, error } = await auth.supabase.from("qa_runs")
    .select("id, creative_kind, creative_ref, creative_metadata, status, total_score, blocking_issues, warnings, suggestions, approved_at, created_at, error_message")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false }).limit(100);
  if (error) {
    console.error("[qa:list]", error);
    return NextResponse.json({ error: "Granskningarna kunde inte laddas" }, { status: 500 });
  }
  return NextResponse.json({ runs: data ?? [] });
}
