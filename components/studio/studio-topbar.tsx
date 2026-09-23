"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Download, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { SaveTemplateModal } from "./save-template-modal";
import { ExportModal } from "./export-modal";

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

  const [saveOpen, setSaveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const totalDuration = config.scenes.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  const setTitle = (title: string) =>
    useStudioStore.setState((s) => ({ config: { ...s.config, title } }));

  return (
    <header className="h-14 px-3 border-b border-nordea-border bg-white flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/create"
          aria-label="Tillbaka"
          title="Tillbaka"
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
        <button type="button" onClick={() => setSaveOpen(true)} className="nordea-btn nordea-btn-secondary nordea-btn-sm">
          <Save className="w-4 h-4" />
          Spara som mall
        </button>
        <button type="button" className="nordea-btn nordea-btn-secondary nordea-btn-sm">
          <ShieldCheck className="w-4 h-4" />
          Kör QA
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
