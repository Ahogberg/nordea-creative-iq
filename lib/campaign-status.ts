// ── Kampanjstatus: en källa för etikett och färg ──
// Används av dashboarden och kampanjlistan så att samma status ser likadan ut
// överallt. Tonerna motsvarar .nordea-badge-* i globals.css.

import type { Campaign } from "@/lib/brief/types";

export type CampaignStatus = Campaign["status"];
export type BadgeTone = "neutral" | "cobalt" | "amber" | "green";

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Utkast", tone: "neutral" },
  in_review: { label: "Under granskning", tone: "amber" },
  approved: { label: "Godkänd", tone: "green" },
  live: { label: "Live", tone: "cobalt" },
};

export function campaignStatus(status: string | null | undefined) {
  return CAMPAIGN_STATUS[(status ?? "draft") as CampaignStatus] ?? CAMPAIGN_STATUS.draft;
}

/** "just nu", "12 min sedan", "3 h sedan", "2 d sedan". */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just nu";
  if (m < 60) return `${m} min sedan`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h sedan`;
  const d = Math.floor(h / 24);
  return `${d} d sedan`;
}
