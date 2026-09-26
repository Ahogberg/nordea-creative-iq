import { NextResponse } from "next/server";
import { requireDb } from "@/lib/supabase/db";
import { getUserSpend } from "@/lib/ai/providers/cost-tracker";

export const runtime = "nodejs";

interface GenerationRow {
  provider: string;
  kind: string;
  cost_usd: number | null;
  status: string;
  created_at: string;
}

export async function GET() {
  try {
    const db = await requireDb();
    if ("response" in db) return db.response;
    const { supabase, ownerId } = db;

    const spend = await getUserSpend(db);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: generations } = await supabase
      .from("ai_generations")
      .select("provider, kind, cost_usd, status, created_at")
      .eq("user_id", ownerId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    const rows: GenerationRow[] = (generations as GenerationRow[] | null) ?? [];

    const byProvider: Record<string, { count: number; spend: number }> = {};
    let totalCalls = 0;
    let totalCached = 0;
    let totalStubbed = 0;
    let totalFailed = 0;

    for (const gen of rows) {
      const key = gen.provider;
      if (!byProvider[key]) byProvider[key] = { count: 0, spend: 0 };
      byProvider[key].count += 1;
      byProvider[key].spend += Number(gen.cost_usd ?? 0);
      totalCalls += 1;
      if (gen.status === "cached") totalCached += 1;
      if (gen.status === "stubbed") totalStubbed += 1;
      if (gen.status === "failed") totalFailed += 1;
    }

    return NextResponse.json({
      budget: spend,
      stats: {
        total_calls_30d: totalCalls,
        cached_calls: totalCached,
        stubbed_calls: totalStubbed,
        failed_calls: totalFailed,
        cache_hit_rate: totalCalls > 0 ? totalCached / totalCalls : 0,
      },
      by_provider: byProvider,
      recent_generations: rows,
    });
  } catch (error) {
    console.error("[ai:usage] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
