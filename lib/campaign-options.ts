// Kanaler och format som kampanjen ska användas i. Strategin (briefen)
// rekommenderar; kampanjen sparar det man faktiskt valt (campaigns.channels
// och campaigns.formats). Videon görs i det första valda formatet — övriga
// format växlar man till i Motion Studio.

import { z } from "zod";
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
  { id: "vertical", name: "Porträtt", ratio: "4:5" },
  { id: "feed", name: "Kvadratisk", ratio: "1:1" },
  { id: "landscape", name: "Bredbild", ratio: "16:9" },
] as const satisfies readonly { id: VideoConfig["format"]; name: string; ratio: string }[];

export type Channel = (typeof CHANNELS)[number]["id"];
export type Format = VideoConfig["format"];

const CHANNEL_IDS = CHANNELS.map((c) => c.id) as [Channel, ...Channel[]];
const FORMAT_IDS = FORMATS.map((f) => f.id) as [Format, ...Format[]];

const unique = <T,>(list: T[]) => [...new Set(list)];

/** Minst en kanal och ett format; dubbletter tas bort, ordningen behålls. */
export const CampaignChoicesSchema = z.object({
  channels: z.array(z.enum(CHANNEL_IDS)).min(1).transform(unique),
  formats: z.array(z.enum(FORMAT_IDS)).min(1).transform(unique),
});

export type CampaignChoices = z.infer<typeof CampaignChoicesSchema>;

export const isChannel = (id: string): id is Channel => CHANNELS.some((c) => c.id === id);
export const isFormat = (id: string): id is Format => FORMATS.some((f) => f.id === id);

export function channelName(id: string): string {
  return CHANNELS.find((c) => c.id === id)?.name ?? id;
}

export function formatName(id: string): string {
  const format = FORMATS.find((f) => f.id === id);
  return format ? `${format.name} · ${format.ratio}` : id;
}
