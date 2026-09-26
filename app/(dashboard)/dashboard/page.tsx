"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, LayoutGrid, Rocket, ShieldCheck } from "lucide-react";
import type { Campaign } from "@/lib/brief/types";

const STAGES = [
  { number: "01", title: "Brief och strategi", description: "Definiera målgrupp, budskap och önskad handling.", icon: FileText, href: "/create/brief", action: "Skapa brief" },
  { number: "02", title: "Kanaler och format", description: "Välj placeringar och bildförhållanden innan produktion.", icon: LayoutGrid, href: "/campaigns", action: "Se kampanjer" },
  { number: "03", title: "Kreativ och granskning", description: "Bearbeta material, testa och kvalitetssäkra.", icon: ShieldCheck, href: "/qa", action: "Öppna QA" },
];
const STATUS: Record<Campaign["status"], string> = {
  draft: "Utkast", in_review: "Under granskning", approved: "Godkänd", live: "Live",
};

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((response) => {
        if (!response.ok) throw new Error("Kunde inte hämta kampanjer");
        return response.json();
      })
      .then((data) => setCampaigns(data.campaigns ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-nordea-blue">CreativeIQ · arbetsyta</p>
          <h1 className="nordea-display mt-2 text-4xl text-nordea-deep">Från brief till färdigt material</h1>
          <p className="mt-2 max-w-2xl text-sm text-nordea-text-secondary">Samla strategi, kanalval, produktion och kvalitetskontroll i ett tydligt flöde.</p>
        </div>
        <Link href="/create/brief" className="nordea-btn nordea-btn-cobalt">Starta kampanj <ArrowRight className="h-4 w-4" /></Link>
      </header>

      <section aria-labelledby="workflow-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="workflow-title" className="text-lg font-semibold text-nordea-deep">Så arbetar du</h2>
          <Link href="/create" className="text-sm font-medium text-nordea-blue hover:underline">Alla kreativa verktyg</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            return <Link key={stage.number} href={stage.href} className="nordea-card group p-5 transition-colors hover:border-nordea-blue/40">
              <div className="flex items-start justify-between"><span className="text-xs font-bold tracking-widest text-nordea-blue">{stage.number}</span><Icon className="h-5 w-5 text-nordea-blue" /></div>
              <h3 className="mt-5 font-semibold text-nordea-deep">{stage.title}</h3>
              <p className="mt-1 min-h-10 text-sm text-nordea-text-secondary">{stage.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-nordea-blue">{stage.action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>;
          })}
        </div>
      </section>

      <section className="nordea-card overflow-hidden" aria-labelledby="campaigns-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nordea-border p-5">
          <div><h2 id="campaigns-title" className="text-lg font-semibold text-nordea-deep">Senaste kampanjer</h2><p className="mt-1 text-sm text-nordea-text-secondary">Fortsätt där teamet senast arbetade.</p></div>
          <Link href="/campaigns" className="text-sm font-medium text-nordea-blue hover:underline">Visa alla <ArrowRight className="inline h-4 w-4" /></Link>
        </div>
        {loading && <p className="p-6 text-sm text-nordea-text-secondary">Hämtar kampanjer…</p>}
        {!loading && error && <p className="p-6 text-sm text-red-700">Kampanjer kunde inte hämtas just nu.</p>}
        {!loading && !error && campaigns.length === 0 && <div className="p-8 text-center"><Rocket className="mx-auto h-7 w-7 text-nordea-blue" /><h3 className="mt-3 font-medium text-nordea-deep">Inga kampanjer ännu</h3><p className="mt-1 text-sm text-nordea-text-secondary">Börja med en brief för att skapa ditt första kampanjmaterial.</p><Link href="/create/brief" className="nordea-btn nordea-btn-secondary mt-4">Skapa brief</Link></div>}
        {!loading && !error && campaigns.slice(0, 5).map((campaign) => <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-nordea-border px-5 py-4 last:border-b-0 hover:bg-nordea-blue-soft/40">
          <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-nordea-deep">{campaign.name}</h3><p className="mt-1 text-xs text-nordea-text-secondary">{campaign.template_ids?.length ?? 0} redigerbara mallar</p></div>
          <div className="flex items-center gap-4"><span className="rounded-full bg-nordea-blue-soft px-2.5 py-1 text-xs font-medium text-nordea-blue">{STATUS[campaign.status] ?? "Utkast"}</span><ArrowRight className="h-4 w-4 text-nordea-blue" /></div>
        </Link>)}
      </section>
    </div>
  );
}
