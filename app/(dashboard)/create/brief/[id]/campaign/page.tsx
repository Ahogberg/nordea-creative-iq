"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Rocket,
  AlertCircle,
  ArrowRight,
  Layers,
  LayoutGrid,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface CampaignResult {
  campaign: { id: string; name: string };
  template_id: string;
  master_id: string | null;
}

// Final step of the brief flow: turn the synthesized strategy into a
// concrete VideoConfig + persistable assets. We always create a template
// (safe — Sprint 3 path) and opportunistically a master_creative when
// Sprint 9 is deployed.
export default function BriefCampaignPage({ params }: PageProps) {
  const router = useRouter();
  const { id: briefId } = use(params);

  const [status, setStatus] = useState<"generating" | "done" | "error">(
    "generating"
  );
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/brief/${briefId}/generate-campaign`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || "Campaign generation failed");
        }
        const data = (await res.json()) as CampaignResult;
        setResult(data);
        setStatus("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Något gick fel");
        setStatus("error");
      }
    })();
  }, [briefId]);

  if (status === "generating") {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-nordea-blue-soft rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Rocket className="w-7 h-7 text-nordea-blue" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-nordea-blue animate-spin" />
            <p className="text-base font-medium text-nordea-text">
              Genererar kampanjmaterial…
            </p>
          </div>
          <p className="text-sm text-nordea-text-tertiary">
            AI omvandlar strategin till en konkret video och sparar som mall.
            Detta tar ~15 sekunder.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-10 h-10 text-nordea-rose mx-auto mb-3" />
          <p className="text-base font-medium text-nordea-text mb-2">
            Kunde inte generera kampanj
          </p>
          <p className="text-sm text-nordea-text-tertiary mb-4">
            {error ?? "Okänt fel"}
          </p>
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
                startedRef.current = false;
                setStatus("generating");
                setError(null);
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

  // status === 'done'
  return (
    <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
      <div className="text-center max-w-lg mx-4">
        <div className="w-16 h-16 bg-nordea-teal/15 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Rocket className="w-7 h-7 text-nordea-teal" />
        </div>
        <h1 className="text-2xl font-semibold text-nordea-text mb-2 tracking-tight">
          Kampanjen är skapad
        </h1>
        <p className="text-sm text-nordea-text-secondary mb-8">
          Strategi → video → mall. Välj vad du vill göra härnäst.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {result?.master_id && (
            <button
              type="button"
              onClick={() =>
                router.push(`/create/master?id=${result.master_id}`)
              }
              className="group bg-white border-2 border-nordea-teal rounded-xl p-5 text-left hover:shadow-md transition-all"
            >
              <Layers className="w-5 h-5 text-nordea-teal mb-3" />
              <p className="text-sm font-semibold text-nordea-text mb-1">
                Öppna i Master
              </p>
              <p className="text-xs text-nordea-text-tertiary mb-3">
                Justera alla 4 format
              </p>
              <span className="flex items-center gap-1 text-xs font-medium text-nordea-teal">
                Master Creative
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              router.push(`/produce?template=${result?.template_id}`)
            }
            className="group bg-white border border-nordea-border rounded-xl p-5 text-left hover:border-nordea-blue/40 transition-all"
          >
            <LayoutGrid className="w-5 h-5 text-nordea-blue mb-3" />
            <p className="text-sm font-semibold text-nordea-text mb-1">
              Massproducera
            </p>
            <p className="text-xs text-nordea-text-tertiary mb-3">
              Skala mallen till många varianter
            </p>
            <span className="flex items-center gap-1 text-xs font-medium text-nordea-blue">
              Öppna Produktion
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => router.push("/templates")}
          className="text-sm text-nordea-text-tertiary hover:text-nordea-text mt-6"
        >
          Eller se alla mallar
        </button>
      </div>
    </div>
  );
}
