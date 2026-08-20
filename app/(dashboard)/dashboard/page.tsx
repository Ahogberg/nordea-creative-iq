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
import { createClient } from "@/lib/supabase/server";

// Server component: läser campaigns/production_jobs/qa_runs/ai_generations
// direkt från Supabase och faller tillbaka till exempeldata när databasen
// är tom eller okonfigurerad (samma former som de riktiga frågorna).

export const dynamic = "force-dynamic";

type Tone = "green" | "amber" | "cobalt" | "neutral";

interface ProjectRow {
  name: string;
  updated: string;
  formats: string[];
  status: string;
  tone: Tone;
  score: number | null;
}

interface QueueRow {
  title: string;
  progress: number;
  sub: string;
  color: string;
}

interface DashboardData {
  projects: ProjectRow[];
  queue: QueueRow[];
  reviewCount: number;
  kpi: { videos: string; templates: string; qaAvg: string; savedHours: string };
  isSample: boolean;
}

const MOCK_DATA: DashboardData = {
  projects: [
    { name: "Bolån — Q2-lansering · hjältefilm", updated: "2h sedan", formats: ["16:9", "9:16", "1:1"], status: "Under granskning", tone: "amber", score: 87 },
    { name: "Privatlån sommar — variantset", updated: "Igår", formats: ["9:16", "1:1"], status: "Godkänd", tone: "green", score: 94 },
    { name: "Spara & Investera — förklarande", updated: "2 dagar sedan", formats: ["16:9"], status: "Producerar", tone: "cobalt", score: null },
    { name: "Kort & Betalningar — introduktion", updated: "4 dagar sedan", formats: ["9:16", "4:5"], status: "Utkast", tone: "neutral", score: null },
    { name: "Hållbarhetsrapport 2026", updated: "1 vecka sedan", formats: ["16:9", "1:1"], status: "Godkänd", tone: "green", score: 91 },
  ],
  queue: [
    { title: "Spara & Investera — 12 varianter", progress: 74, sub: "9 av 12 renderade · ETA 2 min", color: "var(--nordea-teal)" },
    { title: "Bolån Hero — QA-granskning", progress: 32, sub: "Persona-jury granskar · ETA 4 min", color: "var(--nordea-blue)" },
  ],
  reviewCount: 3,
  kpi: { videos: "284", templates: "42", qaAvg: "89", savedHours: "612h" },
  isSample: true,
};

const QUICK_START = [
  { icon: Sparkles, title: "Generera från produktbrief", sub: "Klistra in en brief → 3 varianter på 90s", href: "/create/brief" },
  { icon: LayoutGrid, title: "Använd en mall", sub: "Varumärkesgodkända layouter", href: "/templates" },
  { icon: Upload, title: "Ladda upp befintligt material", sub: "Klipp om för nya format", href: "/create/analyze" },
];

const CAMPAIGN_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Utkast", tone: "neutral" },
  in_review: { label: "Under granskning", tone: "amber" },
  approved: { label: "Godkänd", tone: "green" },
  live: { label: "Live", tone: "cobalt" },
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Nyss";
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Igår";
  if (days < 7) return `${days} dagar sedan`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 vecka sedan" : `${weeks} veckor sedan`;
}

async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

    const [campaignsRes, jobsRes, qaRes, aiRes] = await Promise.all([
      supabase
        .from("campaigns")
        .select("id, name, status, master_creative_ids, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("production_jobs")
        .select("id, name, status, total_videos, completed_videos, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("qa_runs")
        .select("total_score, status, created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("ai_generations")
        .select("id", { count: "exact", head: true }),
    ]);

    const campaigns = campaignsRes.data ?? [];
    const jobs = jobsRes.data ?? [];
    const qaRuns = qaRes.data ?? [];

    if (campaigns.length === 0 && jobs.length === 0 && qaRuns.length === 0) {
      return MOCK_DATA;
    }

    const projects: ProjectRow[] = campaigns.map((c) => {
      const status = CAMPAIGN_STATUS[c.status ?? "draft"] ?? CAMPAIGN_STATUS.draft;
      return {
        name: c.name,
        updated: relativeTime(c.updated_at),
        formats: (c.master_creative_ids?.length ?? 0) > 0 ? ["16:9", "9:16", "1:1"] : ["16:9"],
        status: status.label,
        tone: status.tone,
        score: null,
      };
    });

    const activeJobs = jobs.filter((j) => j.status === "pending" || j.status === "processing");
    const queue: QueueRow[] = activeJobs.slice(0, 4).map((j, i) => {
      const total = j.total_videos || 1;
      const done = j.completed_videos || 0;
      return {
        title: j.name,
        progress: Math.round((done / total) * 100),
        sub: `${done} av ${total} renderade`,
        color: i % 2 === 0 ? "var(--nordea-teal)" : "var(--nordea-blue)",
      };
    });

    const completedVideos = jobs.reduce((sum, j) => sum + (j.completed_videos || 0), 0);
    const scored = qaRuns.filter((q) => typeof q.total_score === "number");
    const qaAvg =
      scored.length > 0
        ? Math.round(scored.reduce((sum, q) => sum + Number(q.total_score), 0) / scored.length)
        : null;
    const aiCount = aiRes.count ?? 0;
    const reviewCount = campaigns.filter((c) => c.status === "in_review").length;

    return {
      projects: projects.length > 0 ? projects : MOCK_DATA.projects,
      queue,
      reviewCount,
      kpi: {
        videos: String(completedVideos || aiCount || 0),
        templates: String(campaigns.length),
        qaAvg: qaAvg != null ? String(qaAvg) : "—",
        savedHours: `${Math.max(1, Math.round(completedVideos * 2.5))}h`,
      },
      isSample: false,
    };
  } catch (error) {
    console.warn("[dashboard] Supabase unavailable, using sample data:", error);
    return MOCK_DATA;
  }
}

export default async function DashboardPage() {
  const greeting = getGreeting();
  const data = await fetchDashboardData();

  const subline = data.isSample
    ? "3 projekt väntar på granskning."
    : data.reviewCount > 0
      ? `${data.reviewCount} ${data.reviewCount === 1 ? "projekt väntar" : "projekt väntar"} på granskning.`
      : "Allt är granskat — bra jobbat.";

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
              <span className="text-nordea-text-tertiary">{subline}</span>
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

        {/* KPI:er */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Producerade videor" value={data.kpi.videos} delta={data.isSample ? "+38%" : undefined} sub={data.isSample ? "jmf Q1" : "totalt"} icon={Video} />
          <StatCard label={data.isSample ? "Aktiva mallar" : "Kampanjer"} value={data.kpi.templates} delta={data.isSample ? "+6" : undefined} deltaTone="cobalt" sub={data.isSample ? "denna vecka" : "senast uppdaterade"} icon={LayoutGrid} />
          <StatCard label="Snitt QA-poäng" value={data.kpi.qaAvg} delta={data.isSample ? "+3.2" : undefined} sub="senaste 30 dagar" icon={CheckCircle2} />
          <StatCard label="Sparad tid" value={data.kpi.savedHours} delta="vs manuellt" deltaTone="teal" sub={data.isSample ? "kvartal hittills" : "uppskattat"} icon={Clock} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-[1.6fr_1fr] gap-5">
          {/* Senaste projekt */}
          <div className="nordea-card overflow-hidden">
            <div className="px-5 py-4 border-b border-nordea-hairline flex items-center justify-between">
              <SectionTitle title="Senaste projekt" hint={data.isSample ? "Exempeldata" : "Senast uppdaterade"} />
              <button className="p-1.5 hover:bg-nordea-bg-hover rounded-md transition-colors">
                <Filter className="w-3.5 h-3.5 text-nordea-text-tertiary" />
              </button>
            </div>
            <div>
              {data.projects.map((p, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[52px_1fr_auto_auto_auto] items-center gap-3 px-5 py-3 ${
                    i < data.projects.length - 1 ? "border-b border-nordea-hairline" : ""
                  }`}
                >
                  <div className="nordea-placeholder-stripe w-[52px] h-8">
                    {p.formats[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-nordea-text truncate">{p.name}</div>
                    <div className="text-[11px] text-nordea-text-tertiary mt-0.5">
                      Uppdaterad {p.updated}
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
              <SectionTitle title="Produktionskö" hint={`${data.queue.length} pågående`} />
              {data.queue.length === 0 ? (
                <p className="text-xs text-nordea-text-tertiary">Inga pågående produktioner just nu.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {data.queue.map((q, i) => (
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
              )}
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
