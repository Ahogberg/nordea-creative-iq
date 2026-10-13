import type { VideoConfig } from "@/lib/remotion/types";
export function draftChoices(prompt: string): { format?: VideoConfig["format"]; duration?: number } {
  const format = prompt.match(/format:\s*(9:16|1:1|16:9|4:5)/i)?.[1];
  const duration = prompt.match(/längd:\s*(6|15|30|60)\s*sekunder/i)?.[1];
  const formats: Record<string, VideoConfig["format"]> = { "9:16": "story", "1:1": "feed", "16:9": "landscape", "4:5": "vertical" };
  return { format: format ? formats[format] : undefined, duration: duration ? Number(duration) : undefined };
}
