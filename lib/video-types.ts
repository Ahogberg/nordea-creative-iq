// ============================================================================
// TEMPLATE & PRODUCTION TYPES
// ============================================================================
//
// Templates wrap a Motion Studio VideoConfig (lib/remotion/types) so the
// existing render pipeline (lib/remotion/render.ts) can re-render templates
// directly with variant text + format overrides at produce-time.

import type {
  Scene,
  TitleScene,
  TextRevealScene,
  CtaScene,
  VideoConfig,
} from './remotion/types';

// ============================================================================
// TEMPLATE
// ============================================================================

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;

  // Motion Studio config stored as a single JSONB blob — keeps storage
  // and render-pipeline contracts identical (no field-name translation).
  config: VideoConfig;

  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PRODUCTION
// ============================================================================

export interface ProductionVariants {
  headlines: string[];
  bodies: string[];
  ctas: string[];
}

export type VideoFormatId = VideoConfig['format'];

export interface ProductionJob {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  variants: ProductionVariants;
  formats: VideoFormatId[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_videos: number;
  completed_videos: number;
  output_urls: string[];
  zip_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================================================
// VARIANT APPLICATION
// ============================================================================

export interface VariantText {
  headline?: string;
  body?: string;
  cta?: string;
}

/**
 * Pull seed text from a config so generate-variants can riff on the
 * template's existing copy. Looks at the first matching scene for each slot.
 */
export function extractVariantSeeds(config: VideoConfig): Required<VariantText> {
  const titleScene = config.scenes.find(
    (s): s is TitleScene => s.type === 'title'
  );
  const textRevealScene = config.scenes.find(
    (s): s is TextRevealScene => s.type === 'text-reveal'
  );
  const ctaScene = config.scenes.find(
    (s): s is CtaScene => s.type === 'cta'
  );

  return {
    headline: titleScene?.headline || ctaScene?.headline || '',
    body: textRevealScene?.lines.join('\n') || titleScene?.subtitle || '',
    cta: ctaScene?.buttonText || '',
  };
}

/**
 * Apply a variant triplet to a config's scenes. Each slot overrides the FIRST
 * matching scene only; subsequent matching scenes are left untouched. If no
 * title scene exists, headline falls back to the first cta scene's headline.
 */
export function applyVariantToConfig(
  config: VideoConfig,
  variant: VariantText = {},
  format?: VideoFormatId
): VideoConfig {
  let headlineApplied = false;
  let bodyApplied = false;
  let ctaApplied = false;

  const scenes: Scene[] = config.scenes.map((scene): Scene => {
    if (scene.type === 'title' && !headlineApplied && variant.headline) {
      headlineApplied = true;
      return { ...scene, headline: variant.headline };
    }
    if (scene.type === 'text-reveal' && !bodyApplied && variant.body) {
      bodyApplied = true;
      return {
        ...scene,
        lines: variant.body.split('\n').filter((l) => l.trim()),
      };
    }
    if (scene.type === 'cta' && !ctaApplied && variant.cta) {
      ctaApplied = true;
      return { ...scene, buttonText: variant.cta };
    }
    return scene;
  });

  // Fallback: no title scene → apply headline to the first cta scene
  if (!headlineApplied && variant.headline) {
    const ctaIndex = scenes.findIndex((s) => s.type === 'cta');
    if (ctaIndex !== -1) {
      const cta = scenes[ctaIndex] as CtaScene;
      scenes[ctaIndex] = { ...cta, headline: variant.headline };
    }
  }

  return {
    ...config,
    scenes,
    format: format ?? config.format,
  };
}

/**
 * Cartesian product of variants × formats. Each yielded item is the exact
 * VideoConfig that should be passed to the render pipeline. Order is stable
 * so producer-worker output indices line up with UI previews.
 */
export function* enumerateProductionConfigs(
  baseConfig: VideoConfig,
  variants: ProductionVariants,
  formats: VideoFormatId[]
): Generator<{ index: number; config: VideoConfig; variant: Required<VariantText>; format: VideoFormatId }> {
  const headlines = variants.headlines.length ? variants.headlines : [''];
  const bodies = variants.bodies.length ? variants.bodies : [''];
  const ctas = variants.ctas.length ? variants.ctas : [''];
  const formatList = formats.length ? formats : [baseConfig.format];

  let index = 0;
  for (const headline of headlines) {
    for (const body of bodies) {
      for (const cta of ctas) {
        for (const format of formatList) {
          const variant: Required<VariantText> = { headline, body, cta };
          const config = applyVariantToConfig(baseConfig, variant, format);
          yield { index, config, variant, format };
          index++;
        }
      }
    }
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/** Wrap a Motion Studio config + name into the row payload for a new template. */
export function videoConfigToTemplate(
  config: VideoConfig,
  name: string,
  description?: string
): Pick<Template, 'name' | 'description' | 'config' | 'is_favorite'> {
  return {
    name,
    description: description?.trim() || null,
    config,
    is_favorite: false,
  };
}

/** Reconstruct a video config from a template + optional overrides. */
export function templateToVideoConfig(
  template: Template,
  variant?: VariantText,
  format?: VideoFormatId
): VideoConfig {
  if (!variant && !format) return template.config;
  return applyVariantToConfig(template.config, variant ?? {}, format);
}

export function calculateTotalVideos(
  variants: ProductionVariants,
  formats: string[]
): number {
  const headlines = Math.max(variants.headlines.length, 1);
  const bodies = Math.max(variants.bodies.length, 1);
  const ctas = Math.max(variants.ctas.length, 1);
  const formatCount = Math.max(formats.length, 1);
  return headlines * bodies * ctas * formatCount;
}

// ============================================================================
// FORMATS
// ============================================================================

export interface VideoFormat {
  id: VideoFormatId;
  label: string;
  description: string;
  width: number;
  height: number;
}

export const VIDEO_FORMATS: VideoFormat[] = [
  { id: 'story', label: 'Story / Reel', description: '9:16', width: 1080, height: 1920 },
  { id: 'feed', label: 'Feed', description: '1:1', width: 1080, height: 1080 },
  { id: 'landscape', label: 'Landskap', description: '16:9', width: 1920, height: 1080 },
  { id: 'vertical', label: 'Vertikal', description: '4:5', width: 1080, height: 1350 },
];
