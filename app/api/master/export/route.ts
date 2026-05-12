import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { doProduction } from "@/lib/production/worker";
import {
  calculateTotalVideos,
  type ProductionVariants,
} from "@/lib/video-types";
import type { VideoConfig } from "@/lib/remotion/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORMAT = z.enum(["story", "feed", "landscape", "vertical"]);

const VariantSchema = z.object({
  format: FORMAT,
  config: z.any(),
});

const RequestSchema = z.object({
  variants: z.array(VariantSchema).min(1),
  name: z.string().optional(),
});

// Master export takes the per-format variants the UI computed (master config
// + applyFormatLayout per format, with optional manual overrides) and runs
// them through the existing render worker. Sprint 9 simplification: the
// layout-hint scaffolding on variant.config isn't read by the renderer yet,
// so we collapse the variants to one source config + the formats list and
// create a single production_job — same path Sprint 8b's /api/studio/export
// uses. Per-variant config overrides become a TODO for Sprint 10.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { variants, name } = RequestSchema.parse(body);

    const supabase = await createClient();

    const sourceConfig = variants[0].config as VideoConfig;
    const formats = variants.map((v) => v.format);

    const templateName =
      name?.trim() ||
      `Master export — ${new Date().toISOString().replace(/[:.]/g, "-")}`;

    const { data: template, error: templateError } = await supabase
      .from("templates")
      .insert({
        user_id: "default-user",
        name: templateName,
        description: "[Master export] auto-generated for multi-format render",
        config: sourceConfig,
        is_favorite: false,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    const productionVariants: ProductionVariants = {
      headlines: [],
      bodies: [],
      ctas: [],
    };

    const totalVideos = calculateTotalVideos(productionVariants, formats);

    const { data: job, error: jobError } = await supabase
      .from("production_jobs")
      .insert({
        user_id: "default-user",
        template_id: template.id,
        name: templateName,
        variants: productionVariants,
        formats,
        total_videos: totalVideos,
        status: "pending",
      })
      .select()
      .single();

    if (jobError) throw jobError;

    setImmediate(() => {
      doProduction(job.id).catch((err) => {
        console.error("[master:export] worker error:", err);
      });
    });

    return NextResponse.json({ job_id: job.id }, { status: 202 });
  } catch (error) {
    console.error("[master:export] start error:", error);
    return NextResponse.json(
      {
        error: "Failed to start master export",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
