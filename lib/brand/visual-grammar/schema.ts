// ── Nordea Visual Grammar — schema ──
//
// Två nivåer:
//  1. AdAnalysis   — en fil per befintlig annons (brand-reference/analysis/<ad_id>.json).
//                    Beskriver vad som faktiskt syns i annonsen.
//  2. VisualGrammar — syntesen av alla analyser (lib/brand/visual-grammar/visual-grammar.json).
//                    Styr AI-genereringen i Motion Studio.
//
// Varje regel i grammatiken måste peka på minst en analyserad annons
// (`evidence`) — valideringen (`npm run brand:validate`) underkänner regler
// som inte går att spåra tillbaka till verkligt material.
//
// Enum-värdena för motion speglar lib/remotion/types.ts så att recepten kan
// användas direkt som VideoConfig.motion.

import { z } from "zod";

// ── Delade enums (håll i synk med lib/remotion/types.ts) ──

export const SceneTypeSchema = z.enum([
  "title",
  "counter",
  "bars",
  "text-reveal",
  "icon-grid",
  "cta",
  "split",
  "highlight-number",
  "lottie",
  "canvas",
]);

export const MotionConfigSchema = z.object({
  logo: z.object({
    reveal: z.enum(["fade", "spring", "scale", "slide-down", "none"]),
    duration: z.number().int().positive(),
  }),
  text: z.object({
    stagger: z.enum(["word", "character", "line", "none"]),
    delayBetween: z.number().int().nonnegative(),
    useSpring: z.boolean(),
  }),
  cta: z.object({
    reveal: z.enum(["fade", "spring", "scale", "slide-up"]),
    spring: z.enum(["gentle", "standard", "snappy", "bouncy", "wobbly"]),
  }),
  transitions: z.object({
    style: z.enum(["cut", "crossfade", "blur", "slide"]),
    duration: z.number().int().nonnegative(),
  }),
  numbers: z.object({
    enabled: z.boolean(),
    duration: z.number().int().positive(),
  }),
});

export const TextAnimationStyleSchema = z.enum([
  "fade-up",
  "slide-in-left",
  "slide-in-right",
  "mask-reveal",
  "stagger-word",
  "stagger-letter",
  "typewriter",
]);

export const ProductSchema = z.enum([
  "mortgage",
  "savings",
  "loans",
  "pension",
  "insurance",
  "cards",
  "business",
  "general",
]);

const ElementSchema = z.enum([
  "logo",
  "headline",
  "subline",
  "body",
  "cta",
  "illustration",
  "photo",
  "icon",
  "number",
  "disclaimer",
  "pattern",
]);

const PositionSchema = z.enum([
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
  "full-bleed",
]);

const ZoneSchema = z.object({
  element: ElementSchema,
  position: PositionSchema,
  approx_area_pct: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

const HexSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Hex-färg som #RRGGBB");

const TypeStyleSchema = z.object({
  font: z.enum(["NordeaSansLarge", "NordeaSansSmall", "okänd"]),
  weight: z.enum(["black", "bold", "medium", "regular", "light"]),
  case: z.enum(["sentence", "upper", "title"]),
  approx_size_pct_of_height: z.number().min(0).max(100).optional(),
  max_lines: z.number().int().positive().optional(),
  color: HexSchema.optional(),
});

const IllustrationSchema = z.object({
  projection: z.enum(["isometric", "axonometric", "flat", "perspective", "other"]),
  angle_deg: z.number().optional(),
  shading: z.enum(["flat", "cel", "gradient", "none"]),
  outline: z.enum(["none", "thin", "thick"]),
  palette: z.array(HexSchema),
  detail_level: z.enum(["low", "medium", "high"]),
  people: z.enum(["none", "stylized", "faceless", "detailed"]),
  motifs: z.array(z.string()),
  composition: z.string(),
  description: z.string(),
});

const MotionSequenceStepSchema = z.object({
  t_start: z.number().nonnegative(),
  t_end: z.number().nonnegative().optional(),
  element: ElementSchema,
  animation: z.string(),
});

// ── 1. AdAnalysis ──

export const AdAnalysisSchema = z.object({
  ad_id: z.string().regex(/^[a-z0-9][a-z0-9-_]*$/, "Filnamn utan ändelse, gemener"),
  source_files: z.array(z.string()).min(1),
  kind: z.enum(["static", "video"]),
  aspect_ratio: z.string().regex(/^\d+:\d+$/),
  channel: z.string().optional(),
  product: ProductSchema.optional(),
  campaign: z.string().optional(),
  year: z.number().int().optional(),

  layout: z.object({
    archetype_hint: z.string(),
    description: z.string(),
    zones: z.array(ZoneSchema).min(1),
  }),
  color: z.object({
    background: z.array(HexSchema).min(1),
    text: z.array(HexSchema),
    accents: z.array(HexSchema),
    notes: z.string().optional(),
  }),
  typography: z.object({
    headline: TypeStyleSchema.optional(),
    body: TypeStyleSchema.optional(),
    cta: TypeStyleSchema.optional(),
    notes: z.string().optional(),
  }),
  imagery: z.object({
    type: z.enum([
      "isometric_illustration",
      "flat_illustration",
      "photo",
      "3d_render",
      "icon_only",
      "typographic",
      "mixed",
    ]),
    illustration: IllustrationSchema.optional(),
    photo: z
      .object({ subject: z.string(), mood: z.string(), lighting: z.string() })
      .optional(),
  }),
  motion: z
    .object({
      duration_s: z.number().positive(),
      hook_first_2s: z.string(),
      sequence: z.array(MotionSequenceStepSchema).min(1),
      logo_reveal: z.string(),
      text_animation: z.string(),
      cta_reveal: z.string(),
      transitions: z.string(),
      illustration_animation: z.string().optional(),
      pacing: z.enum(["calm", "medium", "fast"]),
      end_card: z.string(),
    })
    .optional(),
  copy: z.object({
    headline: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    disclaimer: z.string().optional(),
    pattern: z.string(),
  }),
  observations: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
  analyzed_at: z.string(),
});

export type AdAnalysis = z.infer<typeof AdAnalysisSchema>;

// ── 2. VisualGrammar ──

const EvidenceSchema = z.array(z.string()).min(1, "Minst en annons som belägg");

const RuleSchema = z.object({
  rule: z.string(),
  evidence: EvidenceSchema,
});

export const LayoutArchetypeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string(),
  aspect_ratios: z.array(z.string().regex(/^\d+:\d+$/)).min(1),
  zones: z.array(ZoneSchema).min(1),
  best_for: z.array(z.string()),
  scene_types: z.array(SceneTypeSchema).min(1),
  evidence: EvidenceSchema,
});

export const MotionRecipeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  description: z.string(),
  when_to_use: z.string(),
  motion: MotionConfigSchema,
  text_animation: TextAnimationStyleSchema.optional(),
  scene_sequence: z.array(SceneTypeSchema).min(1),
  typical_duration_s: z.number().positive(),
  evidence: EvidenceSchema,
});

// Lätt formkontroll — den fullständiga typen finns i lib/remotion/types.ts.
const GoldenVideoConfigSchema = z
  .object({
    format: z.enum(["story", "feed", "landscape", "vertical"]),
    backgroundColor: HexSchema,
    accentColor: HexSchema,
    scenes: z
      .array(
        z.looseObject({
          type: SceneTypeSchema,
          durationSeconds: z.number().positive(),
        })
      )
      .min(1),
  })
  .loose();

export const VisualGrammarSchema = z.object({
  version: z.literal(1),
  status: z.enum(["empty", "draft", "reviewed"]),
  market: z.literal("SE"),
  generated_at: z.string().nullable(),
  reviewed_by: z.string().nullable(),
  source_ad_ids: z.array(z.string()),
  summary: z.string(),

  layout_archetypes: z.array(LayoutArchetypeSchema),
  color_rules: z.array(RuleSchema),
  typography_rules: z.array(RuleSchema),
  illustration_style: z
    .object({
      summary: z.string(),
      projection: IllustrationSchema.shape.projection,
      angle_deg: z.number().optional(),
      shading: IllustrationSchema.shape.shading,
      outline: IllustrationSchema.shape.outline,
      palette: z.array(HexSchema).min(1),
      detail_level: IllustrationSchema.shape.detail_level,
      people: IllustrationSchema.shape.people,
      recurring_motifs: z.array(z.string()),
      do: z.array(z.string()),
      dont: z.array(z.string()),
      // Färdig beskrivning för illustratör eller bildmodell.
      generation_prompt: z.string(),
      evidence: EvidenceSchema,
    })
    .nullable(),
  photography_style: z
    .object({
      summary: z.string(),
      do: z.array(z.string()),
      dont: z.array(z.string()),
      evidence: EvidenceSchema,
    })
    .nullable(),
  motion_recipes: z.array(MotionRecipeSchema),
  copy_patterns: z.array(
    z.object({ pattern: z.string(), example: z.string(), evidence: EvidenceSchema })
  ),
  do: z.array(RuleSchema),
  dont: z.array(RuleSchema),
  golden_examples: z.array(
    z.object({
      ad_id: z.string(),
      why: z.string(),
      video_config: GoldenVideoConfigSchema,
    })
  ),
});

export type VisualGrammar = z.infer<typeof VisualGrammarSchema>;
export type LayoutArchetype = z.infer<typeof LayoutArchetypeSchema>;
export type MotionRecipe = z.infer<typeof MotionRecipeSchema>;
