import type {
  ImageProvider,
  ImageGenOptions,
  ImageResult,
  ProviderInfo,
} from "../types";
import { ProviderNotConfiguredError } from "../types";
import { logGeneration } from "../cost-tracker";

/**
 * Fal.ai image generators (Flux / Ideogram / Recraft).
 * STATUS: STUBBED — pending Nordea approval for external services.
 *
 * Stubbed calls are logged so the UI can show demand for the provider.
 */
export class FalImageProvider implements ImageProvider {
  info: ProviderInfo = {
    id: "fal-image",
    name: "Fal.ai images (external — pending approval)",
    type: "image",
    hosting: "external",
    status: process.env.FAL_KEY ? "configured" : "stubbed",
    requires_env_keys: ["FAL_KEY"],
    models: [
      {
        id: "flux-1.1-pro",
        name: "Flux 1.1 Pro",
        description: "Photorealistic images",
        cost_per_call_usd: 0.04,
      },
      {
        id: "ideogram-3",
        name: "Ideogram 3",
        description: "Strong text rendering",
        cost_per_call_usd: 0.05,
      },
      {
        id: "recraft-v3",
        name: "Recraft V3",
        description: "Vector + flat illustrations",
        cost_per_call_usd: 0.04,
      },
    ],
  };

  isAvailable(): boolean {
    return !!process.env.FAL_KEY;
  }

  async generate(opts: ImageGenOptions): Promise<ImageResult> {
    if (!this.isAvailable()) {
      await logGeneration({
        user_id: "default-user",
        kind: "image",
        provider: "fal-image",
        model: opts.model ?? "flux-1.1-pro",
        prompt: opts.prompt,
        params: { ...opts },
        status: "stubbed",
        error_message:
          "FAL_KEY not configured — provider stubbed pending Nordea approval",
      });
      throw new ProviderNotConfiguredError("fal-image", ["FAL_KEY"]);
    }
    // TODO: implement when FAL_KEY is added (apply brand lock, cache, log)
    throw new Error(
      "Fal.ai image integration not yet implemented (Sprint 6+ when approval received)"
    );
  }
}
