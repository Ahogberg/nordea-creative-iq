"use client";

import Link from "next/link";
import { Check, Loader2, AlertCircle, Megaphone } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";

/** Visar vilken kampanj studion sparar till, och om det har sparats. */
export function CampaignChip() {
  const campaign = useStudioStore((s) => s.campaign);
  const save = useStudioStore((s) => s.campaignSave);
  if (!campaign) return null;
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      title="Tillbaka till kampanjen"
      className="flex items-center gap-1.5 h-8 max-w-[260px] rounded-full border border-nordea-border bg-nordea-bg px-3 text-xs text-nordea-text hover:border-nordea-blue/30 hover:text-nordea-blue"
    >
      <Megaphone className="w-3.5 h-3.5 flex-shrink-0 text-nordea-blue" />
      <span className="truncate font-medium">{campaign.name}</span>
      <span className="flex items-center gap-1 text-[11px] text-nordea-text-tertiary flex-shrink-0">
        {save === "saving" ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" /> Sparar
          </>
        ) : save === "error" ? (
          <>
            <AlertCircle className="w-3 h-3 text-nordea-rose" /> Ej sparad
          </>
        ) : (
          <>
            <Check className="w-3 h-3 text-nordea-green" /> Sparad
          </>
        )}
      </span>
    </Link>
  );
}

/** Behåller ?campaign= när man går mellan video och display. */
export function useCampaignQuery(): string {
  const id = useStudioStore((s) => s.campaign?.id);
  return id ? `?campaign=${id}` : "";
}
