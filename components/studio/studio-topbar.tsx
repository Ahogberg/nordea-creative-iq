"use client";

import { useState } from "react";
import { Save, Download, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { useStudioStore } from "@/lib/studio/store";
import { SaveTemplateModal } from "./save-template-modal";
import { ExportModal } from "./export-modal";

export function StudioTopbar() {
  const config = useStudioStore((s) => s.config);
  const generateVariants = useStudioStore((s) => s.generateVariants);
  const isGeneratingVariants = useStudioStore((s) => s.isGeneratingVariants);

  const [saveOpen, setSaveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const totalDuration = config.scenes.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  );

  return (
    <div className="h-14 px-6 border-b border-nordea-border bg-white flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-nordea-text">
          Motion Studio
        </h1>
        <p className="text-xs text-nordea-text-tertiary">
          {config.scenes.length} scener · {totalDuration.toFixed(1)}s totalt
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={generateVariants}
          disabled={isGeneratingVariants}
          className="nordea-btn nordea-btn-ghost nordea-btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingVariants ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          AI-varianter
        </button>
        <button
          type="button"
          onClick={() => setSaveOpen(true)}
          className="nordea-btn nordea-btn-secondary nordea-btn-sm"
        >
          <Save className="w-4 h-4" />
          Spara som mall
        </button>
        <button
          type="button"
          className="nordea-btn nordea-btn-secondary nordea-btn-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          Kör QA
        </button>
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="nordea-btn nordea-btn-primary nordea-btn-sm"
        >
          <Download className="w-4 h-4" />
          Exportera
        </button>
      </div>

      <SaveTemplateModal open={saveOpen} onClose={() => setSaveOpen(false)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
