// ── Nordea brand safe zones per format ──
//
// TODO: Replace these defaults with actual Nordea brand guidelines.
// Reference: Nordea Brand Manual (internal document — pending input from
// Marknad). The numbers below are reasonable industry defaults so the
// Master Creative editor renders something sensible from day one.
//
// Each format has positioning rules for element types:
//   logo / headline / subtitle / cta / counter / asset
//
// Position values are PERCENTAGE-free pixel offsets from a chosen anchor.
// Anchors are the 9-grid (top-left … bottom-right + center). Sizes are
// CSS-string max-widths/heights so they can be either px or %.

export type FormatId = "story" | "feed" | "landscape" | "vertical";

export interface FormatDimensions {
  id: FormatId;
  label: string;
  ratio: string;
  width: number;
  height: number;
}

export const FORMATS: Record<FormatId, FormatDimensions> = {
  story: {
    id: "story",
    label: "Story",
    ratio: "9:16",
    width: 1080,
    height: 1920,
  },
  feed: { id: "feed", label: "Feed", ratio: "1:1", width: 1080, height: 1080 },
  landscape: {
    id: "landscape",
    label: "Landscape",
    ratio: "16:9",
    width: 1920,
    height: 1080,
  },
  vertical: {
    id: "vertical",
    label: "Vertical",
    ratio: "4:5",
    width: 1080,
    height: 1350,
  },
};

export type Anchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ElementSafeZone {
  anchor: Anchor;
  offsetX?: number; // pixels from anchor edge (top-left → distance from left)
  offsetY?: number; // pixels from anchor edge (top-left → distance from top)
  maxWidth?: string; // "80%" or "600px"
  maxHeight?: string;
  fontSize?: number; // for text elements
  textAlign?: "left" | "center" | "right";
}

export type ElementType =
  | "logo"
  | "headline"
  | "subtitle"
  | "cta"
  | "counter"
  | "asset";

export interface FormatSafeZones {
  format: FormatId;
  elements: Record<ElementType, ElementSafeZone>;
}

// ── Defaults — REPLACE WITH OFFICIAL NORDEA BRAND GUIDELINES ──
export const BRAND_SAFE_ZONES: Record<FormatId, FormatSafeZones> = {
  story: {
    format: "story",
    elements: {
      logo: {
        anchor: "top-center",
        offsetY: 80,
        maxWidth: "180px",
        maxHeight: "60px",
      },
      headline: {
        anchor: "center",
        offsetY: -200,
        maxWidth: "85%",
        fontSize: 72,
        textAlign: "center",
      },
      subtitle: {
        anchor: "center",
        offsetY: -60,
        maxWidth: "80%",
        fontSize: 36,
        textAlign: "center",
      },
      counter: {
        anchor: "center",
        maxWidth: "85%",
        fontSize: 200,
        textAlign: "center",
      },
      cta: {
        anchor: "bottom-center",
        offsetY: 200,
        maxWidth: "80%",
        fontSize: 44,
      },
      asset: {
        anchor: "center",
        maxWidth: "100%",
        maxHeight: "100%",
      },
    },
  },
  feed: {
    format: "feed",
    elements: {
      logo: {
        anchor: "top-left",
        offsetX: 60,
        offsetY: 60,
        maxWidth: "160px",
        maxHeight: "50px",
      },
      headline: {
        anchor: "center",
        offsetY: -80,
        maxWidth: "80%",
        fontSize: 64,
        textAlign: "center",
      },
      subtitle: {
        anchor: "center",
        offsetY: 20,
        maxWidth: "75%",
        fontSize: 32,
        textAlign: "center",
      },
      counter: {
        anchor: "center",
        maxWidth: "80%",
        fontSize: 180,
        textAlign: "center",
      },
      cta: {
        anchor: "bottom-center",
        offsetY: 80,
        maxWidth: "60%",
        fontSize: 36,
      },
      asset: {
        anchor: "center",
        maxWidth: "100%",
        maxHeight: "100%",
      },
    },
  },
  landscape: {
    format: "landscape",
    elements: {
      logo: {
        anchor: "top-left",
        offsetX: 80,
        offsetY: 60,
        maxWidth: "180px",
        maxHeight: "60px",
      },
      headline: {
        anchor: "center-left",
        offsetX: 100,
        maxWidth: "45%",
        fontSize: 80,
        textAlign: "left",
      },
      subtitle: {
        anchor: "center-left",
        offsetX: 100,
        offsetY: 80,
        maxWidth: "40%",
        fontSize: 36,
        textAlign: "left",
      },
      counter: {
        anchor: "center",
        maxWidth: "80%",
        fontSize: 220,
        textAlign: "center",
      },
      cta: {
        anchor: "bottom-left",
        offsetX: 100,
        offsetY: 100,
        maxWidth: "30%",
        fontSize: 40,
      },
      asset: {
        anchor: "center",
        maxWidth: "100%",
        maxHeight: "100%",
      },
    },
  },
  vertical: {
    format: "vertical",
    elements: {
      logo: {
        anchor: "top-center",
        offsetY: 80,
        maxWidth: "160px",
        maxHeight: "55px",
      },
      headline: {
        anchor: "center",
        offsetY: -120,
        maxWidth: "85%",
        fontSize: 68,
        textAlign: "center",
      },
      subtitle: {
        anchor: "center",
        maxWidth: "80%",
        fontSize: 34,
        textAlign: "center",
      },
      counter: {
        anchor: "center",
        maxWidth: "80%",
        fontSize: 190,
        textAlign: "center",
      },
      cta: {
        anchor: "bottom-center",
        offsetY: 140,
        maxWidth: "70%",
        fontSize: 38,
      },
      asset: {
        anchor: "center",
        maxWidth: "100%",
        maxHeight: "100%",
      },
    },
  },
};

// Compute concrete pixel position for an element in a given format. Returns
// the anchor-resolved (x, y) plus the raw safe zone in case the caller also
// wants size/alignment metadata.
export function computePosition(
  format: FormatId,
  elementType: ElementType
): { x: number; y: number; safeZone: ElementSafeZone } {
  const dimensions = FORMATS[format];
  const safeZones = BRAND_SAFE_ZONES[format];
  const zone = safeZones.elements[elementType];

  const { width, height } = dimensions;
  const offsetX = zone.offsetX || 0;
  const offsetY = zone.offsetY || 0;

  let x = 0;
  let y = 0;

  if (zone.anchor.includes("left")) x = offsetX;
  else if (zone.anchor.includes("right")) x = width - offsetX;
  else x = width / 2 + offsetX;

  if (zone.anchor.includes("top")) y = offsetY;
  else if (zone.anchor.includes("bottom")) y = height - offsetY;
  else y = height / 2 + offsetY;

  return { x, y, safeZone: zone };
}
