import type { VideoConfig } from "@/lib/remotion/types";

export const CHANNELS = [
  { id: "meta", name: "Meta / Instagram", description: "Flöde och Stories" },
  { id: "linkedin", name: "LinkedIn", description: "Professionellt flöde" },
  { id: "google", name: "Google Ads", description: "Display och video" },
  { id: "tiktok", name: "TikTok", description: "Vertikal video" },
  { id: "youtube", name: "YouTube", description: "Video i bredbild" },
] as const;

export const FORMATS = [
  { id: "story", name: "Story / Reel", ratio: "9:16" },
  { id: "feed", name: "Kvadratisk", ratio: "1:1" },
  { id: "vertical", name: "Porträtt", ratio: "4:5" },
  { id: "landscape", name: "Bredbild", ratio: "16:9" },
] as const;

export type Channel = (typeof CHANNELS)[number]["id"];
export type Format = VideoConfig["format"];

export function parseCampaignChoices(value: unknown): { channels: Channel[]; formats: Format[] } | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.channels) || !Array.isArray(input.formats)) return null;
  if (
    input.channels.some((item) => typeof item !== "string" || !CHANNELS.some((channel) => channel.id === item)) ||
    input.formats.some((item) => typeof item !== "string" || !FORMATS.some((format) => format.id === item))
  ) return null;
  const channels = [...new Set(input.channels)] as Channel[];
  const formats = [...new Set(input.formats)] as Format[];
  if (!channels.length || !formats.length) return null;
  return { channels, formats };
}

export function channelName(id: string): string {
  return CHANNELS.find((channel) => channel.id === id)?.name ?? id;
}

export function formatName(id: string): string {
  const format = FORMATS.find((item) => item.id === id);
  return format ? `${format.name} · ${format.ratio}` : id;
}
