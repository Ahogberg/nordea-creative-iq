import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireUser();
    if ("response" in auth) return auth.response;
    const { supabase } = auth;

    const { data, error } = await supabase
      .from("campaigns")
      .select(
        "id, name, status, brief_id, template_ids, master_creative_ids, created_at, updated_at"
      )
      .order("updated_at", { ascending: false });

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
