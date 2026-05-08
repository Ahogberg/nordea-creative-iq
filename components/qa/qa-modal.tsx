"use client";

import { X } from "lucide-react";
import type { QAReport } from "@/lib/qa/types";
import { QAReportView } from "./qa-report";

interface QAModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: QAReport | null;
  loading?: boolean;
  onApprove?: (note: string) => void;
  onExport?: () => void;
  onRetry?: () => void;
}

/**
 * Wraps QAReportView in a Motion-Studio-styled dark modal. Lazy-rendered —
 * isOpen=false short-circuits before any state work.
 */
export function QAModal({
  isOpen,
  onClose,
  report,
  loading,
  onApprove,
  onExport,
  onRetry,
}: QAModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative bg-[#0a0a1a] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 bg-[#0a0a1a]/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">QA Gate-rapport</h2>
            <p className="text-xs text-white/50 mt-0.5">
              Persona-jury · ToV · Compliance · Heatmap
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            title={loading ? "Vänta tills granskningen är klar" : "Stäng"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <QAReportView
            report={report}
            loading={loading}
            onApprove={onApprove}
            onExport={onExport}
            onRetry={onRetry}
          />
        </div>
      </div>
    </div>
  );
}
