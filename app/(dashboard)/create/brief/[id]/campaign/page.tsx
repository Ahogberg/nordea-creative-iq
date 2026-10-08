"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Rocket, AlertCircle, ArrowLeft } from "lucide-react";
import { CampaignChoicesPicker } from "@/components/brief/campaign-choices-picker";
import { isChannel, isFormat, type Channel, type Format } from "@/lib/campaign-options";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface BriefSummary {
  title?: string | null;
  recommended_channels?: string[] | null;
  recommended_formats?: string[] | null;
}

type Phase = "checking" | "choose" | "creating" | "error";

/** Skapar kampanjen (eller hämtar den som finns) och returnerar dess id. */
async function createCampaign(briefId: string, body: { channels?: Channel[]; formats?: Format[] }): Promise<string> {
  const res = await fetch(`/api/brief/${briefId}/generate-campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as { campaign?: { id: string }; error?: string } | null;
  if (!res.ok || !data?.campaign) throw new Error(data?.error || "Kampanjen kunde inte skapas");
  return data.campaign.id;
}

// Sista steget i brief-flödet. Finns kampanjen redan går sidan direkt vidare
// till den (API:et är idempotent — inget skapas två gånger). Annars väljer man
// kanaler och format, förvalda från strategin, och AI:n skriver videon.
export default function BriefCampaignPage({ params }: PageProps) {
  const router = useRouter();
  const { id: briefId } = use(params);
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<BriefSummary | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [campaignsRes, briefRes] = await Promise.all([
          fetch(`/api/campaigns?brief_id=${encodeURIComponent(briefId)}`),
          fetch(`/api/brief/${briefId}`),
        ]);
        const campaigns = (await campaignsRes.json().catch(() => null)) as { campaigns?: { id: string }[] } | null;
        const briefData = (await briefRes.json().catch(() => null)) as { brief?: BriefSummary } | null;
        if (!briefRes.ok || !briefData?.brief) throw new Error("Briefen kunde inte hämtas");
        if (!campaignsRes.ok) throw new Error("Kampanjerna kunde inte hämtas");
        if (cancelled) return;

        if (campaigns?.campaigns?.length) {
          // Kampanjen finns: gå vidare. Anropet flyttar in videon från mallen
          // för äldre kampanjer och returnerar annars direkt.
          const id = await createCampaign(briefId, {});
          if (!cancelled) router.replace(`/campaigns/${id}`);
          return;
        }

        const b = briefData.brief;
        const recChannels = (b.recommended_channels ?? []).filter(isChannel);
        const recFormats = (b.recommended_formats ?? []).filter(isFormat);
        setBrief(b);
        setChannels(recChannels.length ? recChannels : ["meta"]);
        setFormats(recFormats.length ? recFormats : ["story"]);
        setPhase("choose");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Något gick fel");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [briefId, attempt, router]);

  const create = async () => {
    setPhase("creating");
    try {
      const id = await createCampaign(briefId, { channels, formats });
      router.replace(`/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
      setPhase("error");
    }
  };

  if (phase === "error") {
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
                // Valen finns kvar: försök skapa igen; annars börja om.
                if (brief) void create();
                else {
                  setPhase("checking");
                  setAttempt((a) => a + 1);
                }
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

  if (phase === "choose") {
    const ready = channels.length > 0 && formats.length > 0;
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-12">
        <Link
          href={`/create/brief/${briefId}/review`}
          className="inline-flex items-center gap-1 text-sm text-nordea-text-secondary hover:text-nordea-blue"
        >
          <ArrowLeft className="h-4 w-4" /> Tillbaka till strategin
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-nordea-text-tertiary">Kampanj</p>
          <h1 className="mt-1 text-2xl font-semibold text-nordea-text">Var ska kampanjen synas?</h1>
          <p className="mt-1 text-sm text-nordea-text-secondary">
            {brief?.title ? `${brief.title} · ` : ""}Strategins rekommendationer är förvalda. Du kan ändra dem senare i
            kampanjen.
          </p>
        </div>
        <section className="nordea-card p-5">
          <CampaignChoicesPicker
            channels={channels}
            formats={formats}
            recommendedChannels={brief?.recommended_channels ?? []}
            recommendedFormats={brief?.recommended_formats ?? []}
            onChange={(next) => {
              setChannels(next.channels);
              setFormats(next.formats);
            }}
          />
        </section>
        <div className="flex items-center justify-end gap-3">
          {!ready && <p className="text-xs text-nordea-text-tertiary">Välj minst en kanal och ett format.</p>}
          <button type="button" onClick={create} disabled={!ready} className="nordea-btn nordea-btn-primary disabled:opacity-50">
            <Rocket className="h-4 w-4" />
            Skapa kampanj
          </button>
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
          <p className="text-base font-medium text-nordea-text">
            {phase === "creating" ? "Skapar kampanjen…" : "Förbereder kampanjen…"}
          </p>
        </div>
        {phase === "creating" && (
          <p className="text-sm text-nordea-text-tertiary">AI:n skriver en video utifrån strategin — det tar runt 20 sekunder.</p>
        )}
      </div>
    </div>
  );
}
