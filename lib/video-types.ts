// ============================================================================
// BASE VIDEO TYPES
// ============================================================================

export type FontWeight = 'normal' | 'bold' | 'light' | 'medium' | 'semibold';

export type AnimationType =
  | 'none'
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'typewriter';

export interface BackgroundConfig {
  type: 'solid' | 'gradient' | 'image' | 'video';
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  imageUrl: string | null;
  videoUrl: string | null;
  opacity: number;
}

export interface LogoConfig {
  visible: boolean;
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  size: number;
  opacity: number;
}

export interface TextPlate {
  id: string;
  text: string;
  fontSize: number;
  fontWeight: FontWeight;
  color: string;
  startFrame: number;
  endFrame: number;
  animation: AnimationType;
  isCta: boolean;
  ctaBackgroundColor: string;
  ctaBorderRadius: number;
}

export interface VideoConfig {
  width: number;
  height: number;
  durationInFrames: number;
  fps: number;
  background: BackgroundConfig;
  textPlates: TextPlate[];
  logo: LogoConfig;
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface TextPlateStructure {
  id: string;
  placeholder: 'headline' | 'body' | 'cta' | 'custom';
  fontSize: number;
  fontWeight: FontWeight;
  color: string;
  startFrame: number;
  endFrame: number;
  animation: AnimationType;
  isCta: boolean;
  ctaBackgroundColor: string;
  ctaBorderRadius: number;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_frames: number;
  fps: number;
  background: BackgroundConfig;
  logo: LogoConfig;
  text_structure: TextPlateStructure[];
  default_texts: { placeholder: string; text: string }[];
  formats: string[];
  is_favorite: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductionVariants {
  headlines: string[];
  bodies: string[];
  ctas: string[];
}

export interface ProductionJob {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  variants: ProductionVariants;
  formats: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_videos: number;
  completed_videos: number;
  output_urls: string[];
  zip_url: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Convert a VideoConfig to a Template structure (for saving) */
export function videoConfigToTemplate(
  config: VideoConfig,
  name: string,
  description?: string
): Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'use_count' | 'thumbnail_url'> {
  const textStructure: TextPlateStructure[] = config.textPlates.map((plate, index) => ({
    id: plate.id,
    placeholder: plate.isCta ? 'cta' : index === 0 ? 'headline' : 'body',
    fontSize: plate.fontSize,
    fontWeight: plate.fontWeight,
    color: plate.color,
    startFrame: plate.startFrame,
    endFrame: plate.endFrame,
    animation: plate.animation,
    isCta: plate.isCta,
    ctaBackgroundColor: plate.ctaBackgroundColor,
    ctaBorderRadius: plate.ctaBorderRadius,
  }));

  const defaultTexts = config.textPlates.map((plate, index) => ({
    placeholder: plate.isCta ? 'cta' : index === 0 ? 'headline' : 'body',
    text: plate.text,
  }));

  return {
    name,
    description: description || null,
    duration_frames: config.durationInFrames,
    fps: config.fps,
    background: config.background,
    logo: config.logo,
    text_structure: textStructure,
    default_texts: defaultTexts,
    formats: ['story', 'feed'],
    is_favorite: false,
  };
}

/** Convert a Template back to a VideoConfig with specific texts */
export function templateToVideoConfig(
  template: Template,
  texts: { headline?: string; body?: string; cta?: string }
): VideoConfig {
  const textPlates: TextPlate[] = template.text_structure.map((structure) => {
    let text = '';
    if (structure.placeholder === 'headline') text = texts.headline || '';
    else if (structure.placeholder === 'body') text = texts.body || '';
    else if (structure.placeholder === 'cta') text = texts.cta || '';

    // Fallback to default text if not provided
    if (!text) {
      const defaultText = template.default_texts.find(d => d.placeholder === structure.placeholder);
      text = defaultText?.text || '';
    }

    return {
      id: structure.id,
      text,
      fontSize: structure.fontSize,
      fontWeight: structure.fontWeight,
      color: structure.color,
      startFrame: structure.startFrame,
      endFrame: structure.endFrame,
      animation: structure.animation,
      isCta: structure.isCta,
      ctaBackgroundColor: structure.ctaBackgroundColor,
      ctaBorderRadius: structure.ctaBorderRadius,
    };
  });

  return {
    width: 1080,
    height: 1920,
    durationInFrames: template.duration_frames,
    fps: template.fps,
    background: template.background,
    textPlates,
    logo: template.logo,
  };
}

/** Calculate total video combinations from variants and formats */
export function calculateTotalVideos(variants: ProductionVariants, formats: string[]): number {
  const headlines = Math.max(variants.headlines.length, 1);
  const bodies = Math.max(variants.bodies.length, 1);
  const ctas = Math.max(variants.ctas.length, 1);
  const formatCount = Math.max(formats.length, 1);

  return headlines * bodies * ctas * formatCount;
}
