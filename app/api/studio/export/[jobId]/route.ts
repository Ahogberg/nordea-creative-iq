import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Status endpoint for the Studio Export modal poll. Maps the raw
// production_jobs row onto the shape the modal expects:
//   { status, progress (0-100), download_url, error? }
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("production_jobs")
      .select(
        "status, total_videos, completed_videos, zip_url, output_urls, error_message"
      )
      .eq("id", jobId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { status: "failed", error: "Job not found" },
        { status: 404 }
      );
    }

    const total = Number(data.total_videos ?? 0);
    const done = Number(data.completed_videos ?? 0);
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    // Map worker statuses (pending/processing/completed/failed) onto the
    // modal's expected states (pending/rendering/done/failed).
    let mappedStatus: "pending" | "rendering" | "done" | "failed";
    switch (data.status) {
      case "pending":
        mappedStatus = "pending";
        break;
      case "processing":
        mappedStatus = "rendering";
        break;
      case "completed":
        mappedStatus = "done";
        break;
      case "failed":
      default:
        mappedStatus = "failed";
        break;
    }

    return NextResponse.json({
      status: mappedStatus,
      progress: mappedStatus === "done" ? 100 : progress,
      download_url: data.zip_url ?? data.output_urls?.[0] ?? null,
      error: data.error_message ?? null,
    });
  } catch (error) {
    console.error("[studio:export] status error:", error);
    return NextResponse.json(
      { status: "failed", error: "Status fetch failed" },
      { status: 500 }
    );
  }
}
