import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";
import { RunQARequestSchema, type RunQARequest } from "@/lib/qa/types";
import { runQAGate } from "@/lib/qa/gate";

// QA gate dispatches 4 LLM calls in parallel (~5-10s wall clock).
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RunQARequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    // Insert in 'running' state so the row is queryable while the gate works.
    // If insert fails (Supabase unconfigured locally), we fall back to running
    // the gate ad-hoc and returning the report without persistence.
    const { data: row, error: insertError } = await supabase
      .from("qa_runs")
      .insert({
        user_id: ownerId,
        creative_kind: parsed.data.creative_kind,
        creative_ref: parsed.data.creative_ref,
        creative_metadata: stripInlineImages(parsed.data.metadata ?? {}),
        status: "running",
      })
      .select()
      .single();

    const id = row?.id ?? `ephemeral-${Date.now()}`;
    const persisted = !insertError && !!row;

    if (insertError) {
      console.warn("[qa] insert failed — running ad-hoc:", insertError.message);
    }

    const report = await runQAGate(parsed.data);

    if (persisted) {
      const { error: updateError } = await supabase
        .from("qa_runs")
        .update({
          status: report.status,
          total_score: report.total_score,
          persona_score: report.persona_jury.aggregate_score,
          tov_score: report.tov.weighted_score,
          compliance_score: report.compliance.score,
          heatmap_score: report.heatmap?.attention_score ?? null,
          persona_results: report.persona_jury,
          tov_results: report.tov,
          compliance_results: report.compliance,
          heatmap_results: report.heatmap,
          blocking_issues: report.blocking_issues,
          warnings: report.warnings,
          suggestions: report.suggestions,
          duration_ms: report.duration_ms,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", ownerId);

      if (updateError) {
        console.error("[qa] update failed:", updateError);
      }
    }

    return NextResponse.json({
      id,
      created_at: new Date().toISOString(),
      ...report,
    });
  } catch (error) {
    console.error("[qa] gate error:", error);
    return NextResponse.json(
      {
        error: "QA gate failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Base64-bilder hör inte hemma i qa_runs — spara bara en markör.
function stripInlineImages(
  metadata: NonNullable<RunQARequest["metadata"]>
): NonNullable<RunQARequest["metadata"]> {
  const strip = (src: string) => (src.startsWith("data:") ? "[inline-bild]" : src);
  return {
    ...metadata,
    image_url: metadata.image_url ? strip(metadata.image_url) : undefined,
    frame_urls: metadata.frame_urls?.map(strip),
  };
}
