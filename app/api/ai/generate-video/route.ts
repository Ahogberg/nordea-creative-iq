import { NextResponse } from "next/server";
import { VideoGenOptionsSchema } from "@/lib/ai/providers/types";
import {
  ProviderNotConfiguredError,
  BudgetExceededError,
} from "@/lib/ai/providers/types";
import { selectVideoProvider } from "@/lib/ai/providers/provider-router";
import { applyBrandLock } from "@/lib/ai/brand-prompt";
import { checkBudget } from "@/lib/ai/providers/cost-tracker";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = VideoGenOptionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const opts = { ...parsed.data };
    if (opts.brand_lock !== false) {
      opts.prompt = applyBrandLock(opts.prompt, true);
    }

    // The body.provider is a hint, not part of the schema (it isn't a
    // generation option — it picks which provider runs the options).
    const preferred =
      typeof body.provider === "string" ? body.provider : undefined;
    const provider = selectVideoProvider({ preferred_provider: preferred });

    const estimated =
      provider.info.models.find((m) => m.id === opts.model)?.cost_per_call_usd ??
      provider.info.cost_per_call_usd ??
      0;
    if (estimated > 0) {
      await checkBudget("default-user", estimated);
    }

    const result = await provider.generate(opts);

    return NextResponse.json({
      ...result,
      provider_info: provider.info,
    });
  } catch (error) {
    if (error instanceof ProviderNotConfiguredError) {
      return NextResponse.json(
        {
          error: "Provider not configured",
          message: error.message,
          stubbed: true,
        },
        { status: 503 }
      );
    }
    if (error instanceof BudgetExceededError) {
      return NextResponse.json(
        { error: "Budget exceeded", message: error.message },
        { status: 402 }
      );
    }
    console.error("[ai:video] generation error:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
