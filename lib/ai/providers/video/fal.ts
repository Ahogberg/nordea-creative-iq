import type {
  VideoProvider,
  VideoGenOptions,
  VideoResult,
  ProviderInfo,
} from "../types";
import { ProviderNotConfiguredError } from "../types";
import { logGeneration } from "../cost-tracker";

/**
 * Fal.ai video provider.
 * STATUS: STUBBED — pending Nordea approval for external services.
 *
 * When approved:
 *   1. Set FAL_KEY in .env
 *   2. Implement generate() against https://fal.run/{model}/queue
 *   3. info.status flips to 'configured' and provider becomes selectable
 *
 * Stubbed calls are still logged (status='stubbed') so the UI can show
 * "N attempted Fal.ai calls — pending approval" as evidence of demand.
 */
export class FalVideoProvider implements VideoProvider {
  info: ProviderInfo = {
    id: "fal",
    name: "Fal.ai (external — pending approval)",
    type: "video",
    hosting: "external",
    status: process.env.FAL_KEY ? "configured" : "stubbed",
    requires_env_keys: ["FAL_KEY"],
    models: [
      {
        id: "kling-2.5-turbo",
        name: "Kling 2.5 Turbo",
        description: "Realistic video, fast generation",
        cost_per_call_usd: 0.032,
        supported_aspects: ["9:16", "1:1", "16:9"],
        max_duration_s: 5,
      },
      {
        id: "kling-3.0",
        name: "Kling 3.0",
        description: "Realistic video, high quality",
        cost_per_call_usd: 0.065,
        supported_aspects: ["9:16", "1:1", "16:9"],
        max_duration_s: 10,
      },
      {
        id: "veo-3.1-fast",
        name: "Veo 3.1 Fast",
        description: "Cinematic video with native audio",
        cost_per_call_usd: 0.08,
        supported_aspects: ["16:9", "9:16"],
        max_duration_s: 8,
      },
      {
        id: "seedance-1.5-pro",
        name: "Seedance 1.5 Pro",
        description: "Motion-graphics specialist",
        cost_per_call_usd: 0.05,
        supported_aspects: ["9:16", "1:1", "16:9"],
        max_duration_s: 5,
      },
    ],
  };

  isAvailable(): boolean {
    return !!process.env.FAL_KEY;
  }

  async generate(opts: VideoGenOptions): Promise<VideoResult> {
    if (!this.isAvailable()) {
      // Log the stubbed attempt so we can see demand for this provider
      await logGeneration({
        user_id: "default-user",
        kind: "video",
        provider: "fal",
        model: opts.model ?? "kling-2.5-turbo",
        prompt: opts.prompt,
        params: { ...opts },
        status: "stubbed",
        error_message:
          "FAL_KEY not configured — provider stubbed pending Nordea approval",
      });
      throw new ProviderNotConfiguredError("fal", ["FAL_KEY"]);
    }

    // TODO: implement when FAL_KEY is added
    //   1. POST https://fal.run/{model}/queue with applyBrandLock(prompt)
    //   2. Poll job until done (or use webhooks)
    //   3. Cache result via makeCacheKey + checkCache before re-charging
    //   4. logGeneration with cost_usd from model.cost_per_call_usd
    throw new Error(
      "Fal.ai integration not yet implemented (Sprint 6+ when approval received)"
    );
  }
}
