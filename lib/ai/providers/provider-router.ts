// ── Provider router ──
//
// Singleton lists of provider instances + selectors. The "smart" selectors
// fall back to the always-available primary provider (Remotion for video,
// Pexels for stock) so callers get a useful response even with zero env keys.

import type { VideoProvider, ImageProvider, StockProvider } from "./types";
import { RemotionProvider } from "./video/remotion";
import { FalVideoProvider } from "./video/fal";
import { SelfHostedVideoProvider } from "./video/self-hosted";
import { PexelsProvider } from "./image/stock-pexels";
import { UnsplashProvider } from "./image/stock-unsplash";
import { FalImageProvider } from "./image/fal-flux";

const VIDEO_PROVIDERS: VideoProvider[] = [
  new RemotionProvider(),
  new FalVideoProvider(),
  new SelfHostedVideoProvider(),
];

const STOCK_PROVIDERS: StockProvider[] = [
  new PexelsProvider(),
  new UnsplashProvider(),
];

const IMAGE_PROVIDERS: ImageProvider[] = [new FalImageProvider()];

// ── Video ──

export function listVideoProviders(): VideoProvider[] {
  return VIDEO_PROVIDERS;
}

export function getVideoProvider(id: string): VideoProvider | null {
  return VIDEO_PROVIDERS.find((p) => p.info.id === id) ?? null;
}

export interface SelectVideoOpts {
  preferred_provider?: string;
  style?: string;
}

/**
 * Selection chain:
 *   1. Caller-supplied preferred_provider, if available
 *   2. DEFAULT_VIDEO_PROVIDER env var, if set + available
 *   3. External (Fal.ai) if its key is set — caller paid for the budget
 *   4. Self-hosted GPU if endpoint configured
 *   5. Remotion (always available — the safe default)
 */
export function selectVideoProvider(opts: SelectVideoOpts = {}): VideoProvider {
  if (opts.preferred_provider) {
    const p = getVideoProvider(opts.preferred_provider);
    if (p?.isAvailable()) return p;
  }

  const envDefault = process.env.DEFAULT_VIDEO_PROVIDER;
  if (envDefault) {
    const p = getVideoProvider(envDefault);
    if (p?.isAvailable()) return p;
  }

  const fal = getVideoProvider("fal");
  if (fal?.isAvailable()) return fal;

  const selfHosted = getVideoProvider("self-hosted");
  if (selfHosted?.isAvailable()) return selfHosted;

  return getVideoProvider("remotion")!;
}

// ── Stock ──

export function listStockProviders(): StockProvider[] {
  return STOCK_PROVIDERS;
}

export function getStockProvider(id: string): StockProvider | null {
  return STOCK_PROVIDERS.find((p) => p.info.id === id) ?? null;
}

/**
 * Picks the first available stock provider — Pexels first because it
 * supports both photos and videos. Returns null if neither key is set;
 * the API route maps that to a 503 with configuration hint.
 */
export function selectStockProvider(): StockProvider | null {
  const pexels = getStockProvider("pexels");
  if (pexels?.isAvailable()) return pexels;

  const unsplash = getStockProvider("unsplash");
  if (unsplash?.isAvailable()) return unsplash;

  return null;
}

// ── Image (gen) ──

export function listImageProviders(): ImageProvider[] {
  return IMAGE_PROVIDERS;
}

export function getImageProvider(id: string): ImageProvider | null {
  return IMAGE_PROVIDERS.find((p) => p.info.id === id) ?? null;
}

// ── Status (UI) ──

export function getProviderStatus() {
  const augment = <P extends { info: { id: string }; isAvailable(): boolean }>(p: P) => ({
    ...p.info,
    available: p.isAvailable(),
  });

  return {
    video: VIDEO_PROVIDERS.map(augment),
    stock: STOCK_PROVIDERS.map(augment),
    image: IMAGE_PROVIDERS.map(augment),
  };
}
