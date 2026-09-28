"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Sista steget i brief-flödet: hämtar kampanjen för briefen — eller skapar den
// en gång om den inte finns — och går vidare till kampanjvyn. API:et är
// idempotent, så att öppna sidan igen skapar ingen ny kampanj.
export default function BriefCampaignPage({ params }: PageProps) {
  const router = useRouter();
  const { id: briefId } = use(params);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/brief/${briefId}/generate-campaign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        const data = (await res.json().catch(() => null)) as { campaign?: { id: string }; error?: string } | null;
        if (!res.ok || !data?.campaign) throw new Error(data?.error || "Kampanjen kunde inte skapas");
        if (!cancelled) router.replace(`/campaigns/${data.campaign.id}`);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Något gick fel");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [briefId, attempt, router]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-10 h-10 text-nordea-rose mx-auto mb-3" />
          <p className="text-base font-medium text-nordea-text mb-2">Kunde inte skapa kampanjen</p>
          <p className="text-sm text-nordea-text-tertiary mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => router.push(`/create/brief/${briefId}/review`)}
              className="nordea-btn nordea-btn-secondary"
            >
              Tillbaka till strategi
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAttempt((a) => a + 1);
              }}
              className="nordea-btn nordea-btn-primary"
            >
              Försök igen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-4">
        <div className="w-16 h-16 bg-nordea-blue-soft rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Rocket className="w-7 h-7 text-nordea-blue" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 text-nordea-blue animate-spin" />
          <p className="text-base font-medium text-nordea-text">Förbereder kampanjen…</p>
        </div>
        <p className="text-sm text-nordea-text-tertiary">
          Första gången skriver AI:n en video utifrån strategin — det tar runt 20 sekunder.
        </p>
      </div>
    </div>
  );
}
