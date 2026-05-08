// ── Hash-based cache layer ──
//
// Same prompt + model + params hash to the same cache_key. Hits return
// the previously stored result_url so we don't pay (or wait) twice.
// Cache lookup fails open: any error short-circuits to a miss so the
// provider call still runs.

import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

export function makeCacheKey(
  provider: string,
  model: string,
  params: Record<string, unknown>
): string {
  // Stable JSON: sort keys so the same logical params hash identically
  // regardless of property order.
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return createHash("sha256")
    .update(`${provider}:${model}:${normalized}`)
    .digest("hex")
    .substring(0, 32);
}

export interface CacheLookup {
  hit: boolean;
  result_url?: string;
  thumbnail_url?: string;
  generation_id?: string;
}

export async function checkCache(cache_key: string): Promise<CacheLookup> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_generations")
      .select("id, result_url, thumbnail_url")
      .eq("cache_key", cache_key)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.result_url) {
      return {
        hit: true,
        result_url: data.result_url,
        thumbnail_url: data.thumbnail_url ?? undefined,
        generation_id: data.id,
      };
    }
  } catch {
    // No cache hit / Supabase unavailable — fail open.
  }
  return { hit: false };
}
