import { NextResponse } from "next/server";
import { StockSearchOptionsSchema } from "@/lib/ai/providers/types";
import { ProviderNotConfiguredError } from "@/lib/ai/providers/types";
import {
  selectStockProvider,
  getStockProvider,
} from "@/lib/ai/providers/provider-router";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = StockSearchOptionsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const preferred = typeof body.provider === "string" ? body.provider : null;
    const provider = preferred
      ? getStockProvider(preferred) ?? selectStockProvider()
      : selectStockProvider();

    if (!provider) {
      return NextResponse.json(
        {
          error: "No stock provider available",
          message: "Configure PEXELS_API_KEY or UNSPLASH_ACCESS_KEY",
        },
        { status: 503 }
      );
    }

    const results = await provider.search(parsed.data);

    return NextResponse.json({
      results,
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
    console.error("[ai:stock] search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
