import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("campaigns")
    .select("id, name, status, brief_id, channels, formats, template_ids, master_creative_ids, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Kampanjen hittades inte." }, { status: 404 });
  const templateIds = data.template_ids ?? [];
  const { data: templates, error: templatesError } = templateIds.length
    ? await auth.supabase.from("templates").select("id, name, config").in("id", templateIds)
    : { data: [], error: null };
  if (templatesError) {
    console.error("[campaigns:detail] templates error:", templatesError);
    return NextResponse.json({ error: "Kampanjmaterialet kunde inte laddas." }, { status: 500 });
  }
  const { data: runs, error: qaError } = templateIds.length
    ? await auth.supabase.from("qa_runs").select("id, creative_ref, status, approved_at, created_at")
      .eq("user_id", auth.user.id).eq("creative_kind", "template")
      .in("creative_ref", templateIds).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (qaError) return NextResponse.json({ error: "Granskningsstatus kunde inte laddas" }, { status: 500 });
  return NextResponse.json({
    campaign: data,
    templates: (templates ?? []).map((template) => ({
      id: template.id,
      name: template.name,
      format: template.config?.format ?? null,
      qa: (runs ?? []).find((run) => run.creative_ref === template.id) ?? null,
    })),
  });
}
