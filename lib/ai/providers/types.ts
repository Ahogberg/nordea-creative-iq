// ── Sprint 6: AI provider layer types ──
//
// External providers (Fal.ai, Higgsfield) are typed alongside primary ones
// (Remotion, Pexels, Unsplash) but their implementations throw
// ProviderNotConfiguredError when env keys are missing — that's the
// "stubbed pending approval" path the UI surfaces.

import { z } from "zod";

export type ProviderType = "video" | "image" | "stock";
export type ProviderHosting = "self" | "external" | "stock-api";
export type ProviderStatus =
  | "available"
  | "stubbed"
  | "configured"
  | "rate-limited";

export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  cost_per_call_usd: number;
  supported_aspects?: string[];
  max_duration_s?: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  type: ProviderType;
  hosting: ProviderHosting;
  status: ProviderStatus;
  models: ProviderModel[];
  cost_per_call_usd?: number;
  requires_env_keys?: string[];
}

// ── Video ──

export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5";
export type VideoStyle = "realistic" | "animated" | "abstract" | "corporate";

export interface VideoGenOptions {
  prompt: string;
  model?: string;
  aspect_ratio?: AspectRatio;
  duration_s?: number;
  style?: VideoStyle;
  seed?: number;
  brand_lock?: boolean;
}

export interface VideoResult {
  url: string;
  thumbnail_url?: string;
  duration_s: number;
  width: number;
  height: number;
  provider: string;
  model: string;
  cost_usd: number;
  cached: boolean;
  generation_id: string;
}

export interface VideoProvider {
  info: ProviderInfo;
  generate(opts: VideoGenOptions): Promise<VideoResult>;
  isAvailable(): boolean;
}

// ── Image (gen) ──

export type ImageStyle = "photo" | "illustration" | "flat" | "corporate";

export interface ImageGenOptions {
  prompt: string;
  model?: string;
  aspect_ratio?: AspectRatio;
  style?: ImageStyle;
  seed?: number;
  brand_lock?: boolean;
}

export interface ImageResult {
  url: string;
  thumbnail_url?: string;
  width: number;
  height: number;
  provider: string;
  model: string;
  cost_usd: number;
  cached: boolean;
  generation_id: string;
  attribution?: {
    photographer?: string;
    source: string;
    license: string;
  };
}

export interface ImageProvider {
  info: ProviderInfo;
  generate(opts: ImageGenOptions): Promise<ImageResult>;
  isAvailable(): boolean;
}

// ── Stock search ──

export type StockKind = "photo" | "video";
export type StockOrientation = "horizontal" | "vertical" | "square";

export interface StockSearchOptions {
  query: string;
  type?: StockKind;
  orientation?: StockOrientation;
  per_page?: number;
}

export interface StockResult {
  id: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
  type: StockKind;
  attribution: {
    photographer: string;
    source: string;
    license: string;
    source_url: string;
  };
}

export interface StockProvider {
  info: ProviderInfo;
  search(opts: StockSearchOptions): Promise<StockResult[]>;
  isAvailable(): boolean;
}

// ── Zod schemas (API boundaries) ──

export const VideoGenOptionsSchema = z.object({
  prompt: z.string().min(1).max(2000),
  model: z.string().optional(),
  aspect_ratio: z.enum(["9:16", "1:1", "16:9", "4:5"]).optional(),
  duration_s: z.number().min(1).max(60).optional(),
  style: z.enum(["realistic", "animated", "abstract", "corporate"]).optional(),
  seed: z.number().optional(),
  brand_lock: z.boolean().optional(),
});

export const ImageGenOptionsSchema = z.object({
  prompt: z.string().min(1).max(2000),
  model: z.string().optional(),
  aspect_ratio: z.enum(["9:16", "1:1", "16:9", "4:5"]).optional(),
  style: z.enum(["photo", "illustration", "flat", "corporate"]).optional(),
  seed: z.number().optional(),
  brand_lock: z.boolean().optional(),
});

export const StockSearchOptionsSchema = z.object({
  query: z.string().min(1).max(200),
  type: z.enum(["photo", "video"]).optional(),
  orientation: z.enum(["horizontal", "vertical", "square"]).optional(),
  per_page: z.number().min(1).max(50).optional(),
});

// ── Errors ──

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, missing_keys: string[]) {
    super(
      `Provider "${provider}" is not configured. Missing environment variables: ${missing_keys.join(
        ", "
      )}. This provider is currently STUBBED — pending Nordea approval for external services.`
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export class ProviderRateLimitError extends Error {
  constructor(provider: string, retry_after_s: number) {
    super(`Provider "${provider}" rate-limited. Retry after ${retry_after_s}s.`);
    this.name = "ProviderRateLimitError";
  }
}

export class BudgetExceededError extends Error {
  constructor(spend: number, budget: number) {
    super(
      `Monthly budget exceeded ($${spend.toFixed(2)} / $${budget.toFixed(2)}). Contact admin.`
    );
    this.name = "BudgetExceededError";
  }
}
