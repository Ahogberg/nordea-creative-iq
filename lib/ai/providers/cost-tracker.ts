// ── Cost tracker ──
//
// Logs every provider invocation to ai_generations and accumulates spend
// in user_credits. All DB writes fail-open: if the log insert errors out,
// the provider call still succeeds — we lose audit data, not the user's
// generated artifact. checkBudget throws BudgetExceededError before the
// expensive call so the user gets a clean 402 from the API.

import { createClient } from "@/lib/supabase/server";
import { BudgetExceededError } from "./types";

export interface LogParams {
  user_id: string;
  kind: "video" | "image" | "stock-search" | "text";
  provider: string;
  model?: string;
  prompt?: string;
  params?: Record<string, unknown>;
  result_url?: string;
  thumbnail_url?: string;
  cache_key?: string;
  cache_hit?: boolean;
  cost_usd?: number;
  latency_ms?: number;
  status: "success" | "failed" | "cached" | "stubbed";
  error_message?: string;
}

export async function logGeneration(params: LogParams): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_generations")
      .insert(params)
      .select("id")
      .single();

    if (error) {
      console.error("[ai:cost] log insert failed:", error.message);
      return null;
    }

    if ((params.cost_usd ?? 0) > 0 && params.status === "success") {
      await updateUserSpend(params.user_id, params.cost_usd!);
    }

    return data.id;
  } catch (err) {
    console.error("[ai:cost] tracker error:", err);
    return null;
  }
}

async function updateUserSpend(user_id: string, amount: number): Promise<void> {
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", user_id)
    .single();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  if (!current) {
    await supabase.from("user_credits").insert({
      user_id,
      current_period_spend_usd: amount,
      period_start: todayStr,
    });
    return;
  }

  const periodStart = new Date(current.period_start);
  const monthsSince =
    (today.getFullYear() - periodStart.getFullYear()) * 12 +
    (today.getMonth() - periodStart.getMonth());

  if (monthsSince >= 1) {
    // New billing period — reset accumulator
    await supabase
      .from("user_credits")
      .update({
        current_period_spend_usd: amount,
        period_start: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);
  } else {
    await supabase
      .from("user_credits")
      .update({
        current_period_spend_usd:
          Number(current.current_period_spend_usd ?? 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);
  }
}

export async function checkBudget(
  user_id: string,
  estimated_cost: number
): Promise<void> {
  if (estimated_cost <= 0) return;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_credits")
      .select("monthly_budget_usd, current_period_spend_usd")
      .eq("user_id", user_id)
      .single();

    if (!data) return; // No record = no enforced limit (default budget kicks in on first spend)

    const budget = Number(data.monthly_budget_usd ?? 0);
    const spend = Number(data.current_period_spend_usd ?? 0);
    const projected = spend + estimated_cost;

    if (projected > budget) {
      throw new BudgetExceededError(projected, budget);
    }
  } catch (err) {
    if (err instanceof BudgetExceededError) throw err;
    // Any other DB failure: fail open so the user can still call providers.
    console.warn("[ai:cost] checkBudget DB error — failing open:", err);
  }
}

export interface UserSpend {
  user_id: string;
  monthly_budget_usd: number;
  current_period_spend_usd: number;
  period_start: string;
}

export async function getUserSpend(user_id: string): Promise<UserSpend> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (data) {
      return {
        user_id,
        monthly_budget_usd: Number(data.monthly_budget_usd ?? 100),
        current_period_spend_usd: Number(data.current_period_spend_usd ?? 0),
        period_start: data.period_start,
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    user_id,
    monthly_budget_usd: 100,
    current_period_spend_usd: 0,
    period_start: new Date().toISOString().split("T")[0],
  };
}
