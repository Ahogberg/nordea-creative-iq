import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { supabase, user } = auth;

    const { data, error } = await supabase
      .from("qa_runs")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ run: data });
  } catch (error) {
    console.error("[qa] error fetching run:", error);
    return NextResponse.json({ error: "Failed to fetch QA run" }, { status: 500 });
  }
}
