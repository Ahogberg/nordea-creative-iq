import type { SpringName } from "../types";

/**
 * Pre-konfigurerade spring-physics-konfigurationer.
 * Använd: spring({ frame, fps, config: SPRING_CONFIGS.gentle })
 *
 * Keys matchar SpringName-typen i ../types så MotionConfig.cta.spring kan
 * referera till en av dessa.
 */
export const SPRING_CONFIGS: Record<SpringName, { damping: number; stiffness: number; mass: number }> = {
  // Mjuk, professionell — för rubriker och text
  gentle: { damping: 20, stiffness: 100, mass: 1 },

  // Standard — för logo-reveals
  standard: { damping: 15, stiffness: 150, mass: 1 },

  // Snappy — för CTA-knappar
  snappy: { damping: 12, stiffness: 200, mass: 1 },

  // Bouncy — använd sparsamt (kan kännas AI-slop)
  bouncy: { damping: 8, stiffness: 180, mass: 1 },

  // Wobbly — för speciella moment (siffror som zoomar in)
  wobbly: { damping: 10, stiffness: 250, mass: 1.2 },
};

export type { SpringName };
