"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Upload,
  ArrowRight,
  FileText,
  Clock,
  Search,
  Copy,
  Eye,
  Loader2,
} from "lucide-react";
import type { CreativeBrief, BriefStatus } from "@/lib/brief/types";

type StatusFilter = "all" | BriefStatus;

const STATUS_LABEL: Record<BriefStatus, string> = {
  draft: "Pågående",
  approved: "Klar",
  used: "Använd",
};

const STATUS_BADGE: Record<BriefStatus, string> = {
  draft: "nordea-badge-amber",
  approved: "nordea-badge-teal",
  used: "nordea-badge-cobalt",
};

export default function BriefEntryPage() {
  const router = useRouter();
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [loadingBriefs, setLoadingBriefs] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [cloningId, setCloningId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brief")
      .then((r) => r.json())
      .then((data) => {
        setBriefs(data.briefs ?? []);
      })
      .catch(() => setBriefs([]))
      .finally(() => setLoadingBriefs(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return briefs.filter((b) => {
      if (filter !== "all" && b.status !== filter) return false;
      if (!q) return true;
      return (
        b.title?.toLowerCase().includes(q) ||
        b.big_idea?.toLowerCase().includes(q) ||
        b.problem?.toLowerCase().includes(q)
      );
    });
  }, [briefs, filter, query]);

  const counts = useMemo(() => {
    return {
      all: briefs.length,
      draft: briefs.filter((b) => b.status === "draft").length,
      approved: briefs.filter((b) => b.status === "approved").length,
      used: briefs.filter((b) => b.status === "used").length,
    };
  }, [briefs]);

  const clone = async (brief: CreativeBrief) => {
    setCloningId(brief.id);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manual",
          title: `${brief.title} (kopia)`,
          problem: brief.problem,
          audience_description: brief.audience_description,
          audience_personas: brief.audience_personas,
          current_perception: brief.current_perception,
          desired_action: brief.desired_action,
          key_message: brief.key_message,
          unique_value: brief.unique_value,
          status: "draft",
        }),
      });
      const data = await res.json();
      if (data.brief?.id) {
        router.push(`/create/brief/${data.brief.id}`);
      }
    } finally {
      setCloningId(null);
    }
  };

  return (
    <div className="main-content">
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h1 className="nordea-display text-4xl text-nordea-deep mb-3 tracking-tight">
            Skapa kampanj från idé
          </h1>
          <p className="text-base text-nordea-text-secondary">
            Från första tanke till färdig kampanj — välj hur du vill börja
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <button
            type="button"
            onClick={() => router.push("/create/brief/wizard")}
            className="group bg-white border-2 border-nordea-border rounded-2xl p-8 text-left hover:border-nordea-teal hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 bg-nordea-teal/10 text-nordea-teal rounded-xl flex items-center justify-center mb-6 group-hover:bg-nordea-teal/15">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-nordea-text mb-2">
              Brainstorma med AI
            </h2>
            <p className="text-sm text-nordea-text-secondary mb-6">
              Du har en idé eller ett problem men ingen färdig brief. AI:n
              hjälper dig genom 5 enkla steg att bygga strategin tillsammans.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-nordea-teal">
              Starta brainstorming
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => router.push("/create/brief/upload")}
            className="group bg-white border-2 border-nordea-border rounded-2xl p-8 text-left hover:border-nordea-blue hover:shadow-md transition-all"
          >
            <div className="w-14 h-14 bg-nordea-blue/10 text-nordea-blue rounded-xl flex items-center justify-center mb-6 group-hover:bg-nordea-blue/15">
              <Upload className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold text-nordea-text mb-2">
              Ladda upp brief
            </h2>
            <p className="text-sm text-nordea-text-secondary mb-6">
              Du har redan en brief (PDF eller text). AI:n extraherar
              strategin och du kan justera innan kampanjen genereras.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-nordea-blue">
              Ladda upp brief
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Library header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-nordea-text-secondary uppercase tracking-wider">
            Brief-bibliotek
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nordea-text-tertiary pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Sök titel, big idea eller problem…"
              className="pl-9 pr-3 h-9 text-sm bg-white border border-nordea-border rounded-lg w-72 focus:outline-none focus:border-nordea-blue/40 focus:ring-2 focus:ring-nordea-blue/10"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mb-4">
          {(["all", "draft", "approved", "used"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 h-7 text-xs font-medium rounded-full transition-colors ${
                filter === f
                  ? "bg-nordea-blue text-white"
                  : "bg-white border border-nordea-border text-nordea-text-secondary hover:border-nordea-blue/30"
              }`}
            >
              {f === "all" ? "Alla" : STATUS_LABEL[f]}
              <span className="ml-1.5 opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {loadingBriefs ? (
          <div className="bg-white border border-nordea-border rounded-xl p-6 text-center">
            <p className="text-sm text-nordea-text-tertiary">Laddar…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-nordea-border rounded-xl p-10 text-center">
            <p className="text-sm text-nordea-text-tertiary">
              {query
                ? "Inga briefer matchar din sökning"
                : "Inga briefer än"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                onView={() => router.push(`/create/brief/${brief.id}`)}
                onResume={() => {
                  if (brief.source === "upload") {
                    router.push(`/create/brief/${brief.id}/review`);
                  } else if (brief.status === "draft") {
                    router.push(`/create/brief/wizard?id=${brief.id}`);
                  } else {
                    router.push(`/create/brief/${brief.id}`);
                  }
                }}
                onClone={() => clone(brief)}
                onSeeCampaign={() =>
                  router.push(`/create/brief/${brief.id}/campaign`)
                }
                cloning={cloningId === brief.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefCard({
  brief,
  onView,
  onResume,
  onClone,
  onSeeCampaign,
  cloning,
}: {
  brief: CreativeBrief;
  onView: () => void;
  onResume: () => void;
  onClone: () => void;
  onSeeCampaign: () => void;
  cloning: boolean;
}) {
  const isUpload = brief.source === "upload";
  const stage = brief.wizard_state?.current_stage ?? 0;
  const total = brief.wizard_state?.total_stages ?? 6;

  return (
    <div className="bg-white border border-nordea-border rounded-xl p-4 hover:border-nordea-blue/30 transition-colors flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 bg-nordea-bg-hover rounded-lg flex items-center justify-center flex-shrink-0">
          {isUpload ? (
            <FileText className="w-4 h-4 text-nordea-blue" />
          ) : (
            <Sparkles className="w-4 h-4 text-nordea-teal" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-medium text-nordea-text line-clamp-1 flex-1">
              {brief.title}
            </div>
            <span
              className={`nordea-badge ${STATUS_BADGE[brief.status]}`}
            >
              {STATUS_LABEL[brief.status]}
            </span>
          </div>
          {brief.big_idea ? (
            <p className="text-xs text-nordea-text-secondary line-clamp-2 mb-2 italic">
              &ldquo;{brief.big_idea}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-nordea-text-tertiary line-clamp-2 mb-2">
              {brief.problem ?? "Ingen big idea än"}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-nordea-text-tertiary">
            {brief.status === "draft" && !isUpload && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Steg {stage + 1}/{total}
              </span>
            )}
            <span>
              {new Date(brief.updated_at).toLocaleDateString("sv-SE")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-nordea-hairline">
        {brief.status === "draft" ? (
          <button
            type="button"
            onClick={onResume}
            className="nordea-btn nordea-btn-primary nordea-btn-sm flex-1"
          >
            Återuppta
          </button>
        ) : (
          <button
            type="button"
            onClick={onView}
            className="nordea-btn nordea-btn-secondary nordea-btn-sm flex-1"
          >
            <Eye className="w-3 h-3" />
            Se strategi
          </button>
        )}
        {brief.status === "used" && (
          <button
            type="button"
            onClick={onSeeCampaign}
            className="nordea-btn nordea-btn-ghost nordea-btn-sm"
            title="Se kampanj"
          >
            Kampanj
          </button>
        )}
        <button
          type="button"
          onClick={onClone}
          disabled={cloning}
          className="nordea-btn nordea-btn-ghost nordea-btn-sm"
          title="Klona som ny brief"
        >
          {cloning ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}
