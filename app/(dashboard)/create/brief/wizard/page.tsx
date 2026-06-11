"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WizardProgress } from "@/components/brief/wizard-progress";
import { ProblemStage } from "@/components/brief/stages/problem-stage";
import { AudienceStage } from "@/components/brief/stages/audience-stage";
import { PerceptionStage } from "@/components/brief/stages/perception-stage";
import { MessageStage } from "@/components/brief/stages/message-stage";
import { ActionStage } from "@/components/brief/stages/action-stage";
import { ReviewStage } from "@/components/brief/stages/review-stage";
import { WIZARD_STAGES } from "@/lib/brief/types";

// Map wizard stage ids onto the brief column they save into. Used by the
// auto-save logic so the answer ends up in the right SQL column rather than
// only inside wizard_state.
const STAGE_TO_FIELD: Record<string, string> = {
  problem: "problem",
  audience: "audience_description",
  perception: "current_perception",
  message: "key_message",
  action: "desired_action",
};

function BriefWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefIdParam = searchParams.get("id");

  const [currentStage, setCurrentStage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // briefId starts null; set after a successful load or first-save so we
  // never silently write to an id that doesn't exist in the database.
  const [briefId, setBriefId] = useState<string | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(!!briefIdParam);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Resume existing brief if id is present.
  useEffect(() => {
    if (!briefIdParam) return;
    let cancelled = false;
    fetch(`/api/brief/${briefIdParam}`)
      .then((r) => {
        if (!r.ok) throw new Error("Brief hittades inte");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const brief = data.brief;
        if (brief?.id) {
          setBriefId(brief.id);
          if (brief.wizard_state) {
            setCurrentStage(brief.wizard_state.current_stage ?? 0);
            setAnswers(brief.wizard_state.answers ?? {});
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setResumeError(
            err instanceof Error ? err.message : "Kunde inte ladda brief"
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingBrief(false);
      });
    return () => {
      cancelled = true;
    };
  }, [briefIdParam]);

  const saveProgress = useCallback(
    async (
      stageField: string,
      answer: string,
      nextStageIndex: number,
      mergedAnswers: Record<string, string>
    ): Promise<boolean> => {
      setSaveError(null);
      setIsSaving(true);
      try {
        const url = briefId ? `/api/brief/${briefId}` : "/api/brief";
        const method = briefId ? "PUT" : "POST";

        const payload = {
          source: "wizard",
          title:
            mergedAnswers.problem?.slice(0, 60) ||
            mergedAnswers.audience_description?.slice(0, 60) ||
            "Ny brief",
          [stageField]: answer,
          wizard_state: {
            current_stage: nextStageIndex,
            total_stages: WIZARD_STAGES.length,
            answers: mergedAnswers,
          },
        };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Servern svarade med fel – försök igen");
        const data = await res.json();

        if (!briefId && data.brief?.id) {
          setBriefId(data.brief.id);
          window.history.replaceState(
            {},
            "",
            `/create/brief/wizard?id=${data.brief.id}`
          );
        }
        return true;
      } catch (err) {
        console.error("[wizard] save failed:", err);
        setSaveError(
          err instanceof Error ? err.message : "Kunde inte spara – försök igen"
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [briefId]
  );

  const nextStage = () =>
    setCurrentStage((s) => Math.min(s + 1, WIZARD_STAGES.length - 1));
  const prevStage = () => setCurrentStage((s) => Math.max(s - 1, 0));

  const handleStageComplete = async (stageId: string, answer: string) => {
    const field = STAGE_TO_FIELD[stageId] ?? stageId;
    const merged = { ...answers, [field]: answer };
    setAnswers(merged);
    const saved = await saveProgress(field, answer, currentStage + 1, merged);
    if (saved) nextStage();
  };

  if (isLoadingBrief) {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-nordea-text-tertiary animate-spin" />
      </div>
    );
  }

  if (resumeError) {
    return (
      <div className="min-h-screen bg-nordea-bg flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-700 font-medium mb-4">{resumeError}</p>
          <button
            type="button"
            onClick={() => router.push("/create/brief")}
            className="text-sm text-nordea-blue underline"
          >
            Tillbaka till briefs
          </button>
        </div>
      </div>
    );
  }

  const stage = WIZARD_STAGES[currentStage];

  return (
    <div className="min-h-screen bg-nordea-bg flex flex-col">
      <div className="h-14 bg-white border-b border-nordea-border flex items-center justify-between px-6 flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push("/create/brief")}
          className="text-sm text-nordea-text-tertiary hover:text-nordea-text"
        >
          ← Avbryt
        </button>
        <div className="text-sm font-medium text-nordea-text">
          Brainstorming · Steg {currentStage + 1} av {WIZARD_STAGES.length}
        </div>
        <div className="w-16 text-right">
          {isSaving && (
            <Loader2 className="w-3.5 h-3.5 text-nordea-text-tertiary animate-spin inline" />
          )}
        </div>
      </div>

      {saveError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700 text-center">
          {saveError}
        </div>
      )}

      <WizardProgress currentStage={currentStage} />

      <div className="flex-1 overflow-y-auto py-8 px-6">
        <div className={`max-w-2xl mx-auto${isSaving ? " pointer-events-none opacity-70" : ""}`}>
          {stage.id === "problem" && (
            <ProblemStage
              answer={answers.problem ?? ""}
              onComplete={(a) => handleStageComplete("problem", a)}
            />
          )}
          {stage.id === "audience" && (
            <AudienceStage
              context={answers}
              answer={answers.audience_description ?? ""}
              onComplete={(a) => handleStageComplete("audience", a)}
              onBack={prevStage}
            />
          )}
          {stage.id === "perception" && (
            <PerceptionStage
              context={answers}
              answer={answers.current_perception ?? ""}
              onComplete={(a) => handleStageComplete("perception", a)}
              onBack={prevStage}
            />
          )}
          {stage.id === "message" && (
            <MessageStage
              context={answers}
              answer={answers.key_message ?? ""}
              onComplete={(a) => handleStageComplete("message", a)}
              onBack={prevStage}
            />
          )}
          {stage.id === "action" && (
            <ActionStage
              context={answers}
              answer={answers.desired_action ?? ""}
              onComplete={(a) => handleStageComplete("action", a)}
              onBack={prevStage}
            />
          )}
          {stage.id === "review" && briefId && (
            <ReviewStage
              briefId={briefId}
              answers={answers}
              onApprove={() =>
                router.push(`/create/brief/${briefId}/campaign`)
              }
              onBack={prevStage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function BriefWizardPage() {
  return (
    <Suspense fallback={null}>
      <BriefWizardInner />
    </Suspense>
  );
}
