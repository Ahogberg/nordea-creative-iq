"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import type { QAStatus } from "@/lib/qa/types";
interface Run {
  id: string; creative_kind: string; creative_ref: string;
  creative_metadata: { headline?: string } | null;
  status: QAStatus; total_score: number | null;
  blocking_issues: string[] | null; warnings: string[] | null; suggestions: string[] | null;
  approved_at: string | null; created_at: string; error_message: string | null;
}
const labels: Record<QAStatus, string> = { pass: "Granskad utan hinder", warn: "Behöver bedömning", fail: "Behöver åtgärdas", running: "Granskning pågår", error: "Ej slutförd" };
export default function QAPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  async function load() {
    setError(null);
    try {
      const response = await fetch("/api/qa");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRuns(data.runs);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Kunde inte ladda granskningar"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    setSelected(new URLSearchParams(window.location.search).get("run"));
    void load();
  }, []);
  const run = runs.find((item) => item.id === selected);
  async function approve() {
    if (!run) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/qa/${run.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNote(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Godkännandet kunde inte sparas"); }
    finally { setBusy(false); }
  }
  return <>
    <Topbar breadcrumb={["CreativeIQ", "Granskningar"]} />
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="nordea-display text-3xl text-nordea-deep">Granskningar</h1><p className="mt-2 text-sm text-nordea-text-secondary">Sparade resultat och åtgärder för ditt kreativa material. AI-bedömningar är beslutsstöd.</p></div><button onClick={() => void load()} className="nordea-btn nordea-btn-secondary">Uppdatera</button></header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <Loader2 className="animate-spin text-nordea-blue" /> : runs.length === 0 ? <section className="nordea-card p-8 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-nordea-blue" /><h2 className="mt-3 font-semibold">Inga sparade granskningar ännu</h2><p className="mt-2 text-sm text-nordea-text-secondary">Öppna kreativt material och kör QA. Resultat och förbättringsförslag visas här.</p><Link href="/produce" className="nordea-btn nordea-btn-cobalt mt-5">Öppna produktion</Link></section> : <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr]">
        <section className="nordea-card divide-y divide-nordea-border">{runs.map((item) => <button key={item.id} onClick={() => { setSelected(item.id); setNote(""); }} className={`w-full p-4 text-left hover:bg-nordea-blue-soft ${selected === item.id ? "bg-nordea-blue-soft" : ""}`}><span className="block truncate font-medium text-nordea-deep">{item.creative_metadata?.headline || item.creative_ref || "Kreativt material"}</span><span className="mt-1 block text-sm text-nordea-blue">{item.approved_at ? "Manuellt godkänd" : labels[item.status]}</span><span className="mt-2 block text-xs text-nordea-text-secondary">{new Date(item.created_at).toLocaleString("sv-SE")}</span></button>)}</section>
        <section className="nordea-card p-6">{run ? <div className="space-y-5"><div><h2 className="text-xl font-semibold text-nordea-deep">{run.creative_metadata?.headline || "Granskningsresultat"}</h2><p className="mt-2 text-sm text-nordea-blue">{run.approved_at ? "Manuellt godkänd" : labels[run.status]}</p>{["pass", "warn", "fail"].includes(run.status) && run.total_score !== null && <p className="mt-3 text-3xl font-semibold text-nordea-deep">{Math.round(run.total_score)} <span className="text-base font-normal">/ 100</span></p>}</div>
          {run.error_message && <p className="text-sm text-red-700">{run.error_message}</p>}
          {([ ["Åtgärda innan användning", run.blocking_issues], ["Varningar", run.warnings], ["Förbättringsförslag", run.suggestions] ] as const).map(([title, items]) => items?.length ? <div key={title}><h3 className="font-semibold text-nordea-deep">{title}</h3><ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-nordea-text-secondary">{items.map((item, i) => <li key={i}>{item}</li>)}</ul></div> : null)}
          {run.status === "warn" && !run.approved_at && !run.blocking_issues?.length && <div className="border-t border-nordea-border pt-4"><label className="block text-sm font-medium" htmlFor="approval-note">Kommentar till beslutet</label><textarea id="approval-note" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 w-full rounded-lg border border-nordea-border p-3 text-sm" /><button disabled={busy} onClick={() => void approve()} className="nordea-btn nordea-btn-cobalt mt-3">{busy ? "Sparar…" : "Godkänn med varningar"}</button></div>}
          {run.creative_kind === "template" && <Link href={`/produce?template=${encodeURIComponent(run.creative_ref)}`} className="nordea-btn nordea-btn-secondary">Öppna materialet</Link>}
        </div> : <p className="text-sm text-nordea-text-secondary">Välj en granskning för att se resultat och nästa steg.</p>}</section>
      </div>}
      {runs.length === 100 && <p className="text-xs text-nordea-text-secondary">Visar de 100 senaste granskningarna.</p>}
    </div>
  </>;
}
