import Link from "next/link";
import {
  ArrowRight,
  Video,
  LayoutGrid,
  CheckCircle2,
  Clock,
  Sparkles,
  Upload,
  Plus,
  Filter,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SectionTitle } from "@/components/layout/section-title";
import { StatCard } from "@/components/ui/stat-card";
import { NordeaBadge } from "@/components/ui/nordea-badge";
import { FormatChip } from "@/components/ui/format-chip";
import { CreativeThumbnail } from "@/components/preview/creative-thumbnail";
import { SAMPLE_CREATIVES } from "@/lib/demo/sample-creatives";

// ── MOCK DATA — TODO Sprint 8+ ─────────────────────────────────────────────
// Replace with real queries when corresponding tables/jobs ship:
// - recent projects → SELECT FROM templates JOIN production_jobs LIMIT 5
// - production queue → production_jobs WHERE status IN ('pending','processing')
// - kpi values → aggregate from ai_generations + qa_runs + production_jobs
// The shape of these mock objects matches what the real query should return.

const MOCK_PRODUCTION_QUEUE = [
  { title: "Spara & Investera — 12 varianter", progress: 74, sub: "9 av 12 renderade · ETA 2 min", color: "var(--nordea-teal)" },
  { title: "Bolån Hero — QA-granskning", progress: 32, sub: "Persona-jury granskar · ETA 4 min", color: "var(--nordea-blue)" },
];

const QUICK_START = [
  { icon: Sparkles, title: "Generera från produktbrief", sub: "Klistra in en brief → 3 varianter på 90s", href: "/create/brief" },
  { icon: LayoutGrid, title: "Använd en mall", sub: "Varumärkesgodkända layouter", href: "/templates" },
  { icon: Upload, title: "Ladda upp befintligt material", sub: "Klipp om för nya format", href: "/create/analyze" },
];

export default function DashboardPage() {
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={["Arbetsyta", "Varumärke · Q2 2026"]}
        right={
          <Link href="/create" className="nordea-btn nordea-btn-primary">
            <Plus className="w-4 h-4" />
            Nytt projekt
          </Link>
        }
      />

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* Välkomst */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs text-nordea-text-tertiary mb-2">
              {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="nordea-display text-4xl text-nordea-deep">
              {greeting}, Andreas.
              <br />
              <span className="text-nordea-text-tertiary">3 projekt väntar på granskning.</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/templates" className="nordea-btn nordea-btn-secondary">
              <LayoutGrid className="w-4 h-4" />
              Öppna mall
            </Link>
            <Link href="/create" className="nordea-btn nordea-btn-cobalt">
              <Sparkles className="w-4 h-4" />
              Generera från brief
            </Link>
          </div>
        </div>

        {/* Senaste annonser — det plattformen faktiskt producerar */}
        <div className="nordea-card p-5 mb-8">
          <SectionTitle
            title="Senaste annonserna"
            hint="Håll musen över för att spela"
            right={
              <Link href="/templates" className="text-xs font-medium text-nordea-blue inline-flex items-center gap-1 hover:underline">
                Alla annonser <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 [mask-image:linear-gradient(to_right,black_92%,transparent)]">
            {SAMPLE_CREATIVES.map((c) => (
              <div key={c.id} className="shrink-0 group/card">
                <div className="h-[230px] flex items-end">
                  <CreativeThumbnail
                    config={c.config}
                    className="h-full shadow-[0_8px_24px_-8px_rgba(0,0,94,0.35)] transition-transform duration-300 group-hover/card:-translate-y-1"
                    rounded="rounded-xl"
                  />
                </div>
                <div className="mt-3 max-w-[210px]">
                  <div className="text-[13px] font-medium text-nordea-text truncate">{c.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <NordeaBadge tone={c.tone} dot>{c.status}</NordeaBadge>
                    {c.score !== null && (
                      <span className={`text-[11px] font-semibold tabular-nums ${c.score >= 90 ? "text-nordea-green" : "text-nordea-amber"}`}>
                        QA {c.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KPI:er */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Videor detta kvartal" value="284" delta="+38%" sub="jmf Q1" icon={Video} />
          <StatCard label="Aktiva mallar" value="42" delta="+6" deltaTone="cobalt" sub="denna vecka" icon={LayoutGrid} />
          <StatCard label="Snitt QA-poäng" value="89" delta="+3.2" sub="senaste 30 dagar" icon={CheckCircle2} />
          <StatCard label="Sparad tid" value="612h" delta="vs manuellt" deltaTone="teal" sub="kvartal hittills" icon={Clock} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-5">
          {/* Senaste projekt */}
          <div className="nordea-card overflow-hidden">
            <div className="px-5 py-4 border-b border-nordea-hairline flex items-center justify-between">
              <SectionTitle title="Senaste projekt" hint="Senaste 7 dagarna" />
              <button className="p-1.5 hover:bg-nordea-bg-hover rounded-md transition-colors">
                <Filter className="w-3.5 h-3.5 text-nordea-text-tertiary" />
              </button>
            </div>
            <div>
              {SAMPLE_CREATIVES.map((p, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[52px_1fr_auto_auto_auto] items-center gap-3 px-5 py-3 ${
                    i < SAMPLE_CREATIVES.length - 1 ? "border-b border-nordea-hairline" : ""
                  }`}
                >
                  <div className="w-[52px] h-10 rounded-md overflow-hidden flex items-center justify-center" style={{ backgroundColor: p.config.backgroundColor }}>
                    <CreativeThumbnail config={p.config} playOnHover={false} rounded="rounded-none" className="w-full shrink-0" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-nordea-text truncate">{p.name}</div>
                    <div className="text-[11px] text-nordea-text-tertiary mt-0.5">
                      Uppdaterad {p.updated} · Andreas H.
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {p.formats.map((f) => (
                      <FormatChip key={f} ratio={f} />
                    ))}
                  </div>
                  <div
                    className={`font-mono text-xs w-8 text-right ${
                      p.score
                        ? p.score >= 90
                          ? "text-nordea-green"
                          : p.score >= 80
                            ? "text-nordea-amber"
                            : "text-nordea-rose"
                        : "text-nordea-text-faint"
                    }`}
                  >
                    {p.score ?? "—"}
                  </div>
                  <NordeaBadge tone={p.tone} dot>
                    {p.status}
                  </NordeaBadge>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <div className="nordea-card p-5">
              <SectionTitle title="Snabbstart" />
              <div className="flex flex-col gap-2">
                {QUICK_START.map((q, i) => {
                  const Icon = q.icon;
                  return (
                    <Link
                      key={i}
                      href={q.href}
                      className="flex items-center gap-3 p-3 rounded-lg bg-nordea-bg-hover border border-nordea-hairline hover:border-nordea-border-emphasis hover:bg-nordea-bg-active transition-colors"
                    >
                      <div className="w-8 h-8 rounded-md bg-nordea-blue-soft text-nordea-blue flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-nordea-text">{q.title}</div>
                        <div className="text-[11px] text-nordea-text-tertiary">{q.sub}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-nordea-text-tertiary" />
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="nordea-card p-5">
              <SectionTitle title="Produktionskö" hint={`${MOCK_PRODUCTION_QUEUE.length} pågående`} />
              <div className="flex flex-col gap-3.5">
                {MOCK_PRODUCTION_QUEUE.map((q, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-medium text-nordea-text">{q.title}</span>
                      <span className="text-[11px] font-mono text-nordea-text-tertiary">
                        {q.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-nordea-bg-hover rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${q.progress}%`, backgroundColor: q.color }}
                      />
                    </div>
                    <div className="text-[11px] text-nordea-text-tertiary mt-1.5">{q.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "God natt";
  if (hour < 11) return "God morgon";
  if (hour < 17) return "Hej";
  return "God kväll";
}
