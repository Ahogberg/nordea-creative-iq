// ── Displaybanners: innehåll och per-format-justeringar ──
//
// Ett displaypaket har ETT innehåll (budskap, knapp, illustration, juridik)
// som läggs ut per format av layoutmotorn (layout.ts). Per format kan texten
// kortas eller illustrationen döljas utan att de andra formaten påverkas.

import type { MotionLayer } from "@/lib/remotion/types";

export interface DisplayIllustration {
  /** Canvas-koden från Motion Studio (samma som i videon). */
  tsxCode: string;
  /** Kompilerad kod. Servern kompilerar alltid om från tsxCode innan rendering. */
  compiledJs: string;
  layers?: MotionLayer[];
  /** Tidpunkt i scenen som den statiska bilden visar (sekunder). */
  atSeconds: number;
  /** Illustrationsytans mått i videons designskala (1080 bred). */
  designWidth: number;
  designHeight: number;
}

export interface DisplayLegal {
  /** Konsumentverkets varning för konsumentkrediter. */
  creditWarning?: boolean;
  /** T.ex. "Investeringar innebär en risk." */
  riskNote?: string;
}

export interface DisplayContent {
  /** Får innehålla **fet** markup. */
  headline: string;
  subline?: string;
  cta?: string;
  /** Hex-färg. */
  background: string;
  headlineColor?: string;
  illustration?: DisplayIllustration | null;
  legal?: DisplayLegal;
}

export interface DisplayOverride {
  headline?: string;
  /** null = dölj i det här formatet. */
  subline?: string | null;
  cta?: string | null;
  hideIllustration?: boolean;
}

export interface DisplaySet {
  name: string;
  content: DisplayContent;
  /** Format-id:n ur lib/formats/registry.ts. */
  formats: string[];
  overrides: Record<string, DisplayOverride>;
}

/** Innehållet för ett format efter justeringar. */
export function resolveContent(content: DisplayContent, override?: DisplayOverride): DisplayContent {
  if (!override) return content;
  return {
    ...content,
    headline: override.headline?.trim() ? override.headline : content.headline,
    subline: override.subline === null ? undefined : override.subline?.trim() ? override.subline : content.subline,
    cta: override.cta === null ? undefined : override.cta?.trim() ? override.cta : content.cta,
    illustration: override.hideIllustration ? null : content.illustration,
  };
}
