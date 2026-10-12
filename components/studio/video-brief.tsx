"use client";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { useStudioStore, ASPECT_RATIOS, type AspectRatio } from "@/lib/studio/store";

export function VideoBrief({ initialIdea = "" }: { initialIdea?: string }) {
  const [idea, setIdea] = useState(initialIdea);
  const [format, setFormat] = useState<AspectRatio>("story");
  const [duration, setDuration] = useState("15");
  const busy = useStudioStore(s => s.isChatBusy);
  const start = useStudioStore(s => s.startFromPrompt);
  const messages = useStudioStore(s => s.messages);
  const error = [...messages].reverse().find(m => m.status === "error")?.content;
  const generate = () => {
    if (!idea.trim() || busy) return;
    void start(`Skapa en hel, sammanhängande video.\nIdé: ${idea.trim()}\nFormat: ${ASPECT_RATIOS[format].ratio}. Längd: ${duration} sekunder.\nPlanera berättelse, tempo och avslut för hela filmen. Dela upp i scener internt, utan att be användaren beskriva varje scen.`, `${idea.trim()} · ${ASPECT_RATIOS[format].ratio} · ${duration} sekunder`);
  };
  return <main className="flex-1 overflow-y-auto bg-nordea-bg p-4 sm:p-8">
    <div className="max-w-2xl mx-auto py-8 sm:py-12">
      <Link href="/create" className="text-sm text-nordea-blue hover:underline">← Till Skapa</Link>
      <h1 className="nordea-display text-3xl sm:text-4xl text-nordea-deep mt-6">Beskriv hela videon</h1>
      <p className="text-nordea-text-secondary mt-3 mb-7">Berätta vad filmen ska förmedla och till vem. Du får ett sammanhängande första utkast och kan sedan förbättra helheten eller redigera detaljer.</p>
      <form onSubmit={e => { e.preventDefault(); generate(); }} className="nordea-card p-5 sm:p-7 space-y-5">
        <div><label htmlFor="video-idea" className="block font-medium text-sm mb-2">Vad ska videon handla om?</label>
          <textarea id="video-idea" rows={5} maxLength={1500} value={idea} disabled={busy} onChange={e => setIdea(e.target.value)} placeholder="En varm annons om bolån för förstagångsköpare. Visa hur Nordea hjälper dem förstå nästa steg och avsluta med en tydlig väg till rådgivning." className="nordea-input w-full h-auto p-3 resize-y" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label htmlFor="video-format" className="block font-medium text-sm mb-2">Format</label><select id="video-format" value={format} disabled={busy} onChange={e => setFormat(e.target.value as AspectRatio)} className="nordea-input w-full">{Object.entries(ASPECT_RATIOS).map(([id, value]) => <option key={id} value={id}>{value.label} · {value.ratio}</option>)}</select></div>
          <div><label htmlFor="video-duration" className="block font-medium text-sm mb-2">Längd</label><select id="video-duration" value={duration} disabled={busy} onChange={e => setDuration(e.target.value)} className="nordea-input w-full">{[6, 15, 30, 60].map(value => <option key={value} value={value}>{value} sekunder</option>)}</select></div>
        </div>
        {error && <p role="alert" className="text-sm text-nordea-rose">{error} Din beskrivning finns kvar; försök igen.</p>}
        <button type="submit" disabled={!idea.trim() || busy} className="nordea-btn nordea-btn-primary w-full disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{busy ? "Skapar hela videon…" : "Skapa hela videon"}</button>
        <p className="text-xs text-nordea-text-tertiary">Du behöver inte välja eller skriva en scen i taget.</p>
      </form>
    </div>
  </main>;
}
