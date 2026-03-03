export type BackgroundType = 'solid' | 'gradient' | 'image' | 'video';
export type AnimationType = 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
export type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type FontWeight = 400 | 500 | 600 | 700;

export interface BackgroundConfig {
  type: BackgroundType;
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  imageUrl: string | null;
  videoUrl: string | null;
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

export interface LogoConfig {
  visible: boolean;
  position: LogoPosition;
  size: number;
  opacity: number;
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

export interface VideoFormat {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
}

export const VIDEO_FORMATS: VideoFormat[] = [
  { id: 'story', label: 'Story / Reels', description: '9:16', width: 1080, height: 1920 },
  { id: 'feed', label: 'Feed', description: '1:1', width: 1080, height: 1080 },
  { id: 'landscape', label: 'Landscape', description: '16:9', width: 1920, height: 1080 },
  { id: 'feed-portrait', label: 'Feed Portrait', description: '4:5', width: 1080, height: 1350 },
];

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  width: 1080,
  height: 1920,
  durationInFrames: 150,
  fps: 30,
  background: {
    type: 'solid',
    solidColor: '#00005E',
    gradientStart: '#00005E',
    gradientEnd: '#0000A0',
    gradientAngle: 135,
    imageUrl: null,
    videoUrl: null,
    opacity: 1,
  },
  textPlates: [
    {
      id: 'plate-1',
      text: 'Hur mycket kan ditt sparande växa?',
      fontSize: 56,
      fontWeight: 600,
      color: '#FFFFFF',
      startFrame: 15,
      endFrame: 75,
      animation: 'fade',
      isCta: false,
      ctaBackgroundColor: '#0000A0',
      ctaBorderRadius: 8,
    },
    {
      id: 'plate-2',
      text: 'Se själv med vår sparkalkyl',
      fontSize: 42,
      fontWeight: 500,
      color: '#FFFFFF',
      startFrame: 60,
      endFrame: 120,
      animation: 'fade',
      isCta: false,
      ctaBackgroundColor: '#0000A0',
      ctaBorderRadius: 8,
    },
    {
      id: 'plate-3',
      text: 'Kom igång',
      fontSize: 36,
      fontWeight: 600,
      color: '#FFFFFF',
      startFrame: 105,
      endFrame: 150,
      animation: 'fade',
      isCta: true,
      ctaBackgroundColor: '#0000A0',
      ctaBorderRadius: 8,
    },
  ],
  logo: {
    visible: true,
    position: 'top-center',
    size: 140,
    opacity: 1,
  },
};

export function generateId(): string {
  return `plate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
