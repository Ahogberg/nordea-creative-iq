"use client";

// ── QA-rapporter: riktiga granskningar ur qa_runs ──
//
// Vänster: historiken (nyast först). Höger: vald rapport med totalpoäng,
// delpoäng, persona-jury, tone of voice, compliance och uppmärksamhet.
// Granskningar körs från Motion Studio ("Kör QA") och sparas av /api/qa/run.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, ShieldCheck, Clapperboard } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/topbar";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionTitle } from "@/components/layout/section-title";
import { NordeaBadge } from "@/components/ui/nordea-badge";
import { PersonaImage } from "@/components/ui/persona-image";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { getPersonaById } from "@/lib/persona-library";
import { DEFAULT_THRESHOLDS } from "@/lib/qa/thresholds";
import { formatRelative } from "@/lib/campaign-status";
import type {
  QAStatus,
  PersonaJuryResult,
  ToVScores,
  ComplianceResult,
  HeatmapResult,
} from "@/lib/qa/types";

interface RunSummary {
  id: string;
  creative_kind: "video" | "banner" | "copy" | "template";
  creative_ref: string;
  creative_metadata: { headline?: string } | null;
  total_score: number | null;
  status: QAStatus;
  approved_at: string | null;
  created_at: string;
}

interface RunDetail extends RunSummary {
  persona_score: number | null;
  tov_score: number | null;
  compliance_score: number | null;
  heatmap_score: number | null;
  persona_results: PersonaJuryResult | Record<string, never> | null;
  tov_results: ToVScores | Record<string, never> | null;
  compliance_results: ComplianceResult | Record<string, never> | null;
  heatmap_results: HeatmapResult | Record<string, never> | null;
  blocking_issues: string[] | null;
  warnings: string[] | null;
  suggestions: string[] | null;
  approval_note: string | null;
}

const KIND_LABEL: Record<RunSummary["creative_kind"], string> = {
  video: "Video",
  banner: "Display",
  copy: "Copy",
  template: "Mall",
};

const STATUS_BADGE: Record<QAStatus, { label: string; tone: "green" | "amber" | "rose" | "neutral" }> = {
  pass: { label: "Godkänd nivå", tone: "green" },
  warn: { label: "Under tröskel", tone: "amber" },
  fail: { label: "Blockerad", tone: "rose" },
  running: { label: "Pågår", tone: "neutral" },
  error: { label: "Fel", tone: "rose" },
};

function runTitle(r: RunSummary): string {
  return r.creative_metadata?.headline?.trim() || `${KIND_LABEL[r.creative_kind]} · ${r.creative_ref.slice(0, 8)}`;
}

function scoreColor(score: number): string {
  if (score >= DEFAULT_THRESHOLDS.pass) return "var(--nordea-green)";
  if (score >= DEFAULT_THRESHOLDS.warn) return "var(--nordea-amber)";
  return "var(--nordea-rose)";
}

/** Tomma JSON-objekt ({}) i databasen betyder "ingen data" — behandla som null. */
function present<T extends object>(v: T | Record<string, never> | null | undefined): T | null {
  return v && Object.keys(v).length > 0 ? (v as T) : null;
}

export default function QAReportsPage() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [detailReload, setDetailReload] = useState(0);

  const loadRuns = useCallback(async () => {
    setListError(null);
    setRuns(null);
    try {
      const res = await fetch("/api/qa");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Kunde inte hämta QA-historiken");
      const list = (body.runs ?? []) as RunSummary[];
      setRuns(list);
      setSelectedId((cur) => cur ?? list.find((r) => r.status !== "running")?.id ?? list[0]?.id ?? null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Okänt fel");
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      setDetail(null);
      setDetailError(null);
      try {
        const res = await fetch(`/api/qa/${selectedId}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Kunde inte hämta rapporten");
        if (!cancelled) setDetail(body.run as RunDetail);
      } catch (err) {
        if (!cancelled) setDetailError(err instanceof Error ? err.message : "Okänt fel");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailReload]);

  const approve = async () => {
    if (!detail) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/qa/${detail.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Kunde inte godkänna");
      const now = new Date().toISOString();
      setDetail({ ...detail, approved_at: now });
      setRuns((rs) => rs?.map((r) => (r.id === detail.id ? { ...r, approved_at: now } : r)) ?? rs);
      toast.success("Granskningen är godkänd");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte godkänna");
    } finally {
      setApproving(false);
    }
  };

  const canApprove = detail && !detail.approved_at && (detail.status === "pass" || detail.status === "warn");

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={detail ? ["QA-rapporter", runTitle(detail)] : ["QA-rapporter"]}
        right={
          canApprove ? (
            <button type="button" onClick={approve} disabled={approving} className="nordea-btn nordea-btn-primary">
              <CheckCircle2 className="w-4 h-4" />
              {approving ? "Godkänner…" : "Godkänn"}
            </button>
          ) : detail?.approved_at ? (
            <NordeaBadge tone="green" dot>
              Godkänd {formatRelative(detail.approved_at)}
            </NordeaBadge>
          ) : undefined
        }
      />

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Kvalitetssäkring"
          title="QA-rapporter"
          description="Varje granskning väger persona-jury, tone of voice, compliance och uppmärksamhet mot tröskeln innan materialet går ut."
        />

        {listError ? (
          <div className="nordea-card">
            <ErrorState description={listError} onRetry={loadRuns} />
          </div>
        ) : runs === null ? (
          <div className="grid grid-cols-[280px_1fr] gap-5">
            <div className="nordea-card p-3 flex flex-col gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            <Skeleton className="h-[480px] w-full rounded-xl" />
          </div>
        ) : runs.length === 0 ? (
          <div className="nordea-card">
            <EmptyState
              icon={ShieldCheck}
              title="Inga granskningar ännu"
              description="Kör QA från Motion Studio så hamnar rapporten här, med poäng per persona, ton och regelverk."
              action={
                <Link href="/create/video" className="nordea-btn nordea-btn-primary">
                  <Clapperboard className="w-4 h-4" />
                  Öppna Motion Studio
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
            {/* Historik */}
            <div className="nordea-card p-2 lg:sticky lg:top-6 max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
              {runs.map((r) => {
                const active = r.id === selectedId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                      active ? "bg-nordea-blue-soft" : "hover:bg-nordea-bg-hover"
                    }`}
                  >
                    <span
                      className="font-mono text-sm font-semibold w-8 text-right tabular-nums"
                      style={{ color: r.total_score != null ? scoreColor(r.total_score) : "var(--nordea-text-tertiary)" }}
                    >
                      {r.total_score != null ? Math.round(r.total_score) : "—"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-xs truncate ${active ? "font-semibold text-nordea-blue" : "font-medium text-nordea-text"}`}>
                        {runTitle(r)}
                      </span>
                      <span className="block text-[11px] text-nordea-text-tertiary">
                        {KIND_LABEL[r.creative_kind]} · {formatRelative(r.created_at)}
                        {r.approved_at ? " · godkänd" : ""}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rapport */}
            {detailError ? (
              <div className="nordea-card">
                <ErrorState description={detailError} onRetry={() => setDetailReload((n) => n + 1)} />
              </div>
            ) : !detail ? (
              <Skeleton className="h-[480px] w-full rounded-xl" />
            ) : (
              <Report run={detail} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Report({ run }: { run: RunDetail }) {
  if (run.status === "running") {
    return (
      <div className="nordea-card">
        <EmptyState icon={ShieldCheck} title="Granskningen pågår" description="Juryn, tonen och regelverket kontrolleras just nu. Ladda om sidan om en stund." />
      </div>
    );
  }
  if (run.status === "error" || run.total_score == null) {
    return (
      <div className="nordea-card">
        <ErrorState title="Granskningen avbröts" description="Den här körningen gav inget resultat. Kör QA igen från studion." />
      </div>
    );
  }

  const jury = present<PersonaJuryResult>(run.persona_results);
  const tov = present<ToVScores>(run.tov_results);
  const compliance = present<ComplianceResult>(run.compliance_results);
  const heatmap = present<HeatmapResult>(run.heatmap_results);
  const status = STATUS_BADGE[run.status];
  const total = Math.round(run.total_score);
  const breakdowns = [
    { label: "Persona-jury", value: run.persona_score },
    { label: "Tone of voice", value: run.tov_score },
    { label: "Compliance", value: run.compliance_score },
    { label: "Uppmärksamhet", value: run.heatmap_score },
  ].filter((b): b is { label: string; value: number } => b.value != null);

  const notes = [
    ...(run.blocking_issues ?? []).map((t) => ({ tone: "var(--nordea-rose)", text: t })),
    ...(run.warnings ?? []).map((t) => ({ tone: "var(--nordea-amber)", text: t })),
    ...(run.suggestions ?? []).map((t) => ({ tone: "var(--nordea-blue)", text: t })),
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5 items-start">
      {/* Totalpoäng och åtgärder */}
      <div className="flex flex-col gap-4">
        <div className="nordea-card p-6">
          <div className="nordea-eyebrow mb-4">Total QA-poäng</div>
          <div className="flex items-baseline gap-2">
            <span className="nordea-display text-7xl tracking-tighter" style={{ color: scoreColor(total) }}>
              {total}
            </span>
            <span className="text-base text-nordea-text-tertiary">/100</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <NordeaBadge tone={status.tone} dot>
              {status.label}
            </NordeaBadge>
            <span className="text-[11px] text-nordea-text-tertiary">Tröskel {DEFAULT_THRESHOLDS.pass}</span>
          </div>
          {breakdowns.length > 0 && (
            <div className="mt-5 flex flex-col gap-3.5">
              {breakdowns.map((b) => (
                <Bar key={b.label} label={b.label} value={Math.round(b.value)} />
              ))}
            </div>
          )}
        </div>

        {notes.length > 0 && (
          <div className="nordea-card p-4">
            <SectionTitle title="Att åtgärda" hint={`${notes.length}`} />
            <div className="flex flex-col gap-2.5">
              {notes.map((n, i) => (
                <div key={i} className="flex gap-2.5 p-2.5 bg-nordea-bg-hover border border-nordea-hairline rounded-md">
                  <span className="w-1 rounded shrink-0" style={{ background: n.tone }} />
                  <div className="text-xs text-nordea-text leading-relaxed">{n.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delresultat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 content-start">
        {jury && jury.scores.length > 0 && (
          <div className="nordea-card p-4 md:col-span-2">
            <SectionTitle
              title="Persona-jury"
              hint={`${jury.scores.length} personas · viktat snitt ${Math.round(jury.aggregate_score)}`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-2.5">
              {jury.scores.map((p) => {
                const profile = getPersonaById(p.persona_id);
                const name = profile?.name ?? p.persona_name;
                return (
                  <div key={p.persona_id} className="p-3 bg-nordea-bg-hover border border-nordea-hairline rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <PersonaImage name={name} color={profile?.color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-nordea-text truncate">
                          {name.split(" ")[0]}
                          {profile ? `, ${profile.representativeAge}` : ""}
                        </div>
                        <div className="text-[10px] text-nordea-text-tertiary truncate">{profile?.shortName ?? ""}</div>
                      </div>
                      <span className="font-mono text-[13px] font-semibold" style={{ color: scoreColor(p.weighted_score) }}>
                        {Math.round(p.weighted_score)}
                      </span>
                    </div>
                    <div className="text-[11px] text-nordea-text-secondary italic leading-relaxed">
                      &rdquo;{p.reaction_quote}&rdquo;
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tov && (
          <div className="nordea-card p-4">
            <SectionTitle title="Tone of voice" hint="3 axlar, 0–10" />
            <div className="flex flex-col gap-3.5">
              {(
                [
                  ["Personlig", tov.personlig],
                  ["Expert", tov.expert],
                  ["Ansvarsfull", tov.ansvarsfull],
                ] as const
              ).map(([axis, value]) => (
                <Bar key={axis} label={axis} value={Math.round(value * 10)} display={value.toFixed(1)} />
              ))}
            </div>
            {tov.examples.length > 0 && (
              <div className="mt-4 pt-3 border-t border-nordea-hairline text-[11px] text-nordea-text-secondary leading-relaxed">
                {tov.examples[0].suggestion}
              </div>
            )}
          </div>
        )}

        {compliance && (
          <div className="nordea-card p-4">
            <SectionTitle title="Compliance" hint={`${compliance.checks.length} kontroller`} />
            <div className="flex flex-col gap-2">
              {compliance.checks.map((c) => (
                <div key={c.rule_id} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 w-4 h-4 rounded inline-flex items-center justify-center shrink-0 ${
                      c.passed ? "bg-nordea-green-soft text-nordea-green" : "bg-nordea-rose-soft text-nordea-rose"
                    }`}
                  >
                    {c.passed ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </span>
                  <span className="text-xs flex-1">
                    {c.rule_label}
                    {!c.passed && c.fix_suggestion && (
                      <span className="block text-[11px] text-nordea-text-tertiary mt-0.5">{c.fix_suggestion}</span>
                    )}
                  </span>
                  {c.paragraph && <span className="text-[11px] font-mono text-nordea-text-tertiary">{c.paragraph}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {heatmap && (
          <div className="nordea-card p-4 md:col-span-2">
            <SectionTitle title="Uppmärksamhet" hint={`Första fokus: ${heatmap.primary_focus_label}`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Bar label="Uppmärksamhetspoäng" value={Math.round(heatmap.attention_score)} />
              <Bar label="Andel på loggan" value={Math.round(heatmap.logo_attention_pct)} display={`${Math.round(heatmap.logo_attention_pct)} %`} neutral />
              <Bar label="Andel på knappen" value={Math.round(heatmap.cta_attention_pct)} display={`${Math.round(heatmap.cta_attention_pct)} %`} neutral />
            </div>
            {heatmap.warnings.length > 0 && (
              <ul className="mt-3 text-[11px] text-nordea-text-secondary list-disc pl-4 space-y-1">
                {heatmap.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  display,
  neutral = false,
}: {
  label: string;
  value: number;
  display?: string;
  /** Andelar (t.ex. % på loggan) har inget bra/dåligt — visa i blått. */
  neutral?: boolean;
}) {
  const color = neutral ? "var(--nordea-blue)" : scoreColor(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-nordea-text-secondary">{label}</span>
        <span className="font-mono text-[11px]" style={{ color }}>
          {display ?? value}
        </span>
      </div>
      <div className="h-1.5 bg-nordea-bg-hover rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
