"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Loader2, Megaphone, AlertCircle } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { openCampaign } from "@/lib/studio/campaign-sync";

/**
 * Öppnar kampanjen i ?campaign= och visar studion först när den är inläst.
 * Annars syns standardvideon några sekunder, och det man hinner ändra då
 * skrivs över när kampanjen kommer in.
 */
export function CampaignGate({ campaignId, children }: { campaignId: string | null; children: React.ReactNode }) {
  const openId = useStudioStore((s) => s.campaign?.id);
  const load = useStudioStore((s) => s.campaignLoad);

  useEffect(() => {
    if (campaignId) void openCampaign(campaignId);
  }, [campaignId]);

  if (!campaignId || openId === campaignId) return <>{children}</>;

  const failed = load?.id === campaignId && load.status === "error";
  return (
    <div className="h-full flex items-center justify-center bg-nordea-bg">
      <div className="text-center max-w-md mx-4">
        {failed ? (
          <>
            <AlertCircle className="w-10 h-10 text-nordea-rose mx-auto mb-3" />
            <p className="text-base font-medium text-nordea-text mb-2">Kunde inte öppna kampanjen</p>
            <p className="text-sm text-nordea-text-tertiary mb-4">{load.message}</p>
            <div className="flex gap-2 justify-center">
              <Link href="/campaigns" className="nordea-btn nordea-btn-secondary">
                Till kampanjerna
              </Link>
              <button
                type="button"
                onClick={() => void openCampaign(campaignId)}
                className="nordea-btn nordea-btn-primary"
              >
                Försök igen
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-nordea-blue-soft rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Megaphone className="w-7 h-7 text-nordea-blue" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-nordea-blue animate-spin" />
              <p className="text-base font-medium text-nordea-text">Öppnar kampanjen…</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
