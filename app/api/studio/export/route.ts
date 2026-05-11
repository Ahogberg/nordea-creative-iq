import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { doProduction } from "@/lib/production/worker";
import {
  calculateTotalVideos,
  type ProductionVariants,
} from "@/lib/video-types";

export const runtime = "nodejs";
export const maxDuration = 60;

const FORMAT = z.enum(["story", "feed", "landscape", "vertical"]);

const RequestSchema = z.object({
  config: z.any(),
  formats: z.array(FORMAT).min(1),
  name: z.string().optional(),
});

// Studio export creates a transient template (so the existing render worker
// can pick it up via template_id) and then a production job over the chosen
// formats. We don't expose the temp template in /templates — its description
// is prefixed with [Studio export] so a future cleanup job can recognise it.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config, formats, name } = RequestSchema.parse(body);

    const supabase = await createClient();

    const templateName =
      name?.trim() ||
      `Studio export — ${new Date().toISOString().replace(/[:.]/g, "-")}`;

    const { data: template, error: templateError } = await supabase
      .from("templates")
      .insert({
        user_id: "default-user",
        name: templateName,
        description: "[Studio export] auto-generated for one-off render",
        config,
        is_favorite: false,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // Empty variants → cartesian product collapses to 1 render per format,
    // which is exactly what Studio export wants.
    const variants: ProductionVariants = {
      headlines: [],
      bodies: [],
      ctas: [],
    };

    const totalVideos = calculateTotalVideos(variants, formats);

    const { data: job, error: jobError } = await supabase
      .from("production_jobs")
      .insert({
        user_id: "default-user",
        template_id: template.id,
        name: templateName,
        variants,
        formats,
        total_videos: totalVideos,
        status: "pending",
      })
      .select()
      .single();

    if (jobError) throw jobError;

    setImmediate(() => {
      doProduction(job.id).catch((err) => {
        console.error("[studio:export] worker error:", err);
      });
    });

    return NextResponse.json({ job_id: job.id }, { status: 202 });
  } catch (error) {
    console.error("[studio:export] start error:", error);
    return NextResponse.json(
      {
        error: "Failed to start export",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
