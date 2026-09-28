import { z } from "zod";
import { DISPLAY_FORMATS } from "@/lib/formats/registry";
import type { DisplaySet } from "./types";

const hex = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

const IllustrationSchema = z.object({
  tsxCode: z.string().max(60_000),
  compiledJs: z.string().max(200_000),
  layers: z.array(z.any()).optional(),
  atSeconds: z.number().min(0).max(60),
  designWidth: z.number().positive(),
  designHeight: z.number().positive(),
});

const ContentSchema = z.object({
  headline: z.string().max(300),
  subline: z.string().max(400).optional(),
  cta: z.string().max(40).optional(),
  background: hex,
  headlineColor: hex.optional(),
  illustration: IllustrationSchema.nullable().optional(),
  legal: z
    .object({ creditWarning: z.boolean().optional(), riskNote: z.string().max(200).optional() })
    .optional(),
});

const OverrideSchema = z.object({
  headline: z.string().max(300).optional(),
  subline: z.string().max(400).nullable().optional(),
  cta: z.string().max(40).nullable().optional(),
  hideIllustration: z.boolean().optional(),
});

const formatIds = DISPLAY_FORMATS.map((f) => f.id) as [string, ...string[]];

export const DisplaySetSchema = z.object({
  name: z.string().min(1).max(120),
  content: ContentSchema,
  formats: z.array(z.enum(formatIds)).min(1),
  overrides: z.record(z.string(), OverrideSchema).default({}),
});

/** Validerar och typar ett displaypaket från klienten. */
export function parseDisplaySet(input: unknown): DisplaySet {
  return DisplaySetSchema.parse(input) as DisplaySet;
}
