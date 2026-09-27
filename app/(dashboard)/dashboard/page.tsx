import Link from "next/link";
import {
  ArrowRight,
  Rocket,
  LayoutGrid,
  CheckCircle2,
  Timer,
  Sparkles,
  Upload,
  Film,
  Clapperboard,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SectionTitle } from "@/components/layout/section-title";
import { StatCard } from "@/components/ui/stat-card";
import { NordeaBadge } from "@/components/ui/nordea-badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { CreativeThumbnail } from "@/components/preview/creative-thumbnail";
import { SAMPLE_CREATIVES } from "@/lib/demo/sample-creatives";
import { requireSessionUser } from "@/lib/auth/session-user";
import { greetingName } from "@/lib/auth/user-display";
import { getOverview, type Overview } from "@/lib/dashboard/overview";
import { campaignStatus, formatRelative } from "@/lib/campaign-status";
import type { VideoConfig } from "@/lib/remotion/types";

// Allt här hämtas per förfrågan — siffrorna ska aldrig vara cachade eller påhittade.
export const dynamic = "force-dynamic";

const QUICK_START = [
  { icon: Sparkles, title: "Börja från en brief", sub: "Idé eller färdig brief → strategi och kampanj", href: "/create/brief" },
  { icon: LayoutGrid, title: "Använd en mall", sub: "Varumärkesgodkända layouter", href: "/templates" },
  { icon: Upload, title: "Granska en befintlig annons", sub: "Persona-feedback och uppmärksamhetskarta", href: "/create/analyze" },
];

export default async function DashboardPage() {
  const [user, overview] = await Promise.all([requireSessionUser(), getOverview()]);
  const name = greetingName(user);
  const data = overview.ok ? overview.data : null;

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar breadcrumb={["Översikt"]} />

      <div className="px-8 py-8 max-w-[1400px] mx-auto">
        {/* Välkomst */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <div className="text-xs text-nordea-text-tertiary mb-2 first-letter:uppercase">
              {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Stockholm" })}
            </div>
            <h1 className="nordea-display text-4xl text-nordea-deep">
              {getGreeting()}
              {name ? `, ${name}` : ""}.
              <br />
              <span className="text-nordea-text-tertiary">{statusLine(data)}</span>
            </h1>
          </div>
          <div className="flex gap-2">
            <Link href="/templates" className="nordea-btn nordea-btn-secondary">
              <LayoutGrid className="w-4 h-4" />
              Öppna mall
            </Link>
            <Link href="/create/brief" className="nordea-btn nordea-btn-primary">
              <Sparkles className="w-4 h-4" />
              Ny brief
            </Link>
          </div>
        </div>

        {!overview.ok && (
          <div className="nordea-card mb-8">
            <ErrorState compact title="Översikten kunde inte hämtas" description={overview.message} />
          </div>
        )}

        <RecentAds data={data} />

        {/* KPI:er — riktiga värden, "—" när underlag saknas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Kampanjer"
            value={data ? String(data.campaignCount) : "—"}
            sub={data ? `${data.inReviewCount} under granskning` : undefined}
            icon={Rocket}
          />
          <StatCard
            label="Renderade videor"
            value={data ? String(data.renderedVideos) : "—"}
            sub="från massproduktion"
            icon={Film}
          />
          <StatCard
            label="Snitt QA-poäng"
            value={data?.qa.avgScore != null ? String(Math.round(data.qa.avgScore)) : "—"}
            sub={data && data.qa.runs > 0 ? `${data.qa.runs} granskningar, 30 dagar` : "inga granskningar ännu"}
            icon={CheckCircle2}
          />
          <StatCard
            label="Tid per granskning"
            value={data?.qa.avgDurationMs != null ? formatDuration(data.qa.avgDurationMs) : "—"}
            sub="persona-jury, ToV och compliance"
            icon={Timer}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
          {/* Senaste kampanjer */}
          <div className="nordea-card overflow-hidden">
            <div className="px-5 py-4 border-b border-nordea-hairline">
              <SectionTitle
                title="Senaste kampanjer"
                right={
                  <Link href="/campaigns" className="text-xs font-medium text-nordea-blue inline-flex items-center gap-1 hover:underline">
                    Alla kampanjer <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
            </div>
            {data && data.campaigns.length > 0 ? (
              <div>
                {data.campaigns.map((c, i) => {
                  const status = campaignStatus(c.status);
                  return (
                    <Link
                      key={c.id}
                      href={`/campaigns/${c.id}`}
                      className={`grid grid-cols-[52px_1fr_auto] items-center gap-3 px-5 py-3 hover:bg-nordea-bg-hover transition-colors ${
                        i < data.campaigns.length - 1 ? "border-b border-nordea-hairline" : ""
                      }`}
                    >
                      <div className="w-[52px] h-10 rounded-md overflow-hidden flex items-center justify-center bg-nordea-blue-soft">
                        {c.video_config ? (
                          <CreativeThumbnail config={c.video_config} playOnHover={false} rounded="rounded-none" className="w-full shrink-0" />
                        ) : (
                          <Clapperboard className="w-4 h-4 text-nordea-blue" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-nordea-text truncate">{c.name || "Namnlös kampanj"}</div>
                        <div className="text-[11px] text-nordea-text-tertiary mt-0.5">Uppdaterad {formatRelative(c.updated_at)}</div>
                      </div>
                      <NordeaBadge tone={status.tone} dot>
                        {status.label}
                      </NordeaBadge>
                    </Link>
                  );
                })}
              </div>
            ) : data ? (
              <EmptyState
                compact
                icon={Rocket}
                title="Inga kampanjer ännu"
                description="En kampanj skapas från en godkänd brief och samlar video, displayformat och QA."
                action={
                  <Link href="/create/brief" className="nordea-btn nordea-btn-primary nordea-btn-sm">
                    Skapa en brief
                  </Link>
                }
              />
            ) : (
              <ErrorState compact title="Kampanjerna kunde inte hämtas" description="Se meddelandet ovan." />
            )}
          </div>

          {/* Höger kolumn */}
          <div className="flex flex-col gap-5">
            <div className="nordea-card p-5">
              <SectionTitle title="Snabbstart" />
              <div className="flex flex-col gap-2">
                {QUICK_START.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Link
                      key={q.href}
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
              <SectionTitle title="Produktionskö" hint={data ? `${data.queue.length} pågående` : undefined} />
              {data && data.queue.length > 0 ? (
                <div className="flex flex-col gap-3.5">
                  {data.queue.map((job) => {
                    const pct = job.total_videos > 0 ? Math.round((job.completed_videos / job.total_videos) * 100) : 0;
                    return (
                      <Link key={job.id} href="/produce" className="block group">
                        <div className="flex justify-between mb-1.5">
                          <span className="text-xs font-medium text-nordea-text group-hover:underline truncate pr-3">{job.name}</span>
                          <span className="text-[11px] font-mono text-nordea-text-tertiary">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-nordea-bg-hover rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-nordea-blue transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[11px] text-nordea-text-tertiary mt-1.5">
                          {job.status === "pending" ? "Väntar på start" : `${job.completed_videos} av ${job.total_videos} renderade`}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-nordea-text-tertiary">
                  {data ? "Inget renderas just nu." : "Kön kunde inte hämtas."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Kampanjernas egna videor, eller tydligt märkta exempel innan det finns några. */
function RecentAds({ data }: { data: Overview | null }) {
  const own = (data?.campaigns ?? []).filter((c) => c.video_config);
  const showingExamples = own.length === 0;

  return (
    <div className="nordea-card p-5 mb-8">
      <SectionTitle
        title={showingExamples ? "Exempel på annonser" : "Senaste annonserna"}
        hint={showingExamples ? "Så här ser det ut — dina kampanjers videor visas här" : "Håll musen över för att spela"}
        right={
          showingExamples ? undefined : (
            <Link href="/campaigns" className="text-xs font-medium text-nordea-blue inline-flex items-center gap-1 hover:underline">
              Alla kampanjer <ArrowRight className="w-3 h-3" />
            </Link>
          )
        }
      />
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
        {showingExamples
          ? SAMPLE_CREATIVES.map((c) => (
              <AdCard key={c.id} config={c.config} title={c.product} />
            ))
          : own.map((c) => {
              const status = campaignStatus(c.status);
              return (
                <Link key={c.id} href={`/campaigns/${c.id}`}>
                  <AdCard
                    config={c.video_config!}
                    title={c.name || "Namnlös kampanj"}
                    badge={
                      <NordeaBadge tone={status.tone} dot>
                        {status.label}
                      </NordeaBadge>
                    }
                  />
                </Link>
              );
            })}
      </div>
    </div>
  );
}

function AdCard({
  config,
  title,
  badge,
}: {
  config: VideoConfig;
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="shrink-0 group/card">
      <div className="h-[230px] flex items-end">
        <CreativeThumbnail
          config={config}
          className="h-full shadow-[0_8px_24px_-8px_rgba(0,0,94,0.35)] transition-transform duration-300 group-hover/card:-translate-y-1"
          rounded="rounded-xl"
        />
      </div>
      <div className="mt-3 max-w-[210px]">
        <div className="text-[13px] font-medium text-nordea-text truncate">{title}</div>
        {badge && <div className="mt-1">{badge}</div>}
      </div>
    </div>
  );
}

function statusLine(data: Overview | null): string {
  if (!data) return "Välkommen till CreativeIQ.";
  if (data.inReviewCount === 1) return "1 kampanj väntar på granskning.";
  if (data.inReviewCount > 1) return `${data.inReviewCount} kampanjer väntar på granskning.`;
  if (data.campaignCount === 0) return "Börja med en brief — resten går fort.";
  return "Inget väntar på granskning.";
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s`;
}

function getGreeting(): string {
  // Stockholmstid — servern kan köra i UTC.
  const hour = Number(
    new Intl.DateTimeFormat("sv-SE", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Stockholm" }).format(new Date())
  );
  if (hour < 5) return "God natt";
  if (hour < 11) return "God morgon";
  if (hour < 17) return "Hej";
  return "God kväll";
}
