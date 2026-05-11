"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Type,
  Video,
  Image as ImageIcon,
  FileText,
  ArrowUpRight,
} from "lucide-react";

interface Shortcut {
  id: string;
  icon: typeof Type;
  title: string;
  description: string;
  mode: "copy" | "video" | "analyze" | "brief";
}

const SHORTCUTS: Shortcut[] = [
  {
    id: "copy",
    icon: Type,
    title: "Copy",
    description: "Skriv rubriker, brödtext och CTAs",
    mode: "copy",
  },
  {
    id: "video",
    icon: Video,
    title: "Video",
    description: "Skapa motion graphics med scen-baserad editor",
    mode: "video",
  },
  {
    id: "analyze",
    icon: ImageIcon,
    title: "Analysera annons",
    description: "Persona-feedback på copy + visuella",
    mode: "analyze",
  },
  {
    id: "brief",
    icon: FileText,
    title: "Från brief",
    description: "Importera brief → komplett kampanj",
    mode: "brief",
  },
];

/**
 * AI-driven entry surface for creation. The free-text prompt at the top
 * routes to the appropriate sub-route based on a regex mode detector
 * (TODO: replace with Claude-driven detection in a later sprint).
 * The 4 shortcuts jump straight into a specific tool.
 */
export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    const mode = detectMode(prompt);
    router.push(`/create/${mode}?prompt=${encodeURIComponent(prompt)}`);
  };

  const handleShortcut = (mode: Shortcut["mode"]) => {
    router.push(`/create/${mode}`);
  };

  return (
    <div className="main-content">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="nordea-display text-4xl text-nordea-deep mb-3">
            Vad vill du skapa idag?
          </h1>
          <p className="text-base text-nordea-text-secondary">
            Beskriv din idé så genererar AI:n direkt — eller välj ett verktyg nedan
          </p>
        </div>

        <div className="mb-10">
          <div className="relative">
            <textarea
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
              className="w-full px-5 py-4 pr-14 bg-white border border-nordea-border rounded-2xl text-base text-nordea-deep placeholder:text-nordea-text-tertiary focus:outline-none focus:border-nordea-blue/40 focus:ring-4 focus:ring-nordea-blue/5 resize-none shadow-sm"
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-4 right-4 w-10 h-10 bg-nordea-teal hover:bg-nordea-teal-hover text-nordea-deep rounded-xl flex items-center justify-center disabled:opacity-30 transition-colors"
              title="Generera (⌘+Enter)"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-nordea-text-tertiary mt-2 text-center">
            ⌘+Enter för att skicka
          </p>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-nordea-border" />
          <span className="text-xs text-nordea-text-tertiary uppercase tracking-wider">
            eller välj verktyg
          </span>
          <div className="flex-1 h-px bg-nordea-border" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => handleShortcut(s.mode)}
                className="group bg-white border border-nordea-border rounded-xl p-5 text-left hover:border-nordea-blue/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-nordea-teal/10 text-nordea-teal rounded-lg flex items-center justify-center mb-4 group-hover:bg-nordea-teal/15">
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

/**
 * Regex-based mode router. Sprint 7 stub — replace with Claude routing
 * when we have a free moment. Order matters: more-specific patterns first.
 */
function detectMode(prompt: string): Shortcut["mode"] {
  const lower = prompt.toLowerCase();
  if (/video|animer|reel|story|tiktok|motion/.test(lower)) return "video";
  if (/kampanj|brief|strategi|launch/.test(lower)) return "brief";
  if (/analys|testa|granska|feedback|review/.test(lower)) return "analyze";
  return "copy";
}
