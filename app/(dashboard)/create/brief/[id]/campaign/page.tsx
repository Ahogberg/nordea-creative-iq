"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Rocket } from "lucide-react";
import type { CreativeBrief } from "@/lib/brief/types";

interface PageProps { params: Promise<{ id: string }> }
type Format = "story" | "feed" | "landscape" | "vertical";
type Channel = "meta" | "linkedin" | "google" | "tiktok" | "youtube";
interface Result { template_ids: string[]; master_id: string | null }

const CHANNELS: { id: Channel; name: string; description: string }[] = [
  { id: "meta", name: "Meta / Instagram", description: "Flöde och Stories" },
  { id: "linkedin", name: "LinkedIn", description: "Professionellt flöde" },
  { id: "google", name: "Google Ads", description: "Display och video" },
  { id: "tiktok", name: "TikTok", description: "Vertikal video" },
  { id: "youtube", name: "YouTube", description: "Video i bredbild" },
];
const FORMATS: { id: Format; name: string; ratio: string }[] = [
  { id: "story", name: "Story / Reel", ratio: "9:16" },
  { id: "feed", name: "Kvadratisk", ratio: "1:1" },
  { id: "vertical", name: "Porträtt", ratio: "4:5" },
  { id: "landscape", name: "Bredbild", ratio: "16:9" },
];

export default function BriefCampaignPage({ params }: PageProps) {
  const { id } = use(params);
  const [brief, setBrief] = useState<CreativeBrief | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/brief/${id}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Briefen kunde inte laddas");
        return response.json();
      })
      .then(({ brief: value }: { brief: CreativeBrief }) => {
        if (!active) return;
        setBrief(value);
        setChannels((value.recommended_channels ?? []).filter((item): item is Channel => CHANNELS.some((c) => c.id === item)));
        setFormats((value.recommended_formats ?? []).filter((item): item is Format => FORMATS.some((f) => f.id === item)));
      })
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : "Något gick fel"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const toggle = <T extends string,>(value: T, selected: T[], setSelected: (values: T[]) => void) => {
    setSelected(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch(`/api/brief/${id}/generate-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels, formats }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Kampanjen kunde inte skapas");
      setResult(data as Result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Något gick fel");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-nordea-blue" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link href={`/create/brief/${id}`} className="text-sm text-nordea-blue hover:underline">← Tillbaka till strategin</Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-nordea-blue">Kampanj · steg 2 av 3</p>
        <h1 className="nordea-display mt-2 text-3xl text-nordea-deep">Välj kanaler och format</h1>
        <p className="mt-2 text-sm text-nordea-text-secondary">{brief?.title ?? "Brief"} · Välj var materialet ska användas innan du skapar det.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <section className="nordea-card p-5">
            <h2 className="font-semibold text-nordea-deep">1. Kanaler</h2>
            <p className="mt-1 mb-4 text-sm text-nordea-text-secondary">Strategins rekommendationer är förvalda. Anpassa efter din medieplan.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHANNELS.map((channel) => <button key={channel.id} type="button" aria-pressed={channels.includes(channel.id)} onClick={() => toggle(channel.id, channels, setChannels)} className={`rounded-xl border p-3 text-left transition-colors ${channels.includes(channel.id) ? "border-nordea-blue bg-nordea-blue-soft" : "border-nordea-border bg-white hover:border-nordea-blue/40"}`}>
                <span className="flex items-center justify-between gap-2 font-medium text-nordea-deep">{channel.name}{channels.includes(channel.id) && <Check className="h-4 w-4 text-nordea-blue" />}</span>
                <span className="mt-1 block text-xs text-nordea-text-secondary">{channel.description}</span>
              </button>)}
            </div>
          </section>
          <section className="nordea-card p-5">
            <h2 className="font-semibold text-nordea-deep">2. Kreativa format</h2>
            <p className="mt-1 mb-4 text-sm text-nordea-text-secondary">En redigerbar videomall skapas för varje valt bildförhållande.</p>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((format) => <button key={format.id} type="button" aria-pressed={formats.includes(format.id)} onClick={() => toggle(format.id, formats, setFormats)} className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors ${formats.includes(format.id) ? "border-nordea-blue bg-nordea-blue-soft" : "border-nordea-border bg-white hover:border-nordea-blue/40"}`}>
                <span><span className="block text-sm font-medium text-nordea-deep">{format.name}</span><span className="text-xs text-nordea-text-secondary">{format.ratio}</span></span>
                {formats.includes(format.id) && <Check className="h-4 w-4 text-nordea-blue" />}
              </button>)}
            </div>
          </section>
        </div>
        <aside className="nordea-card h-fit p-5 lg:sticky lg:top-6">
          <h2 className="font-semibold text-nordea-deep">Produktionsöversikt</h2>
          <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-nordea-text-secondary">Kanaler</dt><dd className="font-semibold">{channels.length}</dd></div><div className="flex justify-between"><dt className="text-nordea-text-secondary">Format</dt><dd className="font-semibold">{formats.length}</dd></div><div className="flex justify-between border-t border-nordea-border pt-3"><dt className="text-nordea-text-secondary">Redigerbara mallar</dt><dd className="font-semibold">{formats.length}</dd></div></dl>
          <p className="mt-4 text-xs text-nordea-text-secondary">Granska budskap och anpassa materialet i Master eller Produktion innan publicering.</p>
          <button type="button" onClick={generate} disabled={!brief || generating || channels.length === 0 || formats.length === 0 || !!result} className="nordea-btn nordea-btn-cobalt mt-5 w-full justify-center disabled:opacity-50">{generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}{generating ? "Skapar material…" : "Skapa kampanjmaterial"}</button>
          {(channels.length === 0 || formats.length === 0) && <p className="mt-2 text-xs text-nordea-text-secondary">Välj minst en kanal och ett format.</p>}
        </aside>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && <section className="nordea-card border-nordea-blue p-5" aria-live="polite"><h2 className="text-lg font-semibold text-nordea-deep">Kampanjmaterialet är klart</h2><p className="mt-1 text-sm text-nordea-text-secondary">{result.template_ids.length} mallar skapade. Fortsätt med kreativ bearbetning och granskning.</p><div className="mt-4 flex flex-wrap gap-2">{result.master_id && <Link className="nordea-btn nordea-btn-cobalt" href={`/create/master?id=${result.master_id}`}>Öppna Master <ArrowRight className="h-4 w-4" /></Link>}<Link className="nordea-btn nordea-btn-secondary" href={`/produce?template=${result.template_ids[0]}`}>Öppna Produktion <ArrowRight className="h-4 w-4" /></Link><Link className="nordea-btn nordea-btn-secondary" href="/campaigns">Alla kampanjer</Link></div></section>}
    </div>
  );
}
