import type {
  VideoProvider,
  VideoGenOptions,
  VideoResult,
  ProviderInfo,
  AspectRatio,
} from "../types";
import { logGeneration } from "../cost-tracker";
import { makeCacheKey } from "../cache";

/**
 * Remotion-based video provider. PRIMARY backend — Nordea-internal,
 * zero per-call cost, no compliance risk.
 *
 * Sprint 6 MVP: returns a placeholder URL that points at the existing
 * Motion Studio render pipeline. The free-text-prompt → VideoConfig
 * translation lands in a later sprint (Claude-driven layout planner);
 * for now this provider exists to round out the abstraction so the
 * UI provider-selector can list "Remotion" as available.
 */
export class RemotionProvider implements VideoProvider {
  info: ProviderInfo = {
    id: "remotion",
    name: "Remotion (Nordea internal)",
    type: "video",
    hosting: "self",
    status: "available",
    cost_per_call_usd: 0,
    models: [
      {
        id: "remotion-template",
        name: "Template-based animation",
        description:
          "Use Motion Studio templates with text/data overlays. Zero per-call cost.",
        cost_per_call_usd: 0,
        supported_aspects: ["9:16", "1:1", "16:9", "4:5"],
        max_duration_s: 60,
      },
    ],
  };

  isAvailable(): boolean {
    return true;
  }

  async generate(opts: VideoGenOptions): Promise<VideoResult> {
    const startTime = Date.now();
    const user_id = "default-user";

    const aspect: AspectRatio = opts.aspect_ratio ?? "9:16";
    const duration_s = opts.duration_s ?? 15;
    const cache_key = makeCacheKey("remotion", "remotion-template", {
      prompt: opts.prompt,
      aspect_ratio: aspect,
      duration_s,
      style: opts.style,
      seed: opts.seed,
    });

    const { width, height } = aspectToDimensions(aspect);

    // Sprint 6 stub URL — points at /create/video (renamed from /motion-studio
    // in Sprint 7) so the user lands in the editor instead of a 404. Real
    // prompt-to-config wiring is a separate sprint.
    const result: VideoResult = {
      url: `/create/video?prompt=${encodeURIComponent(opts.prompt)}&aspect=${aspect}&duration=${duration_s}`,
      thumbnail_url: undefined,
      duration_s,
      width,
      height,
      provider: "remotion",
      model: opts.model ?? "remotion-template",
      cost_usd: 0,
      cached: false,
      generation_id: "",
    };

    const generation_id = await logGeneration({
      user_id,
      kind: "video",
      provider: "remotion",
      model: result.model,
      prompt: opts.prompt,
      params: { ...opts },
      result_url: result.url,
      cache_key,
      cost_usd: 0,
      latency_ms: Date.now() - startTime,
      status: "success",
    });

    result.generation_id = generation_id ?? "";
    return result;
  }
}

function aspectToDimensions(aspect: AspectRatio): { width: number; height: number } {
  switch (aspect) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "4:5":
      return { width: 1080, height: 1350 };
  }
}
