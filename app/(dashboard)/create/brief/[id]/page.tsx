"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { ReviewStage } from "@/components/brief/stages/review-stage";
import type { CreativeBrief } from "@/lib/brief/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Direct view-route till en sparad brief — visar strategy view + inline
// edit utan att behöva gå genom hela wizarden eller upload-flow:et.
// Används från brief-biblioteket (11B.6) och som permalänk.
export default function BriefViewPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [brief, setBrief] = useState<CreativeBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/brief/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.brief) {
          setBrief(data.brief);
        } else {
          setError(data.error || "Brief not found");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-base font-medium text-nordea-text mb-2">
            Kunde inte ladda brief
          </p>
          <p className="text-sm text-nordea-text-tertiary mb-4">
            {error ?? "Okänt fel"}
          </p>
          <button
            type="button"
            onClick={() => router.push("/create/brief")}
            className="nordea-btn nordea-btn-primary"
          >
            Tillbaka
          </button>
        </div>
      </div>
    );
  }

  const answers = {
    problem: brief.problem,
    audience_description: brief.audience_description,
    current_perception: brief.current_perception,
    key_message: brief.key_message,
    desired_action: brief.desired_action,
    unique_value: brief.unique_value,
  };

  return (
    <div className="min-h-screen bg-nordea-bg flex flex-col">
      <div className="h-14 bg-white border-b border-nordea-border flex items-center justify-between px-6 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push("/create/brief")}
          className="flex items-center gap-2 text-sm text-nordea-text-tertiary hover:text-nordea-text"
        >
          <ArrowLeft className="w-4 h-4" />
          Alla briefer
        </button>
        <div className="text-sm font-medium text-nordea-text truncate max-w-md">
          {brief.title}
        </div>
        <div className="w-24" />
      </div>

      <div className="flex-1 overflow-y-auto py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <ReviewStage
            briefId={brief.id}
            answers={answers}
            initialStrategy={
              brief.big_idea
                ? {
                    big_idea: brief.big_idea,
                    insight: brief.insight,
                    tension: brief.tension,
                    audience_personas: brief.audience_personas,
                    key_messages: brief.key_messages,
                    value_props: brief.value_props,
                    tone_of_voice: brief.tone_of_voice,
                    recommended_formats: brief.recommended_formats,
                    recommended_channels: brief.recommended_channels,
                    recommended_kpis: brief.recommended_kpis,
                  }
                : undefined
            }
            onApprove={() =>
              router.push(`/create/brief/${brief.id}/campaign`)
            }
            onBack={() => router.push("/create/brief")}
          />
        </div>
      </div>
    </div>
  );
}
