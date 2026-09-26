"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DisplayStudio } from "@/components/display/display-studio";
import { openCampaign } from "@/lib/studio/campaign-sync";

function DisplayPageInner() {
  const campaign = useSearchParams().get("campaign");
  // ?campaign=<id>: kampanjens displaypaket laddas och ändringar sparas tillbaka.
  useEffect(() => {
    if (campaign) void openCampaign(campaign);
  }, [campaign]);
  return <DisplayStudio />;
}

export default function DisplayPage() {
  return (
    <Suspense fallback={null}>
      <DisplayPageInner />
    </Suspense>
  );
}
