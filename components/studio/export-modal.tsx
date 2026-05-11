"use client";

import { useState, useRef, useEffect } from "react";
import { X, Download, Loader2, Check, AlertCircle } from "lucide-react";
import {
  useStudioStore,
  ASPECT_RATIOS,
  type AspectRatio,
} from "@/lib/studio/store";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ExportJob {
  job_id: string;
  status: "pending" | "rendering" | "done" | "failed";
  progress: number;
  download_url?: string | null;
  error?: string | null;
}

export function ExportModal({ open, onClose }: ExportModalProps) {
  const config = useStudioStore((s) => s.config);
  const currentAspect = config.format;

  const [selectedFormats, setSelectedFormats] = useState<Set<AspectRatio>>(
    new Set([currentAspect])
  );
  const [job, setJob] = useState<ExportJob | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when reopened, default selection follows current aspect ratio.
  useEffect(() => {
    if (open) {
      setSelectedFormats(new Set([currentAspect]));
      setJob(null);
    } else if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [open, currentAspect]);

  if (!open) return null;

  const toggleFormat = (format: AspectRatio) => {
    const newSet = new Set(selectedFormats);
    if (newSet.has(format)) {
      newSet.delete(format);
    } else {
      newSet.add(format);
    }
    setSelectedFormats(newSet);
  };

  const pollJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/studio/export/${jobId}`);
      const data = (await res.json()) as ExportJob;

      setJob({
        job_id: jobId,
        status: data.status,
        progress: data.progress ?? 0,
        download_url: data.download_url,
        error: data.error,
      });

      if (data.status === "pending" || data.status === "rendering") {
        pollTimerRef.current = setTimeout(() => pollJob(jobId), 2000);
      }
    } catch (err) {
      setJob({
        job_id: jobId,
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Polling failed",
      });
    }
  };

  const handleExport = async () => {
    if (selectedFormats.size === 0) return;

    setJob({ job_id: "", status: "pending", progress: 0 });

    try {
      const res = await fetch("/api/studio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          formats: Array.from(selectedFormats),
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || "Export start failed");
      }

      const data = await res.json();
      setJob({ job_id: data.job_id, status: "pending", progress: 0 });
      pollJob(data.job_id);
    } catch (err) {
      setJob({
        job_id: "",
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Export misslyckades",
      });
    }
  };

  const formatCount = selectedFormats.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordea-deep/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-5 border-b border-nordea-hairline">
          <h2 className="text-lg font-semibold text-nordea-text">
            Exportera video
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 hover:bg-nordea-bg-hover rounded-md flex items-center justify-center"
            aria-label="Stäng"
          >
            <X className="w-4 h-4 text-nordea-text-tertiary" />
          </button>
        </div>

        <div className="p-5">
          {!job && (
            <>
              <p className="text-sm text-nordea-text-secondary mb-4">
                Välj vilka format du vill exportera
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((key) => {
                  const aspect = ASPECT_RATIOS[key];
                  const active = selectedFormats.has(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFormat(key)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        active
                          ? "border-nordea-blue bg-nordea-blue-soft"
                          : "border-nordea-border bg-white hover:bg-nordea-bg-hover"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-nordea-text">
                          {aspect.label}
                        </span>
                        {active && (
                          <Check className="w-4 h-4 text-nordea-blue" />
                        )}
                      </div>
                      <span className="text-xs text-nordea-text-tertiary font-mono">
                        {aspect.ratio}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-nordea-text-tertiary">
                Estimerad renderingstid: ~{formatCount * 30}s
              </p>
            </>
          )}

          {job && (job.status === "rendering" || job.status === "pending") && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 text-nordea-blue animate-spin" />
                <span className="text-sm font-medium text-nordea-text">
                  {job.status === "pending"
                    ? "Förbereder…"
                    : `Renderar… ${job.progress}%`}
                </span>
              </div>
              <div className="h-2 bg-nordea-bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-nordea-teal transition-all"
                  style={{ width: `${Math.max(job.progress, 5)}%` }}
                />
              </div>
            </div>
          )}

          {job && job.status === "done" && job.download_url && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-nordea-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-nordea-green" />
              </div>
              <p className="text-sm font-medium text-nordea-text mb-3">
                Klar att ladda ner
              </p>
              <a
                href={job.download_url}
                download
                className="nordea-btn nordea-btn-primary nordea-btn-sm inline-flex"
              >
                <Download className="w-4 h-4" />
                Ladda ner
              </a>
            </div>
          )}

          {job && job.status === "done" && !job.download_url && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-nordea-amber/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-nordea-amber" />
              </div>
              <p className="text-sm font-medium text-nordea-text mb-1">
                Klar — men ingen nedladdnings-URL
              </p>
              <p className="text-xs text-nordea-text-tertiary">
                Kontrollera Massproduktion för output
              </p>
            </div>
          )}

          {job && job.status === "failed" && (
            <div className="py-4 text-center">
              <AlertCircle className="w-8 h-8 text-nordea-rose mx-auto mb-2" />
              <p className="text-sm font-medium text-nordea-rose mb-1">
                Export misslyckades
              </p>
              <p className="text-xs text-nordea-text-tertiary">
                {job.error || "Okänt fel"}
              </p>
            </div>
          )}
        </div>

        {!job && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-nordea-hairline">
            <button
              type="button"
              onClick={onClose}
              className="nordea-btn nordea-btn-ghost nordea-btn-sm"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={formatCount === 0}
              className="nordea-btn nordea-btn-primary nordea-btn-sm"
            >
              <Download className="w-4 h-4" />
              Exportera {formatCount} format
            </button>
          </div>
        )}

        {job && (job.status === "done" || job.status === "failed") && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-nordea-hairline">
            <button
              type="button"
              onClick={() => setJob(null)}
              className="nordea-btn nordea-btn-ghost nordea-btn-sm"
            >
              Ny export
            </button>
            <button
              type="button"
              onClick={onClose}
              className="nordea-btn nordea-btn-secondary nordea-btn-sm"
            >
              Stäng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
