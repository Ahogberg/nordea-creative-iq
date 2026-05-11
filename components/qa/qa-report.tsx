"use client";

import { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { QAReport } from "@/lib/qa/types";

interface QAReportViewProps {
  report: QAReport | null;
  loading?: boolean;
  onApprove?: (note: string) => void;
  onExport?: () => void;
  onRetry?: () => void;
}

export function QAReportView({
  report,
  loading,
  onApprove,
  onExport,
  onRetry,
}: QAReportViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["blocking"]));

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading || !report) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Loader2 className="w-7 h-7 text-white/50 animate-spin" />
        <span className="text-sm text-white/60">Kör QA-gate (4 parallella checks)…</span>
        <span className="text-xs text-white/40">~5–10 sekunder</span>
      </div>
    );
  }

  const statusColor =
    report.status === "pass"
      ? "#40BFA3"
      : report.status === "warn"
      ? "#E2BD2C"
      : "#C8575C";

  const StatusIcon =
    report.status === "pass"
      ? CheckCircle2
      : report.status === "warn"
      ? AlertCircle
      : XCircle;

  const statusLabel =
    report.status === "pass"
      ? "Above pass threshold"
      : report.status === "warn"
      ? "Below pass — reviewer approval required"
      : "Failed";

  return (
    <div className="space-y-6">
      {/* Header med score + per-check bars */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs text-white/40 uppercase tracking-wider mb-2">
              Total QA Score
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-bold tabular-nums" style={{ color: statusColor }}>
                {report.total_score}
              </span>
              <span className="text-2xl text-white/40">/100</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <StatusIcon className="w-5 h-5" style={{ color: statusColor }} />
              <span className="text-sm font-medium" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
            <div className="text-xs text-white/40 mt-1">
              Tröskel pass 80 · warn 70 · produkt: {report.product_type}
            </div>
          </div>

          <div className="space-y-2">
            <ScoreBar label="Persona-jury" score={report.persona_jury.aggregate_score} weight={35} />
            <ScoreBar label="Tone of voice" score={report.tov.weighted_score} weight={20} />
            <ScoreBar label="Compliance" score={report.compliance.score} weight={30} />
            {report.heatmap && (
              <ScoreBar label="Heatmap focus" score={report.heatmap.attention_score} weight={15} />
            )}
          </div>
        </div>
      </div>

      {report.blocking_issues.length > 0 && (
        <Section
          title="Blocking issues"
          count={report.blocking_issues.length}
          severity="blocking"
          expanded={expanded.has("blocking")}
          onToggle={() => toggle("blocking")}
        >
          {report.blocking_issues.map((issue, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-white/85">{issue}</span>
            </div>
          ))}
        </Section>
      )}

      <Section
        title="Persona-jury"
        meta={`${report.persona_jury.scores.length} personas · vägd: ${report.persona_jury.aggregate_score}`}
        expanded={expanded.has("persona")}
        onToggle={() => toggle("persona")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.persona_jury.scores.map((score) => (
            <div
              key={score.persona_id}
              className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-white">{score.persona_name}</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {Math.round(score.weighted_score)}
                </div>
              </div>
              <p className="text-xs text-white/60 italic mb-3">
                "{score.reaction_quote}"
              </p>
              <div className="grid grid-cols-3 gap-2 text-xs text-white/50 mb-3">
                <div>Hook {score.hook_score}/10</div>
                <div>Trust {score.trust_score}/10</div>
                <div>Click {score.click_intent}%</div>
              </div>
              {score.objections.length > 0 && (
                <div className="space-y-1">
                  {score.objections.slice(0, 2).map((obj, i) => (
                    <div key={i} className="text-xs text-white/50">
                      • {obj}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Tone of voice"
        meta="3 axes · Personlig / Expert / Ansvarsfull"
        expanded={expanded.has("tov")}
        onToggle={() => toggle("tov")}
      >
        <div className="space-y-3 mb-4">
          <ToVBar label="Personlig" score={report.tov.personlig} />
          <ToVBar label="Expert" score={report.tov.expert} />
          <ToVBar label="Ansvarsfull" score={report.tov.ansvarsfull} />
        </div>
        {report.tov.examples.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            <div className="text-xs text-white/50 uppercase tracking-wider mb-2">
              Förbättringsförslag
            </div>
            {report.tov.examples.map((ex, i) => (
              <div key={i} className="p-3 bg-white/[0.03] rounded-lg">
                <div className="text-xs text-white/40 mb-1 capitalize">{ex.pillar}</div>
                <div className="text-sm text-white/80 mb-1">{ex.issue}</div>
                <div className="text-sm text-emerald-400">→ {ex.suggestion}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Compliance"
        meta={`${report.compliance.passed_count}/${report.compliance.checks.length} checks`}
        expanded={expanded.has("compliance")}
        onToggle={() => toggle("compliance")}
      >
        <div className="space-y-2">
          {report.compliance.checks.map((check, i) => (
            <div
              key={i}
              className="flex items-start justify-between p-3 bg-white/[0.03] rounded-lg gap-3"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {check.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      check.severity === "blocking" ? "text-red-400" : "text-yellow-400"
                    }`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{check.rule_label}</div>
                  <div className="text-xs text-white/50 mt-0.5">{check.detail}</div>
                  {check.fix_suggestion && (
                    <div className="text-xs text-emerald-400/80 mt-1">
                      → {check.fix_suggestion}
                    </div>
                  )}
                </div>
              </div>
              {check.paragraph && (
                <div className="text-xs text-white/30 font-mono ml-3 flex-shrink-0">
                  {check.paragraph}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {report.heatmap && (
        <Section
          title="Heatmap focus"
          meta={`Logo ${report.heatmap.logo_attention_pct}% · CTA ${report.heatmap.cta_attention_pct}%`}
          expanded={expanded.has("heatmap")}
          onToggle={() => toggle("heatmap")}
        >
          <div className="space-y-2">
            {report.heatmap.warnings.length === 0 ? (
              <div className="text-sm text-emerald-400/90">Uppmärksamhets-fördelningen ser balanserad ut.</div>
            ) : (
              report.heatmap.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-white/80">{w}</span>
                </div>
              ))
            )}
          </div>
        </Section>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div className="text-xs text-white/40">
          Granskat på {(report.duration_ms / 1000).toFixed(1)}s · {report.persona_jury.scores.length} personas
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white"
            >
              Kör igen
            </button>
          )}
          {report.status === "warn" && onApprove && (
            <button
              onClick={() => onApprove("")}
              className="px-4 py-2 bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-200"
            >
              Godkänn ändå
            </button>
          )}
          {report.status === "pass" && onExport && (
            <button
              onClick={onExport}
              className="px-6 py-2 bg-[#40BFA3] hover:bg-[#40BFA3]/80 rounded-lg text-sm font-semibold text-[#00005E]"
            >
              Exportera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  meta,
  severity,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  meta?: string;
  severity?: "blocking" | "warning";
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-medium text-white">{title}</span>
          {count !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                severity === "blocking"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {count}
            </span>
          )}
          {meta && <span className="text-xs text-white/40 truncate">{meta}</span>}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
        )}
      </button>
      {expanded && <div className="p-4 pt-0 space-y-2">{children}</div>}
    </div>
  );
}

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  const color = score >= 80 ? "#40BFA3" : score >= 70 ? "#E2BD2C" : "#C8575C";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/50 w-32 truncate">
        {label} <span className="text-white/30">{weight}%</span>
      </span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-white/70 w-9 text-right tabular-nums">
        {Math.round(score)}
      </span>
    </div>
  );
}

function ToVBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/70 w-32">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#40BFA3] rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, score * 10))}%` }}
        />
      </div>
      <span className="text-xs font-mono text-white/70 w-12 text-right tabular-nums">
        {score}/10
      </span>
    </div>
  );
}
