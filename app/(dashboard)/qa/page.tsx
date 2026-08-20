"use client";

import { useEffect, useState } from "react";
import { Download, CheckCircle2, X, AlertCircle, Loader2 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SectionTitle } from "@/components/layout/section-title";
import { NordeaBadge } from "@/components/ui/nordea-badge";
import { CountUp } from "@/components/ui/nordea";
import type {
  PersonaJuryResult,
  ToVScores,
  ComplianceResult,
  HeatmapResult,
  QAStatus,
} from "@/lib/qa/types";

// ── Render model ────────────────────────────────────────────────────────────
// The page renders a normalized report; real qa_runs rows and the sample
// report below both map onto this shape.

interface ReportView {
  id: string | null; // null = sample report
  title: string;
  total_score: number;
  status: QAStatus;
  threshold: number;
  breakdowns: Array<{ label: string; value: number; color: string }>;
  suggestions: Array<{ tone: "amber" | "cobalt" | "green"; title: string; sub: string }>;
  personas: Array<{ name: string; role: string; score: number; take: string; tone: "green" | "cobalt" | "amber" }>;
  tov: Array<{ axis: string; value: number; target: number }>;
  compliance: Array<{ ok: boolean; label: string; sub: string }>;
  heatmap: HeatmapResult | null;
  approved: boolean;
}

interface QARunRow {
  id: string;
  creative_kind: string;
  creative_ref: string;
  creative_metadata: Record<string, unknown> | null;
  total_score: number | null;
  persona_score: number | null;
  tov_score: number | null;
  compliance_score: number | null;
  heatmap_score: number | null;
  status: QAStatus;
  persona_results: PersonaJuryResult | null;
  tov_results: ToVScores | null;
  compliance_results: ComplianceResult | null;
  heatmap_results: HeatmapResult | null;
  suggestions: string[] | null;
  warnings: string[] | null;
  blocking_issues: string[] | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

const SAMPLE_REPORT: ReportView = {
  id: null,
  title: "Bolån Hero — variant 03",
  total_score: 87,
  status: "pass",
  threshold: 80,
  breakdowns: [
    { label: "Persona-jury", value: 84, color: "var(--nordea-green)" },
    { label: "Tone of voice", value: 91, color: "var(--nordea-teal)" },
    { label: "Compliance", value: 92, color: "var(--nordea-blue)" },
    { label: "Heatmap focus", value: 79, color: "var(--nordea-amber)" },
  ],
  suggestions: [
    { tone: "amber", title: "Slow down headline by 0.4s", sub: "Lars (67) reports text reads too fast." },
    { tone: "cobalt", title: "Add amorteringsfrihet line", sub: "Erik (52) — missing detail." },
    { tone: "green", title: "Tone is on-brand", sub: "No changes needed." },
  ],
  personas: [
    { name: "Anna, 34", role: "Förstagångsköpare bostad", score: 92, take: '"Känns ärlig och konkret. Räkneknappen är tydlig."', tone: "green" },
    { name: "Erik, 52", role: "Befintlig bolånekund", score: 84, take: '"Visa något om amorteringsfrihet — saknas."', tone: "cobalt" },
    { name: "Sofia, 28", role: "Hyresgäst, börjar fundera", score: 88, take: '"Snyggt, men jag vill veta vad ett ja kostar."', tone: "green" },
    { name: "Lars, 67", role: "Pensionär, andrahandsboende", score: 71, take: '"Texten går för fort. Ge mig 1 sekund till."', tone: "amber" },
  ],
  tov: [
    { axis: "Personlig", value: 78, target: 70 },
    { axis: "Expert", value: 64, target: 65 },
    { axis: "Ansvarsfull", value: 88, target: 80 },
  ],
  compliance: [
    { ok: true, label: "Riskinformation present", sub: "§ 6.2.1" },
    { ok: true, label: "Effektiv ränta visible", sub: "§ 4.1" },
    { ok: true, label: "Disclaimer time ≥ 2s", sub: "2.4s detected" },
    { ok: false, label: "Logo clear-space", sub: "8% short on left" },
    { ok: true, label: "Brand colors only", sub: "0 off-palette pixels" },
    { ok: true, label: "Subtitles present", sub: "WCAG AA" },
  ],
  heatmap: {
    attention_score: 79,
    focus_areas: [
      { x: 0.12, y: 0.4, width: 0.18, height: 0.3, intensity: 0.9, label: "Rubrik" },
      { x: 0.2, y: 0.7, width: 0.14, height: 0.2, intensity: 0.7, label: "CTA" },
      { x: 0.7, y: 0.35, width: 0.16, height: 0.28, intensity: 0.6, label: "Motiv" },
    ],
    primary_focus_label: "Rubrik",
    logo_attention_pct: 12,
    cta_attention_pct: 18,
    warnings: [],
  },
  approved: false,
};

const scoreTone = (score: number): "green" | "cobalt" | "amber" =>
  score >= 85 ? "green" : score >= 75 ? "cobalt" : "amber";

function mapRunToView(run: QARunRow): ReportView {
  const jury = run.persona_results;
  const tov = run.tov_results;
  const compliance = run.compliance_results;

  const meta = run.creative_metadata || {};
  const title =
    (typeof meta.headline === "string" && meta.headline) || run.creative_ref || "QA-körning";

  const suggestionItems: ReportView["suggestions"] = [
    ...(run.blocking_issues || []).map((s) => ({ tone: "amber" as const, title: s, sub: "Blockerande" })),
    ...(run.suggestions || []).map((s) => ({ tone: "cobalt" as const, title: s, sub: "Förslag" })),
    ...(run.warnings || []).map((s) => ({ tone: "amber" as const, title: s, sub: "Varning" })),
  ].slice(0, 6);

  return {
    id: run.id,
    title,
    total_score: Math.round(run.total_score ?? 0),
    status: run.status,
    threshold: 80,
    breakdowns: [
      { label: "Persona-jury", value: Math.round(run.persona_score ?? 0), color: "var(--nordea-green)" },
      { label: "Tone of voice", value: Math.round(run.tov_score ?? 0), color: "var(--nordea-teal)" },
      { label: "Compliance", value: Math.round(run.compliance_score ?? 0), color: "var(--nordea-blue)" },
      { label: "Heatmap focus", value: Math.round(run.heatmap_score ?? 0), color: "var(--nordea-amber)" },
    ].filter((b) => b.value > 0),
    suggestions: suggestionItems.length > 0 ? suggestionItems : [{ tone: "green", title: "Inga åtgärder krävs", sub: "Alla kontroller godkända." }],
    personas: (jury?.scores || []).map((p) => ({
      name: p.persona_name,
      role: `Klickintention ${Math.round(p.click_intent)} %`,
      score: Math.round(p.weighted_score),
      take: `"${p.reaction_quote}"`,
      tone: scoreTone(p.weighted_score),
    })),
    tov: tov
      ? [
          { axis: "Personlig", value: Math.round(tov.personlig * 10), target: 70 },
          { axis: "Expert", value: Math.round(tov.expert * 10), target: 65 },
          { axis: "Ansvarsfull", value: Math.round(tov.ansvarsfull * 10), target: 80 },
        ]
      : [],
    compliance: (compliance?.checks || []).map((c) => ({
      ok: c.passed,
      label: c.rule_label,
      sub: c.paragraph || c.detail?.slice(0, 40) || "",
    })),
    heatmap: run.heatmap_results && Array.isArray(run.heatmap_results.focus_areas) ? run.heatmap_results : null,
    approved: Boolean(run.approved_at),
  };
}

const heatColor = (intensity: number) =>
  intensity >= 0.8 ? "var(--nordea-rose)" : intensity >= 0.5 ? "var(--nordea-amber)" : "var(--nordea-blue)";

export default function QAReportsPage() {
  const [runs, setRuns] = useState<QARunRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetch("/api/qa")
      .then((res) => (res.ok ? res.json() : { runs: [] }))
      .then((data) => {
        const list: QARunRow[] = (data.runs || []).filter((r: QARunRow) => r.status !== "running");
        setRuns(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedRun = runs.find((r) => r.id === selectedId) || null;
  const isSample = !loading && runs.length === 0;
  const r: ReportView = selectedRun ? mapRunToView(selectedRun) : SAMPLE_REPORT;

  const handleApprove = async () => {
    if (!r.id || approving) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/qa/${r.id}/approve`, { method: "POST" });
      if (res.ok) {
        setRuns((prev) =>
          prev.map((run) => (run.id === r.id ? { ...run, approved_at: new Date().toISOString(), approved_by: "default-user" } : run))
        );
      }
    } finally {
      setApproving(false);
    }
  };

  const scoreColor =
    r.total_score >= 80
      ? "text-nordea-green"
      : r.total_score >= 70
        ? "text-nordea-amber"
        : "text-nordea-rose";

  if (loading) {
    return (
      <div className="min-h-screen bg-nordea-bg">
        <Topbar breadcrumb={["QA-rapporter"]} />
        <div className="px-8 py-6 max-w-[1400px] mx-auto space-y-4">
          <div className="h-8 w-64 bg-nordea-bg-hover rounded animate-pulse" />
          <div className="grid grid-cols-[320px_1fr] gap-5">
            <div className="h-96 bg-nordea-bg-hover rounded-lg animate-pulse" />
            <div className="h-96 bg-nordea-bg-hover rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={["QA-rapporter", r.title]}
        right={
          <div className="flex gap-2">
            <button type="button" className="nordea-btn nordea-btn-secondary">
              <Download className="w-4 h-4" />
              Exportera rapport
            </button>
            <button
              type="button"
              className="nordea-btn nordea-btn-primary"
              onClick={handleApprove}
              disabled={!r.id || r.approved || r.status === "fail" || approving}
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {r.approved ? "Godkänd" : "Godkänn"}
            </button>
          </div>
        }
      />

      {/* Exempel-rapport banner — visas bara när inga riktiga körningar finns */}
      {isSample && (
        <div className="px-8 pt-4">
          <div className="bg-nordea-amber-soft border border-nordea-amber/30 rounded-md px-4 py-2.5 flex items-center gap-2 text-xs text-nordea-amber">
            <AlertCircle className="w-3.5 h-3.5" />
            Exempelrapport — inga QA-körningar hittades ännu. Kör QA från Skapa → Video för att bedöma riktiga assets.
          </div>
        </div>
      )}

      <div className={`px-8 py-6 grid ${runs.length > 1 ? "grid-cols-[220px_320px_1fr]" : "grid-cols-[320px_1fr]"} gap-5 max-w-[1400px] mx-auto`}>
        {/* RUN LIST — only when there are multiple real runs */}
        {runs.length > 1 && (
          <div className="flex flex-col gap-2">
            <div className="nordea-eyebrow mb-1">Senaste körningar</div>
            {runs.map((run) => {
              const active = run.id === selectedId;
              return (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedId(run.id)}
                  className={`text-left p-3 rounded-md border transition-colors ${
                    active ? "border-nordea-blue bg-nordea-blue-soft" : "border-nordea-hairline bg-nordea-bg-hover hover:border-nordea-blue/40"
                  }`}
                >
                  <div className="text-xs font-medium text-nordea-text truncate">{run.creative_ref}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-nordea-text-tertiary">
                      {new Date(run.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                    <span
                      className="font-mono text-[12px] font-semibold"
                      style={{
                        color:
                          run.status === "pass"
                            ? "var(--nordea-green)"
                            : run.status === "warn"
                              ? "var(--nordea-amber)"
                              : "var(--nordea-rose)",
                      }}
                    >
                      {Math.round(run.total_score ?? 0)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* LEFT — total score */}
        <div className="flex flex-col gap-4">
          <div className="nordea-card p-6">
            <div className="nordea-eyebrow mb-4">Total QA-poäng</div>
            <div className="flex items-baseline gap-2">
              <CountUp value={r.total_score} className={`nordea-display text-7xl tracking-tighter ${scoreColor}`} />
              <span className="text-base text-nordea-text-tertiary">/100</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <NordeaBadge tone={r.total_score >= r.threshold ? "green" : r.status === "fail" ? "rose" : "amber"} dot>
                {r.total_score >= r.threshold ? "Över tröskel" : r.status === "fail" ? "Underkänd" : "Under tröskel"}
              </NordeaBadge>
              <span className="text-[11px] text-nordea-text-tertiary">
                Tröskel {r.threshold}
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-3.5">
              {r.breakdowns.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-nordea-text-secondary">{b.label}</span>
                    <span className="font-mono text-[11px]" style={{ color: b.color }}>
                      {b.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-nordea-bg-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${b.value}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="nordea-card p-4">
            <SectionTitle title="Förslag" hint={`${r.suggestions.length}`} />
            <div className="flex flex-col gap-2.5">
              {r.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-2.5 p-2.5 bg-nordea-bg-hover border border-nordea-hairline rounded-md"
                >
                  <span
                    className="w-1 rounded"
                    style={{
                      background:
                        s.tone === "amber"
                          ? "var(--nordea-amber)"
                          : s.tone === "cobalt"
                            ? "var(--nordea-blue)"
                            : "var(--nordea-teal)",
                    }}
                  />
                  <div>
                    <div className="text-xs font-medium text-nordea-text">{s.title}</div>
                    <div className="text-[11px] text-nordea-text-tertiary mt-0.5">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — sections */}
        <div className="grid grid-cols-2 gap-3.5 content-start">
          {/* Persona jury — full width */}
          {r.personas.length > 0 && (
            <div className="nordea-card p-4 col-span-2">
              <SectionTitle
                title="Persona-jury"
                hint={`${r.personas.length} personas`}
              />
              <div className={`grid gap-2.5 ${r.personas.length >= 4 ? "grid-cols-4" : r.personas.length === 3 ? "grid-cols-3" : r.personas.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {r.personas.map((p, i) => (
                  <div
                    key={i}
                    className="p-3 bg-nordea-bg-hover border border-nordea-hairline rounded-md"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-nordea-blue-soft text-nordea-blue flex items-center justify-center text-[10px] font-semibold">
                        {p.name.split(" ")[0].charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-nordea-text">{p.name}</div>
                        <div className="text-[10px] text-nordea-text-tertiary truncate">
                          {p.role}
                        </div>
                      </div>
                      <span
                        className="font-mono text-[13px] font-semibold"
                        style={{
                          color:
                            p.tone === "green"
                              ? "var(--nordea-green)"
                              : p.tone === "cobalt"
                                ? "var(--nordea-blue)"
                                : "var(--nordea-amber)",
                        }}
                      >
                        {p.score}
                      </span>
                    </div>
                    <div className="text-[11px] text-nordea-text-secondary italic leading-relaxed">
                      {p.take}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ToV */}
          {r.tov.length > 0 && (
            <div className="nordea-card p-4">
              <SectionTitle title="Tone of voice" hint="3 pelare" />
              <div className="flex flex-col gap-3.5">
                {r.tov.map((a) => (
                  <div key={a.axis}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span>{a.axis}</span>
                      <span className="font-mono text-[11px] text-nordea-text-tertiary">
                        <span className="text-nordea-teal">{a.value}</span>
                        <span className="mx-1.5">/</span>
                        mål {a.target}
                      </span>
                    </div>
                    <div className="h-1.5 bg-nordea-bg-hover rounded-full relative overflow-hidden">
                      <div
                        className="absolute top-[-2px] bottom-[-2px] w-px bg-nordea-text-tertiary"
                        style={{ left: `${a.target}%` }}
                      />
                      <div
                        className="h-full bg-nordea-teal rounded-full"
                        style={{ width: `${a.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance */}
          {r.compliance.length > 0 && (
            <div className="nordea-card p-4">
              <SectionTitle title="Compliance" hint={`${r.compliance.length} kontroller`} />
              <div className="flex flex-col gap-2">
                {r.compliance.map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span
                      className={`w-4 h-4 rounded inline-flex items-center justify-center ${
                        c.ok ? "bg-nordea-green-soft text-nordea-green" : "bg-nordea-rose-soft text-nordea-rose"
                      }`}
                    >
                      {c.ok ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </span>
                    <span className="text-xs flex-1">{c.label}</span>
                    <span className="text-[11px] font-mono text-nordea-text-tertiary">{c.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Heatmap — full width, driven by focus_areas data */}
          {r.heatmap && (
            <div className="nordea-card p-4 col-span-2">
              <SectionTitle
                title="Uppmärksamhets-heatmap"
                hint={`Predikterat fokus · attention ${r.heatmap.attention_score}/100`}
              />
              <div className="aspect-[16/6] bg-nordea-deep rounded-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-nordea-deep via-nordea-blue to-nordea-deep opacity-90" />
                {r.heatmap.focus_areas.map((area, i) => {
                  const size = Math.max(area.width, area.height) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute rounded-full blur-2xl"
                      style={{
                        left: `${(area.x + area.width / 2) * 100}%`,
                        top: `${(area.y + area.height / 2) * 100}%`,
                        width: `${Math.max(size, 12)}%`,
                        aspectRatio: "1",
                        transform: "translate(-50%, -50%)",
                        background: heatColor(area.intensity),
                        opacity: 0.25 + area.intensity * 0.3,
                      }}
                    />
                  );
                })}
                {r.heatmap.focus_areas
                  .filter((a) => a.label)
                  .map((area, i) => (
                    <span
                      key={`label-${i}`}
                      className="absolute text-[10px] text-white/80 font-medium px-1.5 py-0.5 rounded bg-black/30"
                      style={{
                        left: `${(area.x + area.width / 2) * 100}%`,
                        top: `${(area.y + area.height / 2) * 100}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {area.label}
                    </span>
                  ))}
              </div>
              <div className="flex justify-between mt-2.5 text-[11px] text-nordea-text-tertiary">
                <div className="flex gap-3.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-nordea-rose" />
                    Hett
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-nordea-amber" />
                    Varmt
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-nordea-blue" />
                    Kallt
                  </span>
                </div>
                <span>
                  Logotyp {Math.round(r.heatmap.logo_attention_pct)} % · CTA {Math.round(r.heatmap.cta_attention_pct)} % av uppmärksamheten
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
