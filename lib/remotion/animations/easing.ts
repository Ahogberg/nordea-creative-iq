import { Easing } from "remotion";

/**
 * Nordea Motion Language — easing curves.
 * Curated from Material Design + Apple HIG to match Nordea's "varm men
 * professionell" tonality. Use NORDEA_EASING.standard as the default;
 * decelerate for elements that arrive, accelerate for ones that leave.
 */
export const NORDEA_EASING = {
  standard: Easing.bezier(0.25, 0.1, 0.25, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  easeOutExpo: Easing.bezier(0.16, 1, 0.3, 1),
  easeOutBack: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

export type EasingName = keyof typeof NORDEA_EASING;
