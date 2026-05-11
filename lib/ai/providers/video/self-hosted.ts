import type {
  VideoProvider,
  VideoGenOptions,
  VideoResult,
  ProviderInfo,
} from "../types";
import { ProviderNotConfiguredError } from "../types";

/**
 * Self-hosted (Azure GPU) video provider.
 * STATUS: STUBBED — Azure GPU infrastructure not yet deployed.
 *
 * Future: run open-source text-to-video models (Wan 2.1, Mochi 1) on
 * Nordea-controlled hardware. Zero per-call cost beyond infra, no
 * external data egress, fully compliant with Nordea data policies.
 */
export class SelfHostedVideoProvider implements VideoProvider {
  info: ProviderInfo = {
    id: "self-hosted",
    name: "Nordea Self-hosted GPU (future)",
    type: "video",
    hosting: "self",
    status: process.env.NORDEA_GPU_ENDPOINT ? "configured" : "stubbed",
    requires_env_keys: ["NORDEA_GPU_ENDPOINT", "NORDEA_GPU_KEY"],
    models: [
      {
        id: "wan-2.1",
        name: "Wan 2.1 (Alibaba, open source)",
        description: "Text-to-video, commercial license",
        cost_per_call_usd: 0,
        supported_aspects: ["9:16", "1:1", "16:9"],
        max_duration_s: 5,
      },
      {
        id: "mochi-1",
        name: "Mochi 1 (Genmo, Apache 2.0)",
        description: "High-quality text-to-video",
        cost_per_call_usd: 0,
        supported_aspects: ["16:9"],
        max_duration_s: 5,
      },
    ],
  };

  isAvailable(): boolean {
    return !!process.env.NORDEA_GPU_ENDPOINT;
  }

  async generate(_opts: VideoGenOptions): Promise<VideoResult> {
    if (!this.isAvailable()) {
      throw new ProviderNotConfiguredError("self-hosted", [
        "NORDEA_GPU_ENDPOINT",
        "NORDEA_GPU_KEY",
      ]);
    }
    // TODO: POST to NORDEA_GPU_ENDPOINT with applyBrandLock(prompt)
    throw new Error("Self-hosted integration not yet implemented");
  }
}
