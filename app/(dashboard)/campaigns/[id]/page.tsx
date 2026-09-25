"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, LayoutGrid, Loader2, ShieldCheck } from "lucide-react";
import type { Campaign } from "@/lib/brief/types";
import { channelName, formatName } from "@/lib/campaign-options";

const STATUS: Record<Campaign["status"], string> = {
  draft: "Utkast",
  in_review: "Under granskning",
  approved: "Godkänd",
  live: "Live",
};
interface TemplateSummary { id: string; name: string; format: string | null }

export default function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/campaigns/${id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Kampanjen kunde inte laddas");
        return data as { campaign: Campaign; templates: TemplateSummary[] };
      })
      .then((value) => {
        if (!active) return;
        setCampaign(value.campaign);
        setTemplates(value.templates ?? []);
      })
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Något gick fel"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-nordea-blue" /></div>;
  if (error || !campaign) return <div className="nordea-card mx-auto max-w-xl p-8 text-center"><h1 className="text-lg font-semibold text-nordea-deep">Kampanjen kunde inte öppnas</h1><p className="mt-2 text-sm text-nordea-text-secondary">{error}</p><Link className="nordea-btn nordea-btn-secondary mt-5" href="/campaigns">Till kampanjer</Link></div>;

  const templateIds = campaign.template_ids ?? [];
  const masterIds = campaign.master_creative_ids ?? [];
  const channels = campaign.channels ?? [];
  const formats = campaign.formats ?? [];
  const missingFormats = formats.filter((format) => !templates.some((template) => template.format === format));

  return <div className="mx-auto max-w-5xl space-y-6 pb-12">
    <Link href="/campaigns" className="text-sm text-nordea-blue hover:underline">← Alla kampanjer</Link>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-nordea-blue">Kampanjöversikt</p><h1 className="nordea-display mt-2 text-3xl text-nordea-deep">{campaign.name}</h1><p className="mt-2 text-sm text-nordea-text-secondary">Status: {STATUS[campaign.status] ?? "Utkast"}</p></div>
      {campaign.brief_id && <Link className="nordea-btn nordea-btn-secondary" href={`/create/brief/${campaign.brief_id}`}>Visa strategi <ArrowRight className="h-4 w-4" /></Link>}
    </header>

    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <section className="nordea-card p-5">
          <h2 className="flex items-center gap-2 font-semibold text-nordea-deep"><LayoutGrid className="h-5 w-5 text-nordea-blue" /> Kanaler och format</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div><h3 className="text-xs font-semibold uppercase tracking-wider text-nordea-text-secondary">Valda kanaler</h3><div className="mt-2 flex flex-wrap gap-2">{channels.length ? channels.map((channel) => <span key={channel} className="rounded-full bg-nordea-blue-soft px-3 py-1 text-xs font-medium text-nordea-blue">{channelName(channel)}</span>) : <span className="text-sm text-nordea-text-secondary">Inga kanalval sparade</span>}</div></div>
            <div><h3 className="text-xs font-semibold uppercase tracking-wider text-nordea-text-secondary">Valda format</h3><div className="mt-2 flex flex-wrap gap-2">{formats.length ? formats.map((format) => <span key={format} className="rounded-full bg-nordea-blue-soft px-3 py-1 text-xs font-medium text-nordea-blue">{formatName(format)}</span>) : <span className="text-sm text-nordea-text-secondary">Inga formatval sparade</span>}</div></div>
          </div>
          {campaign.brief_id && <Link href={`/create/brief/${campaign.brief_id}/campaign`} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-nordea-blue hover:underline">Ändra kanal- och formatval <ArrowRight className="h-4 w-4" /></Link>}
        </section>

        <section className="nordea-card p-5">
          <h2 className="font-semibold text-nordea-deep">Kreativt material</h2>
          <p className="mt-1 text-sm text-nordea-text-secondary">{templateIds.length} redigerbara mallar kopplade till kampanjen.</p>
          {templateIds.length ? <div className="mt-4 divide-y divide-nordea-border rounded-lg border border-nordea-border">{templateIds.map((templateId, index) => {
            const template = templates.find((item) => item.id === templateId);
            return <Link key={templateId} href={`/produce?template=${templateId}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-nordea-blue-soft/40"><span className="text-sm font-medium text-nordea-deep">{template?.format ? formatName(template.format) : template?.name ?? `Mall ${index + 1}`}</span><ArrowRight className="h-4 w-4 text-nordea-blue" /></Link>;
          })}</div> : <div className="mt-4 rounded-lg border border-dashed border-nordea-border p-5 text-sm text-nordea-text-secondary">Materialet är ännu inte genererat. Välj kanaler och format för att fortsätta.</div>}
          {missingFormats.length > 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Material saknas för {missingFormats.map(formatName).join(", ")}. Skapa nya mallar för dessa format innan granskning.</p>}
        </section>
      </div>

      <aside className="nordea-card h-fit p-5">
        <h2 className="font-semibold text-nordea-deep">Nästa steg</h2>
        <ol className="mt-4 space-y-4 text-sm">
          <li className="flex gap-3"><FileText className="h-4 w-4 shrink-0 text-nordea-blue" /><span>Granska kampanjens brief och budskap.</span></li>
          <li className="flex gap-3"><LayoutGrid className="h-4 w-4 shrink-0 text-nordea-blue" /><span>{templateIds.length ? "Anpassa kreativa mallar för valda format." : "Skapa material för valda kanaler och format."}</span></li>
          <li className="flex gap-3"><ShieldCheck className="h-4 w-4 shrink-0 text-nordea-blue" /><span>Kör QA innan materialet används.</span></li>
        </ol>
        <div className="mt-5 space-y-2">
          {campaign.brief_id && <Link className="nordea-btn nordea-btn-cobalt w-full" href={templateIds.length && masterIds[0] ? `/create/master?id=${masterIds[0]}` : `/create/brief/${campaign.brief_id}/campaign`}>{templateIds.length ? "Fortsätt med kreativ" : "Skapa kampanjmaterial"} <ArrowRight className="h-4 w-4" /></Link>}
          {templateIds.length > 0 && <Link className="nordea-btn nordea-btn-secondary w-full" href="/qa">Öppna QA</Link>}
        </div>
      </aside>
    </div>
  </div>;
}
