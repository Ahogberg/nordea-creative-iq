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

// ── MOCK DATA — TODO Sprint 8+ ─────────────────────────────────────────────
// Replace with real queries when corresponding tables/jobs ship:
// - recent projects → SELECT FROM templates JOIN production_jobs LIMIT 5
// - production queue → production_jobs WHERE status IN ('pending','processing')
// - kpi values → aggregate from ai_generations + qa_runs + production_jobs
// The shape of these mock objects matches what the real query should return.

const MOCK_RECENT_PROJECTS = [
  { name: "Bolån — Q2 launch · Hero film", updated: "2h ago", formats: ["16:9", "9:16", "1:1"], status: "In review", tone: "amber" as const, score: 87 },
  { name: "Privatlån sommar — variant set", updated: "Yesterday", formats: ["9:16", "1:1"], status: "Approved", tone: "green" as const, score: 94 },
  { name: "Spara & Investera — explainer", updated: "2 days ago", formats: ["16:9"], status: "Producing", tone: "cobalt" as const, score: null },
  { name: "Kort & Betalningar — onboarding", updated: "4 days ago", formats: ["9:16", "4:5"], status: "Draft", tone: "neutral" as const, score: null },
  { name: "Sustainability report 2026", updated: "1 week ago", formats: ["16:9", "1:1"], status: "Approved", tone: "green" as const, score: 91 },
];

const MOCK_PRODUCTION_QUEUE = [
  { title: "Spara & Investera — 12 variants", progress: 74, sub: "9 of 12 rendered · ETA 2 min", color: "var(--nordea-teal)" },
  { title: "Bolån Hero — QA pass", progress: 32, sub: "Persona jury reviewing · ETA 4 min", color: "var(--nordea-blue)" },
];

const QUICK_START = [
  { icon: Sparkles, title: "Generate from product brief", sub: "Paste a brief → 3 variants in 90s", href: "/create/brief" },
  { icon: LayoutGrid, title: "Use a template", sub: "Brand-approved layouts", href: "/templates" },
  { icon: Upload, title: "Upload existing footage", sub: "Re-cut for new formats", href: "/create/analyze" },
];

export default function DashboardPage() {
  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={["Workspace", "Brand · Q2 2026"]}
        right={
          <Link href="/create" className="nordea-btn nordea-btn-primary">
            <Plus className="w-4 h-4" />
            New project
          </Link>
        }
      />

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* Welcome */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs text-nordea-text-tertiary mb-2">
              {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <h1 className="nordea-display text-4xl text-nordea-deep">
              {greeting}, Andreas.
              <br />
              <span className="text-nordea-text-tertiary">3 projekt väntar på din review.</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/templates" className="nordea-btn nordea-btn-secondary">
              <LayoutGrid className="w-4 h-4" />
              Open template
            </Link>
            <Link href="/create" className="nordea-btn nordea-btn-cobalt">
              <Sparkles className="w-4 h-4" />
              Generate from brief
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Videos this quarter" value="284" delta="+38%" sub="vs Q1" icon={Video} />
          <StatCard label="Active templates" value="42" delta="+6" deltaTone="cobalt" sub="this week" icon={LayoutGrid} />
          <StatCard label="Avg QA score" value="89" delta="+3.2" sub="trailing 30d" icon={CheckCircle2} />
          <StatCard label="Time saved" value="612h" delta="vs manual" deltaTone="teal" sub="quarter to date" icon={Clock} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-5">
          {/* Recent projects */}
          <div className="nordea-card overflow-hidden">
            <div className="px-5 py-4 border-b border-nordea-hairline flex items-center justify-between">
              <SectionTitle title="Recent projects" hint="Last 7 days" />
              <button className="p-1.5 hover:bg-nordea-bg-hover rounded-md transition-colors">
                <Filter className="w-3.5 h-3.5 text-nordea-text-tertiary" />
              </button>
            </div>
            <div>
              {MOCK_RECENT_PROJECTS.map((p, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[52px_1fr_auto_auto_auto] items-center gap-3 px-5 py-3 ${
                    i < MOCK_RECENT_PROJECTS.length - 1 ? "border-b border-nordea-hairline" : ""
                  }`}
                >
                  <div className="nordea-placeholder-stripe w-[52px] h-8">
                    {p.formats[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-nordea-text truncate">{p.name}</div>
                    <div className="text-[11px] text-nordea-text-tertiary mt-0.5">
                      Updated {p.updated} · Andreas H.
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
              <SectionTitle title="Quick start" />
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
              <SectionTitle title="Production queue" hint={`${MOCK_PRODUCTION_QUEUE.length} running`} />
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
