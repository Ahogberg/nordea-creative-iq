"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Download, Sparkles, ShieldCheck, Loader2, LayoutGrid } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { SaveTemplateModal } from "./save-template-modal";
import { ExportModal } from "./export-modal";
import { CampaignChip, useCampaignQuery } from "./campaign-chip";
import { UndoRedo } from "./undo-redo";
import { extractVariantSeeds } from "@/lib/video-types";
import type { VideoConfig } from "@/lib/remotion/types";

const QA_STATUS_LABEL: Record<string, string> = {
  pass: "Över tröskeln",
  warn: "Under tröskeln — kan godkännas manuellt",
  fail: "Blockerad — se åtgärderna i rapporten",
};

/** Texten i videon som QA-gaten granskar (fetstilsmarkörer ** bort). */
function qaMetadata(config: VideoConfig) {
  const clean = (t: string) => t.replace(/\*\*/g, "").trim() || undefined;
  const seeds = extractVariantSeeds(config);
  return {
    headline: clean(seeds.headline),
    body: clean(seeds.body),
    cta: clean(seeds.cta),
    duration_s: config.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0),
    has_logo: config.showLogo,
  };
}

/** Nordeas ordmärke i Nordea-blått (samma fil som i videorna, som mask). */
function Wordmark() {
  const mask = 'url("/images/nordea-logo-neg.png") center / contain no-repeat';
  return (
    <span
      role="img"
      aria-label="Nordea"
      className="block h-[17px] bg-nordea-blue"
      style={{ width: 17 * (567 / 118), WebkitMask: mask, mask }}
    />
  );
}

export function StudioTopbar() {
  const config = useStudioStore((s) => s.config);
  const generateVariants = useStudioStore((s) => s.generateVariants);
  const isGeneratingVariants = useStudioStore((s) => s.isGeneratingVariants);
  const setInspectorTab = useStudioStore((s) => s.setInspectorTab);
  const campaign = useStudioStore((s) => s.campaign);
  const campaignQuery = useCampaignQuery();

  const [saveOpen, setSaveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [qaRunning, setQaRunning] = useState(false);
  const router = useRouter();

  // Kör QA-gaten (persona-jury, ToV, compliance) på videons text och sparar
  // rapporten; resultatet visas som ett kort besked med länk till rapporten.
  const runQA = async () => {
    const metadata = qaMetadata(config);
    if (!metadata.headline && !metadata.body && !metadata.cta) {
      toast.error("Det finns ingen text att granska", { description: "Lägg till en rubrik eller CTA först." });
      return;
    }
    setQaRunning(true);
    try {
      const res = await fetch("/api/qa/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creative_kind: "video",
          creative_ref: campaign?.id ?? `studio-${Date.now()}`,
          metadata,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? body.error ?? "QA-granskningen misslyckades");
      const persisted = typeof body.id === "string" && !body.id.startsWith("ephemeral-");
      toast.success(`QA-poäng ${Math.round(body.total_score)} av 100`, {
        description: QA_STATUS_LABEL[body.status] ?? undefined,
        duration: 10000,
        action: persisted
          ? { label: "Öppna rapporten", onClick: () => router.push(`/qa?run=${body.id}`) }
          : undefined,
      });
    } catch (err) {
      toast.error("QA-granskningen misslyckades", {
        description: err instanceof Error ? err.message : "Försök igen om en stund.",
      });
    } finally {
      setQaRunning(false);
    }
  };

  const totalDuration = config.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  const setTitle = (title: string) =>
    useStudioStore.setState((s) => ({ config: { ...s.config, title } }));

  return (
    <header className="h-14 px-3 border-b border-nordea-border bg-white flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href={campaign ? `/campaigns/${campaign.id}` : "/create"}
          aria-label="Tillbaka"
          title={campaign ? "Tillbaka till kampanjen" : "Tillbaka"}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-nordea-text-tertiary hover:text-nordea-text hover:bg-nordea-bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <Wordmark />
        <span className="w-px h-5 bg-nordea-border" />
        <div className="min-w-0">
          <input
            value={config.title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Videons namn"
            className="block w-[260px] max-w-full bg-transparent text-sm font-semibold text-nordea-text rounded px-1 -mx-1 hover:bg-nordea-bg-hover focus:bg-nordea-bg focus:outline-none focus:ring-2 focus:ring-nordea-blue/15 truncate"
          />
          <p className="text-[11px] text-nordea-text-tertiary">
            Motion Studio · {config.scenes.length} scener · {totalDuration.toFixed(1).replace(".", ",")} s
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <UndoRedo />
        <button
          type="button"
          onClick={() => {
            setInspectorTab("variants");
            void generateVariants();
          }}
          disabled={isGeneratingVariants}
          className="nordea-btn nordea-btn-ghost nordea-btn-sm disabled:opacity-50"
        >
          {isGeneratingVariants ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Varianter
        </button>
        <CampaignChip />
        <Link
          href={`/create/display${campaignQuery}`}
          title="Samma budskap i svenska publicisters displayformat"
          className="nordea-btn nordea-btn-secondary nordea-btn-sm"
        >
          <LayoutGrid className="w-4 h-4" />
          Displayformat
        </Link>
        <button type="button" onClick={() => setSaveOpen(true)} className="nordea-btn nordea-btn-secondary nordea-btn-sm">
          <Save className="w-4 h-4" />
          Spara som mall
        </button>
        <button
          type="button"
          onClick={runQA}
          disabled={qaRunning}
          title="Persona-jury, tone of voice och compliance på videons text"
          className="nordea-btn nordea-btn-secondary nordea-btn-sm"
        >
          {qaRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {qaRunning ? "Granskar…" : "Kör QA"}
        </button>
        <button type="button" onClick={() => setExportOpen(true)} className="nordea-btn nordea-btn-primary nordea-btn-sm">
          <Download className="w-4 h-4" />
          Exportera
        </button>
      </div>

      <SaveTemplateModal open={saveOpen} onClose={() => setSaveOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </header>
  );
}
