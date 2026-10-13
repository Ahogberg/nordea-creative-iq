import { z } from "zod";
export const MediaPlanSchema = z.object({
  budget: z.number().finite().min(0).max(1e12),
  duration_days: z.number().int().min(7).max(90),
  channel_mix: z.record(z.enum(["meta", "youtube", "tiktok", "display", "linkedin"]), z.object({ enabled: z.boolean(), allocation: z.number().finite().min(0).max(100) })),
  audience: z.object({ size: z.number().int().min(1).max(1e9), ageMin: z.number().int().min(18).max(100), ageMax: z.number().int().min(18).max(100) }).refine(a => a.ageMin <= a.ageMax, "Åldersintervallet är ogiltigt"),
}).refine(p => Math.abs(Object.values(p.channel_mix).reduce((sum, c) => sum + (c.enabled ? c.allocation : 0), 0) - 100) < 0.01, "Fördela 100 % av budgeten");
export type MediaPlan = z.infer<typeof MediaPlanSchema>;
