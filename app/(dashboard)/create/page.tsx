"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Type,
  Video,
  Image as ImageIcon,
  ArrowUpRight,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";

interface Shortcut {
  id: string;
  icon: typeof Type;
  title: string;
  description: string;
  mode: "copy" | "video" | "analyze";
}

const SHORTCUTS: Shortcut[] = [
  {
    id: "copy",
    icon: Type,
    title: "Skriv annonstext",
    description: "Rubriker, brödtext och CTA:er i Nordeas ton",
    mode: "copy",
  },
  {
    id: "video",
    icon: Video,
    title: "Skapa video",
    description: "Beskriv hela filmen — få ett sammanhängande utkast",
    mode: "video",
  },
  {
    id: "analyze",
    icon: ImageIcon,
    title: "Granska annons",
    description: "Granska en annons med personas och uppmärksamhetskarta",
    mode: "analyze",
  },
];

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Shortcut["mode"]>("video");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() && mode !== "analyze") return;
    setIsGenerating(true);
    router.push(mode === "analyze" ? "/create/analyze" : `/create/${mode}?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleShortcut = (mode: Shortcut["mode"]) => {
    router.push(`/create/${mode}${mode === "video" ? "?new=1" : ""}`);
  };

  return (
    <div className="min-h-screen bg-nordea-bg">
      <Topbar breadcrumb={["Skapa"]} />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="nordea-display text-4xl text-nordea-deep mb-3">
            Vad vill du skapa idag?
          </h1>
          <p className="text-base text-nordea-text-secondary">
            Välj vad du vill göra och beskriv din idé. Du kan också öppna ett verktyg direkt.
          </p>
        </div>

        <div className="mb-10">
          <label htmlFor="create-mode" className="block text-sm font-medium text-nordea-text mb-2">Vad vill du göra?</label>
          <select id="create-mode" value={mode} onChange={(e) => setMode(e.target.value as Shortcut["mode"])} className="nordea-input w-full mb-4">
            {SHORTCUTS.map((s) => <option key={s.mode} value={s.mode}>{s.title}</option>)}
          </select>
          <div className="relative">
            <textarea
              aria-label="Beskriv din idé"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder='T.ex. "En 15-sek video om bolån för förstagångsköpare med fokus på trygghet och låga räntor..."'
              rows={3}
              maxLength={1800}
              className="w-full px-5 py-4 pr-14 bg-white border border-nordea-border rounded-2xl text-base text-nordea-deep placeholder:text-nordea-text-tertiary focus:outline-none focus:border-nordea-blue/40 focus:ring-4 focus:ring-nordea-blue/5 resize-none shadow-sm"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={(!prompt.trim() && mode !== "analyze") || isGenerating}
              className="absolute bottom-4 right-4 w-10 h-10 bg-nordea-blue hover:bg-[#000080] text-white rounded-xl flex items-center justify-center disabled:opacity-30 transition-colors"
              title="Fortsätt (Ctrl/⌘+Enter)"
              aria-label="Fortsätt med din idé"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-nordea-text-tertiary mt-2 text-center">
            Ctrl/⌘+Enter för att fortsätta
          </p>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-nordea-border" />
          <span className="text-xs text-nordea-text-tertiary uppercase tracking-wider">
            eller välj verktyg
          </span>
          <div className="flex-1 h-px bg-nordea-border" />
        </div>

        <div className="nordea-card p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-medium text-nordea-text">Ska materialet ingå i en kampanj?</h2><p className="text-sm text-nordea-text-secondary">Samla brief, material och leverans i en arbetsyta.</p></div>
          <Link href="/create/brief" className="nordea-btn nordea-btn-secondary">Ny kampanj</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => handleShortcut(s.mode)}
                className="group bg-white border border-nordea-border rounded-xl p-5 text-left hover:border-nordea-blue/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-nordea-blue-soft text-nordea-blue rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-nordea-deep">{s.title}</h3>
                  <ArrowUpRight className="w-4 h-4 text-nordea-text-tertiary group-hover:text-nordea-blue transition-colors" />
                </div>
                <p className="text-xs text-nordea-text-tertiary">{s.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
