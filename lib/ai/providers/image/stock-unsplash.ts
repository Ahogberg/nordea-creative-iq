import type {
  StockProvider,
  StockSearchOptions,
  StockResult,
  ProviderInfo,
} from "../types";
import { ProviderNotConfiguredError } from "../types";
import { logGeneration } from "../cost-tracker";

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  urls: { full: string; regular: string };
  links: { html: string };
  user: { name: string };
}

interface UnsplashSearchResponse {
  results: UnsplashPhoto[];
}

/**
 * Unsplash stock photos. PRIMARY — royalty-free under the Unsplash License.
 * Editorial-leaning catalog complements Pexels' commercial breadth.
 */
export class UnsplashProvider implements StockProvider {
  info: ProviderInfo = {
    id: "unsplash",
    name: "Unsplash (royalty-free stock)",
    type: "stock",
    hosting: "stock-api",
    status: process.env.UNSPLASH_ACCESS_KEY ? "available" : "stubbed",
    requires_env_keys: ["UNSPLASH_ACCESS_KEY"],
    cost_per_call_usd: 0,
    models: [
      {
        id: "unsplash-photo",
        name: "Photo search",
        description: "Royalty-free editorial photos",
        cost_per_call_usd: 0,
      },
    ],
  };

  isAvailable(): boolean {
    return !!process.env.UNSPLASH_ACCESS_KEY;
  }

  async search(opts: StockSearchOptions): Promise<StockResult[]> {
    if (!this.isAvailable()) {
      throw new ProviderNotConfiguredError("unsplash", ["UNSPLASH_ACCESS_KEY"]);
    }

    const startTime = Date.now();
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", opts.query);
    url.searchParams.set("per_page", String(opts.per_page ?? 12));
    if (opts.orientation) {
      const mapped =
        opts.orientation === "horizontal"
          ? "landscape"
          : opts.orientation === "vertical"
          ? "portrait"
          : "squarish";
      url.searchParams.set("orientation", mapped);
    }

    try {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Unsplash API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as UnsplashSearchResponse;
      const results: StockResult[] = (data.results ?? []).map((item) => ({
        id: item.id,
        url: item.urls.full,
        preview_url: item.urls.regular,
        width: item.width,
        height: item.height,
        type: "photo" as const,
        attribution: {
          photographer: item.user.name,
          source: "Unsplash",
          license: "Unsplash License (free for commercial use)",
          source_url: item.links.html,
        },
      }));

      await logGeneration({
        user_id: "default-user",
        kind: "stock-search",
        provider: "unsplash",
        prompt: opts.query,
        params: { ...opts },
        cost_usd: 0,
        latency_ms: Date.now() - startTime,
        status: "success",
      });

      return results;
    } catch (error) {
      await logGeneration({
        user_id: "default-user",
        kind: "stock-search",
        provider: "unsplash",
        prompt: opts.query,
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
