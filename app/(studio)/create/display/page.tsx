"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DisplayStudio } from "@/components/display/display-studio";
import { CampaignGate } from "@/components/studio/campaign-gate";

function DisplayPageInner() {
  const campaign = useSearchParams().get("campaign");
  // ?campaign=<id>: kampanjens displaypaket laddas och ändringar sparas tillbaka.
  return (
    <CampaignGate campaignId={campaign}>
      <DisplayStudio />
    </CampaignGate>
  );
}

export default function DisplayPage() {
  return (
    <Suspense fallback={null}>
      <DisplayPageInner />
    </Suspense>
  );
}
