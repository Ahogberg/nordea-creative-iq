import type {
  StockProvider,
  StockSearchOptions,
  StockResult,
  ProviderInfo,
} from "../types";
import { ProviderNotConfiguredError } from "../types";
import { logGeneration } from "../cost-tracker";

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: { original: string; large: string; medium: string };
}

interface PexelsVideoFile {
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  user: { name: string };
  image: string;
  video_files: PexelsVideoFile[];
}

interface PexelsResponse {
  photos?: PexelsPhoto[];
  videos?: PexelsVideo[];
}

/**
 * Pexels stock photos & videos. PRIMARY — royalty-free under the Pexels
 * License (CC0-equivalent). No compliance risk, no external-spend signal
 * to flag for approval.
 */
export class PexelsProvider implements StockProvider {
  info: ProviderInfo = {
    id: "pexels",
    name: "Pexels (royalty-free stock)",
    type: "stock",
    hosting: "stock-api",
    status: process.env.PEXELS_API_KEY ? "available" : "stubbed",
    requires_env_keys: ["PEXELS_API_KEY"],
    cost_per_call_usd: 0,
    models: [
      {
        id: "pexels-photo",
        name: "Photo search",
        description: "Royalty-free photos",
        cost_per_call_usd: 0,
      },
      {
        id: "pexels-video",
        name: "Video search",
        description: "Royalty-free videos",
        cost_per_call_usd: 0,
      },
    ],
  };

  isAvailable(): boolean {
    return !!process.env.PEXELS_API_KEY;
  }

  async search(opts: StockSearchOptions): Promise<StockResult[]> {
    if (!this.isAvailable()) {
      throw new ProviderNotConfiguredError("pexels", ["PEXELS_API_KEY"]);
    }

    const startTime = Date.now();
    const endpoint =
      opts.type === "video"
        ? "https://api.pexels.com/videos/search"
        : "https://api.pexels.com/v1/search";

    const url = new URL(endpoint);
    url.searchParams.set("query", opts.query);
    url.searchParams.set("per_page", String(opts.per_page ?? 12));
    if (opts.orientation) url.searchParams.set("orientation", opts.orientation);

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: process.env.PEXELS_API_KEY! },
      });

      if (!res.ok) {
        throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as PexelsResponse;
      const items: Array<PexelsPhoto | PexelsVideo> =
        opts.type === "video" ? data.videos ?? [] : data.photos ?? [];

      const results: StockResult[] = items.map((item) => {
        if (opts.type === "video") {
          const video = item as PexelsVideo;
          return {
            id: String(video.id),
            url: video.video_files[0]?.link ?? "",
            preview_url: video.image,
            width: video.width,
            height: video.height,
            type: "video" as const,
            attribution: {
              photographer: video.user?.name || "Pexels",
              source: "Pexels",
              license: "Pexels License (free for commercial use)",
              source_url: video.url,
            },
          };
        }
        const photo = item as PexelsPhoto;
        return {
          id: String(photo.id),
          url: photo.src.original,
          preview_url: photo.src.medium,
          width: photo.width,
          height: photo.height,
          type: "photo" as const,
          attribution: {
            photographer: photo.photographer || "Pexels",
            source: "Pexels",
            license: "Pexels License (free for commercial use)",
            source_url: photo.url,
          },
        };
      });

      await logGeneration({
        user_id: "default-user",
        kind: "stock-search",
        provider: "pexels",
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
        provider: "pexels",
        prompt: opts.query,
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
