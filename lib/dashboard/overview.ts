// ── Översiktens siffror, hämtade på servern ──
//
// Allt på dashboarden kommer härifrån, så att inget värde är påhittat.
// Varje fråga filtrerar på ägaren (se lib/supabase/db.ts). Mallbiblioteket
// delas mellan alla inloggade och räknas därför utan ägarfilter.

import { getDb } from "@/lib/supabase/db";
import type { VideoConfig } from "@/lib/remotion/types";
import type { CampaignStatus } from "@/lib/campaign-status";

export interface OverviewCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  updated_at: string;
  video_config: VideoConfig | null;
}

export interface OverviewJob {
  id: string;
  name: string;
  status: "pending" | "processing";
  total_videos: number;
  completed_videos: number;
}

export interface Overview {
  campaigns: OverviewCampaign[];
  campaignCount: number;
  inReviewCount: number;
  templateCount: number;
  renderedVideos: number;
  qa: { runs: number; avgScore: number | null; avgDurationMs: number | null };
  queue: OverviewJob[];
}

export type OverviewResult = { ok: true; data: Overview } | { ok: false; message: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function isVideoConfig(value: unknown): value is VideoConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { scenes?: unknown }).scenes) &&
    (value as { scenes: unknown[] }).scenes.length > 0
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export async function getOverview(): Promise<OverviewResult> {
  let db;
  try {
    db = await getDb();
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Databasen är inte konfigurerad." };
  }
  if (!db) return { ok: false, message: "Inte inloggad." };

  const { supabase, ownerId } = db;
  const since = new Date(Date.now() - 30 * DAY_MS).toISOString();

  const [recent, campaignCount, inReview, templates, jobs, queue, qa] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status, updated_at, video_config")
      .eq("created_by", ownerId)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("created_by", ownerId),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("created_by", ownerId)
      .eq("status", "in_review"),
    supabase.from("templates").select("id", { count: "exact", head: true }),
    supabase.from("production_jobs").select("completed_videos").eq("user_id", ownerId),
    supabase
      .from("production_jobs")
      .select("id, name, status, total_videos, completed_videos")
      .eq("user_id", ownerId)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("qa_runs")
      .select("total_score, duration_ms")
      .eq("user_id", ownerId)
      .in("status", ["pass", "warn", "fail"])
      .gte("created_at", since),
  ]);

  const failed = [recent, campaignCount, inReview, templates, jobs, queue, qa].find((r) => r.error);
  if (failed?.error) {
    console.error("[dashboard] kunde inte hämta översikten:", failed.error);
    return { ok: false, message: "Översikten kunde inte hämtas från databasen." };
  }

  const qaRows = (qa.data ?? []) as { total_score: number | null; duration_ms: number | null }[];
  const scores = qaRows.map((r) => Number(r.total_score)).filter((n) => Number.isFinite(n));
  const durations = qaRows.map((r) => Number(r.duration_ms)).filter((n) => Number.isFinite(n) && n > 0);

  return {
    ok: true,
    data: {
      campaigns: ((recent.data ?? []) as OverviewCampaign[]).map((c) => ({
        ...c,
        video_config: isVideoConfig(c.video_config) ? c.video_config : null,
      })),
      campaignCount: campaignCount.count ?? 0,
      inReviewCount: inReview.count ?? 0,
      templateCount: templates.count ?? 0,
      renderedVideos: ((jobs.data ?? []) as { completed_videos: number | null }[]).reduce(
        (s, j) => s + (j.completed_videos ?? 0),
        0
      ),
      qa: { runs: qaRows.length, avgScore: average(scores), avgDurationMs: average(durations) },
      queue: (queue.data ?? []) as OverviewJob[],
    },
  };
}

