import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { RunQARequestSchema, type RunQARequest } from "@/lib/qa/types";
import { runQAGate } from "@/lib/qa/gate";
import { z } from "zod";

// QA gate dispatches 4 LLM calls in parallel (~5-10s wall clock).
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { supabase, user } = auth;
  let runId: string | null = null;
  try {
    const body = await request.json();
    const parsed = RunQARequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.creative_kind === "template") {
      const { data: template, error } = await supabase.from("templates")
        .select("config").eq("id", parsed.data.creative_ref).single();
      if (error || !template) return NextResponse.json({ error: "Mallen hittades inte" }, { status: 404 });
      const config = z.object({ scenes: z.array(z.record(z.string(), z.unknown())) }).safeParse(template.config);
      if (!config.success) return NextResponse.json({ error: "Mallen saknar läsbart textinnehåll" }, { status: 400 });
      if (config.data.scenes.some((scene) => scene.type === "canvas")) {
        return NextResponse.json({ error: "Text i fria animationsscener behöver granskas från den färdiga videon." }, { status: 400 });
      }
      const copy = config.data.scenes.flatMap(extractSceneText);
      if (!copy.length) return NextResponse.json({ error: "Mallen innehåller ingen text att granska" }, { status: 400 });
      const ctaScene = config.data.scenes.find((scene) => scene.type === "cta");
      parsed.data.metadata = { headline: copy[0], body: copy.slice(1).join("\n"), cta: typeof ctaScene?.buttonText === "string" ? ctaScene.buttonText : undefined, template_id: parsed.data.creative_ref };
    }


    // Persist first so every result can be retrieved later.
    const { data: row, error: insertError } = await supabase
      .from("qa_runs")
      .insert({
        user_id: user.id,
        creative_kind: parsed.data.creative_kind,
        creative_ref: parsed.data.creative_ref,
        creative_metadata: stripInlineImages(parsed.data.metadata ?? {}),
        status: "running",
      })
      .select()
      .single();

    if (insertError || !row) throw insertError ?? new Error("Granskningen kunde inte sparas");
    const id = row.id as string;
    runId = id;
    const report = await runQAGate(parsed.data);
    if (parsed.data.creative_kind === "template") {
      report.warnings.unshift("Endast mallens text har granskats. Bild, animation, läsbarhet och färdig video behöver granskas separat.");
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      report.status = "error";
      report.warnings.unshift("Demonstrationsresultat: AI-nyckel saknas. Detta är ingen slutförd granskning.");
    }

    {
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
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({
      id,
      created_at: row.created_at,
      ...report,
    });
  } catch (error) {
    console.error("[qa] gate error:", error);
    if (runId) {
      const { error: markError } = await supabase.from("qa_runs").update({ status: "error", error_message: "Granskningen avbröts. Kör igen.", completed_at: new Date().toISOString() }).eq("id", runId).eq("user_id", user.id);
      if (markError) console.error("[qa] could not mark failed run:", markError);
    }
    return NextResponse.json(
      {
        error: "QA gate failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function extractSceneText(scene: Record<string, unknown>): string[] {
  const keys = ["headline", "subtitle", "caption", "title", "label", "description", "buttonText", "lines", "leftLabel", "rightLabel", "leftValue", "rightValue", "vsText", "number", "fromValue", "toValue", "value", "suffix", "prefix"];
  const text = keys.flatMap((key) => {
    const value = scene[key];
    return typeof value === "string" || typeof value === "number" ? [String(value)] : Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  });
  for (const key of ["items", "bars"]) {
    const entries = scene[key];
    if (Array.isArray(entries)) for (const entry of entries) {
      if (entry && typeof entry === "object") text.push(...extractSceneText(entry as Record<string, unknown>));
    }
  }
  return text;
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
