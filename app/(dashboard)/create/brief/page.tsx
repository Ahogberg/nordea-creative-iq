"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload, ArrowRight, FileText, Clock } from "lucide-react";
import type { CreativeBrief } from "@/lib/brief/types";

export default function BriefEntryPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [loadingBriefs, setLoadingBriefs] = useState(true);

  useEffect(() => {
    fetch("/api/brief")
      .then((r) => r.json())
      .then((data) => {
        setBriefs(data.briefs ?? []);
      })
      .catch(() => setBriefs([]))
      .finally(() => setLoadingBriefs(false));
  }, []);

  const draftBriefs = briefs.filter((b) => b.status === "draft");

  return (
    <div className="main-content">
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h1 className="nordea-display text-4xl text-nordea-deep mb-3 tracking-tight">
            Skapa kampanj från idé
          </h1>
          <p className="text-base text-nordea-text-secondary">
            Från första tanke till färdig kampanj — välj hur du vill börja
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Mode A: Brainstorm */}
          <button
            type="button"
            onClick={() => router.push("/create/brief/wizard")}
            className="group bg-white border-2 border-nordea-border rounded-2xl p-8 text-left hover:border-nordea-teal hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 bg-nordea-teal/10 text-nordea-teal rounded-xl flex items-center justify-center mb-6 group-hover:bg-nordea-teal/15">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-nordea-text mb-2">
              Brainstorma med AI
            </h2>
            <p className="text-sm text-nordea-text-secondary mb-6">
              Du har en idé eller ett problem men ingen färdig brief. AI:n
              hjälper dig genom 5 enkla steg att bygga strategin tillsammans.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-nordea-teal">
              Starta brainstorming
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mode B: Upload */}
          <button
            type="button"
            onClick={() => router.push("/create/brief/upload")}
            className="group bg-white border-2 border-nordea-border rounded-2xl p-8 text-left hover:border-nordea-blue hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 bg-nordea-blue/10 text-nordea-blue rounded-xl flex items-center justify-center mb-6 group-hover:bg-nordea-blue/15">
              <Upload className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-nordea-text mb-2">
              Ladda upp brief
            </h2>
            <p className="text-sm text-nordea-text-secondary mb-6">
              Du har redan en brief (PDF eller text). AI:n extraherar
              strategin och du kan justera innan kampanjen genereras.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-nordea-blue">
              Ladda upp brief
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Existing briefs */}
        <div>
          <h3 className="text-sm font-medium text-nordea-text-secondary mb-4 uppercase tracking-wider">
            Pågående briefer
          </h3>

          {loadingBriefs ? (
            <div className="bg-white border border-nordea-border rounded-xl p-6 text-center">
              <p className="text-sm text-nordea-text-tertiary">Laddar…</p>
            </div>
          ) : draftBriefs.length === 0 ? (
            <div className="bg-white border border-nordea-border rounded-xl p-6 text-center">
              <p className="text-sm text-nordea-text-tertiary">
                Inga pågående briefer än
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {draftBriefs.map((brief) => {
                const stage = brief.wizard_state?.current_stage ?? 0;
                const total = brief.wizard_state?.total_stages ?? 6;
                const isUpload = brief.source === "upload";
                return (
                  <button
                    type="button"
                    key={brief.id}
                    onClick={() =>
                      router.push(
                        isUpload
                          ? `/create/brief/${brief.id}/review`
                          : `/create/brief/wizard?id=${brief.id}`
                      )
                    }
                    className="group bg-white border border-nordea-border rounded-xl p-4 text-left hover:border-nordea-blue/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-nordea-bg-hover rounded-lg flex items-center justify-center flex-shrink-0">
                        {isUpload ? (
                          <FileText className="w-4 h-4 text-nordea-blue" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-nordea-teal" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-nordea-text line-clamp-1">
                          {brief.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-nordea-text-tertiary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Steg {stage + 1}/{total}
                          </span>
                          <span>
                            {new Date(brief.updated_at).toLocaleDateString(
                              "sv-SE"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
