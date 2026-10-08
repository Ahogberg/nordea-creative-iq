"use client";

// Kampanjvyn: strategin och allt material på ett ställe — videon (Motion
// Studio) och displaypaketet — med status per del. Materialet ägs av
// kampanjen och sparas dit automatiskt när det redigeras.

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Thumbnail } from "@remotion/player";
import {
  ArrowRight,
  Film,
  LayoutGrid,
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  MessageSquareQuote,
  MousePointerClick,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageHeading } from "@/components/layout/page-heading";
import type { Campaign, CreativeBrief } from "@/lib/brief/types";
import type { VideoConfig } from "@/lib/remotion/types";
import { DISPLAY_FORMATS } from "@/lib/formats/registry";
import { DisplayBanner, type DisplayBannerProps } from "@/lib/display/DisplayBanner";
import { resolveContent } from "@/lib/display/types";
import { FORMAT_PRESETS } from "@/lib/remotion/styles";
import {
  channelName,
  formatName,
  isChannel,
  isFormat,
  type Channel,
  type Format,
} from "@/lib/campaign-options";
import { CampaignChoicesPicker } from "@/components/brief/campaign-choices-picker";

const MotionPlayer = dynamic(
  () => import("@/lib/remotion/PlayerWrapper").then((m) => ({ default: m.MotionPlayer })),
  { ssr: false }
);

const STATUSES: Array<{ id: Campaign["status"]; label: string }> = [
  { id: "draft", label: "Utkast" },
  { id: "in_review", label: "Under granskning" },
  { id: "approved", label: "Godkänd" },
  { id: "live", label: "Live" },
];

type BriefSummary = Pick<
  CreativeBrief,
  | "id"
  | "title"
  | "big_idea"
  | "insight"
  | "key_message"
  | "key_messages"
  | "desired_action"
  | "audience_description"
  | "tone_of_voice"
  | "recommended_channels"
  | "recommended_formats"
>;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignPage({ params }: PageProps) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [brief, setBrief] = useState<BriefSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = (await res.json().catch(() => null)) as { campaign?: Campaign; brief?: BriefSummary; error?: string } | null;
      if (!res.ok || !data?.campaign) throw new Error(data?.error || "Kampanjen kunde inte hämtas");
      setCampaign(data.campaign);
      setBrief(data.brief ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (updates: Partial<Pick<Campaign, "name" | "status" | "channels" | "formats">>) => {
    if (!campaign) return false;
    const before = campaign;
    setCampaign({ ...campaign, ...updates });
    const res = await fetch(`/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      setCampaign(before);
      setError("Ändringen kunde inte sparas");
      return false;
    }
    return true;
  };

  const regenerate = async () => {
    if (!campaign?.brief_id) return;
    if (!window.confirm("Skapa en ny video från strategin? Den nuvarande videon ersätts.")) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/brief/${campaign.brief_id}/generate-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Videon kunde inte skapas");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setRegenerating(false);
    }
  };

  if (!campaign) {
    return (
      <div className="min-h-screen bg-nordea-bg">
        <Topbar breadcrumb={["Kampanjer", "…"]} />
        <div className="flex items-center justify-center py-24">
          {error ? (
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-nordea-rose mx-auto mb-2" />
              <p className="text-sm text-nordea-text">{error}</p>
              <Link href="/campaigns" className="mt-3 inline-block text-sm text-nordea-blue hover:underline">
                Till kampanjerna
              </Link>
            </div>
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-nordea-text-tertiary" />
          )}
        </div>
      </div>
    );
  }

  const video = campaign.video_config ?? null;

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar
        breadcrumb={["Kampanjer", campaign.name]}
        right={
          <select
            value={campaign.status}
            onChange={(e) => void patch({ status: e.target.value as Campaign["status"] })}
            aria-label="Kampanjens status"
            className="nordea-input h-9 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        }
      />

      <div className="px-8 py-7 max-w-[1400px] mx-auto">
        <PageHeading
          eyebrow="Kampanj"
          title={campaign.name}
          description={brief?.big_idea ?? undefined}
        />

        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-nordea-rose/20 bg-nordea-rose-soft px-3 py-2 text-sm text-nordea-rose">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 items-start">
          <div className="space-y-5">
            <StrategyCard brief={brief} />
            <ChoicesCard
              campaign={campaign}
              brief={brief}
              onSave={(next) => patch(next)}
            />
          </div>

          <div className="space-y-5 min-w-0">
            <section className="nordea-card p-5">
              <DeliverableHeader
                icon={Film}
                title="Video"
                status={video ? describeVideo(video) : "Ingen video ännu"}
                done={!!video}
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-start">
                <div className="rounded-xl overflow-hidden bg-nordea-bg-hover" style={{ aspectRatio: aspectOf(video) }}>
                  {video ? (
                    <MotionPlayer config={video} loop />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-nordea-text-tertiary">—</div>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-nordea-text-secondary leading-relaxed">
                    Kampanjens huvudfilm. Ändra den genom att prata med AI:n i Motion Studio — ändringarna sparas i
                    kampanjen, och du kan testa den i fokusgruppen därifrån.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/create/video?campaign=${campaign.id}`} className="nordea-btn nordea-btn-primary">
                      Öppna i Motion Studio
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {campaign.brief_id && (
                      <button
                        type="button"
                        onClick={() => void regenerate()}
                        disabled={regenerating}
                        className="nordea-btn nordea-btn-secondary disabled:opacity-50"
                      >
                        {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        {regenerating ? "Skapar ny video…" : "Ny video från strategin"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="nordea-card p-5">
              <DeliverableHeader
                icon={LayoutGrid}
                title="Displayformat"
                status={
                  campaign.display_set
                    ? `${campaign.display_set.formats.length} format · ${Object.keys(campaign.display_set.overrides).length} justerade`
                    : "Inte skapat — utgår från videon när du öppnar det"
                }
                done={!!campaign.display_set}
              />
              {campaign.display_set && <DisplayStrip set={campaign.display_set} />}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/create/display?campaign=${campaign.id}`} className="nordea-btn nordea-btn-primary">
                  {campaign.display_set ? "Öppna displayformat" : "Skapa displayformat"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function aspectOf(video: VideoConfig | null): string {
  const f = FORMAT_PRESETS[video?.format ?? "story"] ?? FORMAT_PRESETS.story;
  return `${f.width} / ${f.height}`;
}

function describeVideo(v: VideoConfig): string {
  const seconds = v.scenes.reduce((s, x) => s + (x.durationSeconds || 0), 0);
  const f = FORMAT_PRESETS[v.format] ?? FORMAT_PRESETS.story;
  return `${v.scenes.length} scener · ${seconds.toFixed(1).replace(".", ",")} s · ${f.label}`;
}

function DeliverableHeader({
  icon: Icon,
  title,
  status,
  done,
}: {
  icon: typeof Film;
  title: string;
  status: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${done ? "bg-nordea-blue-soft" : "bg-nordea-bg-hover"}`}>
        <Icon className={`w-4 h-4 ${done ? "text-nordea-blue" : "text-nordea-text-tertiary"}`} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-nordea-text">{title}</h2>
        <p className="text-xs text-nordea-text-tertiary">{status}</p>
      </div>
    </div>
  );
}

function DisplayStrip({ set }: { set: NonNullable<Campaign["display_set"]> }) {
  const specs = useMemo(() => DISPLAY_FORMATS.filter((f) => set.formats.includes(f.id)), [set.formats]);
  const HEIGHT = 110;
  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
      {specs.map((spec) => {
        const content = resolveContent(set.content, set.overrides[spec.id]);
        const frame = Math.round((content.illustration?.atSeconds ?? 0) * 30);
        const props: DisplayBannerProps = { content, width: spec.width, height: spec.height, family: spec.family };
        const w = Math.round((spec.width / spec.height) * HEIGHT);
        return (
          <div key={spec.id} className="flex-shrink-0">
            <div className="rounded-md overflow-hidden ring-1 ring-nordea-border" style={{ width: w, height: HEIGHT }}>
              <Thumbnail
                component={DisplayBanner}
                compositionWidth={spec.width}
                compositionHeight={spec.height}
                frameToDisplay={frame}
                durationInFrames={frame + 1}
                fps={30}
                inputProps={props}
                style={{ width: w, height: HEIGHT }}
              />
            </div>
            <p className="mt-1 text-[10px] text-nordea-text-tertiary tabular-nums">
              {spec.label} {spec.width}×{spec.height}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Var kampanjen ska synas: valda kanaler och videoformat, med redigering. */
function ChoicesCard({
  campaign,
  brief,
  onSave,
}: {
  campaign: Campaign;
  brief: BriefSummary | null;
  onSave: (next: { channels: Channel[]; formats: Format[] }) => Promise<boolean>;
}) {
  const saved = {
    channels: (campaign.channels ?? []).filter(isChannel),
    formats: (campaign.formats ?? []).filter(isFormat),
  };
  const [draft, setDraft] = useState<{ channels: Channel[]; formats: Format[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const empty = saved.channels.length === 0 && saved.formats.length === 0;

  const startEditing = () => {
    const rec = {
      channels: (brief?.recommended_channels ?? []).filter(isChannel),
      formats: (brief?.recommended_formats ?? []).filter(isFormat),
    };
    setDraft(empty ? rec : saved);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    if (await onSave(draft)) setDraft(null);
    setSaving(false);
  };

  const ready = !!draft && draft.channels.length > 0 && draft.formats.length > 0;

  return (
    <section className="nordea-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-nordea-text">Kanaler och format</h2>
        {!draft && (
          <button type="button" onClick={startEditing} className="text-xs text-nordea-blue hover:underline">
            {empty ? "Välj" : "Ändra"}
          </button>
        )}
      </div>

      {draft ? (
        <div className="mt-4 space-y-4">
          <CampaignChoicesPicker
            channels={draft.channels}
            formats={draft.formats}
            recommendedChannels={brief?.recommended_channels ?? []}
            recommendedFormats={brief?.recommended_formats ?? []}
            onChange={setDraft}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="nordea-btn nordea-btn-ghost nordea-btn-sm">
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={!ready || saving}
              className="nordea-btn nordea-btn-primary nordea-btn-sm disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Spara
            </button>
          </div>
        </div>
      ) : empty ? (
        <p className="mt-2 text-sm text-nordea-text-tertiary">Inte valt ännu.</p>
      ) : (
        <div className="mt-3 space-y-3">
          <ChipRow label="Kanaler" items={saved.channels.map(channelName)} />
          <ChipRow label="Videoformat" items={saved.formats.map(formatName)} />
        </div>
      )}
    </section>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-nordea-text-tertiary uppercase tracking-wide">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-nordea-blue-soft px-2.5 py-0.5 text-xs text-nordea-blue">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ brief }: { brief: BriefSummary | null }) {
  if (!brief) {
    return (
      <aside className="nordea-card p-5 text-sm text-nordea-text-tertiary">Ingen brief kopplad till kampanjen.</aside>
    );
  }
  const messages = Array.isArray(brief.key_messages) ? brief.key_messages.slice(0, 3) : [];
  const rows: Array<{ icon: typeof Target; label: string; text: string | null | undefined }> = [
    { icon: Target, label: "Insikt", text: brief.insight },
    { icon: MessageSquareQuote, label: "Budskap", text: brief.key_message },
    { icon: Users, label: "Målgrupp", text: brief.audience_description },
    { icon: MousePointerClick, label: "Önskad handling", text: brief.desired_action },
  ];
  return (
    <aside className="nordea-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-nordea-text">Strategi</h2>
        <Link href={`/create/brief/${brief.id}/review`} className="text-xs text-nordea-blue hover:underline">
          Visa briefen
        </Link>
      </div>
      {rows
        .filter((r) => r.text)
        .map((r) => (
          <div key={r.label}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-nordea-text-tertiary uppercase tracking-wide">
              <r.icon className="w-3 h-3" /> {r.label}
            </div>
            <p className="mt-1 text-sm text-nordea-text leading-relaxed">{r.text}</p>
          </div>
        ))}
      {messages.length > 0 && (
        <div>
          <div className="text-[11px] font-medium text-nordea-text-tertiary uppercase tracking-wide">Budskapsvinklar</div>
          <ul className="mt-1.5 space-y-1.5">
            {messages.map((m, i) => (
              <li key={i} className="text-sm text-nordea-text">
                <span className="text-nordea-text-tertiary">{m.angle}:</span> {m.headline}
              </li>
            ))}
          </ul>
        </div>
      )}
      {brief.tone_of_voice && <p className="text-xs text-nordea-text-tertiary leading-relaxed">{brief.tone_of_voice}</p>}
    </aside>
  );
}
